import SwiftUI

struct BookDetailView: View {
    let bookKey: String

    @EnvironmentObject var authService: AuthService
    @State private var bookDetails: BookDetails?
    @State private var userBook: UserBook?
    @State private var communityRatings: [UserBook] = []
    @State private var reviewerProfiles: [UUID: Profile] = [:]
    @State private var isLoading = true
    @State private var showEditionPicker = false
    @State private var isDescriptionExpanded = false
    @State private var isWantToRead = false
    @State private var isCurrentlyReading = false
    @State private var showAddToList = false

    var body: some View {
        Group {
            if isLoading {
                ProgressView("Loading book details...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let book = bookDetails {
                bookContent(book)
            } else {
                VStack(spacing: 16) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.system(size: 48))
                        .foregroundColor(.secondary)
                    Text("Unable to load book details")
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .navigationTitle(bookDetails?.title ?? "Book")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await loadBookData()
        }
        .sheet(isPresented: $showEditionPicker) {
            EditionPickerView(workKey: bookKey) { _ in
                // Edition selection — future use
            }
        }
        .sheet(isPresented: $showAddToList) {
            AddToListSheet(
                bookKey: bookKey,
                title: bookDetails?.title ?? "",
                author: bookDetails?.author,
                coverUrl: bookDetails?.coverUrl
            )
        }
    }

    // MARK: - Book Content

    @ViewBuilder
    private func bookContent(_ book: BookDetails) -> some View {
        ScrollView {
            VStack(spacing: 24) {
                headerSection(book)
                userRatingSection()
                actionButtonsSection()
                descriptionSection(book)
                subjectsSection(book)
                communitySection()
                editionsButton()
            }
            .padding(.bottom, 32)
        }
    }

    // MARK: - Header

    private func headerSection(_ book: BookDetails) -> some View {
        VStack(spacing: 12) {
            BookCoverView(coverUrl: book.coverUrl, size: CGSize(width: 160, height: 240))

            Text(book.title)
                .font(.title2.bold())
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            if let author = book.author {
                Text(author)
                    .font(.body)
                    .foregroundColor(.secondary)
            }

            HStack(spacing: 8) {
                if let year = book.firstPublishYear {
                    infoPill(String(year))
                }
                if let pages = book.pageCount {
                    infoPill("\(pages) pages")
                }
                if let translator = book.translator {
                    infoPill("Translated by \(translator)")
                }
            }
        }
        .padding(.top, 16)
    }

    private func infoPill(_ text: String) -> some View {
        Text(text)
            .font(.caption)
            .foregroundColor(.secondary)
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(Color(.systemGray6))
            .cornerRadius(12)
    }

    // MARK: - User's Rating

    @ViewBuilder
    private func userRatingSection() -> some View {
        if let book = userBook {
            VStack(spacing: 8) {
                HStack {
                    Text("#\(book.rankPosition) in \(book.category.rawValue.capitalized)")
                        .font(.headline)
                        .foregroundColor(tierColor(book.tier))

                    Spacer()

                    // TODO: Plan 03 — navigate to .rankBook route for editing
                    Button("Edit") {}
                        .font(.subheadline)
                        .disabled(true)
                }
                .padding()
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(tierColor(book.tier).opacity(0.1))
                )
            }
            .padding(.horizontal)
        }
    }

    private func tierColor(_ tier: BookTier) -> Color {
        switch tier {
        case .liked: return .green
        case .fine: return .yellow
        case .disliked: return .red
        }
    }

    // MARK: - Action Buttons

