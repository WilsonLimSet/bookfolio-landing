import Foundation

// MARK: - Search API

struct OLSearchResponse: Codable {
    let docs: [OLSearchResult]
}

struct OLSearchResult: Codable, Identifiable {
    var id: String { key }
    let key: String
    let title: String
    let authorName: [String]?
    let coverId: Int?
    let firstPublishYear: Int?
    let numberOfPagesMedian: Int?
    let subject: [String]?

    enum CodingKeys: String, CodingKey {
        case key, title, subject
        case authorName = "author_name"
        case coverId = "cover_i"
        case firstPublishYear = "first_publish_year"
        case numberOfPagesMedian = "number_of_pages_median"
    }
}

// MARK: - Work API

struct OLWork: Codable {
    let key: String
    let title: String
    let description: OLDescription?
    let covers: [Int]?
    let subjects: [String]?
    let authors: [OLAuthorRef]?
}

struct OLAuthorRef: Codable {
    let author: OLAuthorKey
}

struct OLAuthorKey: Codable {
    let key: String
}

/// OpenLibrary descriptions can be either a plain string or an object with a `value` field.
/// This enum handles both formats with custom Codable implementation.
enum OLDescription: Codable {
    case string(String)
    case object(OLDescriptionObject)

    var text: String {
        switch self {
        case .string(let value):
            return value
        case .object(let obj):
            return obj.value
        }
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let stringValue = try? container.decode(String.self) {
            self = .string(stringValue)
        } else if let objectValue = try? container.decode(OLDescriptionObject.self) {
            self = .object(objectValue)
        } else {
            throw DecodingError.typeMismatch(
                OLDescription.self,
                DecodingError.Context(
                    codingPath: decoder.codingPath,
                    debugDescription: "Expected String or OLDescriptionObject"
                )
            )
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value):
            try container.encode(value)
        case .object(let obj):
            try container.encode(obj)
        }
    }
}

struct OLDescriptionObject: Codable {
    let type: String?
    let value: String
}

// MARK: - Edition API

struct OLEditionsResponse: Codable {
    let entries: [OLEdition]
}

struct OLEdition: Codable, Identifiable {
    var id: String { key }
    let key: String
    let title: String?
    let covers: [Int]?
    let publishers: [String]?
    let publishDate: String?
    let isbn13: [String]?
    let isbn10: [String]?
    let numberOfPages: Int?

    enum CodingKeys: String, CodingKey {
        case key, title, covers, publishers
        case publishDate = "publish_date"
        case isbn13 = "isbn_13"
        case isbn10 = "isbn_10"
        case numberOfPages = "number_of_pages"
    }
}

// MARK: - Author API

struct OLAuthor: Codable {
    let name: String?
    let bio: OLDescription?
    let birthDate: String?
    let photos: [Int]?

    enum CodingKeys: String, CodingKey {
        case name, bio, photos
        case birthDate = "birth_date"
    }
}

// MARK: - Cover URL Helper

enum OLCoverSize: String {
    case small = "S"
    case medium = "M"
    case large = "L"
}

extension Int {
    func openLibraryCoverURL(size: OLCoverSize = .large) -> URL? {
        URL(string: "https://covers.openlibrary.org/b/id/\(self)-\(size.rawValue).jpg")
    }
}
