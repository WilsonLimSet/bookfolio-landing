import SwiftUI

struct UsernameSetupView: View {
    let userId: UUID

    @EnvironmentObject var authService: AuthService
    @State private var username = ""
    @State private var errorMessage: String?
    @State private var isLoading = false
    @State private var isAvailable: Bool?
    @State private var checkTask: Task<Void, Never>?

    private var isUsernameValid: Bool {
        username.range(of: "^[a-zA-Z0-9_]{3,}$", options: .regularExpression) != nil
    }

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            // Title
            VStack(spacing: 8) {
                Image(systemName: "book.fill")
                    .font(.system(size: 40))
                    .foregroundStyle(Color.accentColor)
                Text("Welcome to Bookfolio!")
                    .font(.title.bold())
                Text("Choose your username")
                    .font(.title3)
                    .foregroundStyle(.secondary)
            }

            // Username Field
            VStack(spacing: 8) {
                HStack {
                    TextField("Username", text: $username)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .textContentType(.username)
                        .padding()
                        .background(Color(.systemGray6))
                        .clipShape(RoundedRectangle(cornerRadius: 10))

                    // Availability indicator
                    if !username.isEmpty && isUsernameValid {
                        if let isAvailable {
                            Image(systemName: isAvailable ? "checkmark.circle.fill" : "xmark.circle.fill")
                                .foregroundStyle(isAvailable ? .green : .red)
                                .font(.title3)
                        } else {
                            ProgressView()
                                .frame(width: 24, height: 24)
                        }
                    }
                }

                Text("3+ characters, letters, numbers, and underscores")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)

                if !username.isEmpty && !isUsernameValid {
                    Text("Invalid username format")
                        .font(.caption)
                        .foregroundStyle(.red)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                if let isAvailable, !isAvailable, isUsernameValid {
                    Text("Username is already taken")
                        .font(.caption)
                        .foregroundStyle(.red)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
            .onChange(of: username) { _ in
                isAvailable = nil
                checkTask?.cancel()
                guard isUsernameValid else { return }
                checkTask = Task {
                    try? await Task.sleep(nanoseconds: 500_000_000)
                    guard !Task.isCancelled else { return }
                    await checkAvailability()
                }
            }

            // Error Message
            if let errorMessage {
                Text(errorMessage)
                    .font(.callout)
                    .foregroundStyle(.red)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity)
            }

            // Continue Button
            Button {
                Task { await submit() }
            } label: {
                Group {
                    if isLoading {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Text("Continue")
                    }
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(canSubmit ? Color.accentColor : Color.gray)
                .foregroundStyle(.white)
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .fontWeight(.semibold)
            }
            .disabled(!canSubmit || isLoading)

            Spacer()

            // Sign Out
            Button {
                Task { try? await authService.signOut() }
            } label: {
                Text("Sign out")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .padding(.bottom, 24)
        }
        .padding(.horizontal, 24)
    }

    private var canSubmit: Bool {
        isUsernameValid && isAvailable == true
    }

    private func checkAvailability() async {
        let trimmed = username.trimmingCharacters(in: .whitespaces).lowercased()
        do {
            let existing: [Profile] = try await supabase.from("profiles")
                .select("username")
                .eq("username", value: trimmed)
                .execute()
                .value
            isAvailable = existing.isEmpty
        } catch {
            isAvailable = nil
        }
    }

    private func submit() async {
        let trimmed = username.trimmingCharacters(in: .whitespaces).lowercased()
        guard isUsernameValid else { return }

        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            try await supabase.from("profiles")
                .update(["username": trimmed])
                .eq("id", value: userId)
                .execute()

            // Re-check state to transition to .authenticated
            if let session = try? await supabase.auth.session {
                await authService.checkUsernameAndSetState(user: session.user)
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

#Preview {
    UsernameSetupView(userId: UUID())
        .environmentObject(AuthService())
}
