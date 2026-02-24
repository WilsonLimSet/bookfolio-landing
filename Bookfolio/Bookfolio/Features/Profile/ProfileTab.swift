import SwiftUI

struct ProfileTab: View {
    @ObservedObject var router: TabRouter
    @EnvironmentObject var authService: AuthService

    var body: some View {
        NavigationStack(path: $router.path) {
            Group {
                if case .authenticated(let user) = authService.state {
                    ProfileView(userId: user.id)
                } else {
                    ProgressView()
                }
            }
            .withRouteDestinations()
        }
    }
}
