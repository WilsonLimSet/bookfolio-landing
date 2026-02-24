import SwiftUI

struct WantToReadButton: View {
    let book: BookMetadata
    @Binding var isWantToRead: Bool
    @EnvironmentObject var authService: AuthService
    @State private var isLoading = false

    var body: some View {
        Button {
            toggle()
        } label: {
            HStack(spacing: 6) {
                if isLoading {
                    ProgressView()
                        .controlSize(.small)
                } else {
                    Image(systemName: isWantToRead ? "bookmark.fill" : "bookmark")
                }
                Text("Want to Read")
                    .font(.subheadline)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
        }
        .foregroundColor(isWantToRead ? .white : .orange)
        .background(isWantToRead ? Color.orange : Color.clear)
        .cornerRadius(10)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.orange, lineWidth: isWantToRead ? 0 : 1.5)
        )
        .disabled(isLoading)
    }

    private func toggle() {
        guard case .authenticated(let user) = authService.state else { return }

        let wasWantToRead = isWantToRead
        isWantToRead.toggle()
        isLoading = true

        Task {
            do {
                if !wasWantToRead {
                    try await BookActionService.addToWantToRead(userId: user.id, book: book)
                } else {
                    try await BookActionService.removeFromWantToRead(userId: user.id, bookKey: book.openLibraryKey)
                }
            } catch {
                isWantToRead = wasWantToRead
                print("WantToReadButton error: \(error)")
            }
            isLoading = false
        }
    }
}
