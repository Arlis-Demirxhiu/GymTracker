# GymTracker

A React Native (Expo) app for tracking which body parts you train and planning a weekly workout agenda.

## Features

- **Today**: see today's planned workout, tap the muscles you trained, add a note, and save. Arrows let you log past days. A "Last trained" list shows how long it's been since you hit each body part (green: 0–3 days, amber: 4–6 days, red: 7+ days or never).
- **Agenda**: plan Monday through Sunday. For each day, set a name, mark it as a rest day, pick the body parts, and add or reorder exercises with sets and reps. Starts with a Push/Pull/Legs split you can edit or reset.
- **History**: a weekly strip with day-by-day dots, sessions per body part over 7, 30, or 90 days, and a list of every workout (each one can be deleted).

Data is stored on the device with AsyncStorage.

## Run

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone, or press `i` for the iOS simulator (needs Xcode), `a` for the Android emulator, or `w` for the web.

## Structure

```
App.tsx                  Tab shell (Today / Agenda / History)
src/store.tsx            State + AsyncStorage persistence
src/data.ts              Body parts, default agenda, date helpers
src/components.tsx       Card, BodyPartTag, BodyPartPicker, Button
src/screens/             TodayScreen, AgendaScreen, HistoryScreen
```
