# GymTracker

A React Native (Expo) app for tracking which body parts you train and planning a weekly workout agenda.

## Features

- **Accounts**: sign up and sign in against your own [API](#api). Your height, weight and experience live with the account; workouts stay on the device, namespaced per account so two people can share a phone.
- **Today**: nothing is planned to begin with — the screen simply asks what you want to train and shows the body map. Tap the muscles, save, and the exercises to do appear at the top with the weight to use. Arrows let you log past days. A "Last trained" list shows how long it's been since you hit each body part (green: 0–3 days, amber: 4–6 days, red: 7+ days or never).
- **Agenda**: optional. Plan Monday through Sunday if you want to: set a name, mark a rest day, pick the body parts, and add or reorder exercises with sets and reps (or fill a day from the API in one tap). Every day starts empty.
- **Body map**: pick muscles by tapping a front/back figure instead of a list (the list is still one tap away, and cardio stays a chip).
- **Suggested exercises**: the muscles you select are sent to the [exercise API](#api), which answers with up to six exercises — shown on Today, and addable to any agenda day with one button.
- **You**: your height, weight and experience level. The weight and level turn each suggested exercise into a starting kg (`2 × 16 kg` for dumbbells, `Bodyweight` where nothing is loaded); height is only used for BMI.
- **Apple Health**: today's active and total calories, steps, exercise minutes and resting heart rate on the Today screen, and a one-tap import of your height and weight on the You tab. Read-only — nothing is written back to Health.
- **History**: a weekly strip with day-by-day dots, sessions per body part over 7, 30, or 90 days, and a list of every workout (each one can be deleted).

Your profile lives on the server with your account; agenda and workout logs are stored on the device with AsyncStorage, under a key per account.

## Run

The app uses Apple HealthKit, which is native code that **Expo Go cannot load**, so on iOS you run a development build — your own copy of the app, built once with Xcode — instead of Expo Go. Needs Xcode and CocoaPods (`brew install cocoapods`).

```bash
npm install
npx expo run:ios                     # simulator
npx expo run:ios --device            # your iPhone, plugged in
```

After the first build, day-to-day work is the same as before: `npx expo start`, and the installed app picks up your changes. Rebuild only when you add a native package or change `app.json`.

On a physical iPhone with a free Apple ID, the build expires after 7 days — run `npx expo run:ios --device` again. Distributing an app that uses HealthKit needs the paid Apple Developer Program.

Expo Go and the web build still run everything except Apple Health, which simply doesn't appear there. `npx expo start` now targets the development build by default; press `s` in its terminal to switch back to Expo Go.

Start the API in a second terminal — the app cannot sign in without it:

```bash
cd server
npm install
npm start
```

In development the app finds the API by itself: it takes the host Expo serves the bundle from (the address in the QR code) and calls port 3001 there, so a phone on the same Wi-Fi works with no configuration. Override it — or point a release build at a real server — with:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.143:3001 npx expo start
```

If the phone says it can't reach the server: check it's on the same network as this Mac, that `npm start` is running in `server/`, and that the address in the error message is reachable from the phone's browser.

## API

A small Express server (`server/`) that suggests exercises for a set of body parts. It holds a curated catalog — no database, no key.

| Endpoint | Description |
| --- | --- |
| `POST /auth/signup` | `{ email, password }` → `{ token, user }` |
| `POST /auth/login` | `{ email, password }` → `{ token, user }` |
| `POST /auth/logout` | Revokes the token it is called with |
| `GET /me` | The signed-in account |
| `PATCH /me` | `{ heightCm, weightKg, level }` |
| `GET /health` | `{ "ok": true }` |
| `GET /body-parts` | Every body part the API accepts |
| `GET /exercises?parts=chest,triceps` | Up to 6 exercises covering those parts |

Authenticated calls carry `Authorization: Bearer <token>`. A signed-in `/exercises` call uses the account's saved bodyweight and level, so the query needs only `parts`.

### Accounts

Passwords are hashed with scrypt and a per-user salt; the hash never leaves the server, and the API returns the same "Email or password is wrong" whether or not the email exists. Five failed sign-ins lock an email for a minute. Tokens are 32 random bytes, valid for 30 days, revoked on sign-out. The app keeps its token in the iOS/Android keychain (`expo-secure-store`); the web build falls back to browser storage.

Accounts live in `server/data/db.json` (git-ignored, written atomically, created on first signup). That is deliberately simple, and it is enough for a server on your own network. **Before putting this anywhere public, put it behind HTTPS** — over plain HTTP, passwords and tokens travel in the clear — and move the file to a real database.

`/exercises` parameters:

| Parameter | Meaning |
| --- | --- |
| `parts` | Comma-separated body parts (required) |
| `limit` | 1–6, default 6 |
| `bodyweight` | Kilograms, 30–300. Adds a `suggestedLoad` to each exercise |
| `level` | `beginner` (default), `intermediate` or `advanced` |

Anything outside those ranges returns 400.

```bash
curl "localhost:3001/exercises?parts=chest,triceps&limit=4&bodyweight=82"
```

```json
{
  "parts": ["chest", "triceps"],
  "count": 4,
  "exercises": [
    {
      "id": "bench-press",
      "name": "Barbell Bench Press",
      "bodyPart": "chest",
      "also": ["triceps", "shoulders"],
      "equipment": "barbell",
      "compound": true,
      "sets": "4",
      "reps": "6-8",
      "suggestedLoad": { "kg": 45, "perHand": false, "label": "45 kg" }
    }
  ]
}
```

Requested parts take turns, least-covered first, so two muscles get three exercises each rather than six for whichever came first; an exercise that also trains another requested muscle counts as half a turn for it. Compound lifts come before isolation work.

### Suggested weights

Every exercise carries a share of bodyweight that suits a beginner — bench press 0.55, back squat 0.70, lateral raise 0.06 per hand — which is scaled by experience (intermediate ×1.35, advanced ×1.7) and rounded to loadable increments: 2.5 kg for barbells and stacks, 2 kg for dumbbells, never below an empty 20 kg bar. Bodyweight and cardio movements return no weight.

Height is not part of this. It hardly predicts strength, so the app collects it for BMI only.

**These are starting estimates, not prescriptions.** Technique, leverages, sleep and the day matter more than any formula — warm up, adjust, and stop if form breaks down.

Run the tests with:

```bash
cd server && npm test
```

## Structure

```
App.tsx                  Tab shell (Today / Agenda / History)
src/store.tsx            Per-account agenda + logs in AsyncStorage
src/data.ts              Body parts, default agenda, date helpers
src/components.tsx       Card, BodyPartTag, BodyPartSelector, Button
src/BodyMap.tsx          Tappable front/back muscle figure (SVG)
src/api.ts               Client for the exercise API
src/auth.tsx             Session: sign in/up/out, token storage, profile
src/screens/             Auth, Onboarding, Today, Agenda, History, Profile
server/src/catalog.ts    Exercise catalog
server/src/select.ts     Picks up to six exercises for the chosen parts
server/src/load.ts       Turns bodyweight + experience into a working weight
server/src/users.ts      Accounts, password hashing, tokens, JSON persistence
server/src/auth.ts       Bearer-token middleware and sign-in throttling
server/src/index.ts      Express routes
```
