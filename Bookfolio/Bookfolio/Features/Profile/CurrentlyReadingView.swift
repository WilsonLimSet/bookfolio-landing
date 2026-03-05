import SwiftUI

struct CurrentlyReadingView: View {
    let userId: UUID
    @State private var books: [CurrentlyReading] = []
    @State private var isLoading = true

    private let columns = [
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
                    Image(systemName: "book.closed")
                        .font(.system(size: 40))
                        .foregroundStyle(.secondary)
                    Text("Not reading anything right now")
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
        .navigationTitle("Currently Reading")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await loadBooks()
        }
    }

    @ViewBuilder
    private func bookCell(_ book: CurrentlyReading) -> some View {
        VStack(spacing: 8) {
            CachedAsyncImage(url: book.coverUrl.flatMap { URL(string: $0) }) { image in
                image.resizable().scaledToFill()
            } placeholder: {
                Image(systemName: "book.fill")
                    .font(.title)
                    .foregroundStyle(.secondary)
                    .frame(width: 100, height: 150)
                    .background(Color(.systemGray5))
            }
            .frame(width: 100, height: 150)
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
                .from("currently_reading")
                .select()
                .eq("user_id", value: userId.uuidString)
                .order("started_at", ascending: false)
                .execute()
                .value
        } catch {
            // Books will remain empty — empty state shown
        }
        isLoading = false
    }
}
