import SwiftUI

struct ReadingGoalStepView: View {
    let userId: UUID
    let onContinue: () -> Void
    let onBack: () -> Void
    let onSkip: () -> Void

    @State private var goal = 24
    @State private var isSaving = false

    private let presets = [12, 24, 52]
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
                Text("What's your reading goal?")
                    .font(.system(size: 32, weight: .bold))
                Text("Set a goal to stay motivated")
                    .font(.body)
                    .foregroundStyle(.secondary)
            }
            .multilineTextAlignment(.center)
            .padding(.horizontal, 32)
            .padding(.top, 16)

            Spacer()

            // Goal picker
            VStack(spacing: 16) {
                HStack(spacing: 32) {
                    Button {
                        if goal > 1 { goal -= 1 }
                    } label: {
                        Image(systemName: "minus")
                            .font(.title2)
                            .frame(width: 48, height: 48)
                            .background(Circle().stroke(Color(.systemGray4)))
                            .foregroundStyle(.secondary)
                    }

                    VStack(spacing: 4) {
                        Text("\(goal)")
                            .font(.system(size: 64, weight: .bold))
                        Text("books this year")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }

                    Button {
                        if goal < 365 { goal += 1 }
                    } label: {
                        Image(systemName: "plus")
                            .font(.title2)
                            .frame(width: 48, height: 48)
                            .background(Circle().stroke(Color(.systemGray4)))
                            .foregroundStyle(.secondary)
                    }
                }

                // Presets
                HStack(spacing: 12) {
                    ForEach(presets, id: \.self) { preset in
                        Button {
                            goal = preset
                        } label: {
                            Text("\(preset)")
                                .font(.subheadline.weight(.medium))
                                .padding(.horizontal, 20)
                                .padding(.vertical, 10)
                                .background(goal == preset ? tealColor : Color(.systemGray6))
                                .foregroundStyle(goal == preset ? .white : .primary)
                                .clipShape(Capsule())
                        }
                    }
                }
            }

            Spacer()

            VStack(spacing: 12) {
                Button(action: save) {
                    Group {
                        if isSaving {
                            ProgressView().tint(.white)
                        } else {
                            Text("Continue")
                        }
                    }
                    .font(.system(size: 18, weight: .semibold))
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
                    .background(tealColor)
                    .foregroundStyle(.white)
                    .clipShape(Capsule())
                }
                .disabled(isSaving)

                Button("Not now", action: onSkip)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 32)
            .padding(.bottom, 48)
        }
    }

    private func save() {
        isSaving = true
        Task {
            try? await supabase.from("profiles")
                .update(["reading_goal_2025": goal])
                .eq("id", value: userId)
                .execute()
            isSaving = false
            onContinue()
        }
    }
}
