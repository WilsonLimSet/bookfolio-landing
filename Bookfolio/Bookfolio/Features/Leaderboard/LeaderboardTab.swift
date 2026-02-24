import SwiftUI

struct LeaderboardTab: View {
    @EnvironmentObject var appRouter: AppRouter
    @ObservedObject var router: TabRouter

    var body: some View {
        NavigationStack(path: $router.path) {
            LeaderboardView(
                onSelectBook: { bookKey in
                    router.push(.bookDetail(bookKey: bookKey))
                },
                onSelectUser: { userId in
                    router.push(.userProfile(userId: userId))
                }
            )
            .withRouteDestinations()
            .navigationTitle("Leaderboard")
        }
    }
}
