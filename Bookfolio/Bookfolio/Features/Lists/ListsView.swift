import SwiftUI

struct ListsView: View {
    let onSelectList: (UUID) -> Void

    @State private var publicLists: [(list: BookList, creatorName: String?, items: [BookListItem])] = []
    @State private var isLoading = true

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, minHeight: 200)
            } else if publicLists.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "list.bullet")
                        .font(.system(size: 40))
                        .foregroundColor(.secondary)
                    Text("No public lists yet")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, minHeight: 200)
            } else {
                LazyVStack(spacing: 16) {
                    ForEach(publicLists, id: \.list.id) { entry in
                        NavigationLink(value: AppRoute.listDetail(listId: entry.list.id)) {
                            ListCardView(
                                list: entry.list,
                                creatorName: entry.creatorName,
                                items: entry.items
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding()
            }
        }
        .navigationTitle("Public Lists")
        .task {
            publicLists = await ListService.fetchPublicLists()
            isLoading = false
        }
    }
}

private struct ListCardView: View {
    let list: BookList
    let creatorName: String?
    let items: [BookListItem]

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(list.name)
                .font(.headline)
                .foregroundColor(.primary)
                .lineLimit(1)

            if let creatorName {
                Text("by \(creatorName)")
                    .font(.caption)
                    .foregroundColor(.secondary)
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
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}
