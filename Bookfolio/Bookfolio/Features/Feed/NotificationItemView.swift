import SwiftUI

struct NotificationItemView: View {
    let item: NotificationItem
    let onUserTap: (UUID) -> Void
    let onBookTap: (String) -> Void

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            // Avatar
            if let fromUserId = item.fromUserId {
                Button {
                    onUserTap(fromUserId)
                } label: {
                    avatarView
                }
                .buttonStyle(.plain)
            } else {
                avatarView
            }

            // Text content
            VStack(alignment: .leading, spacing: 4) {
                notificationText

                Text(item.createdAt.relativeTimestamp)
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }

            Spacer()

            // Book indicator
            if let bookKey = item.bookKey {
                Button {
                    onBookTap(bookKey)
                } label: {
                    Image(systemName: "book.closed.fill")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(item.read ? Color.clear : Color.accentColor.opacity(0.05))
    }

    @ViewBuilder
    private var avatarView: some View {
        AsyncImage(url: item.fromAvatarUrl.flatMap { URL(string: $0) }) { phase in
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
                            .font(.caption2)
                    }
            }
        }
        .frame(width: 36, height: 36)
        .clipShape(Circle())
    }

    @ViewBuilder
    private var notificationText: some View {
        let username = item.fromUsername ?? "Someone"
        let bookTitle = item.bookTitle ?? "a book"

        switch item.type {
        case .follow:
            Text("\(Text(username).bold()) started following you")
                .font(.subheadline)
        case .like:
            Text("\(Text(username).bold()) liked your review of \(Text(bookTitle).bold())")
                .font(.subheadline)
        case .comment:
            Text("\(Text(username).bold()) commented on your review of \(Text(bookTitle).bold())")
                .font(.subheadline)
        case .friendRanked:
            Text("\(Text(username).bold()) ranked \(Text(bookTitle).bold())")
                .font(.subheadline)
        }
    }
}
