# Smart Clerking Assistant

Admin/clinician-facing clerking workspace (MVP). Patients do not use this application.

**Decision support — clinician verification required.**

## What this MVP does

- Search / create patients (UUID-based; updates by ID, not append-only duplicates)
- Document encounters separately from patient identity
- Symptom chips with autocomplete from a sample knowledge pack
- Generate follow-up questions; record answers and pertinent negatives
- Rank explainable differential suggestions and draft an editable plan
- Red-flag and lab alerts from explicit rules
- Autosave status, JSON export/import with validation report, reset with backup warning
- Browser `localStorage` only (`smartClerking:v1`) for demo / controlled use

## What it does not do

- No patient portal, autonomous diagnosis, or automatic prescribing
- No multi-device sync, shared hospital database, or institutional access control
- Not a production clinical-record system

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
npx --yes serve .
```

## Tests

```bash
node tests/storage.test.js
```

## GitHub Pages

**Live URL (after you enable Pages once):**  
https://marksivan.github.io/health-express/

A 404 means Pages is not enabled yet. The app files are on `main`, but GitHub will not serve them until Pages is turned on.

### One-time setup (repo owner)

1. Open **Settings → Pages**  
   https://github.com/marksivan/health-express/settings/pages
2. Under **Build and deployment → Source**, choose **GitHub Actions**  
   (or **Deploy from a branch** → `main` → `/` root).
3. If using Actions: open the **Actions** tab, run **Deploy GitHub Pages**, wait until it is green.
4. Wait 1–2 minutes, then open https://marksivan.github.io/health-express/

Keep that URL stable after records are created — changing origin clears access to existing `localStorage` data. Export a backup before any URL or domain change.

Do not commit patient records, exported backups, or private clinical content. Only fictional sample knowledge belongs in the repo.

## Data model (v1)

Top-level store: `schemaVersion`, `patients[]`, `encounters[]`.  
Patients hold demographics; encounters hold history, exam, vitals, labs, findings, questions, differentials, and plans.
