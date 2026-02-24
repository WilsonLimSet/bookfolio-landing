import Foundation

struct Follow: Codable, Hashable {
    let followerId: UUID
    let followingId: UUID

    enum CodingKeys: String, CodingKey {
        case followerId = "follower_id"
        case followingId = "following_id"
    }
}
