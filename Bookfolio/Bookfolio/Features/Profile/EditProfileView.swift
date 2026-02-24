import SwiftUI
import PhotosUI

struct EditProfileView: View {
    @EnvironmentObject var authService: AuthService
    @Environment(\.dismiss) var dismiss

    @State private var profile: Profile?
    @State private var bio = ""
    @State private var readingGoal = ""
    @State private var instagram = ""
    @State private var twitter = ""
    @State private var avatarImage: UIImage?
    @State private var selectedPhotoItem: PhotosPickerItem?
    @State private var isSaving = false
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var favorites: [FavoriteBook] = []
    @State private var rankedBooks: [UserBook] = []
    @State private var showBookPicker = false

    private var currentUserId: UUID? {
        if case .authenticated(let user) = authService.state {
            return user.id
        }
        return nil
    }

    var body: some View {
        Group {
            if isLoading {
                ProgressView()
            } else {
                formContent
            }
        }
        .navigationTitle("Edit Profile")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadData() }
        .alert("Error", isPresented: .init(
            get: { errorMessage != nil },
            set: { if !$0 { errorMessage = nil } }
        )) {
            Button("OK") { errorMessage = nil }
        } message: {
            Text(errorMessage ?? "")
        }
    }

    // MARK: - Form Content

    private var formContent: some View {
        Form {
            avatarSection
            profileInfoSection
            socialLinksSection
            favoriteBooksSection
            actionsSection
        }
    }

    // MARK: - Avatar Section

    private var avatarSection: some View {
        Section {
            HStack {
                Spacer()
                VStack(spacing: 12) {
                    if let avatarImage {
                        Image(uiImage: avatarImage)
                            .resizable()
                            .scaledToFill()
                            .frame(width: 80, height: 80)
                            .clipShape(Circle())
                    } else if let avatarUrl = profile?.avatarUrl, let url = URL(string: avatarUrl) {
                        AsyncImage(url: url) { image in
                            image.resizable()
                                .scaledToFill()
                        } placeholder: {
                            Circle()
                                .fill(Color.gray.opacity(0.3))
                                .overlay(
                                    Image(systemName: "person.fill")
                                        .foregroundColor(.gray)
                                )
                        }
                        .frame(width: 80, height: 80)
                        .clipShape(Circle())
                    } else {
                        Circle()
                            .fill(Color.gray.opacity(0.3))
                            .frame(width: 80, height: 80)
                            .overlay(
                                Image(systemName: "person.fill")
                                    .font(.title)
                                    .foregroundColor(.gray)
                            )
                    }

                    PhotosPicker(
                        selection: $selectedPhotoItem,
                        matching: .images
                    ) {
                        Text("Change Photo")
                            .font(.subheadline)
                    }
                }
                Spacer()
            }
            .listRowBackground(Color.clear)
        }
        .onChange(of: selectedPhotoItem) { _ in
            Task { await loadSelectedPhoto() }
        }
    }

    // MARK: - Profile Info Section

    private var profileInfoSection: some View {
        Section("Profile Info") {
            if let username = profile?.username {
                HStack {
                    Text("Username")
                        .foregroundColor(.secondary)
                    Spacer()
                    Text(username)
                        .foregroundColor(.secondary)
                }
            }

            VStack(alignment: .leading, spacing: 4) {
                Text("Bio")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                TextEditor(text: $bio)
                    .frame(minHeight: 80)
                    .onChange(of: bio) { _ in
                        if bio.count > 500 {
                            bio = String(bio.prefix(500))
                        }
                    }
                Text("\(bio.count)/500")
                    .font(.caption2)
                    .foregroundColor(bio.count >= 480 ? .red : .secondary)
                    .frame(maxWidth: .infinity, alignment: .trailing)
            }

            HStack {
                Text("Reading Goal")
                Spacer()
                TextField("e.g. 24", text: $readingGoal)
                    .keyboardType(.numberPad)
                    .multilineTextAlignment(.trailing)
                    .frame(width: 80)
            }
        }
    }

    // MARK: - Social Links Section

    private var socialLinksSection: some View {
        Section("Social Links") {
            HStack {
                Image(systemName: "camera")
                    .foregroundColor(.secondary)
                TextField("Instagram handle", text: $instagram)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
            }

            HStack {
                Image(systemName: "at")
                    .foregroundColor(.secondary)
                TextField("Twitter/X handle", text: $twitter)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
            }
        }
    }

    // MARK: - Favorite Books Section

    private var favoriteBooksSection: some View {
        Section("Favorite Books") {
            if favorites.isEmpty {
                Text("No favorites yet")
                    .foregroundColor(.secondary)
                    .font(.subheadline)
            } else {
                ForEach(Array(favorites.enumerated()), id: \.element.id) { index, favorite in
                    HStack(spacing: 12) {
                        if let coverUrl = favorite.coverUrl, let url = URL(string: coverUrl) {
                            AsyncImage(url: url) { image in
                                image.resizable().scaledToFill()
                            } placeholder: {
                                Rectangle().fill(Color.gray.opacity(0.2))
                            }
                            .frame(width: 36, height: 54)
                            .cornerRadius(4)
                        }

                        VStack(alignment: .leading, spacing: 2) {
                            Text(favorite.title)
                                .font(.subheadline)
                                .lineLimit(1)
                            if let author = favorite.author {
                                Text(author)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                    .lineLimit(1)
                            }
                        }

                        Spacer()

                        HStack(spacing: 8) {
                            if index > 0 {
                                Button {
                                    favorites.swapAt(index, index - 1)
                                } label: {
                                    Image(systemName: "arrow.up")
                                        .font(.caption)
                                }
                                .buttonStyle(.borderless)
                            }
                            if index < favorites.count - 1 {
                                Button {
                                    favorites.swapAt(index, index + 1)
                                } label: {
                                    Image(systemName: "arrow.down")
                                        .font(.caption)
                                }
                                .buttonStyle(.borderless)
                            }
                            Button {
                                favorites.remove(at: index)
                            } label: {
                                Image(systemName: "minus.circle.fill")
                                    .foregroundColor(.red)
                            }
                            .buttonStyle(.borderless)
                        }
                    }
                }
            }

            if favorites.count < 4 {
                Button {
                    showBookPicker = true
                } label: {
                    Label("Add Favorite", systemImage: "plus.circle")
                }
            }
        }
        .sheet(isPresented: $showBookPicker) {
            favoriteBookPickerSheet
        }
    }

    // MARK: - Favorite Book Picker

    private var favoriteBookPickerSheet: some View {
        NavigationView {
            List {
                if rankedBooks.isEmpty {
                    Text("No ranked books yet. Rank some books first!")
                        .foregroundColor(.secondary)
                } else {
                    Section("Your Ranked Books") {
                        ForEach(rankedBooks) { book in
                            let alreadyFavorited = favorites.contains { $0.openLibraryKey == book.openLibraryKey }
                            Button {
                                if !alreadyFavorited {
                                    addBookToFavorites(book)
                                    showBookPicker = false
                                }
                            } label: {
                                HStack(spacing: 12) {
                                    if let coverUrl = book.coverUrl, let url = URL(string: coverUrl) {
                                        AsyncImage(url: url) { image in
                                            image.resizable().scaledToFill()
                                        } placeholder: {
                                            Rectangle().fill(Color.gray.opacity(0.2))
                                        }
                                        .frame(width: 36, height: 54)
                                        .cornerRadius(4)
                                    }

                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(book.title)
                                            .font(.subheadline)
                                            .lineLimit(1)
                                        if let author = book.author {
                                            Text(author)
                                                .font(.caption)
                                                .foregroundColor(.secondary)
                                                .lineLimit(1)
                                        }
                                    }

                                    Spacer()

                                    if alreadyFavorited {
                                        Image(systemName: "checkmark.circle.fill")
                                            .foregroundColor(.green)
                                    }
                                }
                            }
                            .disabled(alreadyFavorited)
                        }
                    }
                }
            }
            .navigationTitle("Add Favorite")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { showBookPicker = false }
                }
            }
        }
    }

    // MARK: - Actions Section

    private var actionsSection: some View {
        Section {
            Button {
                Task { await save() }
            } label: {
                HStack {
                    Spacer()
                    if isSaving {
                        ProgressView()
                    } else {
                        Text("Save Changes")
                            .fontWeight(.semibold)
                    }
                    Spacer()
                }
            }
            .disabled(isSaving)

            Button(role: .destructive) {
                Task {
                    try? await authService.signOut()
                }
            } label: {
                HStack {
                    Spacer()
                    Text("Sign Out")
                    Spacer()
                }
            }
        }
    }

    // MARK: - Data Loading

    private func loadData() async {
        guard let userId = currentUserId else { return }

        do {
            async let profileResult = ProfileService.fetchProfile(userId: userId)
            async let favoritesResult: [FavoriteBook] = supabase.from("favorite_books")
                .select()
                .eq("user_id", value: userId.uuidString)
                .order("position")
                .limit(4)
                .execute()
                .value
            async let rankedResult = ProfileService.fetchUserBooks(userId: userId)

            let loadedProfile = try await profileResult
            let loadedFavorites = try await favoritesResult
            let loadedRanked = try await rankedResult

            profile = loadedProfile
            bio = loadedProfile.bio ?? ""
            if let goal = loadedProfile.readingGoal2025 {
                readingGoal = String(goal)
            }
            instagram = loadedProfile.instagram ?? ""
            twitter = loadedProfile.twitter ?? ""
            favorites = loadedFavorites
            rankedBooks = loadedRanked
            isLoading = false
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
        }
    }

    // MARK: - Photo Loading

    private func loadSelectedPhoto() async {
        guard let item = selectedPhotoItem else { return }
        do {
            if let data = try await item.loadTransferable(type: Data.self),
               let uiImage = UIImage(data: data) {
                avatarImage = uiImage
            }
        } catch {
            errorMessage = "Failed to load photo"
        }
    }

    // MARK: - Add Favorite

    private func addBookToFavorites(_ book: UserBook) {
        let favorite = FavoriteBook(
            id: UUID(),
            userId: book.userId,
            openLibraryKey: book.openLibraryKey,
            title: book.title,
            author: book.author,
            coverUrl: book.coverUrl,
            position: favorites.count + 1
        )
        favorites.append(favorite)
    }

    // MARK: - Save

    private func save() async {
        guard let userId = currentUserId else { return }
        isSaving = true
        defer { isSaving = false }

        do {
            var avatarUrl = profile?.avatarUrl

            // Upload avatar if changed
            if let avatarImage,
               let jpegData = avatarImage.jpegData(compressionQuality: 0.7) {
                avatarUrl = try await ProfileService.uploadAvatar(data: jpegData, userId: userId)
            }

            // Strip @ prefix from handles
            let cleanInstagram = instagram.hasPrefix("@") ? String(instagram.dropFirst()) : instagram
            let cleanTwitter = twitter.hasPrefix("@") ? String(twitter.dropFirst()) : twitter

            // Parse reading goal
            let goalInt = Int(readingGoal)

            let update = ProfileUpdate(
                bio: bio.isEmpty ? nil : bio,
                avatarUrl: avatarUrl,
                instagram: cleanInstagram.isEmpty ? nil : cleanInstagram,
                twitter: cleanTwitter.isEmpty ? nil : cleanTwitter,
                readingGoal2025: goalInt
            )

            try await ProfileService.updateProfile(update, userId: userId)
            try await ProfileService.updateFavorites(favorites, userId: userId)

            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
