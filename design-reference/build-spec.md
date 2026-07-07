# OrchardPatch Console Redesign -- Claude Code Build Spec
Date: June 23, 2026
Driver: Chip orchestrates and handles git. Claude Code does the multi-file
editing and runs `npm run build` itself. Keep the build loop INSIDE Claude
Code, do not relay build errors back through Chip.

Repo: orchardpatch (frontend), Next.js 14 App Router, TypeScript, Tailwind,
deployed on Vercel.

---

## Goal
Reskin every console surface to the locked Liquid-Glass-meets-ABM design
system. Fully tokenized: zero hardcoded hex anywhere in components. Light and
dark mode both ship, first load follows the OS setting.

## Visual source of truth (drop these in the repo)
Put the four reference HTML files in `design-reference/`. They are the spec.
Reproduce them faithfully.
- `orchardpatch-console-master.html` -- Dashboard. The token block at the top
  of this file is the canonical token system. Lift it close to verbatim.
- `orchardpatch-app-detail.html` -- App detail page, incl. the resolver
  version module.
- `version-module-states.html` -- the four resolver states (current,
  patchable, lagging, unknown).
The sidebar exploration files are exploration, not spec. Ignore them.

## Hard constraints
- Components reference SEMANTIC tokens only. Never a raw hex in a component.
- Dark mode is mandatory. Every surface must work in both themes.
- First load follows `prefers-color-scheme`. Manual toggle overrides for the
  session. A matchMedia listener follows OS changes until the user overrides.
- No diagonal face shine on glass. Top-edge highlight only.
- No colored rim-light (rejected). Clean glass: translucency + top-edge
  specular + soft depth shadow.
- Always run `npm run build` and get a clean build before reporting a surface
  done. TS errors surface only at build time.

---

## Sequence (branch first, never redesign on main)
Branch off main. Vercel auto-deploys each branch to a preview URL. Review each
surface on its preview before merging to production.

1. **Token layer only.** globals.css + tailwind.config + theme script +
   toggle. No component restyling yet. Build, deploy to preview, confirm the
   page still renders and the toggle flips theme. This is the foundation.
2. **Shell:** sidebar + topbar. Every page uses it.
3. **Dashboard** (`/dashboard`). Own commit + preview.
4. **App detail** (`/apps/[id]`). Own commit + preview.
Merge a surface to production only when it reads right on its preview URL.

---

## Step 1 detail -- token layer

### globals.css
Copy the `:root` block and the `[data-theme="dark"]` block from
`orchardpatch-console-master.html` verbatim into globals.css. These define
three layers: primitives (raw hex), then semantic tokens (light at `:root`,
dark at `[data-theme="dark"]`). Do not edit the values.

### tailwind.config.ts
Map the semantic tokens so Tailwind utilities resolve to the CSS variables.
Pattern:
```
theme: {
  extend: {
    colors: {
      accent: 'var(--accent)',
      'accent-hover': 'var(--accent-hover)',
      'text-primary': 'var(--text-primary)',
      'text-secondary': 'var(--text-secondary)',
      'text-tertiary': 'var(--text-tertiary)',
      'surface-glass': 'var(--surface-glass)',
      'border-hairline': 'var(--border-hairline)',
      'st-current': 'var(--st-current)',
      'st-outdated': 'var(--st-outdated)',
      'st-unknown': 'var(--st-unknown)',
      'st-system': 'var(--st-system)',
      'st-store': 'var(--st-store)',
      'st-lagging': 'var(--st-lagging)',
      // ...map the rest from the token block
    },
    borderRadius: { sm:'10px', md:'14px', lg:'18px', xl:'22px' },
  }
}
```
Components then use `bg-accent`, `text-text-secondary`, `border-border-hairline`
etc., or `var(--token)` directly in arbitrary values where a utility does not
fit (shadows, gradients). Do not introduce new raw hex.

### Theme script (no-flash, OS-follow) -- app/layout.tsx
Inline a tiny script in `<head>` so the theme is set before paint:
```
<script dangerouslySetInnerHTML={{ __html:
  "document.documentElement.setAttribute('data-theme', window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark':'light');"
}} />
```
Set `<html lang="en" data-theme="light">` as the SSR default so there is a sane
fallback.

### Toggle component
Segmented sun/moon glass control (see master file markup + CSS). Client
component. Logic:
- On mount: `apply(mq.matches ? 'dark' : 'light')`.
- `mq.addEventListener('change', ...)` follows OS until the user clicks.
- On click: set a `userOverride` flag and apply the chosen theme.
- `apply(theme)` sets `data-theme` on documentElement and updates the segmented
  control's active state.
