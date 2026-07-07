# Tech Debt

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
