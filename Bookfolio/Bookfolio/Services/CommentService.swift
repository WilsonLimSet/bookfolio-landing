import Foundation
import Supabase

// MARK: - Decodable Response Types

private struct CommentRow: Decodable {
    let id: UUID
    let userId: UUID
    let reviewId: UUID
    let commentText: String
    let createdAt: Date
    let profiles: ProfileRow

    struct ProfileRow: Decodable {
        let id: UUID
        let username: String?
        let avatarUrl: String?

        enum CodingKeys: String, CodingKey {
            case id, username
            case avatarUrl = "avatar_url"
        }
    }

    enum CodingKeys: String, CodingKey {
        case id, profiles
        case userId = "user_id"
        case reviewId = "review_id"
        case commentText = "comment_text"
        case createdAt = "created_at"
    }
}

private struct NewComment: Encodable {
    let userId: UUID
    let reviewId: UUID
    let commentText: String

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case reviewId = "review_id"
        case commentText = "comment_text"
    }
}

// MARK: - CommentService

enum CommentService {

    static func loadComments(reviewId: UUID) async throws -> [(comment: ReviewComment, profile: Profile)] {
        let rows: [CommentRow] = try await supabase.from("review_comments")
            .select("*, profiles(id, username, avatar_url)")
            .eq("review_id", value: reviewId)
            .order("created_at")
            .limit(50)
            .execute()
            .value

        return rows.map { row in
            let comment = ReviewComment(
                id: row.id,
                userId: row.userId,
                reviewId: row.reviewId,
                commentText: row.commentText,
                createdAt: row.createdAt
            )
            let profile = Profile(
                id: row.profiles.id,
                username: row.profiles.username ?? "Unknown",
                bio: nil,
                avatarUrl: row.profiles.avatarUrl,
                instagram: nil,
                twitter: nil,
                referralCode: nil,
                readingGoal2025: nil,
                updatedAt: nil
            )
            return (comment: comment, profile: profile)
        }
    }

    static func postComment(userId: UUID, reviewId: UUID, text: String, reviewOwnerId: UUID, bookTitle: String?) async throws {
        let newComment = NewComment(userId: userId, reviewId: reviewId, commentText: text)
        try await supabase.from("review_comments")
            .insert(newComment)
            .execute()

        // Send notification if commenter is not the review owner
        if userId != reviewOwnerId {
            Task { @Sendable in
                try? await supabase.from("notifications")
                    .insert(NewNotification(
                        userId: reviewOwnerId,
                        type: .comment,
                        fromUserId: userId,
                        bookTitle: bookTitle,
                        bookKey: nil,
                        reviewId: reviewId,
                        read: false
                    ))
                    .execute()
            }
        }
    }

    static func deleteComment(commentId: UUID) async throws {
        try await supabase.from("review_comments")
            .delete()
            .eq("id", value: commentId)
            .execute()
    }
}
