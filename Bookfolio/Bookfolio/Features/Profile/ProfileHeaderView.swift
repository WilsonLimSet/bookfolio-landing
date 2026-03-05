import SwiftUI

struct ProfileHeaderView: View {
    let profile: Profile
    let stats: ProfileStats
    let isOwner: Bool

    private let statColumns = [
        GridItem(.flexible()),
        GridItem(.flexible())
    ]

    var body: some View {
        VStack(spacing: 20) {
            // Avatar
            CachedAsyncImage(url: profile.avatarUrl.flatMap { URL(string: $0) }) { image in
                image.resizable().scaledToFill()
            } placeholder: {
                Image(systemName: "person.circle.fill")
                    .resizable()
                    .foregroundStyle(.secondary)
            }
            .frame(width: 80, height: 80)
            .clipShape(Circle())

            // Username + Badge
            HStack(spacing: 6) {
                Text(profile.username)
                    .font(.title2.bold())

                if let badge = profile.referralBadge, !badge.isEmpty {
                    HStack(spacing: 3) {
                        Image(systemName: badge == "ambassador" ? "star.fill" : "link")
                            .font(.system(size: 10))
                        Text(badge == "ambassador" ? "Ambassador" : "Connector")
                            .font(.system(size: 11, weight: .semibold))
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(badge == "ambassador" ? Color.orange.opacity(0.15) : Color.blue.opacity(0.15))
                    .foregroundStyle(badge == "ambassador" ? .orange : .blue)
                    .clipShape(Capsule())
                }
            }

            // Bio
            if let bio = profile.bio, !bio.isEmpty {
                Text(bio)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            }

            // Stats grid
            LazyVGrid(columns: statColumns, spacing: 16) {
                StatCell(value: "\(stats.totalBooksRead)", label: "Books Read")
                StatCell(value: "\(stats.weekStreak) \u{1F525}", label: "Week Streak")
                StatCell(value: stats.rank.map { "#\($0)" } ?? "\u{2014}", label: "Rank")
                StatCell(value: "\(stats.followersCount)", label: "Followers")
            }
            .padding(.horizontal)

            // Reading goal
            if let goal = profile.readingGoal2025, goal > 0 {
                VStack(spacing: 8) {
                    Text("2025 Reading Goal")
                        .font(.headline)

                    ProgressView(
                        value: Double(stats.booksFinishedThisYear),
                        total: Double(goal)
                    )
                    .tint(.blue)

                    Text("\(stats.booksFinishedThisYear) of \(goal) books in 2025")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal)
            }

            // Social links
            if profile.instagram != nil || profile.twitter != nil {
                HStack(spacing: 16) {
                    if let instagram = profile.instagram, !instagram.isEmpty {
                        Label(instagram, systemImage: "camera")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    if let twitter = profile.twitter, !twitter.isEmpty {
                        Label(twitter, systemImage: "at")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            // Favorite books
            if !stats.favoriteBooks.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Favorites")
                        .font(.headline)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal)

                    HStack(spacing: 12) {
                        ForEach(stats.favoriteBooks) { book in
                            NavigationLink(value: AppRoute.bookDetail(bookKey: book.openLibraryKey)) {
                                CachedAsyncImage(url: book.coverUrl.flatMap { URL(string: $0) }) { image in
                                    image.resizable().scaledToFill()
                                } placeholder: {
                                    RoundedRectangle(cornerRadius: 4)
                                        .fill(Color.secondary.opacity(0.2))
                                }
                                .frame(width: 50, height: 75)
                                .clipShape(RoundedRectangle(cornerRadius: 4))
                            }
                        }
                    }
                    .padding(.horizontal)
                }
            }
        }
        .padding(.vertical)
    }
}

private struct StatCell: View {
    let value: String
    let label: String

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title3.bold())
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}
