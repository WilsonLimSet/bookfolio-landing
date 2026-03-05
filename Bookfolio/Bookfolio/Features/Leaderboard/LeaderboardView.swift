import SwiftUI

struct LeaderboardView: View {
    @State private var fiction: [LeaderboardBook] = []
    @State private var nonfiction: [LeaderboardBook] = []
    @State private var activeUsers: [LeaderboardUser] = []
    @State private var isLoading = true

    let onSelectBook: (String) -> Void
    let onSelectUser: (UUID) -> Void

    var body: some View {
        Group {
            if isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        if !fiction.isEmpty {
                            bookSection(title: "Top Fiction", books: fiction)
                        }

                        if !nonfiction.isEmpty {
                            bookSection(title: "Top Nonfiction", books: nonfiction)
                        }

                        if !activeUsers.isEmpty {
                            activeUsersSection
                        }

                        if fiction.isEmpty && nonfiction.isEmpty && activeUsers.isEmpty {
                            emptyState
                        }
                    }
                    .padding()
                }
            }
        }
        .task {
            let data = await LeaderboardService.fetchLeaderboardData()
            fiction = data.fiction
            nonfiction = data.nonfiction
            activeUsers = data.activeUsers
            isLoading = false
        }
    }

    // MARK: - Book Section

    private func bookSection(title: String, books: [LeaderboardBook]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.title2.bold())
                .padding(.bottom, 4)

            ForEach(Array(books.enumerated()), id: \.element.id) { index, book in
                Button {
                    onSelectBook(book.id)
                } label: {
                    bookRow(book: book, rank: index + 1)
                }
                .buttonStyle(.plain)

                if index < books.count - 1 {
                    Divider()
                }
            }
        }
    }

    private func bookRow(book: LeaderboardBook, rank: Int) -> some View {
        HStack(spacing: 12) {
            rankBadge(rank: rank)

            BookCoverView(coverUrl: book.coverUrl, size: CGSize(width: 50, height: 75))

            VStack(alignment: .leading, spacing: 4) {
                Text(book.title)
                    .font(.subheadline.bold())
                    .lineLimit(2)
                if let author = book.author {
                    Text(author)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                scorePill(score: book.averageScore)
                Text("\(book.ratingCount) rating\(book.ratingCount == 1 ? "" : "s")")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }

    // MARK: - Active Users Section

    private var activeUsersSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Most Active Readers")
                .font(.title2.bold())
                .padding(.bottom, 4)

            ForEach(Array(activeUsers.enumerated()), id: \.element.id) { index, user in
                Button {
                    onSelectUser(user.id)
                } label: {
                    userRow(user: user, rank: index + 1)
                }
                .buttonStyle(.plain)

                if index < activeUsers.count - 1 {
                    Divider()
                }
            }
        }
    }

    private func userRow(user: LeaderboardUser, rank: Int) -> some View {
        HStack(spacing: 12) {
            rankBadge(rank: rank)

            avatarView(url: user.avatarUrl)

            VStack(alignment: .leading, spacing: 4) {
                Text(user.username ?? "Unknown")
                    .font(.subheadline.bold())
                Text("\(user.bookCount) books ranked")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()
        }
        .padding(.vertical, 4)
    }

    // MARK: - Components

    private func rankBadge(rank: Int) -> some View {
        ZStack {
            if rank <= 3 {
                Circle()
                    .fill(rankColor(rank).opacity(0.2))
                    .frame(width: 30, height: 30)
                Text("\(rank)")
                    .font(.subheadline.bold())
                    .foregroundColor(rankColor(rank))
            } else {
                Circle()
                    .fill(Color(.systemGray5))
                    .frame(width: 30, height: 30)
                Text("\(rank)")
                    .font(.subheadline.bold())
                    .foregroundColor(.secondary)
            }
        }
        .frame(width: 30)
    }

    private func rankColor(_ rank: Int) -> Color {
        switch rank {
        case 1: return .yellow
        case 2: return .gray
        case 3: return .orange
        default: return .secondary
        }
    }

    private func scorePill(score: Double) -> some View {
        Text(String(format: "%.1f", score))
            .font(.caption.bold())
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(scoreColor(score).opacity(0.15))
            .foregroundColor(scoreColor(score))
            .cornerRadius(8)
    }

    private func scoreColor(_ score: Double) -> Color {
        if score > 8 {
            return .green
        } else if score > 6 {
            return .yellow
        } else {
            return .red
        }
    }

    private func avatarView(url: String?) -> some View {
        Group {
            if let url, let imageUrl = URL(string: url) {
                CachedAsyncImage(url: imageUrl) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    avatarPlaceholder
                }
            } else {
                avatarPlaceholder
            }
        }
        .frame(width: 40, height: 40)
        .clipShape(Circle())
    }

    private var avatarPlaceholder: some View {
        Circle()
            .fill(Color(.systemGray5))
            .overlay(
                Image(systemName: "person.fill")
                    .foregroundColor(Color(.systemGray3))
            )
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "trophy.fill")
                .font(.system(size: 48))
                .foregroundColor(.secondary)
            Text("No leaderboard data yet")
                .font(.title3.bold())
            Text("Start ranking books to see the leaderboard!")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 60)
    }
}
