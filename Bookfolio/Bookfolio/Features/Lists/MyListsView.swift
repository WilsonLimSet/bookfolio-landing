import SwiftUI

struct MyListsView: View {
    let userId: UUID
    @EnvironmentObject var authService: AuthService
    @State private var lists: [(list: BookList, items: [BookListItem])] = []
    @State private var isLoading = true

    private var isOwner: Bool {
        guard case .authenticated(let user) = authService.state else { return false }
        return user.id == userId
    }

    var body: some View {
        Group {
            if isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if lists.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "list.bullet")
                        .font(.system(size: 40))
                        .foregroundColor(.secondary)
                    Text(isOwner ? "No lists yet — create your first!" : "No lists yet")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ScrollView {
                    LazyVStack(spacing: 16) {
                        ForEach(lists, id: \.list.id) { entry in
                            NavigationLink(value: AppRoute.listDetail(listId: entry.list.id)) {
                                UserListCardView(list: entry.list, items: entry.items)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding()
                }
            }
        }
        .navigationTitle("Lists")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if isOwner {
                ToolbarItem(placement: .navigationBarTrailing) {
                    NavigationLink(value: AppRoute.createList) {
                        Image(systemName: "plus")
                    }
                }
            }
        }
        .task {
            lists = await ListService.fetchUserLists(userId: userId)
            isLoading = false
        }
    }
}

private struct UserListCardView: View {
    let list: BookList
    let items: [BookListItem]

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(list.name)
                    .font(.headline)
                    .foregroundColor(.primary)
                    .lineLimit(1)

                Spacer()

                Text(list.isPublic ? "Public" : "Private")
                    .font(.caption2.bold())
                    .foregroundColor(list.isPublic ? .green : .orange)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(
                        (list.isPublic ? Color.green : Color.orange).opacity(0.15)
                    )
                    .clipShape(Capsule())
            }

            if let description = list.description, !description.isEmpty {
                Text(description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }

            if !items.isEmpty {
                HStack(spacing: 8) {
                    ForEach(items.prefix(4)) { item in
                        BookCoverView(coverUrl: item.coverUrl, size: CGSize(width: 50, height: 75))
                    }
                    if items.count > 4 {
                        Text("+\(items.count - 4) more")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .frame(width: 50, height: 75)
                    }
                }
            } else {
                Text("\(items.count) books")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}
