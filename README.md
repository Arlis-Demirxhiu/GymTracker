# GymTracker

A React Native (Expo) app for tracking which body parts you train and planning a weekly workout agenda.

## Features

- **Today**: see today's planned workout, tap the muscles you trained, add a note, and save. Arrows let you log past days. A "Last trained" list shows how long it's been since you hit each body part (green: 0–3 days, amber: 4–6 days, red: 7+ days or never).
- **Agenda**: plan Monday through Sunday. For each day, set a name, mark it as a rest day, pick the body parts, and add or reorder exercises with sets and reps. Starts with a Push/Pull/Legs split you can edit or reset.
- **Body map**: pick muscles by tapping a front/back figure instead of a list (the list is still one tap away, and cardio stays a chip).
- **Suggested exercises**: the muscles you select are sent to the [exercise API](#api), which answers with up to six exercises — shown on Today, and addable to any agenda day with one button.
- **History**: a weekly strip with day-by-day dots, sessions per body part over 7, 30, or 90 days, and a list of every workout (each one can be deleted).

Data is stored on the device with AsyncStorage.

## Run

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone, or press `i` for the iOS simulator (needs Xcode), `a` for the Android emulator, or `w` for the web.

Start the exercise API in a second terminal, otherwise the suggestion cards show a "couldn't reach the server" message:

```bash
cd server
npm install
npm start
```

The app calls `http://localhost:3001` by default, which works in the simulator and on the web. A real phone needs this machine's LAN address instead:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.143:3001 npx expo start
```

## API

A small Express server (`server/`) that suggests exercises for a set of body parts. It holds a curated catalog — no database, no key.

| Endpoint | Description |
| --- | --- |
| `GET /health` | `{ "ok": true }` |
| `GET /body-parts` | Every body part the API accepts |
| `GET /exercises?parts=chest,triceps` | Up to 6 exercises covering those parts |

`/exercises` takes a comma-separated `parts` list and an optional `limit` (1–6, default 6). Unknown parts or a limit out of range return 400.

```bash
curl "localhost:3001/exercises?parts=chest,triceps&limit=4"
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
      "reps": "6-8"
    }
  ]
}
```

Requested parts take turns, least-covered first, so two muscles get three exercises each rather than six for whichever came first; an exercise that also trains another requested muscle counts as half a turn for it. Compound lifts come before isolation work.

Run the tests with:

```bash
cd server && npm test
```

## Structure

```
App.tsx                  Tab shell (Today / Agenda / History)
src/store.tsx            State + AsyncStorage persistence
src/data.ts              Body parts, default agenda, date helpers
src/components.tsx       Card, BodyPartTag, BodyPartSelector, Button
src/BodyMap.tsx          Tappable front/back muscle figure (SVG)
src/api.ts               Client for the exercise API
src/screens/             TodayScreen, AgendaScreen, HistoryScreen
server/src/catalog.ts    Exercise catalog
server/src/select.ts     Picks up to six exercises for the chosen parts
server/src/index.ts      Express routes
```
