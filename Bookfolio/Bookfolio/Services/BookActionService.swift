import Foundation
import Supabase

struct BookMetadata {
    let openLibraryKey: String
    let title: String
    let author: String?
    let coverUrl: String?
}

enum BookActionService {

    // MARK: - Want to Read

    static func addToWantToRead(userId: UUID, book: BookMetadata) async throws {
        let insert = WantToReadInsert(
            userId: userId,
            openLibraryKey: book.openLibraryKey,
            title: book.title,
            author: book.author,
            coverUrl: book.coverUrl
        )
        try await supabase.from("want_to_read")
            .insert(insert)
            .execute()

        Task {
            try? await logActivity(
                userId: userId,
                actionType: .wantToRead,
                book: book
            )
        }
    }

    static func removeFromWantToRead(userId: UUID, bookKey: String) async throws {
        try await supabase.from("want_to_read")
            .delete()
            .eq("user_id", value: userId)
            .eq("open_library_key", value: bookKey)
            .execute()
    }

    // MARK: - Currently Reading

    static func addToCurrentlyReading(userId: UUID, book: BookMetadata) async throws {
        let insert = CurrentlyReadingInsert(
            userId: userId,
            openLibraryKey: book.openLibraryKey,
            title: book.title,
            author: book.author,
            coverUrl: book.coverUrl
        )
        try await supabase.from("currently_reading")
            .insert(insert)
            .execute()

        // Fire-and-forget: auto-remove from want_to_read
        Task {
            try? await supabase.from("want_to_read")
                .delete()
                .eq("user_id", value: userId)
                .eq("open_library_key", value: book.openLibraryKey)
                .execute()
        }

        // Fire-and-forget: log activity
        Task {
            try? await logActivity(
                userId: userId,
                actionType: .startedReading,
                book: book
            )
        }
    }

    static func removeFromCurrentlyReading(userId: UUID, bookKey: String) async throws {
        try await supabase.from("currently_reading")
            .delete()
            .eq("user_id", value: userId)
            .eq("open_library_key", value: bookKey)
            .execute()
    }

    // MARK: - Status Check

    static func checkBookStatus(userId: UUID, bookKey: String) async -> (isWantToRead: Bool, isCurrentlyReading: Bool, userBook: UserBook?) {
        async let wantToReadResult: [WantToRead] = {
            do {
                return try await supabase.from("want_to_read")
                    .select()
                    .eq("user_id", value: userId)
                    .eq("open_library_key", value: bookKey)
                    .limit(1)
                    .execute()
                    .value
            } catch {
                return []
            }
        }()

        async let currentlyReadingResult: [CurrentlyReading] = {
            do {
                return try await supabase.from("currently_reading")
                    .select()
                    .eq("user_id", value: userId)
                    .eq("open_library_key", value: bookKey)
                    .limit(1)
                    .execute()
                    .value
            } catch {
                return []
            }
        }()

        async let userBookResult: [UserBook] = {
            do {
                return try await supabase.from("user_books")
                    .select()
                    .eq("user_id", value: userId)
                    .eq("open_library_key", value: bookKey)
                    .limit(1)
                    .execute()
                    .value
            } catch {
                return []
            }
        }()

        let (wtr, cr, ub) = await (wantToReadResult, currentlyReadingResult, userBookResult)
        return (isWantToRead: !wtr.isEmpty, isCurrentlyReading: !cr.isEmpty, userBook: ub.first)
    }

    // MARK: - Private

    private static func logActivity(userId: UUID, actionType: ActionType, book: BookMetadata) async throws {
        let activity = NewActivity(
            userId: userId,
            actionType: actionType,
            bookTitle: book.title,
            bookAuthor: book.author,
            bookCoverUrl: book.coverUrl,
            bookKey: book.openLibraryKey,
            bookScore: nil,
            bookCategory: nil,
            targetUserId: nil
        )
        try await supabase.from("activity")
            .insert(activity)
            .execute()
    }
}

// MARK: - Private Insert Structs

private struct WantToReadInsert: Encodable {
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

private struct CurrentlyReadingInsert: Encodable {
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
