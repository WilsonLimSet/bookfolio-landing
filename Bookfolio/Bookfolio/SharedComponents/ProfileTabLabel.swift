import SwiftUI
import UIKit

/// Tab bar label that shows the user's avatar (or fallback person icon).
struct ProfileTabLabel: View {
    @EnvironmentObject var authService: AuthService
    @State private var avatarImage: UIImage?

    var body: some View {
        VStack(spacing: 2) {
            if let avatarImage {
                Image(uiImage: avatarImage)
                    .resizable()
                    .scaledToFill()
                    .frame(width: 24, height: 24)
                    .clipShape(Circle())
            } else {
                Image(systemName: "person.fill")
            }
            Text("Profile")
        }
        .task {
            await loadAvatar()
        }
    }

    private func loadAvatar() async {
        guard case .authenticated(let user) = authService.state else { return }
        do {
            let profile: Profile = try await supabase.from("profiles")
                .select("id, username, avatar_url, bio, instagram, twitter, reading_goal_2025")
                .eq("id", value: user.id.uuidString)
                .single()
                .execute()
                .value
            guard let urlString = profile.avatarUrl,
                  let url = URL(string: urlString) else { return }
            avatarImage = await ImageCacheService.shared.image(for: url)
        } catch {
            // Fall back to person.fill icon
        }
    }
}
