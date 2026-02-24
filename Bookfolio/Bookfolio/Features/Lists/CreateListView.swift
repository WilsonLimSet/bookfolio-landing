import SwiftUI

struct CreateListView: View {
    let onCreated: ((BookList) -> Void)?
    @EnvironmentObject var authService: AuthService
    @State private var name = ""
    @State private var listDescription = ""
    @State private var isPublic = true
    @State private var isSaving = false
    @Environment(\.dismiss) var dismiss

    var body: some View {
        Form {
            Section {
                TextField("List name", text: $name)
            }

            Section("Description") {
                TextEditor(text: $listDescription)
                    .frame(minHeight: 80)
            }

            Section {
                Toggle("Make public", isOn: $isPublic)
            }

            Section {
                Button {
                    saveList()
                } label: {
                    if isSaving {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                    } else {
                        Text("Create List")
                            .frame(maxWidth: .infinity)
                            .bold()
                    }
                }
                .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty || isSaving)
            }
        }
        .navigationTitle("New List")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func saveList() {
        guard case .authenticated(let user) = authService.state else { return }
        isSaving = true

        Task { @MainActor in
            do {
                let created = try await ListService.createList(
                    userId: user.id,
                    name: name.trimmingCharacters(in: .whitespaces),
                    description: listDescription.trimmingCharacters(in: .whitespaces).isEmpty ? nil : listDescription.trimmingCharacters(in: .whitespaces),
                    isPublic: isPublic
                )
                onCreated?(created)
                dismiss()
            } catch {
                isSaving = false
            }
        }
    }
}
