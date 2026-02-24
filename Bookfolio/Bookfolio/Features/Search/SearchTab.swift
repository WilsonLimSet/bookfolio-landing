import SwiftUI

struct SearchTab: View {
    @ObservedObject var router: TabRouter

    var body: some View {
        NavigationStack(path: $router.path) {
            BookSearchView { item in
                router.push(.bookDetail(bookKey: item.key))
            }
            .navigationTitle("Search")
            .withRouteDestinations()
        }
    }
}
