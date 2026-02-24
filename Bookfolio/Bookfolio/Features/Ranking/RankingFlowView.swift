import SwiftUI

struct RankingFlowView: View {
    let bookKey: String
    let title: String
    let author: String?
    let coverUrl: String?
    var existingEntry: UserBook? = nil

    @EnvironmentObject var authService: AuthService
    @Environment(\.dismiss) var dismiss

    @State private var currentStep: RankingStep = .cover
    @State private var selectedCover: String?
    @State private var category: BookCategory?
    @State private var categoryAutoDetected = false
    @State private var tier: BookTier?
    @State private var userBooksCache: [String: [UserBook]] = [:]
    @State private var loadingBooks = true
    @State private var finalPosition: Int?
    @State private var reviewText = ""
    @State private var finishedAt: Date = Date()
    @State private var isSaving = false
    @State private var editions: [BookEditionItem] = []
    @State private var loadingEditions = true

    var body: some View {
        VStack(spacing: 0) {
            // Progress bar
            ProgressView(
                value: Double(currentStep.rawValue),
                total: Double(RankingStep.allCases.count - 1)
            )
            .tint(.blue)
            .padding(.horizontal)
            .padding(.top, 8)

            // Step content
            stepContent
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .navigationTitle("Rank Book")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("Cancel") {
                    dismiss()
                }
            }
        }
        .task {
            await loadInitialData()
        }
    }

    // MARK: - Step Content

    @ViewBuilder
    private var stepContent: some View {
        switch currentStep {
        case .cover:
            CoverSelectionStep(
                editions: editions,
                isLoading: loadingEditions,
                selectedCover: $selectedCover,
                onNext: {
                    if categoryAutoDetected && category != nil {
                        goToStep(.tier)
                    } else {
                        goToStep(.category)
                    }
                }
            )
        case .category:
            CategoryStep(category: $category, categoryAutoDetected: categoryAutoDetected) {
                goToStep(.tier)
            }
        case .tier:
            TierStep(bookTitle: title, tier: $tier) { selectedTier in
                handleTierSelection(selectedTier)
            }
        case .compare:
            CompareStep(
                newBookTitle: title,
                newBookAuthor: author,
                newBookCover: selectedCover ?? coverUrl,
                tierBooks: tierBooksForCompare
            ) { positionInTier in
                finalPosition = higherTierBooksCount + positionInTier + 1
                goToStep(.review)
            }
        case .review:
            placeholderStep("Write Review")
        case .saving:
            placeholderStep("Saving...")
        }
    }

    private func placeholderStep(_ name: String) -> some View {
        VStack(spacing: 16) {
            Text(name)
                .font(.title2.bold())
            Text("Coming soon")
                .foregroundColor(.secondary)
        }
    }

    // MARK: - Computed Properties

    private var tierBooksForCompare: [UserBook] {
        guard let category = category, let tier = tier else { return [] }
        return (userBooksCache[category.rawValue] ?? []).filter { $0.tier == tier }
    }

    private var higherTierBooksCount: Int {
        guard let category = category, let tier = tier else { return 0 }
        let tierOrder: [BookTier: Int] = [.liked: 0, .fine: 1, .disliked: 2]
        let selectedOrder = tierOrder[tier] ?? 0
        return (userBooksCache[category.rawValue] ?? []).filter {
            (tierOrder[$0.tier] ?? 0) < selectedOrder
        }.count
    }

    // MARK: - Navigation

    private func goToStep(_ step: RankingStep) {
        withAnimation(.easeInOut(duration: 0.25)) {
            currentStep = step
        }
    }

    private func goBack() {
        switch currentStep {
        case .tier where categoryAutoDetected && category != nil:
            goToStep(.cover) // Skip category when going back if it was auto-detected
        default:
            let steps = RankingStep.allCases
            guard let index = steps.firstIndex(of: currentStep), index > 0 else { return }
            goToStep(steps[index - 1])
        }
    }

    private func goForward() {
        let steps = RankingStep.allCases
        guard let index = steps.firstIndex(of: currentStep), index < steps.count - 1 else { return }
        goToStep(steps[index + 1])
    }

    // MARK: - Tier Selection

    private func handleTierSelection(_ selectedTier: BookTier) {
        tier = selectedTier
        guard let category = category else { return }

        let allBooks = userBooksCache[category.rawValue] ?? []
        let tierBooks = allBooks.filter { $0.tier == selectedTier }

        if tierBooks.isEmpty {
            // No books in this tier — calculate position directly
            let tierOrder: [BookTier: Int] = [.liked: 0, .fine: 1, .disliked: 2]
            let selectedOrder = tierOrder[selectedTier] ?? 0
            let higherTierBooks = allBooks.filter {
                (tierOrder[$0.tier] ?? 0) < selectedOrder
            }
            finalPosition = higherTierBooks.count + 1
            goToStep(.review) // Skip compare
        } else {
            goToStep(.compare)
        }
    }

    // MARK: - Data Loading

    private func loadInitialData() async {
        // Initialize selectedCover from the coverUrl parameter
        selectedCover = coverUrl

        // Pre-fill from existing entry if re-ranking
        if let existing = existingEntry {
            category = existing.category
            tier = existing.tier
        }

        // Load editions and prefetch user books in parallel
        async let editionsTask: Void = loadEditions()
        async let prefetchTask: Void = prefetchBooks()
        async let categoryTask: Void = autoDetectCategory()

        _ = await (editionsTask, prefetchTask, categoryTask)
    }

    private func loadEditions() async {
        do {
            let result = try await OpenLibraryService.getEditions(workKey: bookKey)
            await MainActor.run {
                editions = result
                // If no cover was set from params, use the first edition
                if selectedCover == nil, let firstCover = result.first?.coverUrl {
                    selectedCover = firstCover
                }
                loadingEditions = false
            }
        } catch {
            await MainActor.run {
                loadingEditions = false
            }
        }
    }

    private func prefetchBooks() async {
        guard case .authenticated(let user) = authService.state else {
            await MainActor.run { loadingBooks = false }
            return
        }

        let cache = await RankingService.prefetchUserBooks(userId: user.id)

        // Filter out the current book from cache
        let filtered = cache.mapValues { books in
            books.filter { $0.openLibraryKey != bookKey }
        }

        await MainActor.run {
            userBooksCache = filtered
            loadingBooks = false
        }
    }

    private func autoDetectCategory() async {
        // Only auto-detect if not re-ranking an existing entry
        guard existingEntry == nil else { return }

        do {
            let subjects = try await OpenLibraryService.fetchWorkSubjects(workKey: bookKey)
            if let detected = OpenLibraryService.detectCategory(subjects: subjects) {
                await MainActor.run {
                    category = detected
                    categoryAutoDetected = true
                }
            }
        } catch {
            // Auto-detection is best-effort; user picks manually if it fails
        }
    }
}
