import SwiftUI

struct BookRowView: View {
    let title: String
    let author: String?
    let coverUrl: String?
    let score: Double?
    let rankPosition: Int?
    let onTap: (() -> Void)?

    init(
        title: String,
        author: String? = nil,
        coverUrl: String? = nil,
        score: Double? = nil,
        rankPosition: Int? = nil,
        onTap: (() -> Void)? = nil
    ) {
        self.title = title
        self.author = author
        self.coverUrl = coverUrl
        self.score = score
        self.rankPosition = rankPosition
        self.onTap = onTap
    }

    var body: some View {
        Button {
            onTap?()
        } label: {
            HStack(spacing: 12) {
                if let rankPosition {
                    Text("#\(rankPosition)")
                        .font(.subheadline.bold().monospaced())
                        .frame(width: 30, alignment: .center)
                        .foregroundColor(.primary)
                }

                AsyncImage(url: coverUrl.flatMap { URL(string: $0) }) { image in
                    image.resizable().scaledToFill()
                } placeholder: {
                    Image(systemName: "book.fill")
                        .font(.title3)
                        .foregroundStyle(.secondary)
                        .frame(width: 50, height: 75)
                        .background(Color(.systemGray5))
                }
                .frame(width: 50, height: 75)
                .clipShape(RoundedRectangle(cornerRadius: 6))

                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.subheadline.bold())
                        .foregroundColor(.primary)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                    if let author {
                        Text(author)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }
                }

                Spacer()

                if let score {
                    Text(String(format: "%.0f", score))
                        .font(.caption.bold())
                        .foregroundColor(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(scoreColor(score))
                        .clipShape(Capsule())
                }
            }
            .padding(.vertical, 4)
        }
        .buttonStyle(.plain)
    }

    private func scoreColor(_ score: Double) -> Color {
        if score >= 70 {
            return .green
        } else if score >= 40 {
            return .yellow
        } else {
            return .red
        }
    }
}
