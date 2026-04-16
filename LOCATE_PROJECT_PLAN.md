# Venom Locate — Student Location Tracker Web App

## Context

For FRC World Championship, the team needs a way to know where every student is at any time — pits, stands, lobby, hotel, bus, etc. Currently coordination relies on group texts and shouting, which doesn't scale at a venue the size of Houston. This new web app gives every student a one-tap way to update their location and gives mentors a real-time dashboard view.

The new app will live in a **separate folder/repo** from `c:\dev\venom-scouting`, on its own Firebase project (sharing the same Google billing account), but reusing battle-tested patterns and components from Venom Scout to accelerate development.

**Suggested name**: `venom-locate` (matches naming convention with venom-scouting).

---

## Final Requirements (confirmed with user)

| Decision | Choice |
|----------|--------|
| Identity | Pick name from roster, persisted in localStorage |
| Location options | Fixed list in code |
| Visibility | Everyone sees everyone |
| Firebase | New separate project (same Google account/billing) |
| History | Current + last 5 locations per student |
| Stale handling | Grey out after 2 hours + admin can ping students |
| Notes | Optional one-line note per location update |
| Admin features | Login, move any/all students, ping students to check in |

---

## Manual Setup Steps (Before Development)

These are things **you** need to do before Claude Code can start building. Have these ready and the dev work goes much faster.

### 1. Create New Folder + Git Repo

```powershell
# In your dev directory
cd c:\dev
mkdir venom-locate
cd venom-locate
git init
```

### 2. Create GitHub Repo

1. Go to https://github.com/new
2. Repo name: `venom-locate` (or `8044-locator` to match `8044-Scout` naming)
3. Owner: `denhamvenom`
4. Visibility: Private (recommended for team-internal app)
5. Do NOT initialize with README — we'll add one
6. Create repo

Then connect locally:
```powershell
git remote add origin https://github.com/denhamvenom/venom-locate.git
git branch -M main
# (push happens after first commit)
```

### 3. Create New Firebase Project

1. Go to https://console.firebase.google.com (logged in with same Google account: `frc8044@gmail.com`)
2. Click "Add project"
3. Project name: `Venom Locate` (suggested project ID: `venom-locate-26`)
4. Disable Google Analytics (not needed for this app)
5. Wait for project creation

