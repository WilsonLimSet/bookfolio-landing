# 05-01 Summary: RankingFlowView Shell, RankingService, CoverSelectionStep

## Status: COMPLETE

## What Was Built

### RankingService (`Bookfolio/Bookfolio/Services/RankingService.swift`)
- `RankingStep` enum: `.cover`, `.category`, `.tier`, `.compare`, `.review`, `.saving`
- `prefetchUserBooks(userId:)` — fetches fiction and nonfiction user_books in parallel, returns `[String: [UserBook]]`
- `rankBook(...)` — calls `rank_book` RPC with `p_`-prefixed params via private `RankBookRPCParams` struct, returns score as `Double`
- `logRankingActivity(...)` — inserts `NewActivity` with `.ranked` action type, book score, and category

### RankingFlowView (`Bookfolio/Bookfolio/Features/Ranking/RankingFlowView.swift`)
- Multi-step container with progress bar (`ProgressView`) and step switching via `RankingStep`
- All state variables: `currentStep`, `selectedCover`, `category`, `tier`, `userBooksCache`, `finalPosition`, `reviewText`, `finishedAt`, `editions`, etc.
- Navigation helpers: `goToStep(_:)`, `goBack()`, `goForward()` with animation
- `.task` data loading: editions fetch, user books prefetch, category auto-detection (all in parallel)
- Pre-fills `selectedCover` from `coverUrl` parameter; pre-fills category/tier from `existingEntry` when re-ranking
- Filters current book from `userBooksCache` by `openLibraryKey`
- `existingEntry` parameter defaults to `nil` for clean call sites
- Cover step wired to `CoverSelectionStep`; other steps show placeholder views

### CoverSelectionStep (`Bookfolio/Bookfolio/Features/Ranking/CoverSelectionStep.swift`)
- 3-column `LazyVGrid` edition grid using `BookCoverView` (100x150)
- Blue border (3pt) and checkmark overlay on selected edition
- Loading state with `ProgressView`, empty state with icon
- "Next" button disabled when no cover selected
- Follows existing `EditionPickerView` grid pattern

### Route Wiring (`Bookfolio/Bookfolio/Navigation/RouteDestination.swift`)
- `.rankBook` case now navigates to `RankingFlowView` instead of placeholder

### Xcode Project (`Bookfolio/Bookfolio.xcodeproj/project.pbxproj`)
- Added all 3 new Swift files to project with proper group structure
- New `Ranking` group under `Features`
- `RankingService.swift` added to `Services` group

## Files Created
- `Bookfolio/Bookfolio/Services/RankingService.swift`
- `Bookfolio/Bookfolio/Features/Ranking/RankingFlowView.swift`
- `Bookfolio/Bookfolio/Features/Ranking/CoverSelectionStep.swift`

## Files Modified
- `Bookfolio/Bookfolio/Navigation/RouteDestination.swift`
- `Bookfolio/Bookfolio.xcodeproj/project.pbxproj`

## Decisions Made
1. **Separate RPC params struct**: Created private `RankBookRPCParams` with `p_` prefixed CodingKeys to match the Postgres function signature, rather than modifying the existing `RankBookParams` which uses different key names.
2. **Default nil for existingEntry**: Made `existingEntry` default to `nil` to avoid type inference issues at call sites and keep the route wiring clean.
3. **RPC response handling**: Used `.single().execute().value` with a `RankBookResult` struct to decode the `{ score: Double }` response from the RPC.
4. **MainActor.run for state updates**: Used explicit `MainActor.run` blocks in async data loading methods to safely update `@State` properties.

## Verification
```
xcodebuild build → BUILD SUCCEEDED
```

## Commits
1. `357ff85` — `feat(05-01): Create RankingService and RankingFlowView shell`
2. `b3ca9ab` — `feat(05-01): Create CoverSelectionStep and wire .rankBook route`
