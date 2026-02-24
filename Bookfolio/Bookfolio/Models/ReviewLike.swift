import Foundation

struct ReviewLike: Codable, Hashable {
    let userId: UUID
    let reviewId: UUID

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case reviewId = "review_id"
    }
}
