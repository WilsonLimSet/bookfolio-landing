import SwiftUI

struct ListDetailView: View {
    let listId: UUID
    @EnvironmentObject var authService: AuthService
    @State private var list: BookList?
    @State private var items: [BookListItem] = []
    @State private var creatorName: String?
    @State private var isLoading = true
    @State private var showDeleteConfirmation = false
    @Environment(\.dismiss) var dismiss

    private var isOwner: Bool {
        guard let list,
              case .authenticated(let user) = authService.state else { return false }
        return user.id == list.userId
    }

    private let columns = [
        GridItem(.flexible(), spacing: 16),
        GridItem(.flexible(), spacing: 16)
    ]

    var body: some View {
        Group {
            if isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let list {
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        // Header
                        VStack(alignment: .leading, spacing: 8) {
                            Text(list.name)
                                .font(.title2.bold())

                            if let creatorName {
                                Text("by \(creatorName)")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }

                            if let description = list.description, !description.isEmpty {
                                Text(description)
                                    .font(.body)
                                    .foregroundColor(.secondary)
                            }

                            // Public/Private badge
                            Text(list.isPublic ? "Public" : "Private")
                                .font(.caption.bold())
                                .foregroundColor(list.isPublic ? .green : .orange)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 4)
                                .background(
                                    (list.isPublic ? Color.green : Color.orange).opacity(0.15)
                                )
                                .clipShape(Capsule())
                        }
                        .padding(.horizontal)

                        // Owner actions
                        if isOwner {
                            HStack(spacing: 12) {
                                Button(role: .destructive) {
                                    showDeleteConfirmation = true
                                } label: {
                                    Label("Delete List", systemImage: "trash")
                                        .font(.subheadline)
                                }
                            }
                            .padding(.horizontal)
                        }

                        // Book grid
                        if items.isEmpty {
                            VStack(spacing: 12) {
                                Image(systemName: "book")
                                    .font(.system(size: 40))
                                    .foregroundColor(.secondary)
                                Text("No books in this list yet")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                            .frame(maxWidth: .infinity, minHeight: 200)
                        } else {
                            LazyVGrid(columns: columns, spacing: 16) {
                                ForEach(items) { item in
                                    NavigationLink(value: AppRoute.bookDetail(bookKey: item.openLibraryKey)) {
                                        VStack(spacing: 6) {
                                            BookCoverView(coverUrl: item.coverUrl, size: CGSize(width: 100, height: 150))

                                            Text(item.title)
                                                .font(.caption)
                                                .foregroundColor(.primary)
                                                .lineLimit(2)
                                                .multilineTextAlignment(.center)

                                            if let author = item.author {
                                                Text(author)
                                                    .font(.caption2)
                                                    .foregroundColor(.secondary)
                                                    .lineLimit(1)
                                            }
                                        }
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                    .padding(.vertical)
                }
            } else {
                VStack(spacing: 12) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.system(size: 40))
                        .foregroundColor(.secondary)
                    Text("Failed to load list")
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .navigationTitle(list?.name ?? "List")
        .navigationBarTitleDisplayMode(.inline)
        .confirmationDialog("Delete this list?", isPresented: $showDeleteConfirmation, titleVisibility: .visible) {
            Button("Delete", role: .destructive) {
                Task { @Sendable in
                    try? await ListService.deleteList(listId: listId)
                }
                dismiss()
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This will permanently delete the list and all its items.")
        }
        .task {
            do {
                let result = try await ListService.fetchListDetail(listId: listId)
                list = result.list
                items = result.items
                creatorName = result.creatorName
            } catch {
                // list remains nil — error state shown
            }
            isLoading = false
        }
    }
}
