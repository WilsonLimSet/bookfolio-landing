import SwiftUI

struct EditionPickerView: View {
    let workKey: String
    let onSelect: (BookEditionItem) -> Void

    @Environment(\.dismiss) var dismiss
    @State private var editions: [BookEditionItem] = []
    @State private var isLoading = true

    private let columns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12),
    ]

    var body: some View {
        NavigationView {
            Group {
                if isLoading {
                    ProgressView("Loading editions...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if editions.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "books.vertical")
                            .font(.system(size: 36))
                            .foregroundColor(.secondary)
                        Text("No editions found")
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ScrollView {
                        LazyVGrid(columns: columns, spacing: 16) {
                            ForEach(editions) { edition in
                                Button {
                                    onSelect(edition)
                                    dismiss()
                                } label: {
                                    editionCell(edition)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Editions")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
            .task {
                await loadEditions()
            }
        }
    }

    private func editionCell(_ edition: BookEditionItem) -> some View {
        VStack(spacing: 6) {
            BookCoverView(coverUrl: edition.coverUrl, size: CGSize(width: 80, height: 120))

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

    private func loadEditions() async {
        isLoading = true
        do {
            editions = try await OpenLibraryService.getEditions(workKey: workKey)
        } catch {
            editions = []
        }
        isLoading = false
    }
}
