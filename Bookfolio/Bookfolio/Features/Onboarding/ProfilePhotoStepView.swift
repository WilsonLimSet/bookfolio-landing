import SwiftUI
import PhotosUI

struct ProfilePhotoStepView: View {
    let userId: UUID
    let onContinue: () -> Void
    let onBack: () -> Void
    let onSkip: () -> Void

    @State private var selectedItem: PhotosPickerItem?
    @State private var avatarImage: UIImage?
    @State private var isUploading = false
    @State private var errorMessage: String?

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
                Text("Add your profile photo")
                    .font(.system(size: 32, weight: .bold))
                Text("Show off the face behind the books")
                    .font(.body)
                    .foregroundStyle(.secondary)
            }
            .multilineTextAlignment(.center)
            .padding(.horizontal, 32)
            .padding(.top, 16)

            Spacer()

            PhotosPicker(selection: $selectedItem, matching: .images) {
                ZStack {
                    Circle()
                        .fill(Color(.systemGray6))
                        .frame(width: 144, height: 144)

                    if let avatarImage {
                        Image(uiImage: avatarImage)
                            .resizable()
                            .scaledToFill()
                            .frame(width: 144, height: 144)
                            .clipShape(Circle())
                    } else {
                        Image(systemName: "camera.fill")
                            .font(.system(size: 40))
                            .foregroundStyle(Color(.systemGray3))
                    }
                }
            }
            .onChange(of: selectedItem) { item in
                guard let item else { return }
                Task {
                    if let data = try? await item.loadTransferable(type: Data.self),
                       let uiImage = UIImage(data: data) {
                        avatarImage = uiImage
                    }
                }
            }

            if let errorMessage {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundStyle(.red)
                    .padding(.top, 8)
            }

            Spacer()

            VStack(spacing: 12) {
                Button(action: upload) {
                    Group {
                        if isUploading {
                            ProgressView().tint(.white)
                        } else {
                            Text("Continue")
                        }
                    }
                    .font(.system(size: 18, weight: .semibold))
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
                    .background(avatarImage != nil ? tealColor : Color.gray)
                    .foregroundStyle(.white)
                    .clipShape(Capsule())
                }
                .disabled(avatarImage == nil || isUploading)

                Button("Not now", action: onSkip)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 32)
            .padding(.bottom, 48)
        }
    }

    private func upload() {
        guard let image = avatarImage,
              let jpegData = image.jpegData(compressionQuality: 0.7) else { return }

        isUploading = true
        errorMessage = nil

        Task {
            do {
                let avatarUrl = try await ProfileService.uploadAvatar(data: jpegData, userId: userId)
                try await supabase.from("profiles")
                    .update(["avatar_url": avatarUrl])
                    .eq("id", value: userId)
                    .execute()
                isUploading = false
                onContinue()
            } catch {
                errorMessage = "Failed to upload photo"
                isUploading = false
            }
        }
    }
}
