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
                onNext: { goToStep(.category) }
            )
        case .category:
            placeholderStep("Category Selection")
        case .tier:
            placeholderStep("Tier Selection")
        case .compare:
            placeholderStep("Compare Books")
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

    // MARK: - Navigation

    private func goToStep(_ step: RankingStep) {
        withAnimation(.easeInOut(duration: 0.25)) {
            currentStep = step
        }
    }

    private func goBack() {
        let steps = RankingStep.allCases
        guard let index = steps.firstIndex(of: currentStep), index > 0 else { return }
        goToStep(steps[index - 1])
    }

    private func goForward() {
        let steps = RankingStep.allCases
        guard let index = steps.firstIndex(of: currentStep), index < steps.count - 1 else { return }
        goToStep(steps[index + 1])
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
