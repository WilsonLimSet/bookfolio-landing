import Foundation

struct ReviewComment: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    let reviewId: UUID
    let commentText: String
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case reviewId = "review_id"
        case commentText = "comment_text"
        case createdAt = "created_at"
    }
}
