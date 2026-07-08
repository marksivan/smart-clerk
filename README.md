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

Publish this repository (or `/docs` / Actions workflow) as a static site. Keep the Pages URL stable after records are created — changing origin clears access to existing `localStorage` data. Export a backup before any URL or domain change.

Do not commit patient records, exported backups, or private clinical content. Only fictional sample knowledge belongs in the repo.

## Data model (v1)

Top-level store: `schemaVersion`, `patients[]`, `encounters[]`.  
Patients hold demographics; encounters hold history, exam, vitals, labs, findings, questions, differentials, and plans.
