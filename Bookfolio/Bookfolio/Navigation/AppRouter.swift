import SwiftUI

enum Tab: Int, CaseIterable, Hashable {
    case feed
    case search
    case profile
    case leaderboard
    case lists

    var title: String {
        switch self {
        case .feed: "Feed"
        case .search: "Search"
        case .profile: "Profile"
        case .leaderboard: "Leaderboard"
        case .lists: "Lists"
        }
    }

    var icon: String {
        switch self {
        case .feed: "book.fill"
        case .search: "magnifyingglass"
        case .profile: "person.fill"
        case .leaderboard: "trophy.fill"
        case .lists: "list.bullet"
        }
    }
}

final class AppRouter: ObservableObject {
    @Published var selectedTab: Tab = .feed

    let feedRouter = TabRouter()
    let searchRouter = TabRouter()
    let profileRouter = TabRouter()
    let leaderboardRouter = TabRouter()
    let listsRouter = TabRouter()

    func router(for tab: Tab) -> TabRouter {
        switch tab {
        case .feed: feedRouter
        case .search: searchRouter
        case .profile: profileRouter
        case .leaderboard: leaderboardRouter
        case .lists: listsRouter
        }
    }

    func navigate(to tab: Tab, route: AppRoute? = nil) {
        selectedTab = tab
        if let route {
            router(for: tab).push(route)
        }
    }

    func popToRoot(tab: Tab) {
        router(for: tab).popToRoot()
    }
}
