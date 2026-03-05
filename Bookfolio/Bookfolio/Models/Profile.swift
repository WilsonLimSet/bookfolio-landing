import Foundation

struct Profile: Codable, Identifiable {
    let id: UUID
    let username: String
    let bio: String?
    let avatarUrl: String?
    let instagram: String?
    let twitter: String?
    let referralCode: String?
    let referralBadge: String?
    let readingGoal2025: Int?
    let updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, username, bio, instagram, twitter
        case avatarUrl = "avatar_url"
        case referralCode = "referral_code"
        case referralBadge = "referral_badge"
        case readingGoal2025 = "reading_goal_2025"
        case updatedAt = "updated_at"
    }
}

struct ProfileUpdate: Encodable {
    var bio: String?
    var avatarUrl: String?
    var instagram: String?
    var twitter: String?
    var readingGoal2025: Int?

    enum CodingKeys: String, CodingKey {
        case bio, instagram, twitter
        case avatarUrl = "avatar_url"
        case readingGoal2025 = "reading_goal_2025"
    }
}