**Enable services:**
- **Firestore Database** → Create database → Start in production mode → Pick region closest to Houston (`us-central1` is fine)
- **Hosting** → Get started → (we'll deploy later via CLI)
- **Cloud Messaging** → No setup needed yet (Tier 2 feature)

**Get web config:**
1. Project Settings (gear icon) → General tab
2. Scroll to "Your apps" → click `</>` (web icon)
3. App nickname: `Venom Locate Web`
4. Check "Also set up Firebase Hosting"
5. Register app
6. **Copy the firebaseConfig object** — you'll need these 7 values:
   ```
   apiKey, authDomain, projectId, storageBucket,
   messagingSenderId, appId, measurementId (optional)
   ```

### 4. Information to Provide to Claude Code

When you start the new project, paste these values into a chat with Claude Code so they can populate `.env`:

```
VITE_FIREBASE_API_KEY=<from step 3>
VITE_FIREBASE_AUTH_DOMAIN=venom-locate-26.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=venom-locate-26
VITE_FIREBASE_STORAGE_BUCKET=venom-locate-26.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<from step 3>
VITE_FIREBASE_APP_ID=<from step 3>

ADMIN_PASSWORD=<your choice — suggest something memorable>
```

**Also tell Claude Code:**
- Path to source venom-scouting repo (for copying reusable files): `c:\dev\venom-scouting`
- Path to student roster CSV: `c:\dev\venom-scouting\public\scouters.csv`
- Whether you want push notifications now (Tier 2) or later (Tier 1 only)

### 5. Install Firebase CLI (if not already)

```powershell
# Verify it's installed (you have it from venom-scouting)
firebase --version

# Login if needed (should already be logged in)
firebase login

# Initialize new project link in the venom-locate folder (later, after scaffold)
firebase use --add  # then select venom-locate-26
```

### 6. Optional: Reserve Hosting URL

Default URL will be `https://venom-locate-26.web.app` (or whatever your project ID is).
If you want a custom subdomain (e.g., `locator.denhamvenom.com`), add a custom domain in Firebase Hosting after first deploy.

---

## Tech Stack

Same proven stack as Venom Scout:
- **Vite 7 + React 19 + React Router 7** — copy `vite.config.js` (with PWA plugin) and `package.json` core deps
- **Firebase 12** — new project, Firestore + (optional) Cloud Messaging for push pings
- **Dexie 4** — minimal local cache (just current locations + offline queue)
- **CSS Modules + Venom dark theme** — copy `src/index.css` verbatim
- **Vite PWA Plugin** — installable on phones, offline-capable

---

## Firestore Data Model

Three collections — small, simple, real-time friendly:

```
/events/{eventCode}                       (e.g., "2026cmptx")
  - eventName: "World Championship 2026"
  - startDate, endDate
  - active: true/false

/events/{eventCode}/students/{studentId}
  - name: "Daniel D"
  - role: "student" | "mentor"

/events/{eventCode}/locations/{studentId}     ← current state, last-write-wins
  - studentId, studentName
  - location: "Pits" | "Stands" | ...
  - note: "Helping with battery swap" | null
  - timestamp: serverTimestamp()
  - deviceId: string

/events/{eventCode}/locationHistory/{studentId}/entries/{autoId}
  - location, note, timestamp
  - (only the most recent 5 are queried)

/events/{eventCode}/pings/{pingId}
  - studentId (or "all"), timestamp, message
  - acknowledged: bool
  - (Student app subscribes via onSnapshot — shows banner + vibrates when ping received)

/config/adminPassword
  - Hashed admin password (or just plain in a localStorage-cached doc — internal team app)
```

---

## Fixed Location List

Hardcoded constant in `src/lib/locations.js`:

```js
export const LOCATIONS = [
  { id: 'pits',     label: 'Pits',           icon: '🔧' },
  { id: 'stands',   label: 'Stands',         icon: '🪑' },
  { id: 'queue',    label: 'Queue',          icon: '⏳' },
  { id: 'practice', label: 'Practice Field', icon: '🎯' },
  { id: 'lobby',    label: 'Lobby',          icon: '🚪' },
  { id: 'food',     label: 'Food Court',     icon: '🍔' },
  { id: 'hotel',    label: 'Hotel',          icon: '🏨' },
  { id: 'bus',      label: 'Bus',            icon: '🚌' },
  { id: 'offsite',  label: 'Off-site',       icon: '🌐' },
  { id: 'other',    label: 'Other',          icon: '❓' },
]
```

Easy to update via code release if needed.

---

## App Architecture

### Routes

| Route | Screen | Purpose |
|-------|--------|---------|
| `/` | LaunchScreen | Pick your name (first time) → main view |
| `/me` | MyLocation | Big tap-target buttons for each location, optional note input, last 5 locations shown |
| `/team` | TeamView | Real-time grid of all students grouped by location, greyed out if stale (>2h) |
| `/admin` | AdminLogin → AdminDashboard | Password gate → admin tools |

### Real-Time Sync Strategy

**Firestore `onSnapshot` listeners replace the 5-minute polling pattern from Venom Scout.** Coaches see updates instantly.

```
Student taps "Pits"
  → write to /locations/{studentId}
  → also append to /locationHistory/{studentId}/entries/{autoId}
  → all other devices' onSnapshot listeners fire
  → Team view re-renders
```

### Offline Behavior

- App caches the current location list and roster in Dexie on startup.
- If a student taps a location while offline:
  - Store update in a local `pendingUpdates` table
  - Auto-flush on reconnect (window.addEventListener('online'))
- Team view shows last-known cached state with a "Reconnecting…" banner.

This is far simpler than Venom Scout's full bidirectional sync.

---

## Admin Features

Admin password gate (single shared password — internal team app, no per-user accounts needed). Reuse `PasswordModal.jsx` from Venom Scout.

Admin Dashboard actions:
1. **Move any student** to any location (with reason note)
2. **Move all students** to a location (e.g., "Everyone to Bus", "Everyone to Lobby for team meeting")
3. **Ping student** — writes to `/pings/{pingId}` collection. Student app sees ping via onSnapshot, shows full-screen banner + vibrate + audio alert until acknowledged.
4. **Ping everyone** — broadcast a check-in request
5. **Reset event** — clear all locations for a fresh event

---

## Push Notifications (Ping Feature) — Two Tiers

**Tier 1 (MVP)**: In-app pings via Firestore `onSnapshot`.
- Works only when student has the app open in browser.
- Shows banner + plays sound + vibrates.
- Zero setup beyond Firestore.

**Tier 2 (later)**: True push via Firebase Cloud Messaging.
- Works even when app is closed.
- Requires user to grant notification permission.
- Service Worker handles background push.
- Adds ~20 lines of code + FCM token management.

**Recommendation**: Build Tier 1 first. Tier 2 is a small add-on if needed after first event.

---

## Reusable Code from Venom Scout

Copy these files verbatim or with minor adaptation:

| File | Reuse type |
|------|------------|
| `src/index.css` | Verbatim — full Venom dark theme |
| `src/components/common/Toast.jsx` + `.module.css` | Verbatim |
| `src/components/common/ConfirmModal.jsx` + `.module.css` | Verbatim |
| `src/components/common/PasswordModal.jsx` + `.module.css` | Verbatim — admin login |
| `src/components/common/ScouterPicker.jsx` + `.module.css` | Adapt — rename to `StudentPicker`, same searchable list pattern |
| `src/components/common/ErrorBoundary.jsx` | Verbatim |
| `src/components/layout/AppShell.jsx` | Adapt — simpler header/back-button |
| `src/lib/firebase.js` | Adapt — point at new project |
| `src/lib/scouters.js` | Adapt — rename `parseStudents`, drop role-based sectioning |
| `src/lib/deviceId.js` | Verbatim |
| `src/context/AppContext.jsx` | Adapt — much smaller (just `studentName`, `studentId`, `eventCode`) |
| `src/main.jsx` | Adapt — same PWA registration pattern |
| `vite.config.js` | Adapt — change PWA manifest name + icons |
| `package.json` | Adapt — change name, drop unused deps (qrcode.react, html5-qrcode, pako, jimp) |
| `firebase.json` | Verbatim — same hosting config |
| `public/scouters.csv` | Copy — student roster (already curated) |

**Do NOT copy**:
- Anything in `gameScout/`, `superScout/`, `pitScout/`, `shadowScout/`, `trainingScout/`, `leadScout/`, `fpsTracker/`
- `src/lib/qr.js`, `dedup.js`, `analytics.js`, `tba.js`, `statbotics.js`, `csvColumns.js`
- `functions/` directory (no Cloud Functions needed for MVP)
- Complex Dexie schema — start with 3-table schema below

---

## New Dexie Schema (minimal)

```js
// src/lib/db.js
const db = new Dexie('VenomLocate')
db.version(1).stores({
  locations: 'studentId, eventCode, location, timestamp',
  pendingUpdates: '++id, studentId, location, note, timestamp',
  metadata: 'key',  // last sync, current event, etc.
})
```

---

## Build Phases

| Phase | Scope | Time estimate |
|-------|-------|---------------|
| **1. Scaffold** | Copy reusable files, set up new Firebase project, get base PWA running | 2-3 hours |
| **2. Identity + roster** | StudentPicker, localStorage persistence, name display | 1 hour |
| **3. MyLocation screen** | Big tap-target buttons, optional note input, write to Firestore | 2 hours |
| **4. Team view (real-time)** | onSnapshot listener, grid grouped by location, stale greying | 3 hours |
| **5. History (last 5)** | Subcollection writes, history display on MyLocation | 1 hour |
| **6. Admin features** | Password gate, move student, move all, ping (Tier 1) | 3 hours |
| **7. Polish + offline** | Pending updates queue, reconnect handling, PWA install, testing | 2 hours |
| **Total MVP** | | **~14 hours / 2 days** |

---

## Critical Files to Create (in new repo)

```
venom-locate/
├── package.json                        ← copy from venom-scouting, trim
├── vite.config.js                      ← copy + update manifest
├── firebase.json                       ← copy verbatim
├── .env                                ← new Firebase config
├── public/
│   ├── venom-logo.png                  ← copy
│   ├── pwa-192x192.png                 ← regenerate
│   └── pwa-512x512.png                 ← regenerate
├── src/
│   ├── App.jsx                         ← new — 4 routes
│   ├── main.jsx                        ← copy + adapt
│   ├── index.css                       ← copy verbatim
│   ├── lib/
│   │   ├── firebase.js                 ← copy + adapt
│   │   ├── db.js                       ← new — minimal schema
│   │   ├── locations.js                ← new — fixed location list
│   │   ├── deviceId.js                 ← copy verbatim
│   │   ├── students.js                 ← adapt from scouters.js
│   │   └── locationSync.js             ← new — onSnapshot listeners + offline queue
│   ├── context/
│   │   └── AppContext.jsx              ← adapt — much smaller
│   ├── components/
│   │   ├── common/
│   │   │   ├── Toast.jsx               ← copy
│   │   │   ├── ConfirmModal.jsx        ← copy
│   │   │   ├── PasswordModal.jsx       ← copy
│   │   │   ├── StudentPicker.jsx       ← adapt from ScouterPicker
│   │   │   └── ErrorBoundary.jsx       ← copy
│   │   ├── layout/
│   │   │   ├── AppShell.jsx            ← adapt
│   │   │   └── LaunchScreen.jsx        ← new — name picker
│   │   ├── locator/
│   │   │   ├── MyLocation.jsx          ← new — tap to set location
│   │   │   └── TeamView.jsx            ← new — real-time grid
│   │   └── admin/
│   │       ├── AdminLogin.jsx          ← new
│   │       └── AdminDashboard.jsx      ← new
└── public/students.csv                 ← copy from venom-scouting
```

---

## Firestore Security Rules (simple)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Open read for team transparency
    match /events/{eventCode}/{document=**} {
      allow read: if true;
      allow write: if true;  // Internal team app, all writes from team devices
    }
  }
}
```

For an internal team-only app served from a known URL, this is acceptable. Lock down further if exposing publicly.

---

## Verification Plan

**Phase 1 (Scaffold)**:
- `npm run dev` shows base PWA at localhost:5173
- Firebase project connects (no auth errors in console)
- Theme matches Venom Scout (dark + gold)

**Phase 2-3 (Identity + MyLocation)**:
- Open on phone, pick name, tap "Pits" → see Firestore doc appear in console
- Refresh page → name persisted, location remembered

**Phase 4 (Team View)**:
- Open on two devices simultaneously
- Tap location on device A → see device B update within 1-2 seconds (Firestore real-time)

**Phase 5 (History)**:
- Tap 6 different locations → MyLocation shows last 5 with timestamps

**Phase 6 (Admin)**:
- Admin login → move test student to "Bus" → confirm change reflects on student's device
- Admin pings student → student's device shows banner + vibrates

**Phase 7 (Offline)**:
- Disable wifi on student device, tap location → see "Pending sync" indicator
- Re-enable wifi → location syncs, indicator clears

**Pre-deployment**:
- Test on actual phones (Android + iOS) with PWA installed
- Verify "Add to Home Screen" works
- Test in Houston-like spotty wifi conditions

---

## Deployment

- New Firebase project → `venom-locate-26` (or similar)
- Same domain pattern: `https://venom-locate-26.web.app`
- `firebase deploy` from new repo root
- Distribute URL via team Slack/text day-of-event

---

## Open Items (Tier 2 / future)

- True push notifications via FCM (when app is closed)
- Per-event configurable location list
- Mentor-only views
- Geolocation auto-detection (could prompt "You appear to be in the Pits area, set location?")
- Export attendance log per event

---

## Summary

**Reuse**: ~60% of code patterns from Venom Scout (UI, build, theme, common components, Firebase pattern)
**New**: Real-time Firestore listeners, simpler 3-table data model, admin tools, ping system
**Effort**: ~14 hours / 2 days for MVP
**Risk**: Low — uses proven patterns, simpler scope than Venom Scout
