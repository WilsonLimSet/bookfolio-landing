import SwiftUI
import Supabase

struct UserSearchView: View {
    let currentUserId: UUID
    let onSelect: (Profile) -> Void

    @State private var query = ""
    @State private var results: [Profile] = []
    @State private var isSearching = false
    @State private var searchTask: Task<Void, Never>?
    @State private var hasSearched = false

    var body: some View {
        VStack(spacing: 0) {
            // Search bar
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.secondary)
                TextField("Search users...", text: $query)
                    .textFieldStyle(.plain)
                    .autocorrectionDisabled()
                    .textInputAutocapitalization(.never)
                if !query.isEmpty {
                    Button {
                        query = ""
                        results = []
                        hasSearched = false
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding(12)
            .background(Color(.systemGray6))
            .cornerRadius(12)
            .padding(.horizontal)

            if isSearching {
                ProgressView()
                    .padding(.top, 24)
            } else if results.isEmpty && hasSearched {
                VStack(spacing: 12) {
                    Image(systemName: "person.slash")
                        .font(.system(size: 36))
                        .foregroundColor(.secondary)
                    Text("No users found")
                        .foregroundColor(.secondary)
                }
                .padding(.top, 24)
            } else if !results.isEmpty {
                LazyVStack(spacing: 0) {
                    ForEach(results) { profile in
                        Button {
                            onSelect(profile)
                        } label: {
                            userRow(profile)
                        }
                        .buttonStyle(.plain)

                        Divider()
                            .padding(.leading, 68)
                    }
                }
                .padding(.top, 8)
            }
        }
        .onChange(of: query) { _ in
            performDebouncedSearch()
        }
    }

    private func userRow(_ profile: Profile) -> some View {
        HStack(spacing: 12) {
            avatarView(profile.avatarUrl)

            Text(profile.username)
                .font(.subheadline.bold())
                .foregroundColor(.primary)

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.horizontal)
        .padding(.vertical, 10)
    }

    private func avatarView(_ avatarUrl: String?) -> some View {
        Group {
            if let urlString = avatarUrl, let url = URL(string: urlString) {
                AsyncImage(url: url) { image in
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

    private func performDebouncedSearch() {
        searchTask?.cancel()

        let trimmed = query.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else {
            results = []
            hasSearched = false
            return
        }

        searchTask = Task {
            do {
                try await Task.sleep(nanoseconds: 300_000_000)
            } catch {
                return // Cancelled
            }

            await MainActor.run { isSearching = true }

            do {
                let searchResults: [Profile] = try await supabase.from("profiles")
                    .select()
                    .ilike("username", pattern: "%\(trimmed)%")
                    .neq("id", value: currentUserId.uuidString)
                    .limit(10)
                    .execute()
                    .value

                if !Task.isCancelled {
                    await MainActor.run {
                        results = searchResults
                        hasSearched = true
                        isSearching = false
                    }
                }
            } catch {
                if !Task.isCancelled {
                    await MainActor.run {
                        results = []
                        hasSearched = true
                        isSearching = false
                    }
                }
            }
        }
    }
}
