import Foundation

struct BookList: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    let name: String
    let description: String?
    let isPublic: Bool
    let createdAt: Date
    let updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id, name, description
        case userId = "user_id"
        case isPublic = "is_public"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}
