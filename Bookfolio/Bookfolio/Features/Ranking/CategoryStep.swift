import SwiftUI

struct CategoryStep: View {
    @Binding var category: BookCategory?
    let categoryAutoDetected: Bool
    let onNext: () -> Void

    var body: some View {
        VStack(spacing: 16) {
            // Header
            VStack(spacing: 6) {
                Text("What type of book?")
                    .font(.title2.bold())

                if categoryAutoDetected, let cat = category {
                    Text("We detected this as **\(cat.rawValue.capitalized)**")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
            }
            .padding(.top, 16)

            if categoryAutoDetected {
                autoDetectedLayout
            } else {
                manualSelectionLayout
            }

            Spacer()

            // Next button
            Button(action: onNext) {
                Text("Next")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
            }
            .buttonStyle(.borderedProminent)
            .disabled(category == nil)
            .padding(.horizontal)
            .padding(.bottom, 16)
        }
    }

    // MARK: - Auto-Detected Layout

    private var autoDetectedLayout: some View {
        VStack(spacing: 12) {
            HStack(spacing: 12) {
                categoryPill(.fiction)
                categoryPill(.nonfiction)
            }
            .padding(.horizontal)

            Text("You can change this if it's wrong")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }

    private func categoryPill(_ cat: BookCategory) -> some View {
        let isSelected = category == cat
        let label = cat.rawValue.capitalized

        return Button {
            category = cat
        } label: {
            Text(label)
                .font(.subheadline.weight(.semibold))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(isSelected ? Color.blue : Color.clear)
                .foregroundColor(isSelected ? .white : .blue)
                .cornerRadius(10)
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(Color.blue, lineWidth: isSelected ? 0 : 1.5)
                )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Manual Selection Layout

    private var manualSelectionLayout: some View {
        VStack(spacing: 16) {
            categoryCard(
                category: .fiction,
                icon: "book.fill",
                title: "Fiction",
                subtitle: "Novels, short stories, poetry"
            )
            categoryCard(
                category: .nonfiction,
                icon: "text.book.closed.fill",
                title: "Nonfiction",
                subtitle: "Biography, history, science"
            )
        }
        .padding(.horizontal)
    }

    private func categoryCard(
        category cat: BookCategory,
        icon: String,
        title: String,
        subtitle: String
    ) -> some View {
        let isSelected = category == cat

        return Button {
            category = cat
        } label: {
            HStack(spacing: 14) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(isSelected ? .white : .blue)
                    .frame(width: 44, height: 44)
                    .background(isSelected ? Color.blue : Color.blue.opacity(0.1))
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
            .background(isSelected ? Color.blue : Color(.systemBackground))
            .cornerRadius(14)
            .overlay(
                RoundedRectangle(cornerRadius: 14)
                    .stroke(isSelected ? Color.blue : Color(.systemGray4), lineWidth: isSelected ? 0 : 1)
            )
        }
        .buttonStyle(.plain)
    }
}
