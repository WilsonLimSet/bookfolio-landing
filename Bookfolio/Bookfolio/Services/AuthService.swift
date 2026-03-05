import Foundation
import Auth
import Supabase

@MainActor
class AuthService: ObservableObject {
    enum AuthState: Sendable, Equatable {
        case loading
        case unauthenticated
        case authenticated(User)
        case needsUsername(User)
        case needsOnboarding(User)

        static func == (lhs: AuthState, rhs: AuthState) -> Bool {
            switch (lhs, rhs) {
            case (.loading, .loading): return true
            case (.unauthenticated, .unauthenticated): return true
            case (.authenticated(let a), .authenticated(let b)): return a.id == b.id
            case (.needsUsername(let a), .needsUsername(let b)): return a.id == b.id
            case (.needsOnboarding(let a), .needsOnboarding(let b)): return a.id == b.id
            default: return false
            }
        }
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
            struct ProfileCheck: Codable {
                let id: UUID
                let username: String
                let onboardingCompleted: Bool?

                enum CodingKeys: String, CodingKey {
                    case id
                    case username
                    case onboardingCompleted = "onboarding_completed"
                }
            }

            let profile: ProfileCheck = try await supabase.from("profiles")
                .select("id, username, onboarding_completed")
                .eq("id", value: user.id)
                .single()
                .execute()
                .value
            if profile.username.isEmpty {
                state = .needsUsername(user)
            } else if profile.onboardingCompleted != true {
                state = .needsOnboarding(user)
            } else {
                state = .authenticated(user)
            }
        } catch let error as NSError {
            // Only treat as "needs username" if profile genuinely not found
            // For network errors, stay in loading so user can retry
            if error.domain == "PostgrestError" || error.localizedDescription.contains("not found") {
                state = .needsUsername(user)
            } else {
                // Network/transient error — retry after delay
                try? await Task.sleep(nanoseconds: 2_000_000_000)
                await checkUsernameAndSetState(user: user)
            }
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
