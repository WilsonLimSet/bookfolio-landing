import SwiftUI

struct TierStep: View {
    let bookTitle: String
    @Binding var tier: BookTier?
    let onSelect: (BookTier) -> Void

    var body: some View {
        VStack(spacing: 16) {
            // Header
            VStack(spacing: 6) {
                Text("How was it?")
                    .font(.title2.bold())
                Text("Rate **\(bookTitle)**")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
            }
            .padding(.top, 16)
            .padding(.horizontal)

            VStack(spacing: 16) {
                tierButton(
                    tier: .liked,
                    icon: "hand.thumbsup.fill",
                    title: "Liked it",
                    subtitle: "Great read, would recommend",
                    color: .green
                )
                tierButton(
                    tier: .fine,
                    icon: "minus.circle.fill",
                    title: "It was fine",
                    subtitle: "Decent, nothing special",
                    color: .yellow
                )
                tierButton(
                    tier: .disliked,
                    icon: "hand.thumbsdown.fill",
                    title: "Didn't like it",
                    subtitle: "Wouldn't recommend",
                    color: .red
                )
            }
            .padding(.horizontal)

            Spacer()
        }
    }

    private func tierButton(
        tier buttonTier: BookTier,
        icon: String,
        title: String,
        subtitle: String,
        color: Color
    ) -> some View {
        let isSelected = tier == buttonTier

        return Button {
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
            tier = buttonTier
            onSelect(buttonTier)
        } label: {
            HStack(spacing: 14) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(isSelected ? .white : color)
                    .frame(width: 44, height: 44)
                    .background(isSelected ? color : color.opacity(0.15))
                    .cornerRadius(10)

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.headline)
                        .foregroundColor(isSelected ? .white : .primary)
                    Text(subtitle)
                        .font(.caption)
                        .foregroundColor(isSelected ? .white.opacity(0.8) : .secondary)
                }

                Spacer()

                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.white)
                        .font(.title3)
                }
            }
            .padding(16)
            .background(isSelected ? color : Color(.systemBackground))
            .cornerRadius(14)
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(isSelected ? color : Color(.systemGray4), lineWidth: isSelected ? 0 : 1)
            )
        }
        .buttonStyle(.plain)
    }
}
