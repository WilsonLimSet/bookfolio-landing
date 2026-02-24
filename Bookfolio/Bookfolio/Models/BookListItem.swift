import Foundation

struct BookListItem: Codable, Identifiable {
    let id: UUID
    let listId: UUID
    let openLibraryKey: String
    let title: String
    let author: String?
    let coverUrl: String?
    let position: Int
    let addedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, title, author, position
        case listId = "list_id"
        case openLibraryKey = "open_library_key"
        case coverUrl = "cover_url"
        case addedAt = "added_at"
    }
}
