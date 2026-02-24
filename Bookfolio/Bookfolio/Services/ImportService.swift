import Foundation
import Supabase

// MARK: - Types

struct GoodreadsBook {
    let title: String
    let author: String
    let rating: Int  // 1-5
    let shelves: String
}

struct MatchedBook: Identifiable {
    let id = UUID()
    let title: String
    let author: String
    let rating: Int
    var openLibraryKey: String?
    var coverUrl: String?
    var category: BookCategory
}

// MARK: - ImportService

enum ImportService {

    // MARK: - CSV Parsing

    static func parseGoodreadsCSV(_ text: String) -> [GoodreadsBook] {
        let lines = text.components(separatedBy: .newlines).filter { !$0.isEmpty }
        guard let headerLine = lines.first else { return [] }

        let headers = parseCSVLine(headerLine)

        // Find column indices
        guard let titleIndex = headers.firstIndex(of: "Title"),
              let authorIndex = headers.firstIndex(of: "Author"),
              let ratingIndex = headers.firstIndex(of: "My Rating") else {
            return []
        }
        let shelvesIndex = headers.firstIndex(of: "Bookshelves")
        let exclusiveShelfIndex = headers.firstIndex(of: "Exclusive Shelf")

        var books: [GoodreadsBook] = []

        for line in lines.dropFirst() {
            let fields = parseCSVLine(line)
            guard fields.count > max(titleIndex, authorIndex, ratingIndex) else { continue }

            let title = fields[titleIndex]
            let author = fields[authorIndex]
            let rating = Int(fields[ratingIndex]) ?? 0

            guard rating > 0 else { continue }

            var shelves = ""
            if let idx = shelvesIndex, fields.count > idx {
                shelves = fields[idx]
            }
            if let idx = exclusiveShelfIndex, fields.count > idx {
                if !shelves.isEmpty { shelves += ", " }
                shelves += fields[idx]
            }

            books.append(GoodreadsBook(
                title: title,
                author: author,
                rating: rating,
                shelves: shelves
            ))
        }

        return books
    }

    private static func parseCSVLine(_ line: String) -> [String] {
        var result: [String] = []
        var current = ""
        var inQuotes = false
        let chars = Array(line)
        var i = 0
        while i < chars.count {
            if inQuotes {
                if chars[i] == "\"" && i + 1 < chars.count && chars[i + 1] == "\"" {
                    current.append("\"")
                    i += 2
                } else if chars[i] == "\"" {
                    inQuotes = false
                    i += 1
                } else {
                    current.append(chars[i])
                    i += 1
                }
            } else {
                if chars[i] == "\"" {
                    inQuotes = true
                    i += 1
                } else if chars[i] == "," {
                    result.append(current.trimmingCharacters(in: .whitespaces))
                    current = ""
                    i += 1
                } else {
                    current.append(chars[i])
                    i += 1
                }
            }
        }
        result.append(current.trimmingCharacters(in: .whitespaces))
        return result
    }

    // MARK: - Book Matching

    static func matchBooks(
        _ books: [GoodreadsBook],
        onProgress: @escaping @Sendable (Int) -> Void
    ) async -> [MatchedBook] {
        var matched: [MatchedBook] = []
        let batchSize = 5

        for batchStart in stride(from: 0, to: books.count, by: batchSize) {
            let batchEnd = min(batchStart + batchSize, books.count)
            let batch = books[batchStart..<batchEnd]

            for book in batch {
                var matchedBook = MatchedBook(
                    title: book.title,
                    author: book.author,
                    rating: book.rating,
                    openLibraryKey: nil,
                    coverUrl: nil,
                    category: categoryFromShelves(book.shelves)
                )

                // Search OpenLibrary
                if let results = try? await OpenLibraryService.searchBooks(
                    query: "\(book.title) \(book.author)"
                ), let first = results.first {
                    matchedBook.openLibraryKey = first.key
                    matchedBook.coverUrl = first.coverUrl

                    // Detect category from OpenLibrary subjects
                    if let subjects = try? await OpenLibraryService.fetchWorkSubjects(
                        workKey: first.key
                    ) {
                        if let detected = OpenLibraryService.detectCategory(subjects: subjects) {
                            matchedBook.category = detected
                        }
                    }
                }

                matched.append(matchedBook)
            }

            onProgress(matched.count)

            // Rate limit: 500ms delay between batches
            if batchEnd < books.count {
                try? await Task.sleep(nanoseconds: 500_000_000)
            }
        }

        return matched
    }

