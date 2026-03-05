import Foundation

enum NotificationType: String, Codable {
    case follow
    case like
    case comment
    case friendRanked = "friend_ranked"
    case referral
}

struct Notification: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    let type: NotificationType
    let fromUserId: UUID?
    let bookTitle: String?
    let bookKey: String?
    let reviewId: UUID?
    let read: Bool
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, type, read
        case userId = "user_id"
        case fromUserId = "from_user_id"
        case bookTitle = "book_title"
        case bookKey = "book_key"
        case reviewId = "review_id"
        case createdAt = "created_at"
    }
}

struct NewNotification: Encodable {
    let userId: UUID
    let type: NotificationType
    let fromUserId: UUID?
    let bookTitle: String?
    let bookKey: String?
    let reviewId: UUID?
    let read: Bool

    enum CodingKeys: String, CodingKey {
        case type, read
        case userId = "user_id"
        case fromUserId = "from_user_id"
        case bookTitle = "book_title"
        case bookKey = "book_key"
        case reviewId = "review_id"
    }
}
