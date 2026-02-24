import AuthenticationServices
import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authService: AuthService

    @StateObject private var appleAuth = AppleAuthService()
    private let googleAuth = GoogleAuthService()

    @State private var showEmailForm = false
    @State private var isSignUp = false
    @State private var email = ""
    @State private var password = ""
    @State private var username = ""
    @State private var errorMessage: String?
    @State private var successMessage: String?

    private var isUsernameValid: Bool {
        username.range(of: "^[a-zA-Z0-9_]{3,}$", options: .regularExpression) != nil
    }

    private var isFormValid: Bool {
        let emailValid = !email.trimmingCharacters(in: .whitespaces).isEmpty
        let passwordValid = password.count >= 6
        if isSignUp {
            return emailValid && passwordValid && isUsernameValid
        }
        return emailValid && passwordValid
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                Spacer().frame(height: 60)

                // Logo / Title
                VStack(spacing: 8) {
                    Image(systemName: "book.fill")
                        .font(.system(size: 48))
                        .foregroundStyle(Color.accentColor)
                    Text("Bookfolio")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    Text("Track, rank, and share your reading")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .padding(.bottom, 16)

                // Apple Sign-In Button
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
                        Text("Sign in with Apple")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 50)
                    .background(Color.primary)
                    .foregroundColor(Color(UIColor.systemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .disabled(authService.isLoading)

                // Google Sign-In Button
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
                    .frame(height: 50)
                    .background(Color(.systemGray6))
                    .foregroundStyle(.primary)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .disabled(authService.isLoading)

                // Divider
                HStack {
                    Rectangle()
                        .frame(height: 1)
                        .foregroundStyle(Color(.systemGray4))
                    Text("or")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Rectangle()
                        .frame(height: 1)
                        .foregroundStyle(Color(.systemGray4))
                }

                // Email toggle link
                Button {
                    withAnimation(.easeInOut(duration: 0.25)) {
                        showEmailForm.toggle()
                    }
                } label: {
                    Text("Sign in with email instead")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                // Collapsible email form
                if showEmailForm {
                    VStack(spacing: 16) {
                        // Mode Toggle
                        Picker("Mode", selection: $isSignUp) {
                            Text("Sign In").tag(false)
                            Text("Create Account").tag(true)
                        }
                        .pickerStyle(.segmented)
                        .onChange(of: isSignUp) { _ in
                            errorMessage = nil
                            successMessage = nil
                        }

                        if isSignUp {
                            TextField("Username", text: $username)
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled()
                                .textContentType(.username)
                                .padding()
                                .background(Color(.systemGray6))
                                .clipShape(RoundedRectangle(cornerRadius: 10))

                            if !username.isEmpty && !isUsernameValid {
                                Text("3+ characters, letters, numbers, and underscores only")
                                    .font(.caption)
                                    .foregroundStyle(.red)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            }
                        }

                        TextField("Email", text: $email)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .keyboardType(.emailAddress)
                            .textContentType(.emailAddress)
                            .padding()
                            .background(Color(.systemGray6))
                            .clipShape(RoundedRectangle(cornerRadius: 10))

                        SecureField("Password", text: $password)
                            .textContentType(isSignUp ? .newPassword : .password)
                            .padding()
                            .background(Color(.systemGray6))
                            .clipShape(RoundedRectangle(cornerRadius: 10))

                        if !password.isEmpty && password.count < 6 {
                            Text("Password must be at least 6 characters")
                                .font(.caption)
                                .foregroundStyle(.red)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }

                        // Submit Button
                        Button {
                            Task { await handleSubmit() }
                        } label: {
                            Group {
                                if authService.isLoading {
                                    ProgressView()
                                        .tint(.white)
                                } else {
                                    Text(isSignUp ? "Create Account" : "Sign In")
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(isFormValid ? Color.accentColor : Color.gray)
                            .foregroundStyle(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                            .fontWeight(.semibold)
                        }
                        .disabled(!isFormValid || authService.isLoading)
                    }
                    .transition(.opacity.combined(with: .move(edge: .top)))
                }

                // Error Message
                if let errorMessage {
                    Text(errorMessage)
                        .font(.callout)
                        .foregroundStyle(.red)
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: .infinity)
                }

                // Success Message
                if let successMessage {
                    Text(successMessage)
                        .font(.callout)
                        .foregroundStyle(.green)
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: .infinity)
                }

                Spacer()
            }
            .padding(.horizontal, 24)
        }
    }

    private func handleSubmit() async {
        errorMessage = nil
        successMessage = nil

        do {
            if isSignUp {
                let sessionCreated = try await authService.signUp(
                    email: email.trimmingCharacters(in: .whitespaces),
                    password: password,
                    username: username.trimmingCharacters(in: .whitespaces).lowercased()
                )
                if !sessionCreated {
                    successMessage = "Check your email to verify your account."
                }
            } else {
                try await authService.signIn(
                    email: email.trimmingCharacters(in: .whitespaces),
                    password: password
                )
            }
        } catch {
            errorMessage = error.userFacingMessage
        }
    }
}

#Preview("Login") {
    LoginView()
        .environmentObject(AuthService())
}
