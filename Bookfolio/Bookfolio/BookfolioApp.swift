import SwiftUI

@main
struct BookfolioApp: App {
    @StateObject private var appRouter = AppRouter()

    var body: some Scene {
        WindowGroup {
            TabView(selection: $appRouter.selectedTab) {
                FeedTab(router: appRouter.feedRouter)
                    .tabItem { Label(Tab.feed.title, systemImage: Tab.feed.icon) }
                    .tag(Tab.feed)
                SearchTab(router: appRouter.searchRouter)
                    .tabItem { Label(Tab.search.title, systemImage: Tab.search.icon) }
                    .tag(Tab.search)
                ProfileTab(router: appRouter.profileRouter)
                    .tabItem { Label(Tab.profile.title, systemImage: Tab.profile.icon) }
                    .tag(Tab.profile)
                LeaderboardTab(router: appRouter.leaderboardRouter)
                    .tabItem { Label(Tab.leaderboard.title, systemImage: Tab.leaderboard.icon) }
                    .tag(Tab.leaderboard)
                ListsTab(router: appRouter.listsRouter)
                    .tabItem { Label(Tab.lists.title, systemImage: Tab.lists.icon) }
                    .tag(Tab.lists)
            }
            .environmentObject(appRouter)
        }
    }
}
