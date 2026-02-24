import Foundation
import Supabase

// MARK: - Feed Models

struct FeedItem: Identifiable {
    let id: UUID
    let userId: UUID
    let username: String
    let avatarUrl: String?
    let title: String
    let author: String?
    let coverUrl: String?
    let openLibraryKey: String
    let score: Double
    let tier: BookTier
    let category: BookCategory
    let reviewText: String?
    let finishedAt: Date?
    let createdAt: Date
    var likeCount: Int
    var isLikedByMe: Bool
}

struct NotificationItem: Identifiable {
    let id: UUID
    let type: NotificationType
    let fromUserId: UUID?
    let fromUsername: String?
    let fromAvatarUrl: String?
    let bookTitle: String?
    let bookKey: String?
    let reviewId: UUID?
    let read: Bool
    let createdAt: Date
}

// MARK: - Decodable Response Types

private struct FollowRow: Decodable {
    let followingId: UUID

    enum CodingKeys: String, CodingKey {
        case followingId = "following_id"
    }
}

private struct ProfileRow: Decodable {
    let id: UUID
    let username: String
    let avatarUrl: String?

    enum CodingKeys: String, CodingKey {
        case id, username
        case avatarUrl = "avatar_url"
    }
}

private struct ReviewLikeRow: Decodable {
    let reviewId: UUID
    let userId: UUID

    enum CodingKeys: String, CodingKey {
        case reviewId = "review_id"
        case userId = "user_id"
    }
}

// MARK: - FeedService

@MainActor
class FeedService: ObservableObject {
    @Published var friendsActivity: [FeedItem] = []
    @Published var yourActivity: [FeedItem] = []
    @Published var notifications: [NotificationItem] = []
    @Published var isLoading = false

    var loadedTabs: Set<Int> = []

    // MARK: - Friends Activity

    func loadFriendsActivity(userId: UUID) async {
        isLoading = true
        defer { isLoading = false }

        do {
            // 1. Get following IDs
            let follows: [FollowRow] = try await supabase.from("follows")
                .select("following_id")
                .eq("follower_id", value: userId)
                .execute()
                .value

            let followingIds = follows.map { $0.followingId }

            guard !followingIds.isEmpty else {
                friendsActivity = []
                return
            }

            let followingStrings = followingIds.map { $0.uuidString }

            // 2. Get user_books for followed users
            let books: [UserBook] = try await supabase.from("user_books")
                .select()
                .in("user_id", values: followingStrings)
                .order("created_at", ascending: false)
                .limit(50)
                .execute()
                .value

            guard !books.isEmpty else {
                friendsActivity = []
                return
            }

            // 3. Get profiles for those users
            let uniqueUserIds = Array(Set(books.map { $0.userId }))
            let userIdStrings = uniqueUserIds.map { $0.uuidString }
            let profiles: [ProfileRow] = try await supabase.from("profiles")
                .select("id, username, avatar_url")
                .in("id", values: userIdStrings)
                .execute()
                .value

            let profileMap = Dictionary(uniqueKeysWithValues: profiles.map { ($0.id, $0) })

            // 4. Get review likes for these book IDs
            let bookIdStrings = books.map { $0.id.uuidString }
            let allLikes: [ReviewLikeRow] = try await supabase.from("review_likes")
                .select("review_id, user_id")
                .in("review_id", values: bookIdStrings)
                .execute()
                .value

            // Count likes per review
            var likeCounts: [UUID: Int] = [:]
            var myLikes: Set<UUID> = []
            for like in allLikes {
                likeCounts[like.reviewId, default: 0] += 1
                if like.userId == userId {
                    myLikes.insert(like.reviewId)
                }
            }

            // 5. Map to FeedItem
            friendsActivity = books.map { book in
                let profile = profileMap[book.userId]
                return FeedItem(
                    id: book.id,
                    userId: book.userId,
                    username: profile?.username ?? "Unknown",
                    avatarUrl: profile?.avatarUrl,
                    title: book.title,
                    author: book.author,
                    coverUrl: book.coverUrl,
                    openLibraryKey: book.openLibraryKey,
                    score: book.score,
                    tier: book.tier,
                    category: book.category,
                    reviewText: book.reviewText,
                    finishedAt: book.finishedAt,
                    createdAt: book.createdAt,
                    likeCount: likeCounts[book.id] ?? 0,
                    isLikedByMe: myLikes.contains(book.id)
                )
            }
        } catch {
            print("Error loading friends activity: \(error)")
            friendsActivity = []
        }
    }

    // MARK: - Your Activity

