import SwiftUI

private let allGenres = [
    "Literary Fiction", "Sci-Fi", "Fantasy", "Mystery/Thriller",
    "Romance", "Historical Fiction", "Non-Fiction", "Biography",
    "Self-Help", "Business", "Science", "Philosophy",
    "Poetry", "Horror", "Young Adult", "Graphic Novels",
]

struct GenreStepView: View {
    let userId: UUID
    let onContinue: () -> Void
    let onBack: () -> Void
    let onSkip: () -> Void

    @State private var selected: Set<String> = []
    @State private var isSaving = false

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
                Text("What genres do you love?")
                    .font(.system(size: 32, weight: .bold))
                Text("Pick a few to help us personalize your experience")
                    .font(.body)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 32)
            .padding(.top, 16)

            ScrollView {
                FlowLayout(spacing: 10) {
                    ForEach(allGenres, id: \.self) { genre in
                        Button {
                            if selected.contains(genre) {
                                selected.remove(genre)
                            } else {
                                selected.insert(genre)
                            }
                        } label: {
                            Text(genre)
                                .font(.subheadline.weight(.medium))
                                .padding(.horizontal, 16)
                                .padding(.vertical, 10)
                                .background(selected.contains(genre) ? tealColor : Color(.systemGray6))
                                .foregroundStyle(selected.contains(genre) ? .white : .primary)
                                .clipShape(Capsule())
                                .overlay(
                                    Capsule()
                                        .stroke(selected.contains(genre) ? Color.clear : Color(.systemGray4), lineWidth: 1)
                                )
                        }
                    }
                }
                .padding(.horizontal, 32)
                .padding(.top, 24)
            }

            VStack(spacing: 12) {
                Button(action: save) {
                    Group {
                        if isSaving {
                            ProgressView().tint(.white)
                        } else {
                            Text("Continue")
                        }
                    }
                    .font(.system(size: 18, weight: .semibold))
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
                    .background(selected.isEmpty ? Color.gray : tealColor)
                    .foregroundStyle(.white)
                    .clipShape(Capsule())
                }
                .disabled(selected.isEmpty || isSaving)

                Button("Nope, I like everything", action: onSkip)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 32)
            .padding(.bottom, 48)
        }
    }

    private func save() {
        isSaving = true
        Task {
            let genresArray = Array(selected)
            try? await supabase.from("profiles")
                .update(["favorite_genres": genresArray])
                .eq("id", value: userId)
                .execute()
            isSaving = false
            onContinue()
        }
    }
}

// Simple flow layout for wrapping genre chips
struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = layout(proposal: proposal, subviews: subviews)
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = layout(proposal: proposal, subviews: subviews)
        for (index, position) in result.positions.enumerated() {
            subviews[index].place(at: CGPoint(x: bounds.minX + position.x, y: bounds.minY + position.y), proposal: .unspecified)
        }
    }

    private func layout(proposal: ProposedViewSize, subviews: Subviews) -> (size: CGSize, positions: [CGPoint]) {
        let maxWidth = proposal.width ?? .infinity
        var positions: [CGPoint] = []
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > maxWidth && x > 0 {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            positions.append(CGPoint(x: x, y: y))
            rowHeight = max(rowHeight, size.height)
            x += size.width + spacing
        }

        return (CGSize(width: maxWidth, height: y + rowHeight), positions)
    }
}
