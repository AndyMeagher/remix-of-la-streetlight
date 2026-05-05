## Goal
Reduce `BottomNav` from 9 tabs to 6 without losing access to any category. Combine related categories into grouped landing screens that show sub-sections.

## Current tabs (9)
Home · Shelters · AB12 · Food · Drop-in · Tips · Medical · Safe Choices · SOS

## Proposed tabs (6)

1. **Home** — unchanged
2. **Housing** — combines **Shelters + AB12 (transitional)**. One screen with two segmented sections ("Shelters" / "AB12 Transitional"). These are both "places to sleep / live" so they belong together.
3. **Food & Drop-in** (label: **"Food"** with Drop-in inside, or **"Daily"**) — combines **Food + Drop-in** as you suggested. Drop-in centers often serve meals, so they pair naturally. Segmented control inside: Meals / Drop-in Centers.
4. **Health** — combines **Medical + Safe Choices (anti-trafficking)**. Both are sensitive, body/safety-related support. Segmented inside: Medical / Safe Choices. (Safe Choices keeps its own description banner so it stays discoverable.)
5. **Tips** — unchanged (community feed is distinct)
6. **SOS** — unchanged (must stay one tap, red, always visible)

That's 6 tabs, no category lost.

### Alternative groupings (if you prefer different combos)
- Move **Tips** into Home as a top section, and keep **Safe Choices** as its own tab. (Less ideal — Tips is high-engagement and benefits from its own tab.)
- Combine **AB12 + Safe Choices** under a "Youth Support" tab. (Weaker fit — they serve different needs.)

I'd recommend the main proposal above.

## Implementation (technical)

- **`src/components/BottomNav.tsx`**: reduce `tabs` array to the 6 above. Pick icons:
  - Housing → `Bed` (or `Home` swap; keep `Home` icon for Home tab — use `Building2` for Housing)
  - Food → `UtensilsCrossed`
  - Health → `Heart`
  - Tips → `MessageSquare`
  - SOS → `ShieldAlert`
- **`src/pages/Index.tsx`**:
  - Replace individual tab IDs (`shelters`, `transitional`, `food`, `dropin`, `medical`, `getout`) with grouped IDs (`housing`, `daily`, `health`).
  - Build a small grouped renderer that uses the existing `Tabs` component (`@/components/ui/tabs`) to switch between sub-categories inside each grouped screen, reusing `ResourceCard` and the existing `resourceMap` data.
  - Update the home screen `quickActions` grid to point to the new grouped tab IDs (e.g. Shelters quick-action opens Housing tab with Shelters sub-tab preselected). Pass an optional `subTab` via state.
  - Keep "Open Now Nearby" logic unchanged.
- No backend / data changes. No changes to `useResources` — same categories under the hood.

## Out of scope
- No renaming of underlying resource categories in the database.
- No changes to SOS, Tips, Quick Exit, Light Points, or Streak features.

Confirm the grouping (or pick an alternative) and I'll implement.
