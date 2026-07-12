Comprehensive review of the whole codebase (~3,600 lines across 40 source files). Overall the app is in good shape: consistent local-date handling with good comments (`src/utils/date.ts`), a solid CSP, real validation on import, and a sensible Dexie migration. Findings below are ordered by severity.

Severity legend:

- **CRITICAL** — will cause bugs, data loss, or security issues if shipped as-is.
- **HIGH** — significant design flaw or performance problem; should be fixed before shipping.
- **MEDIUM** — best-practice violation or maintenance burden; fix recommended.
- **LOW** — style, minor improvement, nitpick.

---

## CRITICAL

### [x] 1. Import can permanently destroy all user data — `clear()` and `bulkAdd()` run outside a transaction

`src/components/settings/DataManagement.vue:213-228`

Each table is cleared and then re-filled as separate, unrelated operations. `validateImport` checks field shapes but not ID uniqueness, so a file with a duplicate `id` (or any other `bulkAdd` failure — quota, constraint) throws *after* the tables were already cleared. The catch block shows "Import failed" but the user's previous data is already gone, partially replaced or empty, with no backup.

**Fix:** wrap the whole import in `db.transaction('rw', db.foodItems, db.mealTemplates, db.dailyLogEntries, db.dailyGoals, async () => { ... })` so a failure rolls everything back (Dexie aborts the transaction on an unhandled error). `clearAll()` at line 239 should get the same treatment for consistency, though it's less risky.

## HIGH

### [x] 2. Numeric form inputs are never validated — strings, `NaN`, and negatives get persisted to IndexedDB

`v-model.number` falls back to the *raw string* when the input isn't parseable (and an emptied field yields `''`). None of the forms validate before saving:

- `MacroInputFields.vue` feeds directly into `AddEntryDialog.save()`, `FoodItemDialog.save()`, `MealTemplateDialog.save()`, and `EditEntryDialog.save()` — a cleared "Calories" field stores `calories: ''`; `dailyTotals` then computes `0 + ''` → `"0"` and subsequent additions become string concatenation, which corrupts the Daily page, History aggregation, and charts.
- `GoalsForm.vue:81-84` saves the form as-is, so goals can become `''`, making `progressPercentages` divide by `0` → `Infinity%`.
- The multiplier fields: `:disabled="multiplier === 1"` doesn't protect against a cleared field (`'' !== 1`), and `macros * ''` coerces to `0` — pressing Apply with an empty multiplier silently zeroes all macros. Typing something like `1,5` (a very likely European decimal-comma input) yields the string `"1,5"`, and `Math.round(500 * "1,5")` → `NaN` saved to the database, which then poisons every total as `NaN`. Affects `AddEntryDialog.vue:252-261`, `EditEntryDialog.vue:78-89`, `FoodItemDialog.vue:104-116`.
- `min="0"` on the text fields only constrains the spinner arrows; typed negative values pass through.

**Fix centrally:** a small sanitizer (`toFiniteNonNegative(v): number`) applied in `save()`/`applyMultiplier`, or validation rules + a form-level guard on the Save buttons. The existing import validator (`isFiniteNum`) shows the right instinct — the UI paths just never got the same rigor.

### [x] 3. One-tap irreversible deletes with no confirmation or undo

`DailyEntryList.vue:29-34`, `FoodItemList.vue:28`, `MealTemplateList.vue:27`

Log entries, foods, and meal templates are deleted instantly on a single small icon tap. This is a mobile-first PWA where mis-taps are common, the delete icon sits directly next to edit, and there is no undo. "Clear All Data" gets a confirm dialog but a curated food library entry doesn't.

**Fix:** either a confirm dialog or (better UX) a snackbar with an Undo action that re-inserts the object.

## MEDIUM

### [x] 4. OpenAI requests have no timeout

`src/services/openai.ts:23`

`fetch` without an `AbortSignal` can hang for minutes on flaky mobile networks, leaving the button spinner stuck with no way out. Add `signal: AbortSignal.timeout(60_000)` and map the abort to a friendly message.

### [x] 5. Macro arithmetic is copy-pasted in six places and has already drifted

`multiplyMacros` exists three times (`AddEntryDialog.vue:252`, `FoodItemDialog.vue:104`, `EditEntryDialog.vue:78`) and the `EditEntryDialog` copy **forgot the `Math.round`**, so edited entries can hold fractional macros while everything else is integer — the drift the duplication invites has already happened. Per-field summation loops are likewise repeated in `dailyLog.ts:22-33`, `history.ts:19-40` (twice), and `openai.ts:147-154`.

**Fix:** extract `multiplyMacros`, `addMacros`/`sumMacros` into `src/utils/macros.ts` next to `emptyMacros()`.

### [x] 6. Malformed AI responses surface as raw TypeErrors

`src/services/openai.ts:58-64`

