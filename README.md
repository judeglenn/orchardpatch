# OrchardPatch

**Fleet-wide macOS patch management. Powered by Installomator.**

OrchardPatch gives Mac admins a single place to see what needs patching across their entire fleet — and actually do something about it. No replacing your MDM. No new trust framework. Just a focused tool that does one thing really well.

🌐 [orchardpatch.vercel.app](https://orchardpatch.vercel.app) · 📋 [Join the waitlist](https://orchardpatch.com)

---

## The problem

Your MDM tells you apps exist. It doesn't tell you they're out of date. And even when you know they're out of date, deploying patches across a mixed fleet is more work than it should be.

Installomator solves the deployment piece. OrchardPatch solves the visibility and orchestration piece.

---

## What it does

- **Fleet dashboard** — see every Mac, every app, every version across your org
- **Patch status** — know what's outdated, what's current, what's waiting on a package update
- **One-click patching** — trigger Installomator silently from the UI, no SSH required
- **Patch history** — full audit log of what was patched, when, and what happened
- **MDM-friendly** — deploy the agent via Jamf, Kandji, Mosyle, or any PKG-capable MDM
- **Label overrides** — map bundle IDs to custom Installomator labels for edge cases

---

## How it works

1. Install the [OrchardPatch Agent](https://github.com/judeglenn/orchardpatch-agent) on each Mac (PKG, silent, MDM-deployable)
2. Agents check in every 15 minutes with a full app inventory
3. OrchardPatch matches apps to Installomator labels (1,400+ supported)
4. You see your fleet in the dashboard — patch individual apps or entire fleets from the UI

---

## Stack

- **Frontend:** Next.js, deployed on Vercel
- **Fleet server:** Node.js + SQLite, deployed on Railway
- **Agent:** Node.js LaunchDaemon, distributed as a signed PKG
- **Patching engine:** [Installomator](https://github.com/Installomator/Installomator)

---

## Development

```bash
git clone https://github.com/judeglenn/orchardpatch
cd orchardpatch
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

You'll also need the [fleet server](https://github.com/judeglenn/orchardpatch-server) and [agent](https://github.com/judeglenn/orchardpatch-agent) running locally for full functionality.

---

## Related repos

| Repo | Description |
|------|-------------|
| [orchardpatch](https://github.com/judeglenn/orchardpatch) | This repo — Next.js dashboard |
| [orchardpatch-agent](https://github.com/judeglenn/orchardpatch-agent) | macOS agent (LaunchDaemon + PKG) |
| [orchardpatch-server](https://github.com/judeglenn/orchardpatch-server) | Fleet server (Node.js + SQLite) |
| [orchardpatch-waitlist](https://github.com/judeglenn/orchardpatch-waitlist) | Waitlist site at orchardpatch.com |

---

## License

MIT
