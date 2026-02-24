import SwiftUI
import UserNotifications

@main
struct BookfolioApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject private var authService = AuthService()
    @StateObject private var appRouter = AppRouter()

    init() {
        UNUserNotificationCenter.current().delegate = PushNotificationService.shared
    }

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
                        .task {
                            _ = await PushNotificationService.shared.requestPermission()
                        }
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
            DiscoverTab(router: appRouter.discoverRouter)
                .tabItem { Label(Tab.discover.title, systemImage: Tab.discover.icon) }
                .tag(Tab.discover)
        }
        .environmentObject(appRouter)
    }
}

class AppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        Task {
            if let user = try? await supabase.auth.session.user {
                await PushNotificationService.shared.registerDeviceToken(deviceToken, userId: user.id)
            }
        }
    }

    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        print("Failed to register for remote notifications: \(error)")
    }
}
