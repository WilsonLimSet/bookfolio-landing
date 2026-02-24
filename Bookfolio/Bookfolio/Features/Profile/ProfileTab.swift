import SwiftUI

struct ProfileTab: View {
    @EnvironmentObject var appRouter: AppRouter
    @EnvironmentObject var authService: AuthService
    @ObservedObject var router: TabRouter

    var body: some View {
        NavigationStack(path: $router.path) {
            ProfilePlaceholderView()
                .withRouteDestinations()
                .navigationTitle("Profile")
                .toolbar {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("Sign Out") {
                            Task { try? await authService.signOut() }
                        }
                        .font(.subheadline)
                    }
                }
        }
    }
}

private struct ProfilePlaceholderView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "person.fill")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("Profile")
                .font(.title2.bold())
            Text("Coming soon")
                .foregroundStyle(.secondary)
        }
    }
}
