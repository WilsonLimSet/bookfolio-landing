import SwiftUI
import UIKit

struct ReviewStep: View {
    @Binding var finishedAt: Date
    @Binding var reviewText: String
    let isSaving: Bool
    let onSave: () -> Void

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                Text("Almost done!")
                    .font(.title.bold())
                    .padding(.top, 8)

                // MARK: - Finish Date
                VStack(alignment: .leading, spacing: 8) {
                    Text("When did you finish?")
                        .font(.headline)

                    DatePicker(
                        "Finish date",
                        selection: $finishedAt,
                        in: ...Date(),
                        displayedComponents: .date
                    )
                    .datePickerStyle(.compact)
                    .labelsHidden()
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                // MARK: - Review Text
                VStack(alignment: .leading, spacing: 8) {
                    Text("Write a review (optional)")
                        .font(.headline)

                    ZStack(alignment: .topLeading) {
                        if reviewText.isEmpty {
                            Text("What did you think? Any highlights, quotes, or takeaways...")
                                .foregroundColor(.secondary)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 12)
                                .allowsHitTesting(false)
                        }

                        TextEditor(text: $reviewText)
                            .frame(minHeight: 120)
                            .scrollContentBackground(.hidden)
                            .padding(4)
                    }
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
                    .onChange(of: reviewText) { newValue in
                        if newValue.count > 1000 {
                            reviewText = String(newValue.prefix(1000))
                        }
                    }

                    Text("\(reviewText.count)/1000")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .frame(maxWidth: .infinity, alignment: .trailing)
                }

                Spacer(minLength: 16)

                // MARK: - Save Button
                Button {
                    UINotificationFeedbackGenerator().notificationOccurred(.success)
                    onSave()
                } label: {
                    if isSaving {
                        HStack(spacing: 8) {
                            ProgressView()
                                .tint(.white)
                            Text("Saving...")
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                    } else {
                        Text("Save")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .frame(height: 50)
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(isSaving)

                // MARK: - Skip Review
                Button {
                    reviewText = ""
                    UINotificationFeedbackGenerator().notificationOccurred(.success)
                    onSave()
                } label: {
                    Text("Skip review")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .disabled(isSaving)
                .padding(.bottom, 16)
            }
            .padding(.horizontal)
        }
    }
}
