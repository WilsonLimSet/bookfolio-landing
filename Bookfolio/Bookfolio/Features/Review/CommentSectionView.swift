import SwiftUI

struct CommentSectionView: View {
    let reviewId: UUID
    let reviewOwnerId: UUID
    let bookTitle: String?

    @EnvironmentObject var authService: AuthService
    @State private var comments: [(comment: ReviewComment, profile: Profile)] = []
    @State private var newCommentText = ""
    @State private var isLoading = true
    @State private var isPosting = false

    private var currentUserId: UUID? {
        if case .authenticated(let user) = authService.state {
            return user.id
        }
        return nil
    }

    private var isAuthenticated: Bool {
        currentUserId != nil
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            Text("Comments (\(comments.count))")
                .font(.headline)

            if isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.vertical, 8)
            } else if comments.isEmpty {
                Text("No comments yet")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .padding(.vertical, 8)
            } else {
                ForEach(comments, id: \.comment.id) { item in
                    commentRow(item.comment, profile: item.profile)
                }
            }

            Divider()

            // Post form
            if isAuthenticated {
                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 8) {
                        TextField("Add a comment...", text: $newCommentText, axis: .vertical)
                            .textFieldStyle(.roundedBorder)
                            .lineLimit(1...4)

                        Button {
                            postComment()
                        } label: {
                            if isPosting {
                                ProgressView()
                                    .frame(width: 24, height: 24)
                            } else {
                                Image(systemName: "arrow.up.circle.fill")
                                    .font(.title2)
                                    .foregroundColor(canPost ? .blue : .gray)
                            }
                        }
                        .disabled(!canPost)
                    }

                    Text("\(newCommentText.count)/500")
                        .font(.caption2)
                        .foregroundColor(newCommentText.count > 500 ? .red : .secondary)
                }
            } else {
                Text("Sign in to comment")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .padding(.vertical, 4)
            }
        }
        .task {
            await loadComments()
        }
    }

    // MARK: - Comment Row

    @ViewBuilder
    private func commentRow(_ comment: ReviewComment, profile: Profile) -> some View {
        HStack(alignment: .top, spacing: 10) {
            // Avatar
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
                            Text(String(profile.username.prefix(1)).uppercased())
                                .font(.caption2.bold())
                                .foregroundColor(.secondary)
                        }
                }
            }
            .frame(width: 30, height: 30)
            .clipShape(Circle())

            VStack(alignment: .leading, spacing: 2) {
                HStack {
                    Text(profile.username)
                        .font(.caption.bold())
                    Text(comment.createdAt.relativeTimestamp)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }

                Text(comment.commentText)
                    .font(.subheadline)
            }

            Spacer()

            // Delete button for own comments
            if comment.userId == currentUserId {
                Button {
                    deleteComment(comment.id)
                } label: {
                    Image(systemName: "trash")
                        .font(.caption)
                        .foregroundColor(.red)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.vertical, 4)
    }

    // MARK: - Helpers

    private var canPost: Bool {
        !newCommentText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && newCommentText.count <= 500
            && !isPosting
    }

    // MARK: - Actions

    private func loadComments() async {
        isLoading = true
        defer { isLoading = false }
        do {
            comments = try await CommentService.loadComments(reviewId: reviewId)
        } catch {
            print("Error loading comments: \(error)")
        }
    }

    private func postComment() {
        guard let userId = currentUserId else { return }
        let text = newCommentText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty, text.count <= 500 else { return }

        isPosting = true
        Task {
            do {
                try await CommentService.postComment(
                    userId: userId,
                    reviewId: reviewId,
                    text: text,
                    reviewOwnerId: reviewOwnerId,
                    bookTitle: bookTitle
                )
                newCommentText = ""
                comments = try await CommentService.loadComments(reviewId: reviewId)
            } catch {
                print("Error posting comment: \(error)")
            }
            isPosting = false
        }
    }

    private func deleteComment(_ commentId: UUID) {
        // Optimistic removal
        comments.removeAll { $0.comment.id == commentId }
        Task {
            do {
                try await CommentService.deleteComment(commentId: commentId)
            } catch {
                print("Error deleting comment: \(error)")
                // Reload on error
                comments = (try? await CommentService.loadComments(reviewId: reviewId)) ?? []
            }
        }
    }
}
