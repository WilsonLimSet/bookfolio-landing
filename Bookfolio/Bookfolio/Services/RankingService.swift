import Foundation
import Supabase

// MARK: - Ranking Step

enum RankingStep: Int, CaseIterable {
    case cover, category, tier, compare, review, saving
}

// MARK: - RPC Types

/// Parameters for the rank_book RPC — uses p_ prefix to match Postgres function signature.
private struct RankBookRPCParams: Encodable {
    let pUserId: UUID
    let pTitle: String
    let pAuthor: String?
    let pCoverUrl: String?
    let pOpenLibraryKey: String
    let pCategory: BookCategory
    let pTier: BookTier
    let pRankPosition: Int
    let pReviewText: String?
    let pFinishedAt: Date?
    let pExistingEntryId: UUID?

    enum CodingKeys: String, CodingKey {
        case pUserId = "p_user_id"
        case pTitle = "p_title"
        case pAuthor = "p_author"
        case pCoverUrl = "p_cover_url"
        case pOpenLibraryKey = "p_open_library_key"
        case pCategory = "p_category"
        case pTier = "p_tier"
        case pRankPosition = "p_rank_position"
        case pReviewText = "p_review_text"
        case pFinishedAt = "p_finished_at"
        case pExistingEntryId = "p_existing_entry_id"
    }
}

private struct RankBookResult: Decodable {
    let score: Double
}

// MARK: - RankingService

enum RankingService {

    /// Prefetch user books for both categories in parallel.
    static func prefetchUserBooks(userId: UUID) async -> [String: [UserBook]] {
        async let fictionResult: [UserBook] = {
            do {
                return try await supabase.from("user_books")
                    .select()
                    .eq("user_id", value: userId)
                    .eq("category", value: "fiction")
                    .order("rank_position")
                    .execute()
                    .value
            } catch {
                return []
            }
        }()

        async let nonfictionResult: [UserBook] = {
            do {
                return try await supabase.from("user_books")
                    .select()
                    .eq("user_id", value: userId)
                    .eq("category", value: "nonfiction")
                    .order("rank_position")
                    .execute()
                    .value
            } catch {
                return []
            }
        }()

        let (fiction, nonfiction) = await (fictionResult, nonfictionResult)
        return ["fiction": fiction, "nonfiction": nonfiction]
    }

    /// Call the rank_book RPC to insert/update a ranked book. Returns the computed score.
    static func rankBook(
        userId: UUID,
        title: String,
        author: String?,
        coverUrl: String?,
        openLibraryKey: String,
        category: BookCategory,
        tier: BookTier,
        rankPosition: Int,
        reviewText: String?,
        finishedAt: Date?,
        existingEntryId: UUID?
    ) async throws -> Double {
        let params = RankBookRPCParams(
            pUserId: userId,
            pTitle: title,
            pAuthor: author,
            pCoverUrl: coverUrl,
            pOpenLibraryKey: openLibraryKey,
            pCategory: category,
            pTier: tier,
            pRankPosition: rankPosition,
            pReviewText: reviewText,
            pFinishedAt: finishedAt,
            pExistingEntryId: existingEntryId
        )

        let result: RankBookResult = try await supabase
            .rpc("rank_book", params: params)
            .single()
            .execute()
            .value

        return result.score
    }

    /// Fire-and-forget activity logging after a successful ranking.
    static func logRankingActivity(
        userId: UUID,
        book: BookMetadata,
        coverUrl: String?,
        score: Double,
        category: BookCategory
    ) async {
        let activity = NewActivity(
            userId: userId,
            actionType: .ranked,
            bookTitle: book.title,
            bookAuthor: book.author,
            bookCoverUrl: coverUrl,
            bookKey: book.openLibraryKey,
            bookScore: score,
            bookCategory: category.rawValue,
            targetUserId: nil
        )
        try? await supabase.from("activity")
            .insert(activity)
            .execute()
    }
}
