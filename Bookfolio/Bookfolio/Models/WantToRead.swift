import Foundation

struct WantToRead: Codable, Hashable {
    let userId: UUID
    let openLibraryKey: String
    let title: String
    let author: String?
    let coverUrl: String?

    enum CodingKeys: String, CodingKey {
        case title, author
        case userId = "user_id"
        case openLibraryKey = "open_library_key"
        case coverUrl = "cover_url"
    }
}
