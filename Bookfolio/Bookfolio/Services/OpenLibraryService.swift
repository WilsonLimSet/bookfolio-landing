import Foundation

// MARK: - Result Types

struct BookSearchItem: Identifiable {
    let id: String
    let key: String
    let title: String
    let author: String?
    let coverUrl: String?
    let year: Int?
    let editions: Int
}

struct BookDetails {
    let key: String
    let title: String
    let author: String?
    let translator: String?
    let coverUrl: String?
    let description: String?
    let firstPublishYear: Int?
    let subjects: [String]
    let pageCount: Int?
}

struct BookEditionItem: Identifiable {
    let id: String
    let key: String
    let title: String?
    let coverUrl: String?
    let publisher: String?
    let year: String?
}

// MARK: - Google Books Types

private struct GoogleBooksResponse: Codable {
    let items: [GoogleBooksItem]?
}

private struct GoogleBooksItem: Codable {
    let volumeInfo: GoogleVolumeInfo?
}

private struct GoogleVolumeInfo: Codable {
    let description: String?
}

// MARK: - OpenLibraryService

enum OpenLibraryService {

    // MARK: - Private Helpers

    private static func fetch<T: Decodable>(_ url: URL) async throws -> T {
        let (data, _) = try await URLSession.shared.data(from: url)
        return try JSONDecoder().decode(T.self, from: data)
    }

    /// Returns true if the string contains characters outside the Basic Latin + Latin Extended range.
    private static func hasNonLatinCharacters(_ text: String) -> Bool {
        let pattern = "[^\\u{0000}-\\u{024F}\\s]"
        return text.range(of: pattern, options: .regularExpression) != nil
    }

    /// Score an edition by popularity heuristics.
    private static func scoreEdition(_ edition: OLEdition) -> Int {
        var score = 0

        // Language scoring
        if let languages = edition.languages, !languages.isEmpty {
            let isEnglish = languages.contains { $0.key == "/languages/eng" }
            if isEnglish {
                score += 15
            } else {
                score -= 10
            }
        } else {
            // No language data: penalize if title has non-Latin chars
            if let title = edition.title, hasNonLatinCharacters(title) {
                score -= 5
            } else {
                score += 5
            }
        }

        // ISBN bonus
        let hasISBN = !(edition.isbn13 ?? []).isEmpty || !(edition.isbn10 ?? []).isEmpty
        if hasISBN {
            score += 5
        }

        // Has cover
        if !(edition.covers ?? []).isEmpty {
            score += 3
        }

        // Publisher bonus
        if !(edition.publishers ?? []).isEmpty {
            score += 1
        }

        return score
    }

    // MARK: - Public API

    /// Search OpenLibrary for books matching the query.
    static func searchBooks(query: String) async throws -> [BookSearchItem] {
        var components = URLComponents(string: "https://openlibrary.org/search.json")!
        components.queryItems = [
            URLQueryItem(name: "q", value: query),
            URLQueryItem(name: "limit", value: "20"),
            URLQueryItem(name: "fields", value: "key,title,author_name,cover_i,cover_edition_key,first_publish_year,edition_count"),
        ]
        guard let url = components.url else { return [] }

        let response: OLSearchResponse = try await fetch(url)
        let queryWords = query.lowercased().split(separator: " ").map(String.init)

        // Filter to results with covers
        let withCovers = response.docs.filter { $0.coverId != nil }

        // Sort: title matches first, then by edition count
        let sorted = withCovers.sorted { a, b in
            let aTitle = a.title.lowercased()
            let bTitle = b.title.lowercased()
            let aMatch = queryWords.allSatisfy { aTitle.contains($0) }
            let bMatch = queryWords.allSatisfy { bTitle.contains($0) }

            if aMatch != bMatch {
                return aMatch
            }
            return (a.editionCount ?? 0) > (b.editionCount ?? 0)
        }

        // Take top 8 and map
        return Array(sorted.prefix(8)).map { result in
            // Handle translated titles
            var displayTitle = result.title
            if hasNonLatinCharacters(result.title),
               !queryWords.allSatisfy({ result.title.lowercased().contains($0) }) {
                displayTitle = query.capitalized
            }

            let coverUrl = result.coverId?.openLibraryCoverURL(size: .medium)?.absoluteString

            return BookSearchItem(
                id: result.key,
                key: result.key,
                title: displayTitle,
                author: result.authorName?.first,
                coverUrl: coverUrl,
                year: result.firstPublishYear,
                editions: result.editionCount ?? 0
            )
        }
    }

    /// Fetch detailed book information from a work key.
    static func getBookDetails(workKey: String) async throws -> BookDetails? {
        guard let workURL = URL(string: "https://openlibrary.org\(workKey).json") else { return nil }
        guard let editionsURL = URL(string: "https://openlibrary.org\(workKey)/editions.json?limit=50") else { return nil }

        // Fetch work first (we need it to get the author key)
        let work: OLWork = try await fetch(workURL)

        // Fetch author and editions in parallel
        let authorKey = work.authors?.first?.author.key
        async let editionsResult: OLEditionsResponse = fetch(editionsURL)

        var author: OLAuthor?
        if let authorKey = authorKey, let authorURL = URL(string: "https://openlibrary.org\(authorKey).json") {
            author = try? await fetch(authorURL) as OLAuthor
        }

        let editions = try await editionsResult

        // Find best edition by score
        let bestEdition = editions.entries
            .sorted { scoreEdition($0) > scoreEdition($1) }
            .first

        // Cover: work covers first, then best edition
        let coverUrl: String? = {
            if let coverId = work.covers?.first, let url = coverId.openLibraryCoverURL(size: .large) {
                return url.absoluteString
            }
            if let coverId = bestEdition?.covers?.first, let url = coverId.openLibraryCoverURL(size: .large) {
                return url.absoluteString
            }
            return nil
        }()

        // Description: 4-tier fallback
        var description: String? = work.description?.text
        if description == nil {
            description = bestEdition?.description?.text
        }
        if description == nil {
            // Google Books fallback
            description = await getGoogleBooksDescription(title: work.title, author: author?.name)
        }

        // Subjects: filter NYT prefixes, take first 6
        let subjects = (work.subjects ?? [])
            .filter { !$0.lowercased().hasPrefix("nyt:") }
            .prefix(6)

        // Page count from best edition
        let pageCount = bestEdition?.numberOfPages

        return BookDetails(
            key: workKey,
            title: work.title,
            author: author?.name,
            translator: nil,
            coverUrl: coverUrl,
            description: description,
            firstPublishYear: nil,
            subjects: Array(subjects),
            pageCount: pageCount
        )
    }

