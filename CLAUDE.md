# Venom Locate — Claude context

Real-time student location tracker PWA for FRC 8044 Denham Venom. Sibling project to `c:\dev\venom-scouting` — reuses its dark-theme components, Firebase + Vite + PWA pattern, but with a much simpler 3-collection data model.

**Working plan + decisions:** [LOCATE_PROJECT_PLAN.md](LOCATE_PROJECT_PLAN.md) and `C:\Users\frc80\.claude\plans\melodic-herding-bumblebee.md`.

## Stack

Vite 7 + React 19 + React Router 7 + Firebase 12 (Firestore + Cloud Messaging) + Dexie 4 + vite-plugin-pwa. Local dev runs HTTPS via `@vitejs/plugin-basic-ssl` on `https://localhost:5173` so phones on the LAN can install the PWA.

## Firebase

- Project ID: `venom-locate-26`
- Hosting URL (post-deploy): `https://venom-locate-26.web.app`
- Blaze plan enabled (required for Cloud Functions in Phase 7)
- All config in `.env` (gitignored). `VITE_FIREBASE_VAPID_KEY` is the public Web Push key.
- `.firebaserc` aliases this folder to the project; `firestore.rules` deployed as wide-open read/write on `/events/**` (internal team app).

## Data model

Roster (students + mentors) lives in CSVs at build time — **not** in Firestore.

- `src/data/students.csv` — `First Name, Last Initial, Role, IsMonitor, Enabled`. Role is `student` or `mentor`. IsMonitor only meaningful for mentors (subset who can OK off-roster "Other" buddy claims).
- `src/data/locations.csv` — `id, label, icon, buddyMin, enabled`. `buddyMin` = number of OTHER people a student must pick when entering that location. Mentors are exempt.

Firestore (under `/events/2026cmptx/`):
- `locations/{rosterId}` — current location, last-write-wins. Has `groupId` reference if in a persistent group.
- `groups/{groupId}` — persistent buddy groups. `members[]`, `confirmedMembers[]`, `location`, `withOther`, `otherApproved`. Survive location changes.
- `locationHistory/{rosterId}/entries/{autoId}` — append-only log of moves (includes groupId).
- `messages/{messageId}` — admin/monitor broadcasts. Target: `{ groups: ["all"|"students"|"mentors"][], rosterIds: [] }`. Kind: `"info"` or `"checkin"`. Acks keyed by rosterId.
- `pins/{rosterId}` — personal 4-digit PINs. Set on first login, verified on return.
- `fcmTokens/{deviceId}` — for FCM push (Phase 7).

## Identity & auth

- **Personal PINs:** everyone (students + mentors) sets a 4-digit PIN on first login, stored in Firestore `/pins/{rosterId}`. Returning users verify their PIN. PINs are managed in [src/lib/pins.js](src/lib/pins.js). Admin can reset individual or bulk PINs.
- **Mentors first-time:** must enter team mentor PIN (`VITE_MENTOR_PIN=8808`) before setting personal PIN. Once personal PIN is set, team PIN is skipped on subsequent logins.
- **Admin:** separate password gate (`VITE_ADMIN_PASSWORD`) for the `/admin` route. Dashboard has Move, Message, and Reset tabs.
- **Monitors:** mentors with `IsMonitor=TRUE` get a Messages tab in bottom nav + monitor approval banner for "Other" buddy claims. Can send messages/check-ins without admin access.
- Identity persisted to `localStorage[venomLocate_state]` via `AppContext`.

## Conventions

- Source-of-truth roster parser: [src/lib/roster.js](src/lib/roster.js) — exports `ROSTER, STUDENTS, MENTORS, MONITORS`. **Do not** create a parallel parser.
- Source-of-truth location parser: [src/lib/locations.js](src/lib/locations.js) — exports `LOCATIONS` and helpers.
- Firestore writes go through [src/lib/locationSync.js](src/lib/locationSync.js) (`writeLocation`) and [src/lib/groups.js](src/lib/groups.js). Don't write to Firestore directly from components.
- Messaging via [src/lib/messages.js](src/lib/messages.js) (`sendMessage`, `ackMessage`, `subscribeRecentMessages`, `isMessageForMe`).
- PIN management via [src/lib/pins.js](src/lib/pins.js) (`getPin`, `setPin`, `deletePin`, `deleteAllPins`).
- Device ID in [src/lib/deviceId.js](src/lib/deviceId.js) stored under `localStorage[venomLocate_deviceId]`.
- All shared common components live in `src/components/common/`. Layout in `src/components/layout/`. Feature screens in `src/components/locator/` and `src/components/admin/`.
- CSS Modules everywhere (`*.module.css`). Theme variables defined in [src/index.css](src/index.css) — copied verbatim from venom-scouting.

## Build phases (status)

Done: Phase 1 (scaffold) → Phase 2 (identity) → Phase 3 (MyLocation) → Phase 4 (TeamView) → Phase 4.5a (mentor PIN login) → Phase 4.5b (persistent groups + BuddyPicker + claim banners) → Phase 4.5c (monitor approval) → Phase 5 (history + search + student detail) → Phase 6 (admin dashboard + messaging + personal PINs + monitor messages tab).

Next: Phase 7 (FCM Tier 2 background push via Cloud Function), Phase 8 (offline queue + PWA install testing).

## Persistent groups (core concept)

Groups live in `/events/{ec}/groups/{groupId}` and persist across location changes. Any confirmed member can instant-move the entire group or leave it. Key lib: [src/lib/groups.js](src/lib/groups.js). BuddyPicker creates groups; MyLocation handles move/leave dialogs, claim banners (Confirm / Add Someone / Different Location), "Add to Group" button, and group-conflict resolution (join theirs vs invite to yours).

## Local dev

```bash
npm install      # one-time
npm run dev      # https://localhost:5173 with self-signed cert (Advanced → Proceed)
firebase deploy  # post-build deploy to venom-locate-26.web.app
```

The dev server is started from this folder; Vite watches all source files and HMR-reloads on save. `.env` changes require a restart.

## Things to avoid

- Don't store the roster in Firestore — it's intentionally CSV-at-build-time. Avoids a sync problem and keeps roster edits a deliberate redeploy step.
- Don't reach for `react-router` v6 docs — this project uses v7 (which still imports from `react-router-dom`).
- Don't add the `Firebase Storage` SDK — we don't need it. Keep `firebase.js` lean.
- Don't create new common picker components — extend `RosterPicker` or write `BuddyPicker` in `src/components/common/`.
