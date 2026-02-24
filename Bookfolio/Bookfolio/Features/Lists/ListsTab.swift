import SwiftUI

struct ListsTab: View {
    @EnvironmentObject var appRouter: AppRouter
    @ObservedObject var router: TabRouter

    var body: some View {
        NavigationStack(path: $router.path) {
            ListsPlaceholderView()
                .withRouteDestinations()
                .navigationTitle("Lists")
        }
    }
}

private struct ListsPlaceholderView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "list.bullet")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("Lists")
                .font(.title2.bold())
            Text("Coming soon")
                .foregroundStyle(.secondary)
        }
    }
}
