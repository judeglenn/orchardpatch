# Tech Debt

## "Show removed" toggle — default-hide shipped, opt-in reveal pending

**Filed:** 2026-07-06  
**Branch:** part3-touchup  
**File:** `src/components/HomePageInner.tsx`

### What was done (backlog item 0, partial)

Removed apps are now **hidden by default** in the App Inventory listing.
The `showRemoved` state flag (`useState(false)`) gates a pre-filter in the
`filtered` useMemo that reads `allRemovedMap` (populated from the
server-sent `removal_state` field) to exclude all-removed bundles from the
rendered list. The `effectiveTotal` denominator is adjusted so the "X of Y"
count reflects visible apps, not the raw total.

### What remains

The `setShowRemoved` setter is wired but no UI toggle exists yet. A future
"Show removed (N)" button/chip in the App Inventory header should call
`setShowRemoved(true)` to reveal hidden rows. When revealed, removed rows
render exactly as they do now (muted "Removed" label, no patch button).

### Resolution

Add the toggle control in a follow-on pass. Alternatively, superseded by
Part 5 `/apps/summary` migration if that endpoint handles removal exclusion
server-side and the client list is rebuilt from that.

---


## outdated-filter removal guard — superseded by Part 5 /apps/summary migration

**Filed:** 2026-07-06  
**Branch:** part3-touchup  
**File:** `src/app/dashboard/page.tsx`

### What it is

A call-site guard on the `outdatedByLabel` filter in `HomePageInner`:

```ts
.filter(a => a.patch_status === 'outdated' && a.removal_state !== 'removed')
```

`removal_state` was also added to the `AppStatus` interface with a `// call-site guard` comment.

### Why it's here

The demo surface needed to be correct immediately (removed apps must not appear in the "Top Outdated" widget). The full migration — moving the dashboard's app-status aggregation to the `/apps/summary` endpoint that already enforces removal exclusion server-side — is Part 5, which is **parked post-preview**.

### Resolution

When Part 5 lands, the `/api/fleet/status` endpoint should natively exclude `removal_state = 'removed'` rows (or the dashboard should switch to `/apps/summary`). At that point, remove the call-site guard and the `removal_state` field from the `AppStatus` interface.
