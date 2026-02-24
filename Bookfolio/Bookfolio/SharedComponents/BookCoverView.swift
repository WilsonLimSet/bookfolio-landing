import SwiftUI

struct BookCoverView: View {
    let coverUrl: String?
    var size: CGSize = CGSize(width: 80, height: 120)

    var body: some View {
        if let coverUrl, let url = URL(string: coverUrl) {
            AsyncImage(url: url) { phase in
                switch phase {
                case .success(let image):
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(width: size.width, height: size.height)
                        .clipped()
                case .failure:
                    fallbackCover
                case .empty:
                    loadingCover
                @unknown default:
                    fallbackCover
                }
            }
            .frame(width: size.width, height: size.height)
            .cornerRadius(8)
            .shadow(radius: 2)
        } else {
            fallbackCover
                .cornerRadius(8)
                .shadow(radius: 2)
        }
    }

    private var loadingCover: some View {
        RoundedRectangle(cornerRadius: 8)
            .fill(Color(.systemGray5))
            .frame(width: size.width, height: size.height)
            .overlay(
                Image(systemName: "book.fill")
                    .foregroundColor(Color(.systemGray3))
                    .font(.system(size: size.width * 0.3))
            )
    }

    private var fallbackCover: some View {
        RoundedRectangle(cornerRadius: 8)
            .fill(Color(.systemGray5))
            .frame(width: size.width, height: size.height)
            .overlay(
                Image(systemName: "book.fill")
                    .foregroundColor(Color(.systemGray3))
                    .font(.system(size: size.width * 0.3))
            )
    }
}
