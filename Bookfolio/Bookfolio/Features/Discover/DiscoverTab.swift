import SwiftUI

struct DiscoverTab: View {
    @ObservedObject var router: TabRouter

    var body: some View {
        NavigationStack(path: $router.path) {
            DiscoverView { userId in
                router.push(.userProfile(userId: userId))
            }
            .navigationTitle("Discover")
            .withRouteDestinations()
        }
    }
}
