import SwiftUI
import Supabase

struct DiscoverView: View {
    @EnvironmentObject var authService: AuthService
    @State private var suggestedUsers: [SuggestedUser] = []
    @State private var isLoading = true
    let onSelectUser: (UUID) -> Void

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if case .authenticated(let user) = authService.state {
                    UserSearchView(currentUserId: user.id) { profile in
                        onSelectUser(profile.id)
                    }
                    .padding(.top, 8)
                }

                suggestedSection
            }
        }
        .refreshable {
            await loadSuggestedUsers()
        }
        .task {
            await loadSuggestedUsers()
        }
    }

    private var suggestedSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Suggested Readers")
                .font(.title3.bold())
                .padding(.horizontal)

            if isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity)
                    .padding(.top, 16)
            } else if suggestedUsers.isEmpty {
                Text("No suggestions yet")
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity)
                    .padding(.top, 16)
            } else {
                LazyVStack(spacing: 0) {
                    ForEach(suggestedUsers) { suggested in
                        suggestedUserRow(suggested)
                        Divider()
                            .padding(.leading, 68)
                    }
                }
            }
        }
        .padding(.top, 8)
    }

    private func suggestedUserRow(_ suggested: SuggestedUser) -> some View {
        HStack(spacing: 12) {
            Button {
                onSelectUser(suggested.profile.id)
            } label: {
                HStack(spacing: 12) {
                    avatarView(suggested.profile.avatarUrl)

                    VStack(alignment: .leading, spacing: 2) {
                        Text(suggested.profile.username)
                            .font(.subheadline.bold())
                            .foregroundColor(.primary)
                        Text("\(suggested.bookCount) books ranked")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    Spacer()
                }
            }
            .buttonStyle(.plain)

            FollowButton(targetUserId: suggested.profile.id, initialIsFollowing: false)
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
    }

    private func avatarView(_ avatarUrl: String?) -> some View {
        Group {
            if let urlString = avatarUrl, let url = URL(string: urlString) {
                CachedAsyncImage(url: url) { image in
                    image.resizable().scaledToFill()
                } placeholder: {
                    Color(.systemGray5)
                }
            } else {
                Image(systemName: "person.circle.fill")
                    .resizable()
                    .foregroundColor(.secondary)
            }
        }
        .frame(width: 40, height: 40)
        .clipShape(Circle())
    }

    private func loadSuggestedUsers() async {
        guard case .authenticated(let user) = authService.state else {
            isLoading = false
            return
        }

        let userId = user.id.uuidString

        do {
            // Fetch IDs the user already follows
            let followRows: [FollowingRow] = try await supabase.from("follows")
                .select("following_id")
                .eq("follower_id", value: userId)
                .execute()
                .value

            let followingIds = Set(followRows.map(\.followingId))

            // Fetch active users by book count
            let bookRows: [UserBookRow] = try await supabase.from("user_books")
                .select("user_id")
                .limit(1000)
                .execute()
                .value

            // Count books per user, exclude self and followed
            var counts: [UUID: Int] = [:]
            for row in bookRows {
                if row.userId != user.id && !followingIds.contains(row.userId) {
                    counts[row.userId, default: 0] += 1
                }
            }

            // Sort by count descending, take top 12
            let topUserIds = counts.sorted { $0.value > $1.value }
                .prefix(12)
                .map(\.key)

            guard !topUserIds.isEmpty else {
                suggestedUsers = []
                isLoading = false
                return
            }

            // Fetch profiles for those IDs
            let profiles: [Profile] = try await supabase.from("profiles")
                .select()
                .in("id", values: topUserIds.map(\.uuidString))
                .execute()
                .value

            // Map to SuggestedUser tuples preserving count order
            let profileMap = Dictionary(uniqueKeysWithValues: profiles.map { ($0.id, $0) })
            suggestedUsers = topUserIds.compactMap { id in
                guard let profile = profileMap[id], let count = counts[id] else { return nil }
                return SuggestedUser(profile: profile, bookCount: count)
            }

            isLoading = false
        } catch {
            isLoading = false
        }
    }
}

// MARK: - Private Row Types

private struct FollowingRow: Decodable {
    let followingId: UUID

    enum CodingKeys: String, CodingKey {
        case followingId = "following_id"
    }
}

private struct UserBookRow: Decodable {
    let userId: UUID

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
    }
}

// MARK: - Suggested User

private struct SuggestedUser: Identifiable {
    let profile: Profile
    let bookCount: Int

    var id: UUID { profile.id }
}
