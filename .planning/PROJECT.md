# Bookfolio iOS

## What This Is

A native SwiftUI iOS app for Bookfolio — a social book ranking platform where users rank books through head-to-head comparisons, build curated reading profiles, and follow friends' reading activity. Shares the same Supabase backend as the existing Next.js web app. Targets the polish and stickiness of Beli.

## Core Value

The ranking flow must feel incredible on iOS — haptic feedback on every comparison, buttery spring animations, gesture-driven interactions. This is what makes the app addictive.

## Requirements

### Validated

- ✓ Supabase backend with auth, database, storage, RPC functions — existing
- ✓ OpenLibrary API integration for book search, details, editions — existing
- ✓ Google Books API fallback for descriptions — existing
- ✓ Database schema: profiles, user_books, follows, notifications, review_likes, review_comments, want_to_read, currently_reading, favorite_books, activity, referrals, book_lists, book_list_items — existing
- ✓ RPC: `rank_book()` (atomic rank insert with score recalculation), `get_user_book_rank()` — existing
- ✓ Auth: Email/password + Google OAuth with username setup flow — existing
- ✓ Storage: avatars bucket with public URLs — existing

### Active

- [ ] SwiftUI app scaffold with supabase-swift SDK integration
- [ ] Auth flows: email/password sign-in/sign-up, Google OAuth, username setup
- [ ] Feed with 3 tabs: Friends activity, Your activity, Incoming notifications
- [ ] Book search via OpenLibrary API
- [ ] Book detail screen: description, editions, rank/want-to-read/currently-reading actions
- [ ] Ranking flow: cover selection → category → tier → binary comparisons → review → save (the crown jewel)
- [ ] Profile screen: stats, favorites, streak, reading goal, follow/unfollow
- [ ] Profile edit: bio, avatar upload, reading goal, favorites management, social links
- [ ] Read/Reading/Want-to-Read list screens
- [ ] Discover users screen: search + suggested users
- [ ] Leaderboard: top fiction, nonfiction, most active
- [ ] Book lists: browse, create, edit, add/remove books
- [ ] Review detail: full review, likes, comments
- [ ] Goodreads CSV import flow (multi-step wizard)
- [ ] Push notifications (APNs) for follows, likes, comments, friend rankings
- [ ] Haptic feedback on all meaningful interactions (rank, like, follow)
- [ ] Pull-to-refresh everywhere
- [ ] Offline caching for profile and feed data
- [ ] Custom tab bar with personality
- [ ] Share profile (link out to web share page or native share sheet)
- [ ] Deep linking support (book, profile, review URLs)

### Out of Scope

- Blog pages — web-only SEO content, no value on mobile
- Privacy/Terms pages — link to web versions (required for App Store, but rendered in Safari/WebView)
- OG image generation — server-side feature, stays on web
- SEO/sitemap — not applicable to native iOS
- Service worker / PWA — web-only concept
- Goodreads import via web redirect — import natively in-app instead

## Context

- Existing web app: Next.js 16 App Router deployed on Vercel
- Existing Supabase project with full schema, RLS policies, and RPC functions
- Apple Developer account active ($99/year)
- iOS app will be a separate Xcode project, NOT in the web repo
- Both web and iOS are clients to the same Supabase backend
- No real-time subscriptions on web — iOS can add them later but not required for v1
- Beli app is the UX benchmark: social feed stickiness, ranking satisfaction, profile-as-identity
- The ranking flow (binary comparison with binary search positioning) is the most complex feature and the core differentiator

## Constraints

- **Platform**: iOS 16+ minimum (one extra year of device support for wider reach)
- **Language**: Swift 6 + SwiftUI
- **Backend**: supabase-swift SDK (must use existing Supabase project, no schema changes)
- **Auth**: Must support same providers (email/password + Google OAuth) and share sessions conceptually (same user accounts)
- **Data**: All data mutations must go through existing RPC functions where they exist (`rank_book`) to maintain consistency
- **App Store**: Must comply with Apple review guidelines (privacy labels, App Tracking Transparency if analytics added)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| SwiftUI over React Native | Best native feel, Beli-level polish requires native animations and haptics | — Pending |
| iOS 16+ minimum | Wider device reach while still supporting modern SwiftUI features | — Pending |
| Separate Xcode project (not monorepo) | Clean separation, no web build interference, standard iOS development | — Pending |
| Full feature parity (minus blog/SEO) | Users should never need to "go to the website" for core features | — Pending |
| Push notifications via APNs | Key stickiness driver that web app lacks | — Pending |

---
*Last updated: 2026-02-24 after initialization*
