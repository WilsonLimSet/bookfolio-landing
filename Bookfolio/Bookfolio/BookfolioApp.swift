import SwiftUI

@main
struct BookfolioApp: App {
    @StateObject private var authService = AuthService()
    @StateObject private var appRouter = AppRouter()

    var body: some Scene {
        WindowGroup {
            Group {
                switch authService.state {
                case .loading:
                    VStack(spacing: 16) {
                        Image(systemName: "book.fill")
                            .font(.system(size: 48))
                            .foregroundStyle(Color.accentColor)
                        Text("Bookfolio")
                            .font(.largeTitle.bold())
                        ProgressView()
                    }
                case .unauthenticated:
                    LoginView()
                case .needsUsername(let user):
                    UsernameSetupView(userId: user.id)
                case .authenticated:
                    mainTabView
                }
            }
            .environmentObject(authService)
        }
    }

    private var mainTabView: some View {
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
