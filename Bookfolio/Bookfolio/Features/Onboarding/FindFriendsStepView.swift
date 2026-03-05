import SwiftUI

struct FindFriendsStepView: View {
    let userId: UUID
    let onContinue: () -> Void
    let onBack: () -> Void
    let onSkip: () -> Void

    @State private var query = ""
    @State private var results: [Profile] = []
    @State private var suggested: [Profile] = []
    @State private var following: Set<UUID> = []
    @State private var isSearching = false
    @State private var searchTask: Task<Void, Never>?

    private let tealColor = Color(red: 0.102, green: 0.227, blue: 0.227)

    var body: some View {
        VStack(spacing: 0) {
            // Back button
            HStack {
                Button(action: onBack) {
                    Image(systemName: "chevron.left")
                        .font(.title3)
                        .foregroundStyle(.secondary)
                }
                Spacer()
            }
            .padding()

            VStack(alignment: .leading, spacing: 8) {
                Text("Find readers you know")
                    .font(.system(size: 32, weight: .bold))
                Text("Follow people to see their rankings and reviews")
                    .font(.body)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 32)
            .padding(.top, 16)

            // Search bar
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundStyle(.secondary)
                TextField("Search by username", text: $query)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                if isSearching {
                    ProgressView()
                        .frame(width: 20, height: 20)
                }
            }
            .padding()
            .background(Color(.systemGray6))
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .padding(.horizontal, 32)
            .padding(.top, 16)
            .onChange(of: query) { _ in
                searchTask?.cancel()
                guard !query.trimmingCharacters(in: .whitespaces).isEmpty else {
                    results = []
                    return
                }
                isSearching = true
                searchTask = Task {
                    try? await Task.sleep(nanoseconds: 300_000_000)
                    guard !Task.isCancelled else { return }
                    await search()
                }
            }

            let displayUsers = query.trimmingCharacters(in: .whitespaces).isEmpty ? suggested : results

            if query.trimmingCharacters(in: .whitespaces).isEmpty && !suggested.isEmpty {
                Text("SUGGESTED")
                    .font(.caption.weight(.medium))
                    .foregroundStyle(.tertiary)
                    .tracking(1)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 32)
                    .padding(.top, 16)
            }

            ScrollView {
                LazyVStack(spacing: 4) {
                    ForEach(displayUsers) { user in
                        userRow(user)
                    }
                }
                .padding(.horizontal, 24)
                .padding(.top, 8)
            }

            VStack(spacing: 12) {
                Button(action: onContinue) {
                    Text("Continue")
                        .font(.system(size: 18, weight: .semibold))
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(tealColor)
                        .foregroundStyle(.white)
                        .clipShape(Capsule())
                }

                Button("Not now", action: onSkip)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 32)
            .padding(.bottom, 48)
        }
        .task { await loadSuggested() }
    }

    @ViewBuilder
    private func userRow(_ user: Profile) -> some View {
        HStack(spacing: 12) {
            CachedAsyncImage(url: user.avatarUrl.flatMap { URL(string: $0) }) { image in
                image.resizable().scaledToFill()
            } placeholder: {
                Text(user.username.prefix(1).uppercased())
                    .font(.headline)
                    .foregroundStyle(.secondary)
            }
            .frame(width: 40, height: 40)
            .clipShape(Circle())

            VStack(alignment: .leading, spacing: 2) {
                Text("@\(user.username)")
                    .font(.subheadline.weight(.medium))
                if let bio = user.bio, !bio.isEmpty {
                    Text(bio)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }

            Spacer()

            Button {
                toggleFollow(user.id)
            } label: {
                Text(following.contains(user.id) ? "Following" : "Follow")
                    .font(.subheadline.weight(.medium))
                    .padding(.horizontal, 16)
                    .padding(.vertical, 6)
                    .background(following.contains(user.id) ? Color(.systemGray6) : tealColor)
                    .foregroundStyle(following.contains(user.id) ? .primary : .white)
                    .clipShape(Capsule())
            }
        }
        .padding(.vertical, 8)
        .padding(.horizontal, 8)
    }

    private func loadSuggested() async {
        do {
            let profiles: [Profile] = try await supabase.from("profiles")
                .select("id, username, avatar_url, bio")
                .neq("id", value: userId)
                .not("username", operator: .is, value: "null")
                .limit(10)
                .execute()
                .value
            suggested = profiles
        } catch {}
    }

    private func search() async {
        let trimmed = query.trimmingCharacters(in: .whitespaces)
        do {
            let profiles: [Profile] = try await supabase.from("profiles")
                .select("id, username, avatar_url, bio")
                .neq("id", value: userId)
                .ilike("username", pattern: "%\(trimmed)%")
                .limit(10)
                .execute()
                .value
            results = profiles
        } catch {}
        isSearching = false
    }

    private func toggleFollow(_ targetId: UUID) {
        if following.contains(targetId) {
            following.remove(targetId)
            Task {
                try? await supabase.from("follows")
                    .delete()
                    .eq("follower_id", value: userId)
                    .eq("following_id", value: targetId)
                    .execute()
            }
        } else {
            following.insert(targetId)
            Task {
                try? await supabase.from("follows")
                    .insert(["follower_id": userId.uuidString, "following_id": targetId.uuidString])
                    .execute()
            }
        }
    }
}