    /// Fetch editions for a work, scored and deduplicated by cover.
    static func getEditions(workKey: String) async throws -> [BookEditionItem] {
        guard let url = URL(string: "https://openlibrary.org\(workKey)/editions.json?limit=200") else { return [] }

        let response: OLEditionsResponse = try await fetch(url)

        // Filter to editions with covers, score and sort
        let scored = response.entries
            .filter { !(($0.covers ?? []).isEmpty) }
            .map { edition in (edition: edition, score: scoreEdition(edition)) }
            .sorted { $0.score > $1.score }

        // Deduplicate by cover ID
        var seenCovers = Set<Int>()
        var results: [BookEditionItem] = []

        for item in scored {
            guard let coverId = item.edition.covers?.first else { continue }
            guard seenCovers.insert(coverId).inserted else { continue }

            let coverUrl = coverId.openLibraryCoverURL(size: .medium)?.absoluteString

            results.append(BookEditionItem(
                id: item.edition.key,
                key: item.edition.key,
                title: item.edition.title,
                coverUrl: coverUrl,
                publisher: item.edition.publishers?.first,
                year: item.edition.publishDate
            ))

            if results.count >= 24 { break }
        }

        return results
    }

    /// Fetch subjects for a work.
    static func fetchWorkSubjects(workKey: String) async throws -> [String] {
        guard let url = URL(string: "https://openlibrary.org\(workKey).json") else { return [] }
        let work: OLWork = try await fetch(url)
        return work.subjects ?? []
    }

    /// Detect whether a book is fiction or nonfiction based on its subjects.
    static func detectCategory(subjects: [String]) -> BookCategory? {
        var fictionScore = 0
        var nonfictionScore = 0

        let nonfictionGenreKeywords: Set<String> = [
            "history", "science", "psychology", "philosophy", "politics",
            "economics", "mathematics", "technology", "education", "religion",
            "sociology", "anthropology", "law", "medicine", "engineering",
        ]

        let fictionGenreKeywords: Set<String> = [
            "fantasy", "thriller", "mystery", "romance", "horror",
            "adventure", "suspense", "detective", "dystopian", "steampunk",
            "cyberpunk", "paranormal", "supernatural",
        ]

        for subject in subjects {
            let lower = subject.lowercased().trimmingCharacters(in: .whitespaces)

            // NYT tags (weight 3)
            if lower.hasPrefix("nyt:") {
                if lower.contains("fiction") && !lower.contains("nonfiction") {
                    fictionScore += 3
                } else if lower.contains("nonfiction") {
                    nonfictionScore += 3
                }
                continue
            }

            // BISAC patterns (weight 2)
            if lower.hasPrefix("fiction /") || lower.hasPrefix("fiction/") {
                fictionScore += 2
                continue
            }
            if lower.contains("biography & autobiography") || lower.contains("business") ||
                lower.contains("self-help") || lower.hasPrefix("history /") ||
                lower.hasPrefix("history/") || lower.hasPrefix("science /") ||
                lower.hasPrefix("science/") || lower.hasPrefix("psychology /") ||
                lower.hasPrefix("psychology/") {
                nonfictionScore += 2
                continue
            }

            // Strong markers (weight 2)
            let strongNonfiction: Set<String> = ["true crime", "biography", "memoir", "autobiography", "essays"]
            if strongNonfiction.contains(lower) {
                nonfictionScore += 2
                continue
            }
            if lower == "fiction" {
                fictionScore += 2
                continue
            }

            // Genre keywords (weight 1)
            for keyword in fictionGenreKeywords {
                if lower.contains(keyword) {
                    fictionScore += 1
                    break
                }
            }
            for keyword in nonfictionGenreKeywords {
                if lower.contains(keyword) {
                    nonfictionScore += 1
                    break
                }
            }
        }

        if fictionScore == 0 && nonfictionScore == 0 {
            return nil
        }

        // Tie-break: nonfiction wins (OpenLibrary over-tags fiction)
        if nonfictionScore >= fictionScore {
            return .nonfiction
        }
        return .fiction
    }

    /// Fetch a book description from Google Books as a fallback.
    static func getGoogleBooksDescription(title: String, author: String?) async -> String? {
        let queryString = "\(title) \(author ?? "")".trimmingCharacters(in: .whitespaces)

        var components = URLComponents(string: "https://www.googleapis.com/books/v1/volumes")!
        components.queryItems = [
            URLQueryItem(name: "q", value: queryString),
            URLQueryItem(name: "maxResults", value: "1"),
        ]
        guard let url = components.url else { return nil }

        do {
            let response: GoogleBooksResponse = try await fetch(url)
            return response.items?.first?.volumeInfo?.description
        } catch {
            return nil
        }
    }
}
