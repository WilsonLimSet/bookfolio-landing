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
                        Image("AppLogo")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 80, height: 80)
                        Text("Bookfolio")
                            .font(.largeTitle.bold())
                        ProgressView()
                    }
                case .unauthenticated:
                    OnboardingView(startStep: .carousel, userId: nil)
                case .needsUsername(let user):
                    OnboardingView(startStep: .username, userId: user.id)
                case .needsOnboarding(let user):
                    OnboardingView(startStep: .photo, userId: user.id)
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
            LeaderboardTab(router: appRouter.leaderboardRouter)
                .tabItem { Label(Tab.leaderboard.title, systemImage: Tab.leaderboard.icon) }
                .tag(Tab.leaderboard)
            SearchTab(router: appRouter.searchRouter)
                .tabItem { Label(Tab.search.title, systemImage: Tab.search.icon) }
                .tag(Tab.search)
            DiscoverTab(router: appRouter.discoverRouter)
                .tabItem { Label(Tab.discover.title, systemImage: Tab.discover.icon) }
                .tag(Tab.discover)
            ProfileTab(router: appRouter.profileRouter)
                .tabItem {
                    ProfileTabLabel()
                }
                .tag(Tab.profile)
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
