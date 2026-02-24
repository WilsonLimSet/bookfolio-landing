import Foundation

struct Referral: Codable, Identifiable {
    let id: UUID
    let referrerId: UUID

    enum CodingKeys: String, CodingKey {
        case id
        case referrerId = "referrer_id"
    }
}
