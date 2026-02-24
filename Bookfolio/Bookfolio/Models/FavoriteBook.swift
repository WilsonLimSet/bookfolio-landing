import Foundation

struct FavoriteBook: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    let openLibraryKey: String
    let title: String
    let author: String?
    let coverUrl: String?
    let position: Int

    enum CodingKeys: String, CodingKey {
        case id, title, author, position
        case userId = "user_id"
        case openLibraryKey = "open_library_key"
        case coverUrl = "cover_url"
    }
}
