import Foundation

enum ActionType: String, Codable {
    case ranked
    case followed
    case wantToRead = "want_to_read"
    case startedReading = "started_reading"
}

struct Activity: Codable, Hashable {
    let userId: UUID
    let actionType: ActionType
    let bookTitle: String?
    let bookAuthor: String?
    let bookCoverUrl: String?
    let bookKey: String?
    let bookScore: Double?
    let bookCategory: String?
    let targetUserId: UUID?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case actionType = "action_type"
        case bookTitle = "book_title"
        case bookAuthor = "book_author"
        case bookCoverUrl = "book_cover_url"
        case bookKey = "book_key"
        case bookScore = "book_score"
        case bookCategory = "book_category"
        case targetUserId = "target_user_id"
        case createdAt = "created_at"
    }
}

struct NewActivity: Encodable {
    let userId: UUID
    let actionType: ActionType
    let bookTitle: String?
    let bookAuthor: String?
    let bookCoverUrl: String?
    let bookKey: String?
    let bookScore: Double?
    let bookCategory: String?
    let targetUserId: UUID?

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case actionType = "action_type"
        case bookTitle = "book_title"
        case bookAuthor = "book_author"
        case bookCoverUrl = "book_cover_url"
        case bookKey = "book_key"
        case bookScore = "book_score"
        case bookCategory = "book_category"
        case targetUserId = "target_user_id"
    }
}
