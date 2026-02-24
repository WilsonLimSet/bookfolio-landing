import Foundation
import GoogleSignIn
import Auth  // from supabase-swift

// TODO: Replace placeholder Google Cloud Console credentials before release.
// Required setup:
// 1. Create iOS OAuth client ID in Google Cloud Console (bundle ID: com.bookfolio.ios)
// 2. Update Info.plist GIDClientID with real client ID
// 3. Update Info.plist URL scheme with reversed real client ID
// 4. Enable Google provider in Supabase Dashboard with iOS client ID

@MainActor
class GoogleAuthService {

    func signIn() async throws {
        // Get root view controller for presenting Google sign-in
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let rootViewController = windowScene.windows.first?.rootViewController else {
            throw GoogleAuthError.noRootViewController
        }

        // Present native Google Sign-In dialog (GIDClientID read from Info.plist automatically)
        let result = try await GIDSignIn.sharedInstance.signIn(withPresenting: rootViewController)

        guard let idToken = result.user.idToken?.tokenString else {
            throw GoogleAuthError.noIdToken
        }

        // Pass ID token to Supabase — Supabase verifies token server-side with Google
        try await supabase.auth.signInWithIdToken(
            credentials: OpenIDConnectCredentials(
                provider: .google,
                idToken: idToken,
                accessToken: result.user.accessToken.tokenString
            )
        )
        // AuthService.authStateChanges will pick up the .signedIn event
    }
}

enum GoogleAuthError: LocalizedError {
    case noRootViewController
    case noIdToken

    var errorDescription: String? {
        switch self {
        case .noRootViewController: return "Could not find root view controller"
        case .noIdToken: return "Google Sign-In did not return an ID token"
        }
    }
}