`validateMacros(parsed.mainCourse.macros, …)` is called without checking that `macros` exists (`openai.ts:126`, `:133`, `:192`). If the model omits it, `obj[field]` throws `TypeError: Cannot read properties of undefined`, and that raw message is what the snackbar shows the user. Same for `JSON.parse` failures at line 55 ("Unexpected token…"). Guard `obj` at the top of `validateMacros` and wrap the parse with a friendly "AI returned an unexpected response" error.

### [x] 7. Division by zero when a goal is 0

`src/stores/dailyLog.ts:42-47`, `WeeklyAverageCard.vue:14`

Nothing prevents saving a goal of 0 (or the `''` case from finding 2), and both the progress percentages and the weekly-average percentages render `Infinity%`/`NaN%`. Guard with `goal > 0 ? … : 0`.

### [x] 8. `index.html` has no cache-control header

`public/.htaccess`

JS/CSS/fonts are `immutable`, and `sw.js` is `no-cache` — good — but `index.html` itself gets Apache defaults, so intermediate caches / browser heuristics may serve a stale shell referencing hashed assets. The service worker masks this for repeat visitors, but the first uncontrolled load and the SW-update path both fetch `index.html` over the network. Add a `<Files "index.html">` block with `no-cache`.

### [x] 9. Duplicated "snap back to today" bootstrap logic

`DailyPage.vue:39-43` and `RecommendPage.vue:184-188`

The identical `loadGoals()` + `currentDate < today() ? today() : undefined` dance lives in two pages. It belongs in the store (e.g., `dailyLog.ensureFreshToday()`), so the next page that needs it can't get it subtly wrong. Related quirk: opening Recommend silently changes which day the Daily page shows.

### [x] 10. Chart palette duplicated, in triplicate

`TrendChart.vue:70-82` and `src/plugins/vuetify.ts:10-23`

The same four hex colors are defined in the Vuetify theme (`macro-*`), again in `macroOptions`, and a third time in `colorMap` within the same component (`macroOptions` alone could serve both uses). A theme change now requires edits in three places. Export a single `MACRO_COLORS` constant, or pull the values from the Vuetify theme at runtime.

### [x] 11. No tests, and no test infrastructure

There's genuinely testable pure logic here — `date.ts`, `aggregateByDate`, `compareByRecency`, the import validators, the OpenAI response parsing — all cheap to cover with Vitest and exactly the code where regressions would be silent (timezone math, aggregation). Worth setting up before the app grows further.

## LOW

### [x] 12. API key in `localStorage`

`src/stores/app.ts:9` — readable by any successful XSS; the strict CSP makes exploitation unlikely, and there's no server to hold it instead, so this is an accepted-risk note rather than a demand — but the About/AI settings copy could warn users to use a low-limit, scoped key.
> Note: This will change to a backend AI provider in a future PR, no need to address it now.

### [x] 13. Label-scan serving size is dropped if "Save as custom food" is checked *after* scanning

`AddEntryDialog.vue:192-195` — the scanned `servingSize`/`servingUnit` are only applied when the checkbox is already ticked at scan time. Store them unconditionally and let the checkbox merely control visibility.

### [x] 14. Snack cards keyed by name

`RecommendPage.vue:143` — the model can return duplicate names → duplicate `:key` warning and glitchy re-render. Key by index or a generated id.

### [x] 15. Consecutive snackbars don't restart the timer

`src/stores/app.ts:11-15` — if a snackbar is already open, `showSnackbar` just swaps the text; the 3s timeout from the first message keeps ticking. Toggle `snackbar.value = false` then `true` on `nextTick`.

### [x] 16. `filterByName` returned as a store action

`src/stores/foods.ts:116` — it's a pure helper; export it from the module (or `utils/`) instead of routing it through Pinia.

### [ ] 17. Double rounding

`DailySummaryCard.vue:18` wraps `store.progressPercentages` in `Math.round` although the store already rounds (`dailyLog.ts:43-46`).

### [ ] 18. `plugins/index.ts` style drift

Semicolons, one-space indent, and imports placed above the file comment, unlike every other file. Also `EditEntryDialog`'s inline multiply vs. the named helper elsewhere.

### [ ] 19. Icon-only buttons lack accessible names

The edit/delete/FAB/AI buttons have tooltips at best; add `aria-label` so screen readers announce them.

### [ ] 20. Deploy rsync never deletes

`.github/workflows/deploy.yml` — without `--delete`, old hashed bundles accumulate on the server forever. (Deliberately keeping one previous generation is fine, but unbounded growth probably isn't intended.)

### [ ] 21. `v-list` wrapping expansion panels

`DailyHistoryList.vue:4` wraps `v-expansion-panels` in a `v-list` for no layout benefit, and the card renders header-only (no empty-state text) before data loads.

---

## Suggested priority

Fix **#1** (transactional import) and **#2** (numeric input sanitization) before anything else — both are reachable through normal UI use and write bad state to IndexedDB, where it persists. **#3–#7** are worthwhile in the next pass; the rest are opportunistic.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
