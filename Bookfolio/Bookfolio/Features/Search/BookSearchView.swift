import SwiftUI

struct BookSearchView: View {
    let onSelect: (BookSearchItem) -> Void

    @State private var query = ""
    @State private var results: [BookSearchItem] = []
    @State private var isSearching = false
    @State private var searchTask: Task<Void, Never>?
    @State private var hasSearched = false

    var body: some View {
        VStack(spacing: 0) {
            // Search bar
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.secondary)
                TextField("Search books...", text: $query)
                    .textFieldStyle(.plain)
                    .autocorrectionDisabled()
                if !query.isEmpty {
                    Button {
                        query = ""
                        results = []
                        hasSearched = false
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding(12)
            .background(Color(.systemGray6))
            .cornerRadius(12)
            .padding(.horizontal)
            .padding(.top, 8)

            if isSearching {
                ProgressView()
                    .padding(.top, 24)
                Spacer()
            } else if results.isEmpty && hasSearched {
                VStack(spacing: 12) {
                    Image(systemName: "book.closed")
                        .font(.system(size: 36))
                        .foregroundColor(.secondary)
                    Text("No books found")
                        .foregroundColor(.secondary)
                }
                .padding(.top, 48)
                Spacer()
            } else if results.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "magnifyingglass")
                        .font(.system(size: 36))
                        .foregroundColor(.secondary)
                    Text("Search for books by title or author")
                        .foregroundColor(.secondary)
                }
                .padding(.top, 48)
                Spacer()
            } else {
                ScrollView {
                    LazyVStack(spacing: 0) {
                        ForEach(results) { item in
                            Button {
                                onSelect(item)
                            } label: {
                                searchResultRow(item)
                            }
                            .buttonStyle(.plain)

                            Divider()
                                .padding(.leading, 68)
                        }
                    }
                    .padding(.top, 8)
                }
            }
        }
        .onChange(of: query) { _ in
            performDebouncedSearch()
        }
    }

    private func searchResultRow(_ item: BookSearchItem) -> some View {
        HStack(spacing: 12) {
            BookCoverView(coverUrl: item.coverUrl, size: CGSize(width: 40, height: 60))

            VStack(alignment: .leading, spacing: 4) {
                Text(item.title)
                    .font(.subheadline.bold())
                    .foregroundColor(.primary)
                    .lineLimit(2)
                if let author = item.author {
                    Text(author)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
                if let year = item.year {
                    Text(String(year))
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
    }

    private func performDebouncedSearch() {
        searchTask?.cancel()

        let trimmed = query.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else {
            results = []
            hasSearched = false
            return
        }

        searchTask = Task {
            do {
                try await Task.sleep(nanoseconds: 300_000_000)
            } catch {
                return // Cancelled
            }

            await MainActor.run { isSearching = true }

            do {
                let searchResults = try await OpenLibraryService.searchBooks(query: trimmed)
                if !Task.isCancelled {
                    await MainActor.run {
                        results = searchResults
                        hasSearched = true
                        isSearching = false
                    }
                }
            } catch {
                if !Task.isCancelled {
                    await MainActor.run {
                        results = []
                        hasSearched = true
                        isSearching = false
                    }
                }
            }
        }
    }
}