    private static func categoryFromShelves(_ shelves: String) -> BookCategory {
        let lower = shelves.lowercased()
        let nonfictionKeywords = [
            "non-fiction", "nonfiction", "biography", "memoir", "history",
            "science", "self-help", "business", "psychology", "philosophy",
            "politics", "economics", "education", "technology", "health",
        ]
        for keyword in nonfictionKeywords {
            if lower.contains(keyword) {
                return .nonfiction
            }
        }
        return .fiction
    }

    // MARK: - Score Calculation

    struct ImportBookData {
        let book: MatchedBook
        let score: Double
        let tier: String
        let position: Int
    }

    static func calculateImportData(_ books: [MatchedBook]) -> [ImportBookData] {
        // Group by rating, highest first
        let grouped = Dictionary(grouping: books) { $0.rating }
        let sortedRatings = grouped.keys.sorted(by: >)

        var result: [ImportBookData] = []
        var runningPosition = 1

        for rating in sortedRatings {
            guard var group = grouped[rating] else { continue }
            group.sort { $0.title < $1.title }

            let tier: String
            let tierMin: Double
            let tierMax: Double

            switch rating {
            case 4, 5:
                tier = "liked"
                tierMin = 6.7
                tierMax = 10.0
            case 3:
                tier = "fine"
                tierMin = 3.4
                tierMax = 6.6
            default:
                tier = "disliked"
                tierMin = 0.0
                tierMax = 3.3
            }

            let tierRange = tierMax - tierMin
            let groupSize = max(Double(group.count), 1.0)

            for (index, book) in group.enumerated() {
                let score = tierMin + (Double(index) / groupSize) * tierRange

                result.append(ImportBookData(
                    book: book,
                    score: score,
                    tier: tier,
                    position: runningPosition
                ))
                runningPosition += 1
            }
        }

        return result
    }

    // MARK: - Batch Import

    private struct ImportBookRow: Encodable {
        let userId: UUID
        let openLibraryKey: String
        let title: String
        let author: String?
        let coverUrl: String?
        let score: Double
        let tier: String
        let category: String
        let rankPosition: Int
        let reviewText: String?
        let finishedAt: Date?

        enum CodingKeys: String, CodingKey {
            case title, author, score, tier, category
            case userId = "user_id"
            case openLibraryKey = "open_library_key"
            case coverUrl = "cover_url"
            case rankPosition = "rank_position"
            case reviewText = "review_text"
            case finishedAt = "finished_at"
        }
    }

    static func importBooks(
        userId: UUID,
        books: [ImportBookData],
        onProgress: @escaping @Sendable (Int) -> Void
    ) async {
        var imported = 0

        for data in books {
            guard let openLibraryKey = data.book.openLibraryKey else { continue }

            let row = ImportBookRow(
                userId: userId,
                openLibraryKey: openLibraryKey,
                title: data.book.title,
                author: data.book.author,
                coverUrl: data.book.coverUrl,
                score: data.score,
                tier: data.tier,
                category: data.book.category.rawValue,
                rankPosition: data.position,
                reviewText: nil,
                finishedAt: nil
            )

            try? await supabase.from("user_books")
                .upsert(row, onConflict: "user_id,open_library_key")
                .execute()

            imported += 1
            onProgress(imported)
        }
    }
}
