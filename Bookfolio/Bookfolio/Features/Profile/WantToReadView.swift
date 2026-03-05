import SwiftUI

struct WantToReadView: View {
    let userId: UUID
    @State private var books: [WantToRead] = []
    @State private var isLoading = true

    private let columns = [
        GridItem(.flexible(), spacing: 16),
        GridItem(.flexible(), spacing: 16),
        GridItem(.flexible(), spacing: 16)
    ]

    var body: some View {
        Group {
            if isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if books.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "bookmark")
                        .font(.system(size: 40))
                        .foregroundStyle(.secondary)
                    Text("Your reading wishlist is empty")
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ScrollView {
                    LazyVGrid(columns: columns, spacing: 20) {
                        ForEach(books, id: \.self) { book in
                            NavigationLink(value: AppRoute.bookDetail(bookKey: book.openLibraryKey)) {
                                bookCell(book)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding()
                }
            }
        }
        .navigationTitle("Want to Read")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await loadBooks()
        }
    }

    @ViewBuilder
    private func bookCell(_ book: WantToRead) -> some View {
        VStack(spacing: 8) {
            CachedAsyncImage(url: book.coverUrl.flatMap { URL(string: $0) }) { image in
                image.resizable().scaledToFill()
            } placeholder: {
                Image(systemName: "book.fill")
                    .font(.title)
                    .foregroundStyle(.secondary)
                    .frame(width: 80, height: 120)
                    .background(Color(.systemGray5))
            }
            .frame(width: 80, height: 120)
            .clipShape(RoundedRectangle(cornerRadius: 8))

            Text(book.title)
                .font(.caption.bold())
                .foregroundColor(.primary)
                .lineLimit(2)
                .multilineTextAlignment(.center)

            if let author = book.author {
                Text(author)
                    .font(.caption2)
                    .foregroundColor(.secondary)
                    .lineLimit(1)
            }
        }
        .frame(maxWidth: .infinity)
    }

    private func loadBooks() async {
        do {
            books = try await supabase
                .from("want_to_read")
                .select()
                .eq("user_id", value: userId.uuidString)
                .execute()
                .value
        } catch {
            // Books will remain empty — empty state shown
        }
        isLoading = false
    }
}
