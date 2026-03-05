# 05-02 Summary: CategoryStep and TierStep

## What Was Built

### CategoryStep (`Bookfolio/Bookfolio/Features/Ranking/CategoryStep.swift`)
- Two distinct layouts based on whether category was auto-detected:
  - **Auto-detected layout**: Shows "We detected this as [Category]" with two pill-style toggle buttons (Fiction/Nonfiction) and a hint that the user can change it
  - **Manual selection layout**: Two large card-style buttons with icons, titles, and subtitles (Fiction: book.fill, Nonfiction: text.book.closed.fill)
- Selected state visual feedback: filled background with white text and checkmark
- "Next" button disabled until a category is selected

### TierStep (`Bookfolio/Bookfolio/Features/Ranking/TierStep.swift`)
- Three tier buttons with distinct colors:
  - "Liked it" (green, hand.thumbsup.fill)
  - "It was fine" (yellow, minus.circle.fill)
  - "Didn't like it" (red, hand.thumbsdown.fill)
- Each button shows icon, title, and subtitle in a card layout
- Haptic feedback via `UIImpactFeedbackGenerator(style: .medium)` on selection
- Selection immediately triggers `onSelect` callback (no separate Next button needed)

### RankingFlowView Updates (`Bookfolio/Bookfolio/Features/Ranking/RankingFlowView.swift`)
- Replaced placeholder views for `.category` and `.tier` steps with real components
- **Skip-category logic**: Cover step's onNext checks `categoryAutoDetected && category != nil` to skip directly to tier
- **Empty-tier logic** in `handleTierSelection`: If no books exist in the selected tier, calculates `finalPosition` from higher-tier book count + 1 and skips to `.review`
- **Back navigation**: Updated `goBack()` to skip category step when going back from tier if category was auto-detected

## Files Created
- `Bookfolio/Bookfolio/Features/Ranking/CategoryStep.swift`
- `Bookfolio/Bookfolio/Features/Ranking/TierStep.swift`

## Files Modified
- `Bookfolio/Bookfolio/Features/Ranking/RankingFlowView.swift`
- `Bookfolio/Bookfolio.xcodeproj/project.pbxproj` (added new files to project)

## Decisions Made
- Used `minus.circle.fill` for the "fine" tier icon instead of `hand.raised.fill` (more intuitive for a neutral/mediocre rating)
- TierStep has no separate "Next" button — selecting a tier immediately triggers navigation (matching the decisive nature of the action)
- Card-style buttons match the visual language of CoverSelectionStep for consistency
- Used `foregroundColor` throughout (not `foregroundStyle`) for iOS 16 compatibility

## Verification
- `xcodebuild` build: **SUCCEEDED**
- CategoryStep compiles with both auto-detected and manual layouts
- TierStep compiles with three visual tier buttons and haptic feedback
- Auto-detected category skips category step (cover -> tier)
- Empty tier skips compare step (tier -> review with calculated position)
- Back navigation handles skip-category correctly
