import Foundation

enum AppRoute: Hashable {
    case bookDetail(bookKey: String)
    case userProfile(userId: UUID)
    case editProfile
    case followers(userId: UUID)
    case following(userId: UUID)
    case listDetail(listId: UUID)
    case myLists(userId: UUID)
    case createList
    case browseLists
    case reviewDetail(reviewId: UUID)
    case rankBook(bookKey: String, title: String, author: String?, coverUrl: String?)
    case readBooks(userId: UUID)
    case currentlyReading(userId: UUID)
    case wantToRead(userId: UUID)
    case importBooks
}
