import Foundation
import Supabase

enum ListService {

    // MARK: - Private Row Types

    private struct ListWithItemsRow: Decodable {
        let id: UUID
        let userId: UUID
        let name: String
        let description: String?
        let isPublic: Bool
        let createdAt: Date
        let updatedAt: Date
        let bookListItems: [BookListItem]

        enum CodingKeys: String, CodingKey {
            case id, name, description
            case userId = "user_id"
            case isPublic = "is_public"
            case createdAt = "created_at"
            case updatedAt = "updated_at"
            case bookListItems = "book_list_items"
        }
    }

    private struct ListWithProfileRow: Decodable {
        let id: UUID
        let userId: UUID
        let name: String
        let description: String?
        let isPublic: Bool
        let createdAt: Date
        let updatedAt: Date
        let profiles: ProfileRow
        let bookListItems: [BookListItem]

        struct ProfileRow: Decodable {
            let username: String?
            let avatarUrl: String?
            enum CodingKeys: String, CodingKey {
                case username
                case avatarUrl = "avatar_url"
            }
        }

        enum CodingKeys: String, CodingKey {
            case id, name, description, profiles
            case userId = "user_id"
            case isPublic = "is_public"
            case createdAt = "created_at"
            case updatedAt = "updated_at"
            case bookListItems = "book_list_items"
        }
    }

    // MARK: - Private Insert Types

    private struct NewList: Encodable {
        let userId: UUID
        let name: String
        let description: String?
        let isPublic: Bool

        enum CodingKeys: String, CodingKey {
            case name, description
            case userId = "user_id"
            case isPublic = "is_public"
        }
    }

    private struct NewListItem: Encodable {
        let listId: UUID
        let openLibraryKey: String
        let title: String
        let author: String?
        let coverUrl: String?
        let position: Int

        enum CodingKeys: String, CodingKey {
            case title, author, position
            case listId = "list_id"
            case openLibraryKey = "open_library_key"
            case coverUrl = "cover_url"
        }
    }

    private struct PositionRow: Decodable {
        let position: Int
    }

    // MARK: - Fetch Methods

    static func fetchPublicLists() async -> [(list: BookList, creatorName: String?, items: [BookListItem])] {
        do {
            let rows: [ListWithProfileRow] = try await supabase.from("book_lists")
                .select("*, profiles(username, avatar_url), book_list_items(*)")
                .eq("is_public", value: true)
                .order("updated_at", ascending: false)
                .limit(20)
                .execute()
                .value

            return rows.map { row in
                let list = BookList(
                    id: row.id,
                    userId: row.userId,
                    name: row.name,
                    description: row.description,
                    isPublic: row.isPublic,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt
                )
                return (list: list, creatorName: row.profiles.username, items: row.bookListItems)
            }
        } catch {
            return []
        }
    }

    static func fetchUserLists(userId: UUID) async -> [(list: BookList, items: [BookListItem])] {
        do {
            let rows: [ListWithItemsRow] = try await supabase.from("book_lists")
                .select("*, book_list_items(*)")
                .eq("user_id", value: userId.uuidString)
                .order("updated_at", ascending: false)
                .execute()
                .value

            return rows.map { row in
                let list = BookList(
                    id: row.id,
                    userId: row.userId,
                    name: row.name,
                    description: row.description,
                    isPublic: row.isPublic,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt
                )
                return (list: list, items: row.bookListItems)
            }
        } catch {
            return []
        }
    }

    static func fetchListDetail(listId: UUID) async throws -> (list: BookList, items: [BookListItem], creatorName: String?) {
        let rows: [ListWithProfileRow] = try await supabase.from("book_lists")
            .select("*, profiles(username, avatar_url), book_list_items(*)")
            .eq("id", value: listId.uuidString)
            .limit(1)
            .execute()
            .value

        guard let row = rows.first else {
            throw NSError(domain: "ListService", code: 404, userInfo: [NSLocalizedDescriptionKey: "List not found"])
        }

        let list = BookList(
            id: row.id,
            userId: row.userId,
            name: row.name,
            description: row.description,
            isPublic: row.isPublic,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt
        )
        let sortedItems = row.bookListItems.sorted { $0.position < $1.position }
        return (list: list, items: sortedItems, creatorName: row.profiles.username)
    }

    // MARK: - Create / Delete

    static func createList(userId: UUID, name: String, description: String?, isPublic: Bool) async throws -> BookList {
        let newList = NewList(
            userId: userId,
            name: name,
            description: description,
            isPublic: isPublic
        )
        let created: BookList = try await supabase.from("book_lists")
            .insert(newList)
            .select()
            .single()
            .execute()
            .value
        return created
    }

    static func deleteList(listId: UUID) async throws {
        try await supabase.from("book_lists")
            .delete()
            .eq("id", value: listId.uuidString)
            .execute()
    }

    // MARK: - Add / Remove Books

    static func addBookToList(listId: UUID, bookKey: String, title: String, author: String?, coverUrl: String?) async throws {
        let positionRows: [PositionRow] = try await supabase.from("book_list_items")
            .select("position")
            .eq("list_id", value: listId.uuidString)
            .order("position", ascending: false)
            .limit(1)
            .execute()
            .value

        let maxPosition = positionRows.first?.position ?? 0

        let newItem = NewListItem(
            listId: listId,
            openLibraryKey: bookKey,
            title: title,
            author: author,
            coverUrl: coverUrl,
            position: maxPosition + 1
        )
        try await supabase.from("book_list_items")
            .insert(newItem)
            .execute()
    }

    static func removeBookFromList(listId: UUID, bookKey: String) async throws {
        try await supabase.from("book_list_items")
            .delete()
            .eq("list_id", value: listId.uuidString)
            .eq("open_library_key", value: bookKey)
            .execute()
    }
}
