import SwiftUI
import UniformTypeIdentifiers

// MARK: - Import Step

private enum ImportStep: Int, CaseIterable {
    case upload = 1
    case matching = 2
    case review = 3
    case importing = 4
    case done = 5

    var label: String {
        switch self {
        case .upload: return "Upload"
        case .matching: return "Matching"
        case .review: return "Review"
        case .importing: return "Importing"
        case .done: return "Done"
        }
    }
}

// MARK: - GoodreadsImportView

struct GoodreadsImportView: View {
    @EnvironmentObject var authService: AuthService
    @Environment(\.dismiss) var dismiss

    @State private var step: ImportStep = .upload
    @State private var parsedBooks: [GoodreadsBook] = []
    @State private var matchedBooks: [MatchedBook] = []
    @State private var progress = 0
    @State private var totalToImport = 0
    @State private var importedCount = 0
    @State private var showFilePicker = false
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Step indicator
                stepIndicator

                // Step content
                switch step {
                case .upload:
                    uploadStep
                case .matching:
                    matchingStep
                case .review:
                    reviewStep
                case .importing:
                    importingStep
                case .done:
                    doneStep
                }
            }
            .padding()
        }
        .navigationTitle("Import from Goodreads")
        .navigationBarTitleDisplayMode(.inline)
        .fileImporter(
            isPresented: $showFilePicker,
            allowedContentTypes: [UTType.commaSeparatedText],
            allowsMultipleSelection: false
        ) { result in
            handleFileSelection(result)
        }
    }

    // MARK: - Step Indicator

    private var stepIndicator: some View {
        HStack(spacing: 4) {
            ForEach(ImportStep.allCases, id: \.rawValue) { s in
                Circle()
                    .fill(s.rawValue <= step.rawValue ? Color.accentColor : Color(.systemGray4))
                    .frame(width: 8, height: 8)
            }
        }
        .padding(.top, 8)
    }

    // MARK: - Upload Step

    private var uploadStep: some View {
        VStack(spacing: 20) {
            Image(systemName: "doc.text")
                .font(.system(size: 48))
                .foregroundColor(.accentColor)

            Text("Export your Goodreads library as CSV")
                .font(.title3.bold())
                .multilineTextAlignment(.center)

            VStack(alignment: .leading, spacing: 12) {
                instructionRow(number: 1, text: "Go to goodreads.com/review/import")
                instructionRow(number: 2, text: "Click \"Export Library\"")
                instructionRow(number: 3, text: "Upload the CSV file here")
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)

            if let errorMessage {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundColor(.red)
                    .multilineTextAlignment(.center)
            }

            Button {
                showFilePicker = true
            } label: {
                HStack {
                    Image(systemName: "doc.badge.plus")
                    Text("Choose CSV File")
                }
                .font(.headline)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.accentColor)
                .cornerRadius(12)
            }
        }
    }

    private func instructionRow(number: Int, text: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Text("\(number)")
                .font(.caption.bold())
                .foregroundColor(.white)
                .frame(width: 24, height: 24)
                .background(Color.accentColor)
                .clipShape(Circle())

            Text(text)
                .font(.subheadline)
        }
    }

    // MARK: - Matching Step

    private var matchingStep: some View {
        VStack(spacing: 20) {
            ProgressView()
                .scaleEffect(1.5)

            Text("Matching \(parsedBooks.count) books with Open Library...")
                .font(.headline)
                .multilineTextAlignment(.center)

            Text("\(progress) of \(parsedBooks.count) matched")
                .font(.subheadline)
                .foregroundColor(.secondary)

            ProgressView(value: Double(progress), total: Double(max(parsedBooks.count, 1)))
                .tint(.accentColor)
                .padding(.horizontal, 40)
        }
        .padding(.top, 40)
        .task {
            await startMatching()
        }
    }

    // MARK: - Review Step

    private var reviewStep: some View {
        VStack(spacing: 16) {
            let importable = matchedBooks.filter { $0.openLibraryKey != nil }
            let fictionCount = importable.filter { $0.category == .fiction }.count
            let nonfictionCount = importable.filter { $0.category == .nonfiction }.count

            Text("Found \(matchedBooks.count) books")
                .font(.title3.bold())

            HStack(spacing: 16) {
                Label("\(fictionCount) Fiction", systemImage: "book.closed")
                    .font(.subheadline)
                    .foregroundColor(.blue)
                Label("\(nonfictionCount) Nonfiction", systemImage: "text.book.closed")
                    .font(.subheadline)
                    .foregroundColor(.orange)
            }

            // Grouped by rating
            LazyVStack(spacing: 0) {
                ForEach([5, 4, 3, 2, 1], id: \.self) { rating in
                    let booksForRating = matchedBooks.filter { $0.rating == rating }
                    if !booksForRating.isEmpty {
                        Section {
                            ForEach(booksForRating) { book in
                                importBookRow(book)
                            }
                        } header: {
                            HStack {
                                Text("\(rating) Star\(rating == 1 ? "" : "s")")
                                    .font(.subheadline.bold())
                                Text("(\(booksForRating.count))")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                Spacer()
                            }
                            .padding(.vertical, 8)
                            .padding(.top, rating == 5 ? 0 : 8)
                        }
                    }
                }
            }

            Button {
                startImporting()
            } label: {
                Text("Import \(importable.count) Books")
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(importable.isEmpty ? Color.gray : Color.accentColor)
                    .cornerRadius(12)
            }
            .disabled(importable.isEmpty)
        }
    }

    private func importBookRow(_ book: MatchedBook) -> some View {
        HStack(spacing: 12) {
            // Cover thumbnail
            if let coverUrl = book.coverUrl, let url = URL(string: coverUrl) {
                AsyncImage(url: url) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    Color(.systemGray5)
                }
                .frame(width: 40, height: 60)
                .cornerRadius(4)
            } else {
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color(.systemGray5))
                    .frame(width: 40, height: 60)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(book.title)
                    .font(.subheadline)
                    .lineLimit(1)
                Text(book.author)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(1)
            }

            Spacer()

            if book.openLibraryKey != nil {
                Text(book.category == .fiction ? "Fiction" : "Nonfiction")
                    .font(.caption2)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(book.category == .fiction ? Color.blue.opacity(0.15) : Color.orange.opacity(0.15))
                    .foregroundColor(book.category == .fiction ? .blue : .orange)
                    .cornerRadius(4)
            } else {
                Text("Not found")
                    .font(.caption2)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color(.systemGray5))
                    .foregroundColor(.secondary)
                    .cornerRadius(4)
            }
        }
        .padding(.vertical, 6)
        .opacity(book.openLibraryKey != nil ? 1.0 : 0.5)
    }

    // MARK: - Importing Step

    private var importingStep: some View {
        VStack(spacing: 20) {
            ProgressView()
                .scaleEffect(1.5)

            Text("Importing books...")
                .font(.headline)

            Text("\(importedCount) of \(totalToImport)")
                .font(.subheadline)
                .foregroundColor(.secondary)

            ProgressView(value: Double(importedCount), total: Double(max(totalToImport, 1)))
                .tint(.accentColor)
                .padding(.horizontal, 40)
        }
        .padding(.top, 40)
    }

    // MARK: - Done Step

    private var doneStep: some View {
        VStack(spacing: 20) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 64))
                .foregroundColor(.green)

            Text("Successfully imported \(importedCount) books!")
                .font(.title3.bold())
                .multilineTextAlignment(.center)

            Button {
                dismiss()
            } label: {
                Text("Done")
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.accentColor)
                    .cornerRadius(12)
            }
        }
        .padding(.top, 40)
    }

    // MARK: - Actions

    private func handleFileSelection(_ result: Result<[URL], Error>) {
        switch result {
        case .success(let urls):
            guard let url = urls.first else { return }

            guard url.startAccessingSecurityScopedResource() else {
                errorMessage = "Unable to access the file. Please try again."
                return
            }
            defer { url.stopAccessingSecurityScopedResource() }

            do {
                let text = try String(contentsOf: url, encoding: .utf8)
                let books = ImportService.parseGoodreadsCSV(text)
                if books.isEmpty {
                    errorMessage = "No rated books found in the CSV. Make sure the file contains books with ratings."
                    return
                }
                parsedBooks = books
                errorMessage = nil
                step = .matching
            } catch {
                errorMessage = "Failed to read the file. Please make sure it's a valid CSV."
            }

        case .failure:
            errorMessage = "Failed to select file. Please try again."
        }
    }

    private func startMatching() async {
        let books = parsedBooks
        let matched = await ImportService.matchBooks(books) { count in
            Task { @MainActor in
                progress = count
            }
        }
        matchedBooks = matched
        step = .review
    }

    private func startImporting() {
        guard case .authenticated(let user) = authService.state else { return }

        let importData = ImportService.calculateImportData(matchedBooks)
        let importable = importData.filter { $0.book.openLibraryKey != nil }
        totalToImport = importable.count
        step = .importing

        Task {
            await ImportService.importBooks(userId: user.id, books: importable) { count in
                Task { @MainActor in
                    importedCount = count
                }
            }
            await MainActor.run {
                step = .done
            }
        }
    }
}
