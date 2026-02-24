import Foundation
import Supabase

struct ProfileStats {
    let fictionCount: Int
    let nonfictionCount: Int
    let wantToReadCount: Int
    let currentlyReadingCount: Int
    let booksFinishedThisYear: Int
    let followersCount: Int
    let followingCount: Int
    let favoriteBooks: [FavoriteBook]
    let weekStreak: Int
    let referralCount: Int
    let rank: Int?

    var totalBooksRead: Int { fictionCount + nonfictionCount }
}

struct FollowWithProfile: Codable {
    let followerId: UUID
    let followingId: UUID
    let createdAt: Date
    let profiles: Profile

    enum CodingKeys: String, CodingKey {
        case followerId = "follower_id"
        case followingId = "following_id"
        case createdAt = "created_at"
        case profiles
    }
}

@MainActor
enum ProfileService {

    // MARK: - Fetch Profile

    static func fetchProfile(username: String) async throws -> Profile {
        try await supabase.from("profiles")
            .select()
            .eq("username", value: username)
            .single()
            .execute()
            .value
    }

    static func fetchProfile(userId: UUID) async throws -> Profile {
        try await supabase.from("profiles")
            .select()
            .eq("id", value: userId.uuidString)
            .single()
            .execute()
            .value
    }

    // MARK: - Stats

    static func fetchStats(userId: UUID) async throws -> ProfileStats {
        let userIdString = userId.uuidString

        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]

        let year = Calendar.current.component(.year, from: Date())
        let startOfYear = "\(year)-01-01T00:00:00Z"
        let endOfYear = "\(year)-12-31T23:59:59Z"

        let twelveWeeksAgo = Calendar.current.date(byAdding: .weekOfYear, value: -12, to: Date())!
        let twelveWeeksAgoString = formatter.string(from: twelveWeeksAgo)

        async let fictionResponse = supabase.from("user_books")
            .select("id", head: true, count: .exact)
            .eq("user_id", value: userIdString)
            .eq("category", value: "fiction")
            .execute()

        async let nonfictionResponse = supabase.from("user_books")
            .select("id", head: true, count: .exact)
            .eq("user_id", value: userIdString)
            .eq("category", value: "nonfiction")
            .execute()

        async let wantToReadResponse = supabase.from("want_to_read")
            .select("user_id", head: true, count: .exact)
            .eq("user_id", value: userIdString)
            .execute()

        async let currentlyReadingResponse = supabase.from("currently_reading")
            .select("user_id", head: true, count: .exact)
            .eq("user_id", value: userIdString)
            .execute()

        async let booksThisYearResponse = supabase.from("user_books")
            .select("id", head: true, count: .exact)
            .eq("user_id", value: userIdString)
            .gte("finished_at", value: startOfYear)
            .lte("finished_at", value: endOfYear)
            .execute()

        async let followersResponse = supabase.from("follows")
            .select("follower_id", head: true, count: .exact)
            .eq("following_id", value: userIdString)
            .execute()

        async let followingResponse = supabase.from("follows")
            .select("following_id", head: true, count: .exact)
            .eq("follower_id", value: userIdString)
            .execute()

        async let favoritesResult: [FavoriteBook] = supabase.from("favorite_books")
            .select()
            .eq("user_id", value: userIdString)
            .order("position")
            .limit(4)
            .execute()
            .value

        async let referralsResponse = supabase.from("referrals")
            .select("id", head: true, count: .exact)
            .eq("referrer_id", value: userIdString)
            .execute()

        async let activitiesResult: [Activity] = supabase.from("activity")
            .select("created_at")
            .eq("user_id", value: userIdString)
            .gte("created_at", value: twelveWeeksAgoString)
            .execute()
            .value

        // Rank via RPC — optional, nil if no books
        let rankValue: Int? = try? await supabase.rpc(
            "get_user_book_rank",
            params: ["target_user_id": userIdString]
        ).execute().value

        let fiction = try await fictionResponse
        let nonfiction = try await nonfictionResponse
        let wantToRead = try await wantToReadResponse
        let currentlyReading = try await currentlyReadingResponse
        let booksThisYear = try await booksThisYearResponse
        let followers = try await followersResponse
        let following = try await followingResponse
        let favorites = try await favoritesResult
        let referrals = try await referralsResponse
        let activities = try await activitiesResult

