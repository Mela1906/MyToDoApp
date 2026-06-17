# TodoApp – Projektstruktur

React Native App (Expo SDK 56) für Samsung Galaxy S26.  
Sprache: TypeScript · Navigation: React Navigation · Speicher: AsyncStorage

---

## Ordnerstruktur

```
TodoApp/
├── App.tsx                    ← Einstiegspunkt, GestureHandler-Wrapper
├── index.ts                   ← Expo-Root (registerRootComponent)
├── app.json                   ← Expo-Konfiguration (Name, Icons, jsEngine: hermes)
├── babel.config.js            ← Babel + reanimated-Plugin
├── tsconfig.json              ← TypeScript-Konfiguration
│
├── assets/                    ← App-Icons und Splash-Screen
│
└── src/
    ├── types/
    │   └── index.ts           ← Alle TypeScript-Typen (Todo, Event, Reminder, ...)
    │
    ├── storage/
    │   └── index.ts           ← AsyncStorage CRUD für Todos, Events und Kategorien
    │                            Alle Funktionen loggen mit [TodoApp] im Dev-Modus
    │
    ├── utils/
    │   ├── colors.ts          ← Farbpalette, Prioritäts- und Energie-Labels
    │   ├── sort.ts            ← Sortierlogik für Todos (Priorität, Deadline, beides)
    │   └── debug.ts           ← log() / error() – nur aktiv wenn __DEV__ === true
    │
    ├── navigation/
    │   └── index.tsx          ← Bottom-Tab-Navigator (Heute / Todos / Termine)
    │                            Jeder Tab hat einen eigenen Stack-Navigator
    │
    ├── screens/
    │   ├── TodayScreen.tsx    ← Dashboard: Tages-Timeline + Fokus-Todos + Fortschrittsring
    │   ├── TodosScreen.tsx    ← Todo-Liste mit Sortierung, Subtask-Toggle, Löschen
    │   ├── AddTodoScreen.tsx  ← Formular: Titel, Priorität, Energie, Deadline,
    │   │                        Zeitschätzung, Kontext-Tags, Unteraufgaben
    │   ├── EventsScreen.tsx   ← Terminliste (chronologisch), vergangene Termine ausgegraut
    │   └── AddEventScreen.tsx ← Formular: Titel, Farbe, Start/Ende, offenes Ende,
    │                            Erinnerungen (6 Voreinstellungen), Wiederholung
    │
    └── components/            ← (leer – wächst mit zukünftigen Features)
```

---

## Datenmodelle (`src/types/index.ts`)

### Todo
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | string | Eindeutige ID (zufällig generiert) |
| `title` | string | Pflichtfeld |
| `priority` | `low \| medium \| high \| urgent` | Bestimmt Farbe und Sortierung |
| `energyLevel` | `low \| medium \| high` | Wieviel Konzentration wird benötigt |
| `deadline` | string (ISO) | Optional – löst Überfällig-Warnung aus |
| `estimatedMinutes` | number | Zeitschätzung in Minuten |
| `subtasks` | `Subtask[]` | Liste von Unteraufgaben mit eigener completed-Flag |
| `contextTags` | string[] | z.B. `['@Zuhause', '@Arbeit']` |
| `completed` | boolean | Status |

### Event (Termin)
| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | string | Eindeutige ID |
| `title` | string | Pflichtfeld |
| `startDate` | string (ISO) | Beginn |
| `endDate` | string (ISO) | Ende – optional wenn `isOpenEnded: true` |
| `isOpenEnded` | boolean | Termin ohne festes Ende (z.B. Urlaub ab...) |
| `reminders` | `Reminder[]` | Mehrere Erinnerungen möglich (5 Min, 1 Std usw.) |
| `recurrence` | `Recurrence` | Wiederholung: tägl./wöch./monatl./jährl. |
| `color` | string | Hex-Farbe für visuelle Unterscheidung |

---

## Datenspeicherung

AsyncStorage-Keys:
- `@mytodo_todos` – JSON-Array aller Todos
- `@mytodo_events` – JSON-Array aller Termine
- `@mytodo_categories` – JSON-Array der Kategorien

Alle Lese-/Schreiboperationen sind in `src/storage/index.ts` gekapselt.  
Im Entwicklungsmodus werden alle Operationen in der Konsole geloggt.

---

## Navigation

```
Tab Navigator
├── Heute        → TodayScreen
├── Todos        → Stack: TodosScreen → AddTodoScreen (Modal)
└── Termine      → Stack: EventsScreen → AddEventScreen (Modal)
```

---

## Debugging

### JS Debugger öffnen (auf dem S26)
1. App in Expo Go starten
2. **Gerät schütteln** → Entwicklermenü öffnet sich
3. **"Open JS Debugger"** tippen → Chrome DevTools öffnet sich im Browser

### Was erscheint in der Konsole
Alle Storage-Aktionen werden mit `[TodoApp] HH:MM:SS.mmm` geloggt:
```
[TodoApp] 14:23:01.452 getTodos → 3 items
[TodoApp] 14:23:02.101 addTodo → abc123 "Zahnarzt anrufen"
[TodoApp] 14:23:02.198 saveTodos ✓ 4 items
```

### Expo Metro-Konsole
Im Terminal wo `npx expo start` läuft: Logs erscheinen ebenfalls direkt.

---

## App starten (Entwicklung)

```bash
cd TodoApp
npm install
npx expo start
```

→ QR-Code erscheint → mit **Expo Go** auf dem S26 scannen.

### Geplante nächste Features
- [ ] Kalenderansicht (Woche/Monat)
- [ ] Push-Notifications für Erinnerungen
- [ ] Habit-Tracker mit Streaks
- [ ] Spracheingabe ("Zahnarzt morgen 14 Uhr")
- [ ] Pomodoro-Timer
- [ ] Dark Mode
- [ ] Standort-basierte Erinnerungen
- [ ] Android Home-Screen Widget
