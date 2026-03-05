import SwiftUI

struct UsernameStepView: View {
    let userId: UUID
    let onContinue: () -> Void
    let onBack: () -> Void

    @EnvironmentObject var authService: AuthService
    @State private var username = ""
    @State private var isAvailable: Bool?
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var checkTask: Task<Void, Never>?

    private var isUsernameValid: Bool {
        username.range(of: "^[a-zA-Z0-9_]{3,}$", options: .regularExpression) != nil
    }

    private var canSubmit: Bool {
        isUsernameValid && isAvailable == true && !isLoading
    }

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
                Text("Your username")
                    .font(.system(size: 32, weight: .bold))
                Text("How do you want to be known on Bookfolio?")
                    .font(.body)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 32)
            .padding(.top, 16)

            VStack(spacing: 12) {
                HStack {
                    Text("@")
                        .foregroundStyle(.secondary)
                        .font(.title3)
                    TextField("username", text: $username)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .font(.title3)

                    if isUsernameValid {
                        if let isAvailable {
                            Image(systemName: isAvailable ? "checkmark.circle.fill" : "xmark.circle.fill")
                                .foregroundStyle(isAvailable ? .green : .red)
                        } else {
                            ProgressView()
                                .frame(width: 24, height: 24)
                        }
                    }
                }
                .padding()
                .background(Color(.systemGray6))
                .clipShape(RoundedRectangle(cornerRadius: 16))

                if let errorMessage {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundStyle(.red)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                if let isAvailable, !isAvailable, isUsernameValid {
                    Text("This username is taken")
                        .font(.caption)
                        .foregroundStyle(.red)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                Text("You can always change this later")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(.horizontal, 32)
            .padding(.top, 32)
            .onChange(of: username) { _ in
                isAvailable = nil
                checkTask?.cancel()
                guard isUsernameValid else { return }
                checkTask = Task {
                    try? await Task.sleep(nanoseconds: 400_000_000)
                    guard !Task.isCancelled else { return }
                    await checkAvailability()
                }
            }

            Spacer()

            Button(action: submit) {
                Group {
                    if isLoading {
                        ProgressView().tint(.white)
                    } else {
                        Text("Continue")
                    }
                }
                .font(.system(size: 18, weight: .semibold))
                .frame(maxWidth: .infinity)
                .frame(height: 56)
                .background(canSubmit ? Color(red: 0.102, green: 0.227, blue: 0.227) : Color.gray)
                .foregroundStyle(.white)
                .clipShape(Capsule())
            }
            .disabled(!canSubmit)
            .padding(.horizontal, 32)
            .padding(.bottom, 48)
        }
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

    private func submit() {
        let trimmed = username.trimmingCharacters(in: .whitespaces).lowercased()
        guard isUsernameValid else { return }

        isLoading = true
        errorMessage = nil

        Task {
            do {
                try await supabase.from("profiles")
                    .update(["username": trimmed])
                    .eq("id", value: userId)
                    .execute()
                isLoading = false
                onContinue()
            } catch {
                errorMessage = error.localizedDescription
                isLoading = false
            }
        }
    }
}
