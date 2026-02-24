import SwiftUI

struct FeedTab: View {
    @EnvironmentObject var appRouter: AppRouter
    @ObservedObject var router: TabRouter

    var body: some View {
        NavigationStack(path: $router.path) {
            FeedPlaceholderView()
                .withRouteDestinations()
                .navigationTitle("Feed")
        }
    }
}

private struct FeedPlaceholderView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "book.fill")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("Feed")
                .font(.title2.bold())
            Text("Coming soon")
                .foregroundStyle(.secondary)
        }
    }
}
