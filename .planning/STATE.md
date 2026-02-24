# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-24)

**Core value:** The ranking flow must feel incredible on iOS — haptic feedback on every comparison, buttery spring animations, gesture-driven interactions.
**Current focus:** ALL PHASES COMPLETE — App ready for App Store submission

## Current Position

Phase: 7 complete (FINAL)
Plan: 07-04 complete
Status: All 7 phases complete
Last activity: 2026-02-24 — Lists, import, polish, App Store prep complete

Progress: ██████████ 100%

## Performance Metrics

**Velocity:**
- Total plans completed: 25
- Average duration: ~7min
- Total execution time: ~176min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 3/3 | 18min | 6min |
| 02-authentication | 3/3 | 21min | 7min |
| 03-feed-and-profile | 4/4 | ~30min | ~7.5min |
| 04-book-discovery | 3/3 | ~22min | ~7min |
| 05-ranking-flow | 4/4 | ~28min | ~7min |
| 06-social-notifications | 4/4 | ~28min | ~7min |
| 07-lists-import-polish | 4/4 | ~28min | ~7min |

**Recent Trend:**
- Last 5 plans: 06-04 (3min), 07-01 (5min), 07-02 (5min), 07-03 (5min), 07-04 (2min)
- Trend: Stable ~2-5min/plan

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Used xcodegen (project.yml) for Xcode project generation
- Global supabase singleton following supabase-swift docs pattern
- PKCE auth flow for mobile security
- Swift 6 with strict concurrency from start
- Used Double for Supabase numeric columns (score, bookScore)
- OLDescription uses singleValueContainer for polymorphic decoding
- Tables without id conform to Hashable instead of Identifiable
- TabRouters passed as @ObservedObject to tab views
- Tab enum with computed title/icon centralizes tab configuration
- ErrorCode static constants for Supabase auth error matching
- AuthService.AuthState includes .needsUsername for OAuth users
- iOS 16 compatible onChange(of:) with _ parameter
- GoogleSignIn-iOS v8 has no nonce parameter
- Apple Sign-In uses ASAuthorizationController delegate pattern bridged with CheckedContinuation
- Social-first auth UI: Apple + Google prominent, email collapsed
- Auth-state routing: BookfolioApp switches on AuthService.state
- FeedService uses private Decodable row types for lightweight Supabase query responses
- Review likes fetched separately and merged in Swift (no complex JOINs)
- Inner tab content uses Group+switch instead of nested TabView to avoid conflicts
- Tab caching via loadedTabs Set to avoid re-fetching on tab switch
- ProfileService uses static methods (no instance state needed)
- FollowWithProfile struct for Supabase foreign-key join queries
- Week streak calculated client-side from activity dates grouped by ISO week
- foregroundColor instead of foregroundStyle for ternary Color/HierarchicalShapeStyle compat
- Avatar upload: compress UIImage to JPEG (0.7) then upload to Supabase Storage with upsert
- NewFavoriteBook private Encodable struct for inserting favorites (avoids sending server-generated id)
- PhotosPicker with PhotosPickerItem.loadTransferable for iOS 16+ image selection
- Reading list routes: .readBooks, .currentlyReading, .wantToRead added to AppRoute
- OpenLibraryService uses enum with static methods (no instance state)
- Generic fetch<T: Decodable> helper for URLSession + JSONDecoder
- OLEdition has languages ([OLLanguageRef]?) and description (OLDescription?) fields
- OLSearchResult has coverEditionKey and editionCount for search sorting
- Nonfiction wins ties in detectCategory (OpenLibrary over-tags fiction)
- BookCoverView: reusable AsyncImage component with loading/fallback in SharedComponents
- Debounced search: cancel previous Task, sleep 300ms, then search
- User book query uses limit(1) + .first instead of maybeSingle()
- BookMetadata marked Sendable for Swift 6 strict concurrency
- Fire-and-forget closures use @Sendable for concurrency compliance
- BookActionService uses fire-and-forget for activity logging and want-to-read cleanup
- RankBookRPCParams private struct with p_-prefixed CodingKeys for Postgres RPC
- RankingService uses enum with static methods (consistent pattern)
- Binary search comparison within same tier only
- Haptic feedback: medium impact on comparisons, success notification on completion
- Spring animations: response 0.3, dampingFraction 0.7 for card selection
- 400ms delay between comparisons for animation
- Skip comparison places at middle position
- Category auto-detect skips category step entirely
- Empty tier skips compare step, calculates position directly
- Compact DatePicker style for review step
- TextEditor with placeholder overlay (no native placeholder support)
- CommentService uses enum with static methods + private CommentRow Decodable for joined query
- Comment notifications fire-and-forget only when commenter != review owner
- ReviewDetailView fetches userBook, profile, like status, like count separately
- Discover tab replaced Lists placeholder — renamed tab case from .lists to .discover
- UserSearchView debounced search (300ms) with ilike on username
- Suggested readers: top 12 most active users not already followed
- LeaderboardService aggregates liked books by open_library_key with majority-rules category
- Fiction wins ties in leaderboard category voting
- Rank badges: gold (#1), silver (#2), bronze (#3)
- PushNotificationService is a class (UNUserNotificationCenterDelegate requires NSObject)
- AppDelegate adapter via @UIApplicationDelegateAdaptor for device token handling
- Push permission requested after authentication via .task modifier
- device_tokens upsert uses try? (table may not exist yet)
- ListService uses enum with static methods + private Decodable row types for joined queries
- Lists accessed from Profile (not a tab) — .myLists, .createList, .browseLists routes
- ListDetailView uses NavigationLink(value:) for book navigation (no callbacks)
- Goodreads CSV import: custom parser handling quoted fields + escaped quotes
- Import score calculation: tier ranges (liked 6.7-10, fine 3.4-6.6, disliked 0-3.3)
- Import uses direct upsert (not rank_book RPC) with calculated scores
- OpenLibrary rate limited: 5 books/batch with 500ms delay
- AddToListSheet toggles books in/out of lists with haptic feedback
- Pull-to-refresh via .refreshable on Profile, Discover, Feed tabs
- Haptic feedback on like (.light), follow (.light), comment post (.success)
- PrivacyInfo.xcprivacy declares no tracking, collected data (email, userId, photos)
- NSPhotoLibraryUsageDescription in Info.plist for avatar upload

### Deferred Issues

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-24
Stopped at: ALL PHASES COMPLETE — app ready for App Store
Resume file: None
