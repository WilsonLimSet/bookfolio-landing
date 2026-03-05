import Foundation

struct Referral: Codable, Identifiable {
    let id: UUID
    let referrerId: UUID
    let referredId: UUID?

    enum CodingKeys: String, CodingKey {
        case id
        case referrerId = "referrer_id"
        case referredId = "referred_id"
    }
}
