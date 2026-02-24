import SwiftUI
import UIKit

// MARK: - Relative Date Formatting

extension Date {
    var relativeTimestamp: String {
        let now = Date()
        let interval = now.timeIntervalSince(self)

        if interval < 60 {
            return "just now"
        } else if interval < 3600 {
            let minutes = Int(interval / 60)
            return "\(minutes)m"
        } else if interval < 86400 {
            let hours = Int(interval / 3600)
            return "\(hours)h"
        } else if interval < 604800 {
            let days = Int(interval / 86400)
            return "\(days)d"
        } else {
            let weeks = Int(interval / 604800)
            return "\(weeks)w"
        }
    }
}

// MARK: - Score Color

private func scoreColor(for score: Double) -> Color {
    if score >= 8 {
        return .green
    } else if score >= 5 {
        return .orange
    } else {
        return .red
    }
}

// MARK: - FeedItemView

struct FeedItemView: View {
    let item: FeedItem
    let onLikeTap: () -> Void
    let onUserTap: (UUID) -> Void
    let onBookTap: (String) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // User row
            HStack(spacing: 10) {
                Button {
                    onUserTap(item.userId)
                } label: {
                    avatarView
                }
                .buttonStyle(.plain)

                VStack(alignment: .leading, spacing: 2) {
                    Button {
                        onUserTap(item.userId)
                    } label: {
                        Text(item.username)
                            .font(.subheadline.bold())
                            .foregroundStyle(.primary)
                    }
                    .buttonStyle(.plain)

                    Text(item.createdAt.relativeTimestamp)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()
            }

            // Book row
            Button {
                onBookTap(item.openLibraryKey)
            } label: {
                HStack(alignment: .top, spacing: 12) {
                    // Cover image
                    AsyncImage(url: item.coverUrl.flatMap { URL(string: $0) }) { phase in
                        switch phase {
                        case .success(let image):
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                        default:
                            Rectangle()
                                .fill(Color.gray.opacity(0.2))
                                .overlay {
                                    Image(systemName: "book.closed")
                                        .foregroundStyle(.secondary)
                                }
                        }
                    }
                    .frame(width: 60, height: 90)
                    .clipShape(RoundedRectangle(cornerRadius: 8))

                    // Book info
                    VStack(alignment: .leading, spacing: 4) {
                        Text(item.title)
                            .font(.subheadline.bold())
                            .foregroundStyle(.primary)
                            .lineLimit(2)

                        if let author = item.author {
                            Text(author)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .lineLimit(1)
                        }

                        // Score pill
                        HStack(spacing: 6) {
                            Text(String(format: "%.1f", item.score))
                                .font(.caption.bold())
                                .foregroundStyle(.white)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(scoreColor(for: item.score))
                                .clipShape(Capsule())

                            Text(item.tier.rawValue.capitalized)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }

                        if let reviewText = item.reviewText, !reviewText.isEmpty {
                            Text(reviewText)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .lineLimit(3)
                        }
                    }
                }
            }
            .buttonStyle(.plain)

            // Like row
            HStack(spacing: 4) {
                Button {
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    onLikeTap()
                } label: {
                    Image(systemName: item.isLikedByMe ? "heart.fill" : "heart")
                        .foregroundStyle(item.isLikedByMe ? .red : .secondary)
                        .font(.subheadline)
                }
                .buttonStyle(.plain)

                if item.likeCount > 0 {
                    Text("\(item.likeCount)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()
            }

            Divider()
        }
        .padding(.horizontal)
        .padding(.vertical, 4)
    }

    @ViewBuilder
    private var avatarView: some View {
        AsyncImage(url: item.avatarUrl.flatMap { URL(string: $0) }) { phase in
            switch phase {
            case .success(let image):
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            default:
                Circle()
                    .fill(Color.gray.opacity(0.2))
                    .overlay {
                        Image(systemName: "person.fill")
                            .foregroundStyle(.secondary)
                            .font(.caption)
                    }
            }
        }
        .frame(width: 40, height: 40)
        .clipShape(Circle())
    }
}
