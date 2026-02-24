import Foundation

struct LeaderboardBook: Identifiable {
    let id: String // open_library_key
    let title: String
    let author: String?
    let coverUrl: String?
    let averageScore: Double
    let ratingCount: Int
}

struct LeaderboardUser: Identifiable {
    let id: UUID
    let username: String?
    let avatarUrl: String?
    let bookCount: Int
}

enum LeaderboardService {
    private struct LikedBookRow: Decodable {
        let openLibraryKey: String
        let title: String
        let author: String?
        let coverUrl: String?
        let score: Double
        let category: String

        enum CodingKeys: String, CodingKey {
            case title, author, score, category
            case openLibraryKey = "open_library_key"
            case coverUrl = "cover_url"
        }
    }

    private struct UserIdRow: Decodable {
        let userId: UUID

        enum CodingKeys: String, CodingKey {
            case userId = "user_id"
        }
    }

    private struct ProfileRow: Decodable {
        let id: UUID
        let username: String?
        let avatarUrl: String?

        enum CodingKeys: String, CodingKey {
            case id, username
            case avatarUrl = "avatar_url"
        }
    }

    static func fetchLeaderboardData() async -> (fiction: [LeaderboardBook], nonfiction: [LeaderboardBook], activeUsers: [LeaderboardUser]) {
        async let likedBooks = fetchLikedBooks()
        async let userIds = fetchUserIds()

        let (books, ids) = await (likedBooks, userIds)

        let (fiction, nonfiction) = aggregateBooks(books)
        let activeUsers = await fetchActiveUsers(from: ids)

        return (fiction: fiction, nonfiction: nonfiction, activeUsers: activeUsers)
    }

    private static func fetchLikedBooks() async -> [LikedBookRow] {
        guard let rows: [LikedBookRow] = try? await supabase
            .from("user_books")
            .select("open_library_key, title, author, cover_url, score, category")
            .eq("tier", value: "liked")
            .order("score", ascending: false)
            .limit(200)
            .execute()
            .value
        else {
            return []
        }
        return rows
    }

    private static func fetchUserIds() async -> [UserIdRow] {
        guard let rows: [UserIdRow] = try? await supabase
            .from("user_books")
            .select("user_id")
            .limit(1000)
            .execute()
            .value
        else {
            return []
        }
        return rows
    }

    private static func aggregateBooks(_ books: [LikedBookRow]) -> (fiction: [LeaderboardBook], nonfiction: [LeaderboardBook]) {
        let grouped = Dictionary(grouping: books, by: \.openLibraryKey)

        var fictionBooks: [LeaderboardBook] = []
        var nonfictionBooks: [LeaderboardBook] = []

        for (key, group) in grouped {
            let avgScore = group.map(\.score).reduce(0, +) / Double(group.count)
            let fictionVotes = group.filter { $0.category == "fiction" }.count
            let nonfictionVotes = group.filter { $0.category == "nonfiction" }.count
            // Fiction wins ties
            let isFiction = fictionVotes >= nonfictionVotes

            let first = group[0]
            let book = LeaderboardBook(
                id: key,
                title: first.title,
                author: first.author,
                coverUrl: first.coverUrl,
                averageScore: avgScore,
                ratingCount: group.count
            )

            if isFiction {
                fictionBooks.append(book)
            } else {
                nonfictionBooks.append(book)
            }
        }

        fictionBooks.sort { $0.averageScore > $1.averageScore }
        nonfictionBooks.sort { $0.averageScore > $1.averageScore }

        return (
            fiction: Array(fictionBooks.prefix(10)),
            nonfiction: Array(nonfictionBooks.prefix(10))
        )
    }

    private static func fetchActiveUsers(from userIds: [UserIdRow]) async -> [LeaderboardUser] {
        var counts: [UUID: Int] = [:]
        for row in userIds {
            counts[row.userId, default: 0] += 1
        }

        let topUsers = counts.sorted { $0.value > $1.value }.prefix(10)
        let topUserIds = topUsers.map(\.key)

        guard !topUserIds.isEmpty else { return [] }

        guard let profiles: [ProfileRow] = try? await supabase
            .from("profiles")
            .select("id, username, avatar_url")
            .in("id", values: topUserIds.map(\.uuidString))
            .execute()
            .value
        else {
            return []
        }

        let profileMap = Dictionary(uniqueKeysWithValues: profiles.map { ($0.id, $0) })

        return topUsers.compactMap { (userId, count) in
            guard let profile = profileMap[userId] else { return nil }
            return LeaderboardUser(
                id: userId,
                username: profile.username,
                avatarUrl: profile.avatarUrl,
                bookCount: count
            )
        }
    }
}
