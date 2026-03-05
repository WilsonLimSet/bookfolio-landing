import SwiftUI

enum Tab: Int, CaseIterable, Hashable {
    case feed
    case leaderboard
    case search
    case discover
    case profile

    var title: String {
        switch self {
        case .feed: "Feed"
        case .leaderboard: "Leaderboard"
        case .search: "Search"
        case .discover: "Discover"
        case .profile: "Profile"
        }
    }

    var icon: String {
        switch self {
        case .feed: "book.fill"
        case .leaderboard: "trophy.fill"
        case .search: "magnifyingglass"
        case .discover: "person.2.fill"
        case .profile: "person.fill"
        }
    }
}

final class AppRouter: ObservableObject {
    @Published var selectedTab: Tab = .feed

    let feedRouter = TabRouter()
    let searchRouter = TabRouter()
    let profileRouter = TabRouter()
    let leaderboardRouter = TabRouter()
    let discoverRouter = TabRouter()

    func router(for tab: Tab) -> TabRouter {
        switch tab {
        case .feed: feedRouter
        case .search: searchRouter
        case .profile: profileRouter
        case .leaderboard: leaderboardRouter
        case .discover: discoverRouter
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
