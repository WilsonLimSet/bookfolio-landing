import SwiftUI
import UIKit

struct AddToListSheet: View {
    let bookKey: String
    let title: String
    let author: String?
    let coverUrl: String?

    @EnvironmentObject var authService: AuthService
    @State private var userLists: [(list: BookList, items: [BookListItem])] = []
    @State private var isLoading = true
    @State private var showCreateList = false
    @Environment(\.dismiss) var dismiss

    private var bookInListIds: Set<UUID> {
        Set(
            userLists
                .filter { pair in pair.items.contains { $0.openLibraryKey == bookKey } }
                .map(\.list.id)
        )
    }

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if userLists.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "list.bullet")
                            .font(.system(size: 40))
                            .foregroundColor(.secondary)
                        Text("No lists yet")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        Button("Create List") {
                            showCreateList = true
                        }
                        .buttonStyle(.borderedProminent)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    List {
                        ForEach(userLists, id: \.list.id) { pair in
                            let inList = bookInListIds.contains(pair.list.id)
                            Button {
                                toggleBook(listId: pair.list.id, inList: inList)
                            } label: {
                                HStack {
                                    Text(pair.list.name)
                                        .foregroundColor(.primary)
                                    Spacer()
                                    if inList {
                                        Image(systemName: "checkmark")
                                            .foregroundColor(.blue)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("Add to List")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Done") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showCreateList = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showCreateList) {
                NavigationStack {
                    CreateListView { _ in
                        Task { await loadLists() }
                    }
                }
            }
            .task {
                await loadLists()
            }
        }
    }

    // MARK: - Data Loading

    private func loadLists() async {
        guard case .authenticated(let user) = authService.state else {
            isLoading = false
            return
        }
        let results = await ListService.fetchUserLists(userId: user.id)
        userLists = results
        isLoading = false
    }

    // MARK: - Toggle

    private func toggleBook(listId: UUID, inList: Bool) {
        let generator = UIImpactFeedbackGenerator(style: .light)
        generator.impactOccurred()

        Task {
            do {
                if inList {
                    try await ListService.removeBookFromList(listId: listId, bookKey: bookKey)
                } else {
                    try await ListService.addBookToList(
                        listId: listId,
                        bookKey: bookKey,
                        title: title,
                        author: author,
                        coverUrl: coverUrl
                    )
                }
                await loadLists()
            } catch {
                print("Error toggling book in list: \(error)")
            }
        }
    }
}
