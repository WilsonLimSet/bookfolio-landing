import SwiftUI
import UIKit

/// Drop-in replacement for AsyncImage with memory + disk caching.
struct CachedAsyncImage<Content: View, Placeholder: View>: View {
    let url: URL?
    @ViewBuilder let content: (Image) -> Content
    @ViewBuilder let placeholder: () -> Placeholder

    @State private var uiImage: UIImage?

    var body: some View {
        Group {
            if let uiImage {
                content(Image(uiImage: uiImage))
                    .transition(.opacity.animation(.easeIn(duration: 0.2)))
            } else {
                placeholder()
            }
        }
        .task(id: url) {
            await loadImage()
        }
    }

    private func loadImage() async {
        guard let url else { return }
        uiImage = await ImageCacheService.shared.image(for: url)
    }
}

/// Convenience initializer matching AsyncImage phase-based API.
extension CachedAsyncImage where Content == Image, Placeholder == EmptyView {
    init(url: URL?) {
        self.url = url
        self.content = { $0 }
        self.placeholder = { EmptyView() }
    }
}
