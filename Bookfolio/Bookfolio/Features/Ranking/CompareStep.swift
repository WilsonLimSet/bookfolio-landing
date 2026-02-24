import SwiftUI
import UIKit

struct CompareStep: View {
    let newBookTitle: String
    let newBookAuthor: String?
    let newBookCover: String?
    let tierBooks: [UserBook]
    let onComplete: (Int) -> Void

    @State private var low = 0
    @State private var high: Int
    @State private var compareIndex: Int
    @State private var selectedSide: String?
    @State private var isAnimating = false
    @State private var comparisonNumber = 1
    @State private var comparisonId = UUID()

    private var maxComparisons: Int {
        let count = tierBooks.count
        guard count > 0 else { return 0 }
        return Int(ceil(log2(Double(count))))
    }

    private var currentBook: UserBook? {
        guard !tierBooks.isEmpty else { return nil }
        let clampedIndex = min(compareIndex, tierBooks.count - 1)
        return tierBooks[clampedIndex]
    }

    init(
        newBookTitle: String,
        newBookAuthor: String?,
        newBookCover: String?,
        tierBooks: [UserBook],
        onComplete: @escaping (Int) -> Void
    ) {
        self.newBookTitle = newBookTitle
        self.newBookAuthor = newBookAuthor
        self.newBookCover = newBookCover
        self.tierBooks = tierBooks
        self.onComplete = onComplete
        self._high = State(initialValue: tierBooks.count)
        self._compareIndex = State(initialValue: tierBooks.count / 2)
    }

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            // Title
            Text("Which do you prefer?")
                .font(.title2.bold())

            // Progress
            Text("Comparison \(comparisonNumber) of ~\(max(maxComparisons, 1))")
                .font(.subheadline)
                .foregroundColor(.secondary)

            // Book comparison cards
            if let existing = currentBook {
                HStack(alignment: .top, spacing: 12) {
                    // New book card
                    bookCard(
                        coverUrl: newBookCover,
                        title: newBookTitle,
                        author: newBookAuthor,
                        side: "new"
                    )
                    .onTapGesture {
                        handlePrefer(preferNew: true)
                    }

                    // VS divider
                    Text("vs")
                        .font(.subheadline.weight(.medium))
                        .foregroundColor(.secondary)
                        .padding(.top, 76)

                    // Existing book card
                    bookCard(
                        coverUrl: existing.coverUrl,
                        title: existing.title,
                        author: existing.author,
                        side: "existing"
                    )
                    .onTapGesture {
                        handlePrefer(preferNew: false)
                    }
                }
                .id(comparisonId)
                .transition(.asymmetric(
                    insertion: .move(edge: .trailing).combined(with: .opacity),
                    removal: .move(edge: .leading).combined(with: .opacity)
                ))
                .padding(.horizontal, 24)
            }

            Spacer()

            // Skip button
            Button {
                handleSkip()
            } label: {
                Text("Skip \u{2014} place in middle")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            .padding(.bottom, 32)
        }
        .animation(.spring(response: 0.3, dampingFraction: 0.7), value: selectedSide)
    }

    // MARK: - Book Card

    private func bookCard(coverUrl: String?, title: String, author: String?, side: String) -> some View {
        let isSelected = selectedSide == side
        let isUnselected = selectedSide != nil && !isSelected

        return VStack(spacing: 8) {
            BookCoverView(
                coverUrl: coverUrl,
                size: CGSize(width: 120, height: 180)
            )

            Text(title)
                .font(.caption.bold())
                .lineLimit(2)
                .multilineTextAlignment(.center)
                .frame(width: 120)

            if let author {
                Text(author)
                    .font(.caption2)
                    .foregroundColor(.secondary)
                    .lineLimit(1)
                    .frame(width: 120)
            }
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.1), radius: isSelected ? 8 : 4, y: isSelected ? 4 : 2)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(isSelected ? Color.blue : Color.clear, lineWidth: 2)
        )
        .scaleEffect(isSelected ? 1.05 : isUnselected ? 0.95 : 1.0)
        .opacity(isUnselected ? 0.6 : 1.0)
    }

    // MARK: - Binary Search Logic

    private func handlePrefer(preferNew: Bool) {
        guard !isAnimating else { return }
        isAnimating = true

        // Haptic feedback
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()

        // Show selection
        selectedSide = preferNew ? "new" : "existing"

        // Delay for animation, then advance
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
            var newLow = low
            var newHigh = high

            if preferNew {
                newHigh = compareIndex
            } else {
                newLow = compareIndex + 1
            }

            if newLow >= newHigh {
                // Done - found final position
                UINotificationFeedbackGenerator().notificationOccurred(.success)
                onComplete(newLow)
            } else {
                withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                    low = newLow
                    high = newHigh
                    compareIndex = (newLow + newHigh) / 2
                    selectedSide = nil
                    comparisonNumber += 1
                    comparisonId = UUID()
                }
            }

            isAnimating = false
        }
    }

    private func handleSkip() {
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
        onComplete((low + high) / 2)
    }
}
