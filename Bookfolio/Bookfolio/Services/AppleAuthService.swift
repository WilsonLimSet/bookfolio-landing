import AuthenticationServices
import CryptoKit
import Foundation
import Auth  // from supabase-swift

// TODO: Apple Sign-In requires the capability in entitlements AND a provisioning profile
// with "Sign in with Apple" enabled in the Apple Developer portal.
// Also enable the Apple provider in Supabase Dashboard with Service ID, Team ID, Key ID, Private Key.
// Without proper Apple Developer setup, it will crash at runtime.

@MainActor
class AppleAuthService: NSObject, ObservableObject, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {

    private var rawNonce: String?
    private var signInContinuation: CheckedContinuation<Void, Error>?

    private func generateNonce() -> String {
        var randomBytes = [UInt8](repeating: 0, count: 32)
        _ = SecRandomCopyBytes(kSecRandomDefault, randomBytes.count, &randomBytes)
        return randomBytes.map { String(format: "%02x", $0) }.joined()
    }

    private func sha256(_ input: String) -> String {
        let data = Data(input.utf8)
        let hash = SHA256.hash(data: data)
        return hash.compactMap { String(format: "%02x", $0) }.joined()
    }

    func signIn() {
        let nonce = generateNonce()
        rawNonce = nonce
        let hashedNonce = sha256(nonce)

        let appleIDProvider = ASAuthorizationAppleIDProvider()
        let request = appleIDProvider.createRequest()
        request.requestedScopes = [.fullName, .email]
        request.nonce = hashedNonce

        let authorizationController = ASAuthorizationController(authorizationRequests: [request])
        authorizationController.delegate = self
        authorizationController.presentationContextProvider = self
        authorizationController.performRequests()
    }

    func signInAsync() async throws {
        try await withCheckedThrowingContinuation { continuation in
            signInContinuation = continuation
            signIn()
        }
    }

    // MARK: - ASAuthorizationControllerDelegate

    nonisolated func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        Task { @MainActor in
            guard let appleIDCredential = authorization.credential as? ASAuthorizationAppleIDCredential,
                  let identityTokenData = appleIDCredential.identityToken,
                  let identityTokenString = String(data: identityTokenData, encoding: .utf8),
                  let nonce = rawNonce else {
                signInContinuation?.resume(throwing: AppleAuthError.missingCredentials)
                signInContinuation = nil
                return
            }

            do {
                try await supabase.auth.signInWithIdToken(
                    credentials: .init(
                        provider: .apple,
                        idToken: identityTokenString,
                        nonce: nonce
                    )
                )
                signInContinuation?.resume()
            } catch {
                signInContinuation?.resume(throwing: error)
            }
            signInContinuation = nil
        }
    }

    nonisolated func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        Task { @MainActor in
            // Don't treat user cancellation as error
            if (error as? ASAuthorizationError)?.code == .canceled {
                signInContinuation?.resume()
            } else {
                signInContinuation?.resume(throwing: error)
            }
            signInContinuation = nil
        }
    }

    // MARK: - ASAuthorizationControllerPresentationContextProviding

    nonisolated func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        MainActor.assumeIsolated {
            guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                  let window = windowScene.windows.first else {
                return ASPresentationAnchor()
            }
            return window
        }
    }
}

enum AppleAuthError: LocalizedError {
    case missingCredentials

    var errorDescription: String? {
        switch self {
        case .missingCredentials: return "Apple Sign-In did not return valid credentials"
        }
    }
}
