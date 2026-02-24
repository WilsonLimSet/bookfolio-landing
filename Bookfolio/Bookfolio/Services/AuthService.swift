import Foundation
import Auth
import Supabase

@MainActor
class AuthService: ObservableObject {
    enum AuthState: Sendable {
        case loading
        case unauthenticated
        case authenticated(User)
        case needsUsername(User)
    }

    @Published var state: AuthState = .loading
    @Published var isLoading = false

    init() {
        Task { await listenForAuthChanges() }
    }

    func listenForAuthChanges() async {
        for await (event, session) in supabase.auth.authStateChanges {
            if event == .initialSession || event == .signedIn {
                if let session {
                    await checkUsernameAndSetState(user: session.user)
                } else {
                    state = .unauthenticated
                }
            } else if event == .signedOut {
                state = .unauthenticated
            }
        }
    }

    func checkUsernameAndSetState(user: User) async {
        do {
            let profile: Profile = try await supabase.from("profiles")
                .select("id, username")
                .eq("id", value: user.id)
                .single()
                .execute()
                .value
            if profile.username.isEmpty {
                state = .needsUsername(user)
            } else {
                state = .authenticated(user)
            }
        } catch {
            state = .needsUsername(user)
        }
    }

    func signIn(email: String, password: String) async throws {
        isLoading = true
        defer { isLoading = false }
        _ = try await supabase.auth.signIn(email: email, password: password)
    }

    func signUp(email: String, password: String, username: String) async throws -> Bool {
        isLoading = true
        defer { isLoading = false }

        let existing: [Profile] = try await supabase.from("profiles")
            .select("username")
            .eq("username", value: username)
            .execute()
            .value
        if !existing.isEmpty {
            throw AuthServiceError.usernameTaken
        }

        let response = try await supabase.auth.signUp(
            email: email,
            password: password,
            data: ["username": .string(username)]
        )

        return response.session != nil
    }

    func signOut() async throws {
        try await supabase.auth.signOut()
    }
}

enum AuthServiceError: LocalizedError {
    case usernameTaken
    case invalidUsername

    var errorDescription: String? {
        switch self {
        case .usernameTaken: return "Username is already taken"
        case .invalidUsername: return "Username must be at least 3 characters (letters, numbers, underscores only)"
        }
    }
}
