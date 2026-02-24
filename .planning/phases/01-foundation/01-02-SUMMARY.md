---
phase: 01-foundation
plan: 02
subsystem: database
tags: [swift, codable, supabase, openlibrary, models]

# Dependency graph
requires:
  - phase: none
    provides: database schema from existing web app
provides:
  - 13 Codable Swift structs mapping all Supabase tables
  - OpenLibrary API response types with custom decoding
  - Swift enums for constrained database columns (BookCategory, BookTier, ActionType, NotificationType)
  - Insert/update structs (ProfileUpdate, RankBookParams, NewActivity, NewNotification)
affects: [01-foundation, 02-core-services, 03-ranking-engine]

# Tech tracking
tech-stack:
  added: []
  patterns: [CodingKeys snake_case mapping, custom Codable for polymorphic JSON]

key-files:
  created:
    - Bookfolio/Bookfolio/Models/Profile.swift
    - Bookfolio/Bookfolio/Models/UserBook.swift
    - Bookfolio/Bookfolio/Models/Follow.swift
    - Bookfolio/Bookfolio/Models/Notification.swift
    - Bookfolio/Bookfolio/Models/ReviewLike.swift
    - Bookfolio/Bookfolio/Models/ReviewComment.swift
    - Bookfolio/Bookfolio/Models/WantToRead.swift
    - Bookfolio/Bookfolio/Models/CurrentlyReading.swift
    - Bookfolio/Bookfolio/Models/FavoriteBook.swift
    - Bookfolio/Bookfolio/Models/Activity.swift
    - Bookfolio/Bookfolio/Models/Referral.swift
    - Bookfolio/Bookfolio/Models/BookList.swift
    - Bookfolio/Bookfolio/Models/BookListItem.swift
    - Bookfolio/Bookfolio/Models/OpenLibraryTypes.swift
  modified: []

key-decisions:
  - "Used Double for score/bookScore fields (Supabase numeric maps to Swift Double)"
  - "OLDescription uses singleValueContainer for polymorphic decoding (string vs object)"
  - "Tables without id (Follow, ReviewLike, WantToRead, CurrentlyReading) conform to Hashable instead of Identifiable"

patterns-established:
  - "CodingKeys enum for snake_case DB columns to camelCase Swift properties"
  - "Separate Encodable structs for insert/update operations (omit server-generated fields)"
  - "Swift enums with String raw values for constrained text columns"

issues-created: []

# Metrics
duration: 5min
completed: 2026-02-24
---

# Plan 02: Swift Models Summary

**14 Codable Swift models covering all 13 Supabase tables and OpenLibrary API response types with snake_case mapping and custom polymorphic decoding**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-24
- **Completed:** 2026-02-24
- **Tasks:** 2
- **Files created:** 14

## Accomplishments
- Created 13 Swift structs matching all Supabase database tables with exact column name mapping
- Defined 4 Swift enums for constrained text columns (BookCategory, BookTier, ActionType, NotificationType)
- Created 4 insert/update helper structs (ProfileUpdate, RankBookParams, NewActivity, NewNotification)
- Built OpenLibrary API response types with custom Codable for polymorphic description field
- Added cover URL helper extension on Int for building OpenLibrary cover image URLs

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Supabase table models** - `c20b16a` (feat)
2. **Task 2: Create OpenLibrary API response types** - `437e4b6` (feat)

## Files Created/Modified
- `Bookfolio/Bookfolio/Models/Profile.swift` - Profile + ProfileUpdate
- `Bookfolio/Bookfolio/Models/UserBook.swift` - UserBook + BookCategory/BookTier enums + RankBookParams
- `Bookfolio/Bookfolio/Models/Follow.swift` - Follow (Hashable, no id)
- `Bookfolio/Bookfolio/Models/Notification.swift` - Notification + NotificationType enum + NewNotification
- `Bookfolio/Bookfolio/Models/ReviewLike.swift` - ReviewLike (Hashable, no id)
- `Bookfolio/Bookfolio/Models/ReviewComment.swift` - ReviewComment
- `Bookfolio/Bookfolio/Models/WantToRead.swift` - WantToRead (Hashable, no id)
- `Bookfolio/Bookfolio/Models/CurrentlyReading.swift` - CurrentlyReading (Hashable, no id)
- `Bookfolio/Bookfolio/Models/FavoriteBook.swift` - FavoriteBook
- `Bookfolio/Bookfolio/Models/Activity.swift` - Activity + ActionType enum + NewActivity
- `Bookfolio/Bookfolio/Models/Referral.swift` - Referral
- `Bookfolio/Bookfolio/Models/BookList.swift` - BookList
- `Bookfolio/Bookfolio/Models/BookListItem.swift` - BookListItem
- `Bookfolio/Bookfolio/Models/OpenLibraryTypes.swift` - All OpenLibrary API types

## Decisions Made
- Used `Double` for Supabase `numeric` columns (score, bookScore) since Swift lacks a native Decimal Codable that maps cleanly
- OLDescription uses `singleValueContainer` decoding to handle both `"string"` and `{"type": "...", "value": "string"}` OpenLibrary formats
- Tables without a primary `id` column conform to `Hashable` instead of `Identifiable` for SwiftUI compatibility

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
None

## Next Phase Readiness
- All model types ready for use by Supabase client service layer
- Enums and CodingKeys ensure type-safe database queries
- Insert/update structs ready for write operations

---
*Phase: 01-foundation*
*Completed: 2026-02-24*
