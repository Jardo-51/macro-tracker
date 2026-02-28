# Macro Tracker

A progressive web app for tracking daily macronutrient intake. Built with Vue 3, Vuetify, and IndexedDB for fully offline, local-first usage — no account or server required.

## Features

### Daily Tracking

- Log food entries via three methods: manual input, saved food items (with adjustable servings), or meal templates
- View real-time progress bars for calories, protein, carbs, and fat against your daily goals
- See percentage completion and remaining macros at a glance
- Delete individual entries from today's log

### AI-Powered Macro Estimation

- Optionally connect your OpenAI API key to estimate macros from a food description
- Uses GPT-4o-mini for quick, low-cost estimations
- API key is stored locally in your browser and never sent to any server other than OpenAI

### Food & Meal Management

- Create a personal library of food items with serving size, unit (g, oz, cup, etc.), and macro values
- Build meal templates that store total macros for frequently eaten combinations
- Search and filter across saved foods and meals

### History & Analytics

- View daily macro history over 7, 14, or 30 day ranges
- Interactive line chart with toggleable macro series and goal reference lines
- Weekly averages calculated from days with logged entries
- Expandable daily breakdown showing all entries per day

### Goals

- Set custom daily targets for calories, protein, carbs, and fat
- Defaults to 2000 cal / 150g protein / 250g carbs / 65g fat
- Goals persist across sessions

### Data Management

- Export all data (foods, meals, entries, goals) as a timestamped JSON file
- Import previously exported data with validation
- Clear all data with confirmation prompt

### PWA & Offline Support

- Installable on mobile and desktop — runs as a standalone app
- Full offline functionality via service worker caching
- Auto-updates when a new version is deployed

### Dark Mode

- Toggle between light and dark themes from settings
- Preference persists across sessions

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Vue 3 (Composition API) + TypeScript |
| UI | Vuetify 4 + Material Design Icons |
| State | Pinia |
| Routing | Vue Router |
| Database | Dexie (IndexedDB) |
| Charts | Chart.js + vue-chartjs |
| Build | Vite + vite-plugin-pwa |
| IDs | UUIDv7 |

## Getting Started

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Lint
pnpm lint
```

Alternatively, if you use [Nix](https://nixos.org/), you can run commands via the project's dev shell:

```bash
nix develop -c pnpm dev
```

## Project Structure

```
src/
├── pages/           # Route-level page components
├── components/      # UI components organized by feature
│   ├── today/       # Daily tracking (progress, entries, add dialog)
│   ├── history/     # Charts, averages, daily breakdown
│   ├── meals/       # Food and meal CRUD
│   ├── settings/    # Goals, theme, data management, AI config
│   └── layout/      # Bottom navigation
├── stores/          # Pinia stores (dailyLog, history, foods, app)
├── services/        # External API integration (OpenAI)
├── db/              # Dexie database setup
├── utils/           # Date helpers
├── types/           # TypeScript interfaces
├── plugins/         # Vuetify, Pinia, Router config
└── main.ts          # App entry point
```
