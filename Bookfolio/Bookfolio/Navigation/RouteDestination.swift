import SwiftUI

struct RouteDestination: ViewModifier {
    func body(content: Content) -> some View {
        content
            .navigationDestination(for: AppRoute.self) { route in
                switch route {
                case .bookDetail(let bookKey):
                    PlaceholderDestination(title: "Book Detail", detail: bookKey)
                case .userProfile(let userId):
                    ProfileView(userId: userId)
                case .editProfile:
                    EditProfileView()
                case .followers(let userId):
                    FollowListView(userId: userId, listType: .followers)
                case .following(let userId):
                    FollowListView(userId: userId, listType: .following)
                case .listDetail(let listId):
                    PlaceholderDestination(title: "List Detail", detail: listId.uuidString)
                case .reviewDetail(let reviewId):
                    PlaceholderDestination(title: "Review Detail", detail: reviewId.uuidString)
                case .rankBook(let bookKey, let title, _, _):
                    PlaceholderDestination(title: "Rank Book", detail: "\(title) (\(bookKey))")
                case .readBooks(let userId):
                    ReadBooksView(userId: userId)
                case .currentlyReading(let userId):
                    CurrentlyReadingView(userId: userId)
                case .wantToRead(let userId):
                    WantToReadView(userId: userId)
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