        let streak = calculateWeekStreak(activities: activities)

        return ProfileStats(
            fictionCount: fiction.count ?? 0,
            nonfictionCount: nonfiction.count ?? 0,
            wantToReadCount: wantToRead.count ?? 0,
            currentlyReadingCount: currentlyReading.count ?? 0,
            booksFinishedThisYear: booksThisYear.count ?? 0,
            followersCount: followers.count ?? 0,
            followingCount: following.count ?? 0,
            favoriteBooks: favorites,
            weekStreak: streak,
            referralCount: referrals.count ?? 0,
            rank: rankValue
        )
    }

    // MARK: - Week Streak

    private static func calculateWeekStreak(activities: [Activity]) -> Int {
        guard !activities.isEmpty else { return 0 }

        let calendar = Calendar.current
        let now = Date()

        // Group activities by ISO week number + year
        var weeksWithActivity = Set<String>()
        for activity in activities {
            let weekOfYear = calendar.component(.weekOfYear, from: activity.createdAt)
            let yearForWeek = calendar.component(.yearForWeekOfYear, from: activity.createdAt)
            weeksWithActivity.insert("\(yearForWeek)-W\(weekOfYear)")
        }

        // Count consecutive weeks backwards from current week
        var streak = 0
        var checkDate = now

        for _ in 0..<12 {
            let weekOfYear = calendar.component(.weekOfYear, from: checkDate)
            let yearForWeek = calendar.component(.yearForWeekOfYear, from: checkDate)
            let key = "\(yearForWeek)-W\(weekOfYear)"

            if weeksWithActivity.contains(key) {
                streak += 1
            } else {
                break
            }

            checkDate = calendar.date(byAdding: .weekOfYear, value: -1, to: checkDate)!
        }

        return streak
    }

    // MARK: - Follow Lists

    static func fetchFollowers(userId: UUID) async throws -> [(Profile, Date)] {
        let follows: [FollowWithProfile] = try await supabase.from("follows")
            .select("follower_id, following_id, created_at, profiles:follower_id(id, username, bio, avatar_url, instagram, twitter, referral_code, reading_goal_2025, updated_at)")
            .eq("following_id", value: userId.uuidString)
            .execute()
            .value

        return follows.map { ($0.profiles, $0.createdAt) }
    }

    static func fetchFollowing(userId: UUID) async throws -> [(Profile, Date)] {
        let follows: [FollowWithProfile] = try await supabase.from("follows")
            .select("follower_id, following_id, created_at, profiles:following_id(id, username, bio, avatar_url, instagram, twitter, referral_code, reading_goal_2025, updated_at)")
            .eq("follower_id", value: userId.uuidString)
            .execute()
            .value

        return follows.map { ($0.profiles, $0.createdAt) }
    }

    // MARK: - Follow / Unfollow

    static func isFollowing(currentUserId: UUID, targetUserId: UUID) async throws -> Bool {
        let response = try await supabase.from("follows")
            .select("follower_id", head: true, count: .exact)
            .eq("follower_id", value: currentUserId.uuidString)
            .eq("following_id", value: targetUserId.uuidString)
            .execute()

        return (response.count ?? 0) > 0
    }

    static func follow(currentUserId: UUID, targetUserId: UUID) async throws {
        let follow = Follow(followerId: currentUserId, followingId: targetUserId)
        try await supabase.from("follows")
            .insert(follow)
            .execute()

        let activity = NewActivity(
            userId: currentUserId,
            actionType: .followed,
            bookTitle: nil,
            bookAuthor: nil,
            bookCoverUrl: nil,
            bookKey: nil,
            bookScore: nil,
            bookCategory: nil,
            targetUserId: targetUserId
        )
        try await supabase.from("activity")
            .insert(activity)
            .execute()

        let notification = NewNotification(
            userId: targetUserId,
            type: .follow,
            fromUserId: currentUserId,
            bookTitle: nil,
            bookKey: nil,
            reviewId: nil,
            read: false
        )
        try await supabase.from("notifications")
            .insert(notification)
            .execute()
    }

    static func unfollow(currentUserId: UUID, targetUserId: UUID) async throws {
        try await supabase.from("follows")
            .delete()
            .eq("follower_id", value: currentUserId.uuidString)
            .eq("following_id", value: targetUserId.uuidString)
            .execute()
    }
}
