import SwiftUI
import Supabase

// MARK: - Score Color Helper

private func scoreColor(for score: Double) -> Color {
    if score >= 8 {
        return .green
    } else if score >= 5 {
        return .orange
    } else {
        return .red
    }
}

// MARK: - Decodable Row Types

private struct LikeCountRow: Decodable {
    let count: Int
}

// MARK: - ReviewDetailView

struct ReviewDetailView: View {
    let reviewId: UUID

    @EnvironmentObject var authService: AuthService
    @State private var userBook: UserBook?
    @State private var reviewerProfile: Profile?
    @State private var isLoading = true
    @State private var isLiked = false
    @State private var likeCount = 0

    private var currentUserId: UUID? {
        if case .authenticated(let user) = authService.state {
            return user.id
        }
        return nil
    }

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, minHeight: 300)
            } else if let book = userBook {
                VStack(alignment: .leading, spacing: 16) {
                    // Reviewer header
                    if let profile = reviewerProfile {
                        NavigationLink(value: AppRoute.userProfile(userId: profile.id)) {
                            HStack(spacing: 10) {
                                AsyncImage(url: profile.avatarUrl.flatMap { URL(string: $0) }) { phase in
                                    switch phase {
                                    case .success(let image):
                                        image
                                            .resizable()
                                            .aspectRatio(contentMode: .fill)
                                    default:
                                        Circle()
                                            .fill(Color.gray.opacity(0.2))
                                            .overlay {
                                                Image(systemName: "person.fill")
                                                    .foregroundColor(.secondary)
                                                    .font(.caption)
                                            }
                                    }
                                }
                                .frame(width: 40, height: 40)
                                .clipShape(Circle())

                                VStack(alignment: .leading, spacing: 2) {
                                    Text(profile.username)
                                        .font(.subheadline.bold())
                                        .foregroundColor(.primary)
                                    Text(book.createdAt.relativeTimestamp)
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }

                                Spacer()
                            }
                        }
                        .buttonStyle(.plain)
                    }

                    // Book info
                    HStack(alignment: .top, spacing: 12) {
                        BookCoverView(coverUrl: book.coverUrl, size: CGSize(width: 80, height: 120))

                        VStack(alignment: .leading, spacing: 6) {
                            Text(book.title)
                                .font(.headline)

                            if let author = book.author {
                                Text(author)
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }

                            // Score pill
                            HStack(spacing: 8) {
                                Text(String(format: "%.1f", book.score))
                                    .font(.caption.bold())
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 3)
                                    .background(scoreColor(for: book.score))
                                    .clipShape(Capsule())

                                Text(book.tier.rawValue.capitalized)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }

                            // Category badge
                            Text(book.category == .fiction ? "Fiction" : "Nonfiction")
                                .font(.caption)
                                .foregroundColor(.blue)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(Color.blue.opacity(0.1))
                                .clipShape(Capsule())
                        }
                    }

                    // Review text
                    if let reviewText = book.reviewText, !reviewText.isEmpty {
                        Text(reviewText)
                            .font(.body)
                            .padding(.top, 4)
                    }

                    Divider()

                    // Like row
                    HStack(spacing: 6) {
                        Button {
                            toggleLike()
                        } label: {
                            Image(systemName: isLiked ? "heart.fill" : "heart")
                                .foregroundColor(isLiked ? .red : .secondary)
                                .font(.title3)
                        }
                        .buttonStyle(.plain)

                        if likeCount > 0 {
                            Text("\(likeCount)")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }

                        Spacer()
                    }

                    Divider()

                    // Comments
                    CommentSectionView(
                        reviewId: reviewId,
                        reviewOwnerId: book.userId,
                        bookTitle: book.title
                    )
                }
                .padding()
            } else {
                Text("Review not found")
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, minHeight: 300)
            }
        }
        .navigationTitle("Review")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await loadReview()
        }
    }

    // MARK: - Data Loading

    private func loadReview() async {
        isLoading = true
        defer { isLoading = false }

        do {
            // Fetch user_book (the review)
            let books: [UserBook] = try await supabase.from("user_books")
                .select()
                .eq("id", value: reviewId)
                .limit(1)
                .execute()
                .value

            guard let book = books.first else { return }
            userBook = book

            // Fetch reviewer profile
            let profiles: [Profile] = try await supabase.from("profiles")
                .select()
                .eq("id", value: book.userId)
                .limit(1)
                .execute()
                .value
            reviewerProfile = profiles.first

            // Fetch like count
            let likes: [ReviewLike] = try await supabase.from("review_likes")
                .select("user_id, review_id")
                .eq("review_id", value: reviewId)
                .execute()
                .value
            likeCount = likes.count

            // Check if current user liked
            if let userId = currentUserId {
                isLiked = likes.contains { $0.userId == userId }
            }
        } catch {
            print("Error loading review: \(error)")
        }
    }

    // MARK: - Like Toggle

    private func toggleLike() {
        guard let userId = currentUserId else { return }

        // Optimistic update
        let wasLiked = isLiked
        isLiked.toggle()
        likeCount += isLiked ? 1 : -1

        Task {
            do {
                if wasLiked {
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

                    // Notification if not own review
                    if let book = userBook, userId != book.userId {
                        Task { @Sendable in
                            _ = try? await supabase.from("notifications")
                                .insert(NewNotification(
                                    userId: book.userId,
                                    type: .like,
                                    fromUserId: userId,
                                    bookTitle: book.title,
                                    bookKey: nil,
                                    reviewId: reviewId,
                                    read: false
                                ))
                                .execute()
                        }
                    }
                }
            } catch {
                // Revert on error
                print("Error toggling like: \(error)")
                isLiked = wasLiked
                likeCount += wasLiked ? 1 : -1
            }
        }
    }
}
