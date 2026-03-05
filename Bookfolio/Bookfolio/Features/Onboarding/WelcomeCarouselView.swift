import SwiftUI

struct CarouselSlide: Identifiable {
    let id = UUID()
    let icon: String
    let title: String
    let description: String
}

private let slides = [
    CarouselSlide(icon: "arrow.up.arrow.down", title: "Rank", description: "Build your personal book ranking"),
    CarouselSlide(icon: "magnifyingglass", title: "Discover", description: "Get recommendations from readers you trust"),
    CarouselSlide(icon: "book.fill", title: "Track", description: "Keep track of what you've read and want to read"),
]

struct WelcomeCarouselView: View {
    let onGetStarted: () -> Void
    let onLogin: () -> Void

    @State private var showSplash = true
    @State private var currentPage = 0

    private let tealColor = Color(red: 0.102, green: 0.227, blue: 0.227)
    private let accentTeal = Color(red: 0.239, green: 0.545, blue: 0.545)

    var body: some View {
        ZStack {
            tealColor.ignoresSafeArea()

            if showSplash {
                splashView
            } else {
                carouselView
            }
        }
        .onAppear {
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                withAnimation(.easeInOut(duration: 0.5)) {
                    showSplash = false
                }
            }
        }
    }

    private var splashView: some View {
        VStack(spacing: 16) {
            Image("AppLogo")
                .resizable()
                .scaledToFit()
                .frame(width: 80, height: 80)
                .clipShape(RoundedRectangle(cornerRadius: 16))
            Text("Bookfolio")
                .font(.system(size: 36, weight: .bold))
                .foregroundStyle(.white)
        }
    }

    private var carouselView: some View {
        VStack(spacing: 0) {
            TabView(selection: $currentPage) {
                ForEach(Array(slides.enumerated()), id: \.element.id) { index, slide in
                    VStack(spacing: 24) {
                        ZStack {
                            Circle()
                                .fill(.white.opacity(0.1))
                                .frame(width: 128, height: 128)
                            Image(systemName: slide.icon)
                                .font(.system(size: 48))
                                .foregroundStyle(.white.opacity(0.9))
                        }

                        Text(slide.title)
                            .font(.system(size: 32, weight: .bold))
                            .foregroundStyle(.white)

                        Text(slide.description)
                            .font(.system(size: 18))
                            .foregroundStyle(.white.opacity(0.7))
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 32)
                    }
                    .tag(index)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .never))

            // Dots
            HStack(spacing: 8) {
                ForEach(0..<slides.count, id: \.self) { i in
                    Capsule()
                        .fill(.white.opacity(i == currentPage ? 1 : 0.3))
                        .frame(width: i == currentPage ? 24 : 8, height: 8)
                        .animation(.easeInOut(duration: 0.2), value: currentPage)
                }
            }
            .padding(.bottom, 32)

            // Get started button
            Button(action: onGetStarted) {
                Text("Get started")
                    .font(.system(size: 18, weight: .semibold))
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
                    .background(accentTeal)
                    .foregroundStyle(.white)
                    .clipShape(Capsule())
            }
            .padding(.horizontal, 32)

            // Login link
            Button(action: onLogin) {
                Text("Already have an account? Log in")
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.6))
            }
            .padding(.top, 16)
            .padding(.bottom, 48)
        }
    }
}
