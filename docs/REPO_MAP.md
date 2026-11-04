# Repository Map

Quick navigation guide for coding agents and human engineers: answers *"where is what I need?"* without guessing or full-tree scanning.

---

## 1. Entry Points
- `index.html` - Web application bootstrap, accessible DOM structure.
- `js/app.js` - UI controller, DOM event bindings, state orchestration.
- `js/models.js` - Domain entities (`NoteModel`), validation logic, schema constants.
- `js/storage.js` - Persistence repository (`NoteRepository`), memory fallback, result wrapper (`StorageResult`).

---

## 2. Tests
- `tests/notes.test.mjs` - Automated test suite running with Node.js built-in test runner (`node:test`).
  - Suite 1: Domain Model Validation & Creation
  - Suite 2: Architectural Invariant: No Deletion Capability
  - Suite 3: Persistence: In-Memory Fallback & Retrieval
  - Suite 4: Query & Filtering (FR-04 category filtering tests)

---

## 3. Change Guide

### If modifying or adding Domain Rules:
1. Consult `REQUIREMENTS.md` and `SPEC.md`.
2. Update `js/models.js`.
3. Add corresponding unit tests in `tests/notes.test.mjs`.
4. Run verification: `npm.cmd test` or `./scripts/verify_repo.sh`.

### If modifying or adding Storage Queries:
1. Consult `REQUIREMENTS.md` and `SPEC.md`.
2. Inspect `js/storage.js`.
3. Respect strict invariants: **DO NOT** add any delete/remove/clear methods.
4. Maintain `StorageResult` wrapper contract: return `StorageResult.ok(data)` or `StorageResult.fail(error)`.
5. Add unit tests in `tests/notes.test.mjs`.
6. Run verification: `./scripts/verify_repo.sh` or `npm.cmd test`.

---

## 4. Do Not Edit Directly
- `package.json` dependencies (do not add third-party runtime dependencies; zero-dependency constraint).
- Invariant assertions in `tests/notes.test.mjs` (never remove or weaken architectural assertions).
- Git repository metadata and baseline history.
