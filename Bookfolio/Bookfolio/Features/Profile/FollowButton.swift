import SwiftUI

struct FollowButton: View {
    let targetUserId: UUID
    @EnvironmentObject var authService: AuthService
    @State private var isFollowing: Bool
    @State private var isLoading = false

    init(targetUserId: UUID, initialIsFollowing: Bool) {
        self.targetUserId = targetUserId
        _isFollowing = State(initialValue: initialIsFollowing)
    }

    var body: some View {
        Button {
            Task { await toggleFollow() }
        } label: {
            Text(isFollowing ? "Following" : "Follow")
                .font(.subheadline.bold())
                .foregroundColor(isFollowing ? .primary : .white)
                .padding(.horizontal, 24)
                .padding(.vertical, 8)
                .background(isFollowing ? Color(.systemGray5) : .blue)
                .clipShape(Capsule())
                .overlay(
                    Capsule()
                        .strokeBorder(isFollowing ? Color(.systemGray3) : .clear, lineWidth: 1)
                )
        }
        .disabled(isLoading)
        .opacity(isLoading ? 0.6 : 1)
    }

    private func toggleFollow() async {
        guard case .authenticated(let user) = authService.state else { return }

        // Optimistic update
        isFollowing.toggle()
        isLoading = true

        do {
            if isFollowing {
                try await ProfileService.follow(currentUserId: user.id, targetUserId: targetUserId)
            } else {
                try await ProfileService.unfollow(currentUserId: user.id, targetUserId: targetUserId)
            }
        } catch {
            // Revert on failure
            isFollowing.toggle()
        }

        isLoading = false
    }
}
