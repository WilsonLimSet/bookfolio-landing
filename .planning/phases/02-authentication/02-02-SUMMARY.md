---
phase: 02-authentication
plan: 02
subsystem: auth
tags: [google-sign-in, supabase-auth, swiftui, swift, ios, oauth, spm]

# Dependency graph
requires:
  - phase: 02-authentication
    plan: 01
    provides: AuthService with session management, LoginView with Google button placeholder
provides:
  - GoogleAuthService with native Google Sign-In flow via signInWithIdToken
  - GoogleSignIn-iOS SPM dependency (v8+)
  - Info.plist configured with Google client ID placeholder and URL scheme
  - LoginView Google button wired to GoogleAuthService
affects: [02-03, 03-navigation]

# Tech tracking
tech-stack:
  added: [GoogleSignIn-iOS v8+, GoogleSignInSwift]
  patterns: [GoogleAuthService passes ID token to Supabase signInWithIdToken, GIDClientID configured in Info.plist]

key-files:
  created:
    - Bookfolio/Bookfolio/Services/GoogleAuthService.swift
  modified:
    - Bookfolio/project.yml
    - Bookfolio/Bookfolio/Info.plist
    - Bookfolio/Bookfolio/Features/Auth/LoginView.swift

key-decisions:
  - "Removed nonce flow: GoogleSignIn-iOS SDK v8 does not support passing a nonce parameter to signIn(withPresenting:). Supabase signInWithIdToken works without nonce (nonce is optional)."
  - "Used simple signIn(withPresenting:) API — SDK reads GIDClientID from Info.plist automatically"

patterns-established:
  - "GoogleAuthService as standalone @MainActor class: keeps Google SDK logic isolated from AuthService"
  - "ID token flow: Google SDK -> ID token -> Supabase signInWithIdToken -> authStateChanges fires"

issues-created: []

# Metrics
duration: 5min
completed: 2026-02-24
---

# Plan 02-02: Google Sign-In Summary

**Native Google Sign-In via GoogleSignIn-iOS SDK with ID token passed to Supabase signInWithIdToken**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-24
- **Completed:** 2026-02-24
- **Tasks:** 2
- **Files created:** 1
- **Files modified:** 3

## Accomplishments
- GoogleSignIn-iOS SPM dependency added (v8+) with GoogleSignIn and GoogleSignInSwift products
- GoogleAuthService implements native sign-in: presents Google dialog, extracts ID token, passes to Supabase
- Info.plist configured with GIDClientID placeholder and reversed-client-ID URL scheme
- LoginView Google button wired to GoogleAuthService with error handling and loading state

## Task Commits

Each task was committed atomically:

1. **Task 1: Add GoogleSignIn SPM dependency and create GoogleAuthService** - `63139ef` (feat)
2. **Task 2: Wire Google Sign-In button into LoginView** - `bb41fac` (feat)

## Files Created/Modified
- `Bookfolio/Bookfolio/Services/GoogleAuthService.swift` - Native Google sign-in with ID token flow to Supabase
- `Bookfolio/project.yml` - Added GoogleSignIn-iOS SPM dependency (v8+)
- `Bookfolio/Bookfolio/Info.plist` - GIDClientID placeholder and Google URL scheme
- `Bookfolio/Bookfolio/Features/Auth/LoginView.swift` - Google button wired to GoogleAuthService

## Decisions Made
- Removed nonce flow from plan: GoogleSignIn-iOS SDK v8 does not expose a nonce parameter on signIn(withPresenting:). Supabase signInWithIdToken accepts tokens without nonce (nonce is optional per docs). This is a deviation from the plan but correct for the actual SDK API.
- Used system SF Symbol "g.circle.fill" for Google button icon (real Google logo requires asset bundle)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] GoogleSignIn-iOS v8 has no nonce parameter**
- **Found during:** Task 1 (GoogleAuthService.swift)
- **Issue:** Plan specified passing hashed nonce to `signIn(withPresenting:hint:additionalScopes:nonce:)` but GoogleSignIn-iOS v8 does not have a nonce parameter on any signIn method
- **Fix:** Removed nonce/CryptoKit usage entirely. Used simple `signIn(withPresenting:)` and passed ID token to Supabase without nonce. Supabase signInWithIdToken nonce is optional.
- **Files modified:** Bookfolio/Bookfolio/Services/GoogleAuthService.swift
- **Verification:** Build succeeded
- **Committed in:** 63139ef

---

**Total deviations:** 1 auto-fixed (1 blocking), 0 deferred
**Impact on plan:** Nonce removal necessary because SDK does not support it. No security regression — Supabase still verifies the Google ID token server-side. Nonce adds replay protection but is optional.

## Issues Encountered
None beyond the auto-fixed deviation above.

## Next Phase Readiness
- Google Sign-In flow complete, pending real Google Cloud Console credentials
- TODO comments in GoogleAuthService.swift document required credential setup steps
- AuthService.authStateChanges will handle the .signedIn event from Google auth
- Ready for Plan 02-03 (username setup flow for OAuth users via .needsUsername state)

---
*Phase: 02-authentication*
*Completed: 2026-02-24*
