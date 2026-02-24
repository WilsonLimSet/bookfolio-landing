# Roadmap: Bookfolio iOS

## Overview

Build a native SwiftUI iOS app for Bookfolio that shares the existing Supabase backend with the web app. Start with project foundation and auth, build out the core screens (feed, profile, book detail), then tackle the crown jewel ranking flow, layer on social features with push notifications, and finish with lists, import, and App Store polish. The goal is Beli-level stickiness through native haptics, spring animations, and gesture-driven interactions.

## Domain Expertise

None

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Foundation** — Xcode project, supabase-swift SDK, Swift models, navigation shell
- [x] **Phase 2: Authentication** — Email/password, Google OAuth, Apple Sign-In, username setup, session persistence
- [ ] **Phase 3: Feed & Profile** — Feed tabs, profile screen, edit profile, read/reading/want lists
- [ ] **Phase 4: Book Discovery** — Search, book detail, edition picker, want-to-read/currently-reading
- [ ] **Phase 5: Ranking Flow** — Cover selection, category, tier, binary comparisons, review, save
- [ ] **Phase 6: Social & Notifications** — Follow, like, comment, push notifications, discover, leaderboard
- [ ] **Phase 7: Lists, Import & Polish** — Book lists, Goodreads import, haptics, offline caching, App Store prep

## Phase Details

### Phase 1: Foundation
**Goal**: Xcode project with supabase-swift SDK configured, Swift models for all 12 Supabase tables, and a tab-based navigation shell with placeholder screens
**Depends on**: Nothing (first phase)
**Research**: Likely (supabase-swift SDK setup patterns, SwiftUI app architecture for tab-based navigation)
**Research topics**: supabase-swift SDK initialization, Swift Codable models for Supabase tables, SwiftUI NavigationStack patterns, keychain token storage
**Plans**: 3 plans

Plans:
- [ ] 01-01: Xcode project scaffold with SPM dependencies (supabase-swift, etc.)
- [ ] 01-02: Swift models for all Supabase tables + OpenLibrary API types
- [ ] 01-03: Tab bar navigation shell with placeholder screens and routing

### Phase 2: Authentication
**Goal**: Complete auth flow — email/password sign-in/sign-up, Google OAuth via ASWebAuthenticationSession, post-OAuth username setup, persistent sessions
**Depends on**: Phase 1
**Research**: Likely (supabase-swift auth API, ASWebAuthenticationSession for OAuth, deep link handling)
**Research topics**: supabase-swift Auth.signIn/signUp/signInWithOAuth, ASWebAuthenticationSession setup, URL scheme configuration, session persistence across app launches
**Plans**: 3 plans

Plans:
- [ ] 02-01: Email/password sign-in and sign-up with validation
- [ ] 02-02: Google OAuth via ASWebAuthenticationSession with callback handling
- [ ] 02-03: Username setup flow (post-OAuth) and session persistence

### Phase 3: Feed & Profile
**Goal**: Three-tab feed (friends/you/incoming), full profile screen with stats/favorites/streak, profile edit with avatar upload, and read/reading/want-to-read list screens
**Depends on**: Phase 2
**Research**: Unlikely (standard SwiftUI views using Supabase patterns from Phase 1-2)
**Plans**: 4 plans

Plans:
- [ ] 03-01: Feed screen with three tabs (friends activity, your activity, incoming notifications)
- [ ] 03-02: Profile screen with stats, favorites, streak, reading goal
- [ ] 03-03: Profile edit — bio, avatar upload, reading goal, favorites, social links
- [ ] 03-04: Read, currently reading, and want-to-read list screens

### Phase 4: Book Discovery
**Goal**: Book search via OpenLibrary API, book detail screen with description/editions/actions, want-to-read and currently-reading toggle buttons
**Depends on**: Phase 3
**Research**: Unlikely (HTTP calls to OpenLibrary, reusing web app's API patterns)
**Plans**: 3 plans

Plans:
- [ ] 04-01: OpenLibrary API service (search, details, editions, category detection)
- [ ] 04-02: Book detail screen with description, editions, author info
- [ ] 04-03: Want-to-read and currently-reading action buttons with activity logging

### Phase 5: Ranking Flow
**Goal**: The crown jewel — full-screen ranking experience: cover selection from editions, category picker, tier selection, binary comparison with haptics and spring animations, optional review, atomic save via rank_book RPC
**Depends on**: Phase 4
**Research**: Unlikely (pure SwiftUI — gestures, animations, haptics are built-in APIs)
**Plans**: 4 plans

Plans:
- [ ] 05-01: Cover selection step with edition grid
- [ ] 05-02: Category detection + tier selection steps
- [ ] 05-03: Binary comparison step with haptic feedback and spring animations
- [ ] 05-04: Review step + save via rank_book RPC with activity logging

### Phase 6: Social & Notifications
**Goal**: Follow/unfollow, review likes, comment threads, push notifications via APNs, discover users screen, leaderboard
**Depends on**: Phase 5
**Research**: Likely (APNs setup, Supabase Edge Functions or database webhooks for push triggers)
**Research topics**: APNs certificate/key setup, device token registration, Supabase Edge Functions for push delivery, notification permission flow
**Plans**: 4 plans

Plans:
- [ ] 06-01: Follow button, like button, comment section
- [ ] 06-02: Discover users screen (search + suggested)
- [ ] 06-03: Leaderboard screen (top fiction, nonfiction, most active)
- [ ] 06-04: Push notifications — APNs setup, token registration, notification handling

### Phase 7: Lists, Import & Polish
**Goal**: Book lists CRUD, Goodreads CSV import wizard, haptic feedback polish everywhere, offline caching, deep linking, and App Store submission prep
**Depends on**: Phase 6
**Research**: Likely (CSV parsing in Swift, App Store review guidelines, deep link / universal link setup)
**Research topics**: Swift CSV parsing libraries or manual parsing, App Store Connect setup, universal links configuration, privacy labels, App Tracking Transparency
**Plans**: 4 plans

Plans:
- [ ] 07-01: Book lists — browse, create, edit, add/remove books
- [ ] 07-02: Goodreads CSV import wizard (multi-step: upload → match → categorize → rank → import)
- [ ] 07-03: Polish — haptic feedback on all interactions, pull-to-refresh, offline caching
- [ ] 07-04: App Store prep — icons, screenshots, privacy labels, submission

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | 2026-02-24 |
| 2. Authentication | 3/3 | Complete | 2026-02-24 |
| 3. Feed & Profile | 0/4 | Not started | - |
| 4. Book Discovery | 0/3 | Not started | - |
| 5. Ranking Flow | 0/4 | Not started | - |
| 6. Social & Notifications | 0/4 | Not started | - |
| 7. Lists, Import & Polish | 0/4 | Not started | - |