    @ViewBuilder
    private func actionButtonsSection() -> some View {
        if case .authenticated = authService.state, let book = bookDetails {
            let metadata = BookMetadata(
                openLibraryKey: bookKey,
                title: book.title,
                author: book.author,
                coverUrl: book.coverUrl
            )

            VStack(spacing: 10) {
                if userBook == nil {
                    NavigationLink(value: AppRoute.rankBook(
                        bookKey: bookKey,
                        title: book.title,
                        author: book.author,
                        coverUrl: book.coverUrl
                    )) {
                        Label("Add to my list", systemImage: "plus.circle")
                            .font(.subheadline.bold())
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                    }
                    .buttonStyle(.borderedProminent)
                }

                HStack(spacing: 12) {
                    CurrentlyReadingButton(
                        book: metadata,
                        isCurrentlyReading: $isCurrentlyReading,
                        isWantToRead: $isWantToRead
                    )

                    if !isCurrentlyReading {
                        WantToReadButton(
                            book: metadata,
                            isWantToRead: $isWantToRead
                        )
                    }
                }

                Button {
                    showAddToList = true
                } label: {
                    Label("Add to List", systemImage: "list.bullet")
                        .font(.subheadline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                }
                .buttonStyle(.bordered)
            }
            .padding(.horizontal)
        }
    }

    // MARK: - Description

    @ViewBuilder
    private func descriptionSection(_ book: BookDetails) -> some View {
        if let description = book.description, !description.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                Text("Description")
                    .font(.headline)

                Text(description)
                    .font(.body)
                    .lineLimit(isDescriptionExpanded ? nil : 5)

                if description.count > 200 {
                    Button(isDescriptionExpanded ? "Show less" : "Show more") {
                        withAnimation {
                            isDescriptionExpanded.toggle()
                        }
                    }
                    .font(.subheadline.bold())
                }
            }
            .padding(.horizontal)
        }
    }

    // MARK: - Subjects

    @ViewBuilder
    private func subjectsSection(_ book: BookDetails) -> some View {
        if !book.subjects.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                Text("Subjects")
                    .font(.headline)
                    .padding(.horizontal)

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(book.subjects.prefix(6), id: \.self) { subject in
                            Text(subject)
                                .font(.caption)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(Color(.systemGray6))
                                .cornerRadius(16)
                        }
                    }
                    .padding(.horizontal)
                }
            }
        }
    }

    // MARK: - Community Ratings

    @ViewBuilder
    private func communitySection() -> some View {
        if !communityRatings.isEmpty {
            VStack(alignment: .leading, spacing: 12) {
                let avgScore = communityRatings.reduce(0.0) { $0 + $1.score } / Double(communityRatings.count)

                Text("Community")
                    .font(.headline)

                Text(String(format: "%.1f avg \u{00B7} %d ratings", avgScore, communityRatings.count))
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                LazyVStack(spacing: 8) {
                    ForEach(communityRatings) { rating in
                        communityRatingRow(rating)
                    }
                }
            }
            .padding(.horizontal)
        }
    }

    private func communityRatingRow(_ rating: UserBook) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 8) {
                Circle()
                    .fill(Color(.systemGray4))
                    .frame(width: 30, height: 30)
                    .overlay(
                        Text(profileInitial(for: rating.userId))
                            .font(.caption.bold())
                            .foregroundColor(.secondary)
                    )

                Text(reviewerProfiles[rating.userId]?.username ?? "User")
                    .font(.subheadline.bold())

                Spacer()

                Text(String(format: "%.1f", rating.score))
                    .font(.caption.bold())
                    .foregroundColor(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(tierColor(rating.tier))
                    .cornerRadius(8)
            }

            if let reviewText = rating.reviewText, !reviewText.isEmpty {
                Text(reviewText)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }
        }
        .padding(12)
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }

    private func profileInitial(for userId: UUID) -> String {
        if let profile = reviewerProfiles[userId], let first = profile.username.first {
            return String(first).uppercased()
        }
        return "?"
    }

    // MARK: - Editions Button

    private func editionsButton() -> some View {
        Button {
            showEditionPicker = true
        } label: {
            HStack {
                Image(systemName: "books.vertical")
                Text("Browse Editions")
                Spacer()
                Image(systemName: "chevron.right")
            }
            .font(.subheadline)
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
        }
        .buttonStyle(.plain)
        .padding(.horizontal)
    }

    // MARK: - Data Loading

    private func loadBookData() async {
        isLoading = true

        // 1. Fetch book details from OpenLibrary
        do {
            bookDetails = try await OpenLibraryService.getBookDetails(workKey: bookKey)
        } catch {
            isLoading = false
            return
        }

        // 2. If authenticated, fetch Supabase data in parallel
        if case .authenticated(let user) = authService.state {
            async let statusResult: Void = loadBookStatus(userId: user.id)
            async let communityResult: Void = loadCommunityRatings()
            _ = await (statusResult, communityResult)
        }

        isLoading = false
    }

    private func loadBookStatus(userId: UUID) async {
        let status = await BookActionService.checkBookStatus(userId: userId, bookKey: bookKey)
        isWantToRead = status.isWantToRead
        isCurrentlyReading = status.isCurrentlyReading
        userBook = status.userBook
    }

    private func loadCommunityRatings() async {
        do {
            let ratings: [UserBook] = try await supabase.from("user_books")
                .select()
                .eq("open_library_key", value: bookKey)
                .order("score", ascending: false)
                .limit(100)
                .execute()
                .value
            communityRatings = ratings

            // Fetch reviewer profiles
            let userIds = Array(Set(ratings.map(\.userId)))
            if !userIds.isEmpty {
                let profiles: [Profile] = try await supabase.from("profiles")
                    .select()
                    .in("id", values: userIds.map { $0.uuidString })
                    .execute()
                    .value
                var profileMap: [UUID: Profile] = [:]
                for profile in profiles {
                    profileMap[profile.id] = profile
                }
                reviewerProfiles = profileMap
            }
        } catch {
            // Silently fail — community ratings are non-critical
        }
    }
}
