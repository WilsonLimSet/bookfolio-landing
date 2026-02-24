import SwiftUI

struct CoverSelectionStep: View {
    let editions: [BookEditionItem]
    let isLoading: Bool
    @Binding var selectedCover: String?
    let onNext: () -> Void

    private let columns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12),
    ]

    var body: some View {
        VStack(spacing: 16) {
            // Header
            VStack(spacing: 6) {
                Text("Choose a cover")
                    .font(.title2.bold())
                Text("Select the edition cover you prefer")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            .padding(.top, 16)

            // Content
            if isLoading {
                Spacer()
                ProgressView("Loading editions...")
                Spacer()
            } else if editions.isEmpty {
                Spacer()
                VStack(spacing: 12) {
                    Image(systemName: "books.vertical")
                        .font(.system(size: 36))
                        .foregroundColor(.secondary)
                    Text("No editions found")
                        .foregroundColor(.secondary)
                }
                Spacer()
            } else {
                ScrollView {
                    LazyVGrid(columns: columns, spacing: 16) {
                        ForEach(editions) { edition in
                            editionCell(edition)
                        }
                    }
                    .padding(.horizontal)
                }
            }

            // Next button
            Button(action: onNext) {
                Text("Next")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
            }
            .buttonStyle(.borderedProminent)
            .disabled(selectedCover == nil)
            .padding(.horizontal)
            .padding(.bottom, 16)
        }
    }

    private func editionCell(_ edition: BookEditionItem) -> some View {
        let isSelected = edition.coverUrl != nil && edition.coverUrl == selectedCover

        return Button {
            selectedCover = edition.coverUrl
        } label: {
            VStack(spacing: 6) {
                BookCoverView(coverUrl: edition.coverUrl, size: CGSize(width: 100, height: 150))
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(isSelected ? Color.blue : Color.clear, lineWidth: 3)
                    )
                    .overlay(alignment: .bottomTrailing) {
                        if isSelected {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.blue)
                                .background(Circle().fill(.white).padding(1))
                                .offset(x: 4, y: 4)
                        }
                    }

                VStack(spacing: 2) {
                    if let publisher = edition.publisher {
                        Text(publisher)
                            .font(.caption2)
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }
                    if let year = edition.year {
                        Text(year)
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
        .buttonStyle(.plain)
    }
}