    func loadYourActivity(userId: UUID) async {
        isLoading = true
        defer { isLoading = false }

        do {
            // 1. Get user's books
            let books: [UserBook] = try await supabase.from("user_books")
                .select()
                .eq("user_id", value: userId)
                .order("created_at", ascending: false)
                .limit(50)
                .execute()
                .value

            guard !books.isEmpty else {
                yourActivity = []
                return
            }

            // 2. Get profile
            let profiles: [ProfileRow] = try await supabase.from("profiles")
                .select("id, username, avatar_url")
                .eq("id", value: userId)
                .execute()
                .value

            let profile = profiles.first

            // 3. Get review likes
            let bookIdStrings = books.map { $0.id.uuidString }
            let allLikes: [ReviewLikeRow] = try await supabase.from("review_likes")
                .select("review_id, user_id")
                .in("review_id", values: bookIdStrings)
                .execute()
                .value

            var likeCounts: [UUID: Int] = [:]
            var myLikes: Set<UUID> = []
            for like in allLikes {
                likeCounts[like.reviewId, default: 0] += 1
                if like.userId == userId {
                    myLikes.insert(like.reviewId)
                }
            }

            // 4. Map to FeedItem
            yourActivity = books.map { book in
                FeedItem(
                    id: book.id,
                    userId: book.userId,
                    username: profile?.username ?? "Unknown",
                    avatarUrl: profile?.avatarUrl,
                    title: book.title,
                    author: book.author,
                    coverUrl: book.coverUrl,
                    openLibraryKey: book.openLibraryKey,
                    score: book.score,
                    tier: book.tier,
                    category: book.category,
                    reviewText: book.reviewText,
                    finishedAt: book.finishedAt,
                    createdAt: book.createdAt,
                    likeCount: likeCounts[book.id] ?? 0,
                    isLikedByMe: myLikes.contains(book.id)
                )
            }
        } catch {
            print("Error loading your activity: \(error)")
            yourActivity = []
        }
    }

    // MARK: - Notifications

    func loadNotifications(userId: UUID) async {
        isLoading = true
        defer { isLoading = false }

        do {
            // 1. Fetch notifications
            let notifs: [Notification] = try await supabase.from("notifications")
                .select()
                .eq("user_id", value: userId)
                .order("created_at", ascending: false)
                .limit(50)
                .execute()
                .value

            // 2. Get profiles for from_user_ids
            let fromUserIds = Array(Set(notifs.compactMap { $0.fromUserId }))
            var profileMap: [UUID: ProfileRow] = [:]
            if !fromUserIds.isEmpty {
                let idStrings = fromUserIds.map { $0.uuidString }
                let profiles: [ProfileRow] = try await supabase.from("profiles")
                    .select("id, username, avatar_url")
                    .in("id", values: idStrings)
                    .execute()
                    .value
                profileMap = Dictionary(uniqueKeysWithValues: profiles.map { ($0.id, $0) })
            }

            // 3. Map to NotificationItem
            notifications = notifs.map { notif in
                let profile = notif.fromUserId.flatMap { profileMap[$0] }
                return NotificationItem(
                    id: notif.id,
                    type: notif.type,
                    fromUserId: notif.fromUserId,
                    fromUsername: profile?.username,
                    fromAvatarUrl: profile?.avatarUrl,
                    bookTitle: notif.bookTitle,
                    bookKey: notif.bookKey,
                    reviewId: notif.reviewId,
                    read: notif.read,
                    createdAt: notif.createdAt
                )
            }

            // 4. Mark unread as read
            try await supabase.from("notifications")
                .update(["read": true])
                .eq("user_id", value: userId)
                .eq("read", value: false)
                .execute()
        } catch {
            print("Error loading notifications: \(error)")
            notifications = []
        }
    }

    // MARK: - Toggle Like

    func toggleLike(reviewId: UUID, userId: UUID, isCurrentlyLiked: Bool) async {
        // Optimistic update
        updateLikeState(reviewId: reviewId, liked: !isCurrentlyLiked)

        do {
            if isCurrentlyLiked {
                // Unlike
                try await supabase.from("review_likes")
                    .delete()
                    .eq("user_id", value: userId)
                    .eq("review_id", value: reviewId)
                    .execute()
            } else {
                // Like
                let newLike = ReviewLike(userId: userId, reviewId: reviewId)
                try await supabase.from("review_likes")
                    .insert(newLike)
                    .execute()
            }
        } catch {
            // Revert optimistic update on error
            print("Error toggling like: \(error)")
            updateLikeState(reviewId: reviewId, liked: isCurrentlyLiked)
        }
    }

    private func updateLikeState(reviewId: UUID, liked: Bool) {
        let delta = liked ? 1 : -1

        if let index = friendsActivity.firstIndex(where: { $0.id == reviewId }) {
            friendsActivity[index].likeCount += delta
            friendsActivity[index].isLikedByMe = liked
        }
        if let index = yourActivity.firstIndex(where: { $0.id == reviewId }) {
            yourActivity[index].likeCount += delta
            yourActivity[index].isLikedByMe = liked
        }
    }
}
