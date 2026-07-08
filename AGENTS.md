# AGENTS.md

## Cursor Cloud specific instructions

Smart Clerking Assistant is a **100% client-side static web app** (vanilla HTML/CSS/JS). There is **no backend, database, API, build step, or package manager** — no `package.json`/lockfile exists. Data persists only in the browser's `localStorage` (key `smartClerking:v1`).

### Services
- **App (single service):** static files (`index.html`, `styles.css`, `js/*.js`). Serve the repo root over HTTP, e.g. `python3 -m http.server 8000` (or `npx --yes serve .` per README), then open `http://localhost:8000/index.html`. Opening `index.html` via `file://` also works, but serving over a stable origin is preferred since `localStorage` is scoped to the origin.

### Test / lint / build
- **Tests:** `node tests/storage.test.js` (plain Node, no framework/deps; prints a pass count and exits non-zero on failure).
- **Lint:** none configured.
- **Build:** none — files are loaded directly via `<script>` tags in `index.html`.

### Notes
- Nothing to install; the startup update script is effectively a no-op.
- JS modules (`js/localStore.js`, `js/knowledge.js`) are dual-purpose: they attach to browser globals and also `module.exports` so the Node test file can import them.
