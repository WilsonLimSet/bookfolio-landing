import SwiftUI

struct ReadBooksView: View {
    let userId: UUID
    @State private var fictionBooks: [UserBook] = []
    @State private var nonfictionBooks: [UserBook] = []
    @State private var isLoading = true

    var body: some View {
        Group {
            if isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if fictionBooks.isEmpty && nonfictionBooks.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "book")
                        .font(.system(size: 40))
                        .foregroundStyle(.secondary)
                    Text("No books ranked yet")
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        if !fictionBooks.isEmpty {
                            bookSection(title: "Fiction", books: fictionBooks)
                        }
                        if !nonfictionBooks.isEmpty {
                            bookSection(title: "Nonfiction", books: nonfictionBooks)
                        }
                    }
                    .padding()
                }
            }
        }
        .navigationTitle("Read")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await loadBooks()
        }
    }

    @ViewBuilder
    private func bookSection(title: String, books: [UserBook]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.title3.bold())
                .padding(.bottom, 4)

            LazyVStack(spacing: 0) {
                ForEach(books) { book in
                    NavigationLink(value: AppRoute.bookDetail(bookKey: book.openLibraryKey)) {
                        BookRowView(
                            title: book.title,
                            author: book.author,
                            coverUrl: book.coverUrl,
                            score: book.score,
                            rankPosition: book.rankPosition
                        )
                    }
                    .buttonStyle(.plain)

                    if book.id != books.last?.id {
                        Divider()
                    }
                }
            }
        }
    }

    private func loadBooks() async {
        do {
            let allBooks: [UserBook] = try await supabase
                .from("user_books")
                .select()
                .eq("user_id", value: userId.uuidString)
                .order("rank_position")
                .execute()
                .value

            fictionBooks = allBooks.filter { $0.category == .fiction }
            nonfictionBooks = allBooks.filter { $0.category == .nonfiction }
        } catch {
            // Books will remain empty — empty state shown
        }
        isLoading = false
    }
}
