import SwiftUI

struct LeaderboardTab: View {
    @EnvironmentObject var appRouter: AppRouter
    @ObservedObject var router: TabRouter

    var body: some View {
        NavigationStack(path: $router.path) {
            LeaderboardPlaceholderView()
                .withRouteDestinations()
                .navigationTitle("Leaderboard")
        }
    }
}

private struct LeaderboardPlaceholderView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "trophy.fill")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("Leaderboard")
                .font(.title2.bold())
            Text("Coming soon")
                .foregroundStyle(.secondary)
        }
    }
}
