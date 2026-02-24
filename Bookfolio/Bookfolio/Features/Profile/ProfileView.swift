import SwiftUI

struct ProfileView: View {
    let userId: UUID
    @EnvironmentObject var authService: AuthService
    @State private var profile: Profile?
    @State private var stats: ProfileStats?
    @State private var isFollowing = false
    @State private var isLoading = true

    private var isOwner: Bool {
        guard case .authenticated(let user) = authService.state else { return false }
        return user.id == userId
    }

    var body: some View {
        Group {
            if isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let profile, let stats {
                ScrollView {
                    VStack(spacing: 20) {
                        ProfileHeaderView(
                            profile: profile,
                            stats: stats,
                            isOwner: isOwner
                        )

                        // Action buttons
                        if isOwner {
                            NavigationLink(value: AppRoute.editProfile) {
                                Text("Edit Profile")
                                    .font(.subheadline.bold())
                                    .foregroundStyle(.primary)
                                    .padding(.horizontal, 24)
                                    .padding(.vertical, 8)
                                    .background(Color(.systemGray5))
                                    .clipShape(Capsule())
                            }
                        } else {
                            FollowButton(
                                targetUserId: userId,
                                initialIsFollowing: isFollowing
                            )
                        }

                        // Reading status pills
                        HStack(spacing: 12) {
                            NavigationLink(value: AppRoute.currentlyReading(userId: userId)) {
                                StatusPill(
                                    label: "Currently Reading",
                                    count: stats.currentlyReadingCount,
                                    color: .blue
                                )
                            }
                            .buttonStyle(.plain)

                            NavigationLink(value: AppRoute.readBooks(userId: userId)) {
                                StatusPill(
                                    label: "Read",
                                    count: stats.totalBooksRead,
                                    color: .green
                                )
                            }
                            .buttonStyle(.plain)

                            NavigationLink(value: AppRoute.wantToRead(userId: userId)) {
                                StatusPill(
                                    label: "Want to Read",
                                    count: stats.wantToReadCount,
                                    color: .orange
                                )
                            }
                            .buttonStyle(.plain)
                        }
                        .padding(.horizontal)

                        // Followers / Following links
                        HStack(spacing: 24) {
                            NavigationLink(value: AppRoute.followers(userId: userId)) {
                                HStack(spacing: 4) {
                                    Text("\(stats.followersCount)")
                                        .font(.subheadline.bold())
                                    Text("Followers")
                                        .font(.subheadline)
                                        .foregroundStyle(.secondary)
                                }
                            }
                            .buttonStyle(.plain)

                            NavigationLink(value: AppRoute.following(userId: userId)) {
                                HStack(spacing: 4) {
                                    Text("\(stats.followingCount)")
                                        .font(.subheadline.bold())
                                    Text("Following")
                                        .font(.subheadline)
                                        .foregroundStyle(.secondary)
                                }
                            }
                            .buttonStyle(.plain)
                        }

                        // Lists link
                        NavigationLink(value: AppRoute.myLists(userId: userId)) {
                            HStack {
                                Image(systemName: "list.bullet")
                                    .foregroundColor(.blue)
                                Text(isOwner ? "Your Lists" : "\(profile.username ?? "User")'s Lists")
                                    .font(.subheadline)
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            .padding(.horizontal)
                            .padding(.vertical, 10)
                            .background(Color(.systemGray6))
                            .cornerRadius(10)
                        }
                        .buttonStyle(.plain)
                        .padding(.horizontal)

                        // Import from Goodreads
                        if isOwner {
                            NavigationLink(value: AppRoute.importBooks) {
                                HStack {
                                    Image(systemName: "square.and.arrow.down")
                                        .foregroundColor(.purple)
                                    Text("Import from Goodreads")
                                        .font(.subheadline)
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                .padding(.horizontal)
                                .padding(.vertical, 10)
                                .background(Color(.systemGray6))
                                .cornerRadius(10)
                            }
                            .buttonStyle(.plain)
                            .padding(.horizontal)
                        }

                        Spacer().frame(height: 20)
                    }
                }
                .refreshable {
                    await loadProfile()
                }
            } else {
                VStack(spacing: 12) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.system(size: 40))
                        .foregroundStyle(.secondary)
                    Text("Failed to load profile")
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .navigationTitle(profile?.username ?? "Profile")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if isOwner {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Sign Out") {
                        Task { try? await authService.signOut() }
                    }
                    .font(.subheadline)
                }
            }
        }
        .task {
            await loadProfile()
        }
    }

    private func loadProfile() async {
        do {
            async let profileResult = ProfileService.fetchProfile(userId: userId)
            async let statsResult = ProfileService.fetchStats(userId: userId)

            profile = try await profileResult
            stats = try await statsResult

            // Check follow status for non-owner
            if !isOwner {
                guard case .authenticated(let user) = authService.state else { return }
                isFollowing = try await ProfileService.isFollowing(
                    currentUserId: user.id,
                    targetUserId: userId
                )
            }
        } catch {
            // Profile/stats will remain nil — error state shown
        }
        isLoading = false
    }
}

private struct StatusPill: View {
    let label: String
    let count: Int
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text("\(count)")
                .font(.subheadline.bold())
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(color.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}
