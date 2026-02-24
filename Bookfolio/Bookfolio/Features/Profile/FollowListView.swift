import SwiftUI

enum FollowListType {
    case followers
    case following

    var title: String {
        switch self {
        case .followers: return "Followers"
        case .following: return "Following"
        }
    }
}

struct FollowListView: View {
    let userId: UUID
    let listType: FollowListType
    @State private var users: [(Profile, Date)] = []
    @State private var isLoading = true

    var body: some View {
        Group {
            if isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if users.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "person.2")
                        .font(.system(size: 40))
                        .foregroundStyle(.secondary)
                    Text("No \(listType.title.lowercased()) yet")
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                List(users, id: \.0.id) { profile, date in
                    NavigationLink(value: AppRoute.userProfile(userId: profile.id)) {
                        HStack(spacing: 12) {
                            AsyncImage(url: profile.avatarUrl.flatMap { URL(string: $0) }) { image in
                                image.resizable().scaledToFill()
                            } placeholder: {
                                Image(systemName: "person.circle.fill")
                                    .resizable()
                                    .foregroundStyle(.secondary)
                            }
                            .frame(width: 40, height: 40)
                            .clipShape(Circle())

                            VStack(alignment: .leading, spacing: 2) {
                                Text(profile.username)
                                    .font(.body.bold())
                                Text(date, style: .date)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }
                .listStyle(.plain)
            }
        }
        .navigationTitle(listType.title)
        .task {
            await loadUsers()
        }
    }

    private func loadUsers() async {
        do {
            switch listType {
            case .followers:
                users = try await ProfileService.fetchFollowers(userId: userId)
            case .following:
                users = try await ProfileService.fetchFollowing(userId: userId)
            }
        } catch {
            // Silently handle — show empty state
        }
        isLoading = false
    }
}
