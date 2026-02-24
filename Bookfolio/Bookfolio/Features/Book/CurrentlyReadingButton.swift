import SwiftUI

struct CurrentlyReadingButton: View {
    let book: BookMetadata
    @Binding var isCurrentlyReading: Bool
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
                    Image(systemName: isCurrentlyReading ? "book.fill" : "book")
                }
                Text(isCurrentlyReading ? "Reading" : "Start Reading")
                    .font(.subheadline)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
        }
        .foregroundColor(isCurrentlyReading ? .white : .blue)
        .background(isCurrentlyReading ? Color.blue : Color.clear)
        .cornerRadius(10)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.blue, lineWidth: isCurrentlyReading ? 0 : 1.5)
        )
        .disabled(isLoading)
    }

    private func toggle() {
        guard case .authenticated(let user) = authService.state else { return }

        let wasCurrentlyReading = isCurrentlyReading
        let wasWantToRead = isWantToRead
        isCurrentlyReading.toggle()
        if !wasCurrentlyReading {
            isWantToRead = false
        }
        isLoading = true

        Task {
            do {
                if !wasCurrentlyReading {
                    try await BookActionService.addToCurrentlyReading(userId: user.id, book: book)
                } else {
                    try await BookActionService.removeFromCurrentlyReading(userId: user.id, bookKey: book.openLibraryKey)
                }
            } catch {
                isCurrentlyReading = wasCurrentlyReading
                isWantToRead = wasWantToRead
                print("CurrentlyReadingButton error: \(error)")
            }
            isLoading = false
        }
    }
}