Do NOT use localStorage in this prototype path. In-memory + OS-follow is the
locked behavior. (If persistence is wanted later, that is a separate decision.)

---

## Step 2-4 -- per-surface checklist

### Shell (sidebar + topbar)
- Sidebar: flat green-tinted glass (light `rgba(31,58,40,0.90)`, dark
  `rgba(18,34,23,0.80)`), backdrop-filter on. Thin top-edge shine via the
  inset box-shadow set in the master file. NO radial glow, NO diagonal sweep.
- Logo: TEXT ONLY wordmark `OrchardPatch`, `Patch` in mint `var(--sidebar-accent)`
  (#74cc7c). No glyph.
- Nav groups: Inventory / Enterprise / Configuration. Active item: frosted pill
  + thin mint left bar (glowing). `Soon` chips on Cultivation/Reports/Alerts.
- Topbar: frosted, sticky, content scrolls under it. Theme toggle lives here.
  Dashboard topbar shows title + subtitle + sync pill + Sync now. App-detail
  topbar shows the breadcrumb (back chevron / Apps / current app).

### Dashboard (/dashboard)
- 5 metric cards: Outdated (amber), Current (green), Unknown (gray), System
  (faint gray), App Store (blue). Vivid glowing dots, the two key numbers
  colored, neutral numbers stay --text-primary. Subtle status-colored corner
  glow per card.
- Fleet health card: conic-gradient donut (outdated/current/unknown/system),
  masked ring, center count. Legend rows.
- Top outdated apps card: rows with avatar, name, version delta (installed ->
  patchable), device-count pill.
- Patch by the Orchard card: header, amber notice, luminous green primary
  button (Bushel/Orchard). Active-voice lowercase copy.
- Pinned apps: dashed empty-state cards, "Coming soon."

### App detail (/apps/[id])
- Identity header: avatar, name, bundle id (mono), Installomator label chip,
  source badge `via Installomator` (extensible SourceBadge, label not
  hardcoded), device count. Bushel `Patch all outdated` primary button top-right
  + overflow icon button.
- Version hero card: the resolver module. Three numbers Installed / Patchable /
  Vendor latest with arrows. PROGRESSIVE DISCLOSURE -- render only as many
  numbers as carry information:
  - current: one number + check, "Up to date" line.
  - patchable: two numbers (installed -> patchable, amber).
  - lagging: three numbers (installed -> patchable -> vendor latest, vendor in
    restrained red) + the factual gap line with the thin red accent bar.
  - unknown: muted "Version data unavailable", stays visible.
  Installed at app level is a fleet AGGREGATE: single number when uniform,
  range (e.g. "131.0-132.0") when machines diverge.
- Lagging treatment is CALM. Restrained red (dot, pill, number, thin bar,
  factual sentence). NEVER a red banner. Wording is Installomator-safe ("...for
  now", no blame).
- Fleet installations card: per-device rows (device name + model/OS, installed
  version, status pill, last checked, action). Per-device action is CONDITIONAL:
  - installed < patchable -> `Patch to X` button (Fruit).
  - installed == patchable but app lagging -> muted "On newest patchable", no
    button.
  - source == 'mas' -> hide patch action, show "App Store" muted text.
- App patch history card: flat list, full datetime ("Jun 22, 2026 at 6:32 PM"),
  device, version delta, status pill. Link out to full Patch History.

### Status color semantics (apply everywhere)
current=green, outdated/patchable=amber, unknown=gray, system=faint gray,
App Store=blue, lagging=red (the ONLY red state, reserved for the resolver).
Dark mode brightens each; tints become low-alpha over dark. These are tokens
(`--st-*`), never raw hex in components.

---

## Hazards / notes
- Template-literal mangling is a Python-generated-edit problem. Claude Code
  edits files directly, so it does not apply. Just make sure the work goes
  through direct file editing, not a Python-string-concatenation path.
- backdrop-filter needs the `-webkit-` prefix for Safari. The reference files
  include both; keep both.
- The donut uses conic-gradient + a radial mask for the ring. No chart library
  needed.
- Verify the status-bar / metric math after any category change (a new category
  can drop items from a count if it has no render home).
- Comma-format Homebrew versions ("12.8,282010") should be normalized to the
  part before the comma AT DISPLAY TIME only. Do not mutate stored values.

## Done means
Each surface renders pixel-faithful to its reference in BOTH themes, follows the
OS setting on first load, contains zero hardcoded hex in components, and
`npm run build` is clean. Reviewed on its Vercel preview URL before merge.
