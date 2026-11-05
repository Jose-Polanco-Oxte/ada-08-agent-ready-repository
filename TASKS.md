# Task Registry (TASKS)

This file tracks planned, active, and completed technical changes with traceability to requirements.

| Change ID | Title | Covered Requirements | Target Components | Status |
|---|---|---|---|---|
| `CR-01` | Implement category-based filtering in NoteRepository | `FR-04`, `AC-04.1`, `AC-04.2`, `AC-04.3`, `AC-04.4` | `js/storage.js`, `tests/notes.test.mjs` | **COMPLETED (Verified by AFTER Run)** |
| `CR-02` | Implement keyword search in NoteRepository | `FR-05`, `AC-05.1`, `AC-05.2` | `js/storage.js`, `tests/notes.test.mjs` | Planned |
| `CR-03` | Implement export of notes to JSON/CSV | `FR-06`, `AC-06.1` | `js/app.js`, `js/storage.js` | Backlog |

---

## Active Task: CR-01
- **File:** `TASK_UNDER_TEST.md`
- **Assigned Scope:** Addition of `filterByCategory(category)` method in `NoteRepository`.
- **Validation Mandate:** 100% automated test coverage in `tests/notes.test.mjs` and zero regressions on existing tests.
