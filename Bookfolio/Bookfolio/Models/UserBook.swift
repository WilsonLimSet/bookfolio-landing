import Foundation

enum BookCategory: String, Codable {
    case fiction
    case nonfiction
}

enum BookTier: String, Codable {
    case liked
    case fine
    case disliked
}

struct UserBook: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    let openLibraryKey: String
    let title: String
    let author: String?
    let coverUrl: String?
    let category: BookCategory
    let tier: BookTier
    let rankPosition: Int
    let score: Double
    let reviewText: String?
    let finishedAt: Date?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, title, author, category, tier, score
        case userId = "user_id"
        case openLibraryKey = "open_library_key"
        case coverUrl = "cover_url"
        case rankPosition = "rank_position"
        case reviewText = "review_text"
        case finishedAt = "finished_at"
        case createdAt = "created_at"
    }
}

struct RankBookParams: Encodable {
    let userId: UUID
    let openLibraryKey: String
    let title: String
    let author: String?
    let coverUrl: String?
    let category: BookCategory
    let tier: BookTier
    let rankPosition: Int
    let score: Double
    let reviewText: String?
    let finishedAt: Date?

    enum CodingKeys: String, CodingKey {
        case title, author, category, tier, score
        case userId = "user_id"
        case openLibraryKey = "open_library_key"
        case coverUrl = "cover_url"
        case rankPosition = "rank_position"
        case reviewText = "review_text"
        case finishedAt = "finished_at"
    }
}
