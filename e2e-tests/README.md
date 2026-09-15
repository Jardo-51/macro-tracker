# End-to-end tests

Playwright, driving the **production build** in a browser: `pnpm build` and a
`vite preview` server are started by `playwright.config.ts`, so a run checks the
minified bundle, the lazy route chunks and the service worker, not the dev
server.

## Running them

The browsers do not come from `playwright install` — they come from nixpkgs
instead, via the `playwright` shell in `flake.nix`:

```sh
nix develop .#playwright -c pnpm test:e2e
```

That shell exports `PLAYWRIGHT_BROWSERS_PATH` (at `playwright-driver.browsers`)
and `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS`. Outside it, a run fails with
*"Executable doesn't exist"* — unless you have run `playwright install`
yourself, which is fine too, but then CI and your machine are driving different
binaries.

CI runs them through the same shell (`.github/workflows/e2e-tests.yml`).

Useful variations:

```sh
nix develop .#playwright -c pnpm test:e2e pwa.spec.ts   # one file
nix develop .#playwright -c pnpm test:e2e --headed      # watch it
nix develop .#playwright -c pnpm test:e2e --debug       # step through it
pnpm test:e2e:report                                    # last HTML report
```

### The preview port is shared

`playwright.config.ts` starts `vite preview` on **4173** and, outside CI, reuses
whatever is already answering there (`reuseExistingServer`). If another vite
project on this machine left a preview server on that port, a run silently
drives *that* app instead, and every locator fails with "element(s) not found"
against a page you did not build. Reuse also skips `pnpm build`, so a preview
server left over from an hour ago gives you a green run against a **stale
bundle** — and that one does not announce itself at all. Check with
`ss -ltnp | grep 4173` when a run fails that way.

Move out of the way with `E2E_PORT`, rather than editing tracked config:

```sh
E2E_PORT=4273 nix develop .#playwright -c pnpm test:e2e
```

### Keeping the versions in step

`playwright-driver.browsers` pins one set of browser revisions and
`@playwright/test` in `package.json` is pinned exactly (no caret) to match.
Nothing in the package manager knows about that coupling, so
`scripts/check-playwright-pin.sh` is the guard for it — its header explains the
failure mode it exists to catch, and it rejects both a drifted version and a
range spec:

```sh
pnpm check:playwright-pin
```

CI runs it in `e2e-tests.yml` **before** the suite, so the diagnosis arrives
ahead of the failure it explains. To bump the two sides together deliberately,
move the npm side to whatever the check reports:

```sh
pnpm add -D @playwright/test@<version the check printed>
```

## The suites

These cover the things that only a real browser can show — a service worker, a
reload, and data read back out of IndexedDB. Everything that is a pure function
or a store in isolation belongs in the Vitest suite under `src/**/__tests__/`
instead; it runs in seconds and does not need a build.

What each suite covers, and what it deliberately does not, is in its own
docblock — that is where it stays in step with the assertions. In outline:

- `pwa.spec.ts` — the service worker: the app with the network cut, still
  routing, still reading its entries back and still able to log new ones. For an
  offline-first food log this is the one to keep green.
- `settings.spec.ts` — the two kinds of persisted setting: the theme, which is a
  localStorage string, and the daily goals, which are a row in IndexedDB.
- `dialogs.spec.ts` — the add dialogs staying open, and keeping what has been
  typed, through the gestures that used to discard it: a tap on the scrim and an
  Escape. Only a browser has a scrim to tap.

Nothing here touches the OpenAI-backed features (estimate, label scan,
recommend). They are network calls to a third party behind a key the suite does
not have; testing them means deciding what to stub, which is a separate piece of
work from this setup.

## Conventions

These are what the suites follow, and what a new one should.

- **Drive the app the way a user does**: the bottom nav, the buttons, the
  dialogs. Reaching past that — into IndexedDB, localStorage, `window` — is for
  a test whose subject has no form on screen at all, and each helper that does
  it should say in a comment why it is one of those. `serviceWorkerReady` is not
  a precedent for it: it reads `navigator.serviceWorker`, the browser rather
  than the app, and nothing is asserted on what it returns — it is the wait that
  makes cutting the network a test instead of a race.
- **Assert with `expect`, which retries. No sleeps.** Waiting for something
  means waiting for the thing on screen that says it happened, not for a
  plausible number of seconds to pass.
- **Snackbars sit over the bottom nav and the add-entry FAB, and swallow clicks
  aimed at them** — the helpers call `settle()` before navigating or opening the
  dialog. `App.vue`'s snackbar has no close button, so `settle()` waits its
  timeout out; it returns at once when there is none, so after a *mutating*
  action use `expectSnackbar()`, which waits for the message to appear first.
  Never dismiss one by pressing its button: the only button it ever has is the
  *Undo* on a deleted entry.
- **Match names with `exact: true`.** Playwright matches an accessible name as a
  case-insensitive substring by default, so `getByRole('button', { name: 'Add' })`
  also finds the *Add entry* FAB.
