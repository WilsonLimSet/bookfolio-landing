import SwiftUI

struct FeedTab: View {
    @ObservedObject var router: TabRouter
    @EnvironmentObject var authService: AuthService
    @StateObject private var feedService = FeedService()
    @State private var selectedTab = 0

    private var currentUserId: UUID? {
        guard case .authenticated(let user) = authService.state else { return nil }
        return user.id
    }

    var body: some View {
        NavigationStack(path: $router.path) {
            VStack(spacing: 0) {
                // Segmented picker
                Picker("Feed", selection: $selectedTab) {
                    Text("Friends").tag(0)
                    Text("You").tag(1)
                    Text("Incoming").tag(2)
                }
                .pickerStyle(.segmented)
                .padding()

                // Tab content
                Group {
                    switch selectedTab {
                    case 0:
                        friendsList
                    case 1:
                        yourList
                    case 2:
                        notificationsList
                    default:
                        EmptyView()
                    }
                }
            }
            .navigationTitle("Feed")
            .withRouteDestinations()
            .onChange(of: selectedTab) { _ in
                loadTabIfNeeded()
            }
            .task {
                loadTabIfNeeded()
            }
        }
    }

    // MARK: - Friends List

    @ViewBuilder
    private var friendsList: some View {
        if feedService.isLoading && feedService.friendsActivity.isEmpty {
            loadingView
        } else if feedService.friendsActivity.isEmpty {
            emptyState(
                icon: "magnifyingglass",
                message: "Follow some readers to see their activity here"
            )
        } else {
            ScrollView {
                LazyVStack(spacing: 0) {
                    ForEach(feedService.friendsActivity) { item in
                        FeedItemView(
                            item: item,
                            onLikeTap: {
                                guard let userId = currentUserId else { return }
                                Task {
                                    await feedService.toggleLike(
                                        reviewId: item.id,
                                        userId: userId,
                                        isCurrentlyLiked: item.isLikedByMe
                                    )
                                }
                            },
                            onUserTap: { userId in
                                router.push(.userProfile(userId: userId))
                            },
                            onBookTap: { bookKey in
                                router.push(.bookDetail(bookKey: bookKey))
                            }
                        )
                    }
                }
            }
        }
    }

    // MARK: - Your List

    @ViewBuilder
    private var yourList: some View {
        if feedService.isLoading && feedService.yourActivity.isEmpty {
            loadingView
        } else if feedService.yourActivity.isEmpty {
            emptyState(
                icon: "book",
                message: "Rank your first book to see your activity here"
            )
        } else {
            ScrollView {
                LazyVStack(spacing: 0) {
                    ForEach(feedService.yourActivity) { item in
                        FeedItemView(
                            item: item,
                            onLikeTap: {
                                guard let userId = currentUserId else { return }
                                Task {
                                    await feedService.toggleLike(
                                        reviewId: item.id,
                                        userId: userId,
                                        isCurrentlyLiked: item.isLikedByMe
                                    )
                                }
                            },
                            onUserTap: { userId in
                                router.push(.userProfile(userId: userId))
                            },
                            onBookTap: { bookKey in
                                router.push(.bookDetail(bookKey: bookKey))
                            }
                        )
                    }
                }
            }
        }
    }

    // MARK: - Notifications List

    @ViewBuilder
    private var notificationsList: some View {
        if feedService.isLoading && feedService.notifications.isEmpty {
            loadingView
        } else if feedService.notifications.isEmpty {
            emptyState(
                icon: "bell",
                message: "No notifications yet"
            )
        } else {
            ScrollView {
                LazyVStack(spacing: 0) {
                    ForEach(feedService.notifications) { item in
                        NotificationItemView(
                            item: item,
                            onUserTap: { userId in
                                router.push(.userProfile(userId: userId))
                            },
                            onBookTap: { bookKey in
                                router.push(.bookDetail(bookKey: bookKey))
                            }
                        )
                        Divider()
                    }
                }
            }
        }
    }

    // MARK: - Helpers

    @ViewBuilder
    private var loadingView: some View {
        Spacer()
        ProgressView()
        Spacer()
    }

    @ViewBuilder
    private func emptyState(icon: String, message: String) -> some View {
        Spacer()
        VStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 40))
                .foregroundStyle(.secondary)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
        Spacer()
    }

    private func loadTabIfNeeded() {
        guard let userId = currentUserId else { return }
        guard !feedService.loadedTabs.contains(selectedTab) else { return }
        feedService.loadedTabs.insert(selectedTab)

        Task {
            switch selectedTab {
            case 0:
                await feedService.loadFriendsActivity(userId: userId)
            case 1:
                await feedService.loadYourActivity(userId: userId)
            case 2:
                await feedService.loadNotifications(userId: userId)
            default:
                break
            }
        }
    }
}
