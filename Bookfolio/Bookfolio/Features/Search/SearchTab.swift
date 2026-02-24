import SwiftUI

struct SearchTab: View {
    @EnvironmentObject var appRouter: AppRouter
    @ObservedObject var router: TabRouter

    var body: some View {
        NavigationStack(path: $router.path) {
            SearchPlaceholderView()
                .withRouteDestinations()
                .navigationTitle("Search")
        }
    }
}

private struct SearchPlaceholderView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("Search")
                .font(.title2.bold())
            Text("Coming soon")
                .foregroundStyle(.secondary)
        }
    }
}
