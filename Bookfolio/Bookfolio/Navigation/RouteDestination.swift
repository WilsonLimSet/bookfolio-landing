import SwiftUI

struct RouteDestination: ViewModifier {
    func body(content: Content) -> some View {
        content
            .navigationDestination(for: AppRoute.self) { route in
                switch route {
                case .bookDetail(let bookKey):
                    PlaceholderDestination(title: "Book Detail", detail: bookKey)
                case .userProfile(let userId):
                    PlaceholderDestination(title: "User Profile", detail: userId.uuidString)
                case .editProfile:
                    PlaceholderDestination(title: "Edit Profile", detail: nil)
                case .followers(let userId):
                    PlaceholderDestination(title: "Followers", detail: userId.uuidString)
                case .following(let userId):
                    PlaceholderDestination(title: "Following", detail: userId.uuidString)
                case .listDetail(let listId):
                    PlaceholderDestination(title: "List Detail", detail: listId.uuidString)
                case .reviewDetail(let reviewId):
                    PlaceholderDestination(title: "Review Detail", detail: reviewId.uuidString)
                case .rankBook(let bookKey, let title, _, _):
                    PlaceholderDestination(title: "Rank Book", detail: "\(title) (\(bookKey))")
                }
            }
    }
}

private struct PlaceholderDestination: View {
    let title: String
    let detail: String?

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "doc.text")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text(title)
                .font(.title2.bold())
            if let detail {
                Text(detail)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Text("Coming soon")
                .foregroundStyle(.tertiary)
        }
        .navigationTitle(title)
    }
}

extension View {
    func withRouteDestinations() -> some View {
        modifier(RouteDestination())
    }
}
