import SwiftUI

struct ImportStepView: View {
    let onFinish: () -> Void
    let onBack: () -> Void

    private let tealColor = Color(red: 0.102, green: 0.227, blue: 0.227)

    var body: some View {
        VStack(spacing: 0) {
            // Back button
            HStack {
                Button(action: onBack) {
                    Image(systemName: "chevron.left")
                        .font(.title3)
                        .foregroundStyle(.secondary)
                }
                Spacer()
            }
            .padding()

            VStack(spacing: 8) {
                Text("Get a head start")
                    .font(.system(size: 32, weight: .bold))
                Text("Import your books from Goodreads\nto quickly build your ranked list")
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
            .padding(.horizontal, 32)
            .padding(.top, 16)

            Spacer()

            ZStack {
                Circle()
                    .fill(Color(.systemGray6))
                    .frame(width: 128, height: 128)
                Image(systemName: "book.fill")
                    .font(.system(size: 48))
                    .foregroundStyle(Color(.systemGray3))
            }

            Text("Export your Goodreads library as CSV\nand import it on our website.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.top, 24)

            Spacer()

            VStack(spacing: 12) {
                // For iOS, import is done on web — this links to the website
                Button(action: openImportPage) {
                    Text("Open Import Page")
                        .font(.system(size: 18, weight: .semibold))
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(tealColor)
                        .foregroundStyle(.white)
                        .clipShape(Capsule())
                }

                Button("Skip — I'll do this later", action: onFinish)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 32)
            .padding(.bottom, 48)
        }
    }

    private func openImportPage() {
        if let url = URL(string: "https://bookfolio.app/import") {
            UIApplication.shared.open(url)
        }
    }
}
