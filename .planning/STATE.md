# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-24)

**Core value:** The ranking flow must feel incredible on iOS — haptic feedback on every comparison, buttery spring animations, gesture-driven interactions.
**Current focus:** Phase 3 complete — ready for Phase 4

## Current Position

Phase: 3 complete
Plan: 03-04 complete
Status: Ready to plan Phase 4
Last activity: 2026-02-24 — Phase 3 Feed & Profile complete

Progress: ██████░░░░ 40%

## Performance Metrics

**Velocity:**
- Total plans completed: 10
- Average duration: ~7min
- Total execution time: ~70min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 3/3 | 18min | 6min |
| 02-authentication | 3/3 | 21min | 7min |
| 03-feed-and-profile | 4/4 | ~30min | ~7.5min |

**Recent Trend:**
- Last 5 plans: 03-01 (8min), 03-02 (8min), 03-03 (5min), 03-04 (4min)
- Trend: Stable ~5-8min/plan

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

### Deferred Issues

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-24
Stopped at: Phase 3 complete, ready to plan Phase 4 (Book Discovery)
Resume file: None
