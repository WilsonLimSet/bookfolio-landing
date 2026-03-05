import SwiftUI
import AuthenticationServices

struct SignInStepView: View {
    @EnvironmentObject var authService: AuthService

    @StateObject private var appleAuth = AppleAuthService()
    private let googleAuth = GoogleAuthService()

    let onBack: () -> Void

    @State private var errorMessage: String?

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

            VStack(alignment: .leading, spacing: 8) {
                Text("Let's get started")
                    .font(.system(size: 32, weight: .bold))
                Text("Sign in to start ranking your books")
                    .font(.body)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 32)
            .padding(.top, 16)

            Spacer()

            VStack(spacing: 16) {
                // Apple Sign In
                Button {
                    Task {
                        do {
                            try await appleAuth.signInAsync()
                        } catch {
                            errorMessage = error.localizedDescription
                        }
                    }
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "apple.logo")
                            .font(.title3)
                        Text("Continue with Apple")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
                    .background(Color.primary)
                    .foregroundColor(Color(UIColor.systemBackground))
                    .clipShape(Capsule())
                }

                // Google Sign In
                Button {
                    Task {
                        do {
                            try await googleAuth.signIn()
                        } catch {
                            errorMessage = error.localizedDescription
                        }
                    }
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "g.circle.fill")
                            .font(.title3)
                        Text("Continue with Google")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
                    .background(Color(.systemGray6))
                    .foregroundStyle(.primary)
                    .clipShape(Capsule())
                }

                if let errorMessage {
                    Text(errorMessage)
                        .font(.callout)
                        .foregroundStyle(.red)
                        .multilineTextAlignment(.center)
                }
            }
            .padding(.horizontal, 32)

            Spacer()

            Text("By continuing, you agree to our Terms of Service and Privacy Policy")
                .font(.caption)
                .foregroundStyle(.tertiary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
                .padding(.bottom, 32)
        }
    }
}
