import SwiftUI

enum OnboardingStep: Int, CaseIterable {
    case carousel
    case signIn
    case username
    case photo
    case readingGoal
    case genres
    case findFriends
    case invite
    case importBooks
}

struct OnboardingView: View {
    @EnvironmentObject var authService: AuthService
    let startStep: OnboardingStep
    let userId: UUID?

    @State private var currentStep: OnboardingStep
    @State private var direction: Edge = .trailing
    @State private var completionError: String?

    init(startStep: OnboardingStep = .carousel, userId: UUID? = nil) {
        self.startStep = startStep
        self.userId = userId
        _currentStep = State(initialValue: startStep)
    }

    /// Whether back navigation should be disabled (user is already authenticated, can't go back to auth)
    private var backDisabledForUsername: Bool {
        startStep.rawValue >= OnboardingStep.username.rawValue
    }

    var body: some View {
        ZStack {
            switch currentStep {
            case .carousel:
                WelcomeCarouselView(
                    onGetStarted: { goForward(to: .signIn) },
                    onLogin: { goForward(to: .signIn) }
                )
                .transition(.asymmetric(
                    insertion: .move(edge: .trailing),
                    removal: .move(edge: .leading)
                ))

            case .signIn:
                SignInStepView(
                    onBack: { goBack(to: .carousel) }
                )
                .transition(.asymmetric(
                    insertion: .move(edge: direction),
                    removal: .move(edge: direction == .trailing ? .leading : .trailing)
                ))

            case .username:
                if let userId {
                    UsernameStepView(
                        userId: userId,
                        onContinue: { goForward(to: .photo) },
                        // Disable back if user entered at username step (already signed in)
                        onBack: backDisabledForUsername ? { /* no-op */ } : { goBack(to: .signIn) }
                    )
                    .transition(.asymmetric(
                        insertion: .move(edge: direction),
                        removal: .move(edge: direction == .trailing ? .leading : .trailing)
                    ))
                }

            case .photo:
                if let userId {
                    ProfilePhotoStepView(
                        userId: userId,
                        onContinue: { goForward(to: .readingGoal) },
                        onBack: startStep.rawValue >= OnboardingStep.photo.rawValue ? { /* no-op */ } : { goBack(to: .username) },
                        onSkip: { goForward(to: .readingGoal) }
                    )
                    .transition(.asymmetric(
                        insertion: .move(edge: direction),
                        removal: .move(edge: direction == .trailing ? .leading : .trailing)
                    ))
                }

            case .readingGoal:
                if let userId {
                    ReadingGoalStepView(
                        userId: userId,
                        onContinue: { goForward(to: .genres) },
                        onBack: { goBack(to: .photo) },
                        onSkip: { goForward(to: .genres) }
                    )
                    .transition(.asymmetric(
                        insertion: .move(edge: direction),
                        removal: .move(edge: direction == .trailing ? .leading : .trailing)
                    ))
                }

            case .genres:
                if let userId {
                    GenreStepView(
                        userId: userId,
                        onContinue: { goForward(to: .findFriends) },
                        onBack: { goBack(to: .readingGoal) },
                        onSkip: { goForward(to: .findFriends) }
                    )
                    .transition(.asymmetric(
                        insertion: .move(edge: direction),
                        removal: .move(edge: direction == .trailing ? .leading : .trailing)
                    ))
                }

            case .findFriends:
                if let userId {
                    FindFriendsStepView(
                        userId: userId,
                        onContinue: { goForward(to: .invite) },
                        onBack: { goBack(to: .genres) },
                        onSkip: { goForward(to: .invite) }
                    )
                    .transition(.asymmetric(
                        insertion: .move(edge: direction),
                        removal: .move(edge: direction == .trailing ? .leading : .trailing)
                    ))
                }

            case .invite:
                if let userId {
                    InviteStepView(
                        userId: userId,
                        onContinue: { goForward(to: .importBooks) },
                        onBack: { goBack(to: .findFriends) },
                        onSkip: { goForward(to: .importBooks) }
                    )
                    .transition(.asymmetric(
                        insertion: .move(edge: direction),
                        removal: .move(edge: direction == .trailing ? .leading : .trailing)
                    ))
                }

            case .importBooks:
                ImportStepView(
                    onFinish: { completeOnboarding() },
                    onBack: { goBack(to: .invite) }
                )
                .transition(.asymmetric(
                    insertion: .move(edge: direction),
                    removal: .move(edge: direction == .trailing ? .leading : .trailing)
                ))
            }
        }
        .animation(.easeInOut(duration: 0.3), value: currentStep)
        .alert("Something went wrong", isPresented: .init(
            get: { completionError != nil },
            set: { if !$0 { completionError = nil } }
        )) {
            Button("Try Again") { completeOnboarding() }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text(completionError ?? "Please try again.")
        }
    }

    private func goForward(to step: OnboardingStep) {
        direction = .trailing
        withAnimation { currentStep = step }
    }

    private func goBack(to step: OnboardingStep) {
        direction = .leading
        withAnimation { currentStep = step }
    }

    private func completeOnboarding() {
        Task {
            guard let userId else { return }
            do {
                try await supabase.from("profiles")
                    .update(["onboarding_completed": true])
                    .eq("id", value: userId)
                    .execute()

                if let session = try? await supabase.auth.session {
                    await authService.checkUsernameAndSetState(user: session.user)
                }
            } catch {
                completionError = error.localizedDescription
            }
        }
    }
}
