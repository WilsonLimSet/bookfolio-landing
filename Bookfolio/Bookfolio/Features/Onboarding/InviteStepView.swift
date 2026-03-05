import SwiftUI

struct InviteStepView: View {
    let userId: UUID
    let onContinue: () -> Void
    let onBack: () -> Void
    let onSkip: () -> Void

    @State private var referralCode = ""
    @State private var referralCount = 0
    @State private var copied = false

    private let tealColor = Color(red: 0.102, green: 0.227, blue: 0.227)

    private let tiers: [(count: Int, label: String, icon: String)] = [
        (1, "Connector", "link"),
        (3, "Social Links", "person.2"),
        (5, "Ambassador", "star"),
        (10, "Accent Color", "paintpalette"),
    ]

    private var referralUrl: String {
        "https://bookfolio.app/login?ref=\(referralCode)"
    }

    private var shareText: String {
        "I ranked my top books on Bookfolio. See if we agree! \(referralUrl)"
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

            VStack(spacing: 8) {
                Text("Invite your friends")
                    .font(.system(size: 32, weight: .bold))
                Text("Share your link and unlock\nrewards as friends join.")
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
            .padding(.horizontal, 32)
            .padding(.top, 16)

            Spacer()

            // Reward tiers
            VStack(spacing: 16) {
                ZStack {
                    // Background line
                    Rectangle()
                        .fill(Color(.systemGray4))
                        .frame(height: 2)
                        .padding(.horizontal, 32)

                    HStack {
                        ForEach(Array(tiers.enumerated()), id: \.offset) { _, tier in
                            let isUnlocked = referralCount >= tier.count
                            VStack(spacing: 6) {
                                ZStack {
                                    Circle()
                                        .fill(isUnlocked ? Color.green : Color(.systemGray5))
                                        .frame(width: 40, height: 40)

                                    if isUnlocked {
                                        Image(systemName: "checkmark")
                                            .font(.system(size: 16, weight: .bold))
                                            .foregroundStyle(.white)
                                    } else {
                                        Text("\(tier.count)")
                                            .font(.system(size: 14, weight: .bold))
                                            .foregroundStyle(Color(.systemGray2))
                                    }
                                }

                                Text(tier.label)
                                    .font(.system(size: 10, weight: .medium))
                                    .foregroundStyle(isUnlocked ? .green : .secondary)
                            }

                            if tier.count != tiers.last?.count {
                                Spacer()
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                }
                .padding(.horizontal, 16)

                if referralCount > 0 {
                    Text("\(referralCount) \(referralCount == 1 ? "friend has" : "friends have") joined!")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(.green)
                }
            }

            Spacer()

            VStack(spacing: 12) {
                // Share button
                Button {
                    let activityVC = UIActivityViewController(
                        activityItems: [shareText],
                        applicationActivities: nil
                    )
                    if let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                       let root = scene.windows.first?.rootViewController {
                        root.present(activityVC, animated: true)
                    }
                } label: {
                    Text("Share invite link")
                        .font(.system(size: 18, weight: .semibold))
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(tealColor)
                        .foregroundStyle(.white)
                        .clipShape(Capsule())
                }

                // Copy link
                Button {
                    UIPasteboard.general.string = referralUrl
                    copied = true
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2) { copied = false }
                } label: {
                    Text(copied ? "Copied!" : "Copy link")
                        .font(.subheadline.weight(.medium))
                        .frame(maxWidth: .infinity)
                        .frame(height: 48)
                        .background(Color(.systemGray6))
                        .foregroundStyle(.primary)
                        .clipShape(Capsule())
                }
            }
            .padding(.horizontal, 32)

            VStack(spacing: 12) {
                Button(action: onContinue) {
                    Text("Continue")
                        .font(.system(size: 18, weight: .semibold))
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(tealColor)
                        .foregroundStyle(.white)
                        .clipShape(Capsule())
                }

                Button("Not now", action: onSkip)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 32)
            .padding(.top, 16)
            .padding(.bottom, 48)
        }
        .task { await loadReferralData() }
    }

    private func loadReferralData() async {
        do {
            let profile: Profile = try await supabase.from("profiles")
                .select("id, username, referral_code")
                .eq("id", value: userId)
                .single()
                .execute()
                .value
            referralCode = profile.referralCode ?? profile.username

            let response = try await supabase.from("referrals")
                .select("id", head: true, count: .exact)
                .eq("referrer_id", value: userId.uuidString)
                .execute()
            referralCount = response.count ?? 0
        } catch {}
    }
}
