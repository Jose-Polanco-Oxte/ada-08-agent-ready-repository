# AGENTS.md

Operational contract and guidelines for autonomous coding agents working on this repository.

---

## 1. Read First
Before inspecting arbitrary files or proposing code changes, read these documents in order:
1. `REQUIREMENTS.md` — Authoritative functional and non-functional requirements.
2. `SPEC.md` — Verifiable acceptance criteria with requirements traceability.
3. `ARCHITECTURE.md` — Layer boundaries, component contracts, and architectural invariants.
4. `TASKS.md` — Active and planned work items.
5. `docs/REPO_MAP.md` — Navigation map and component change guides.

---

## 2. Sources of Truth
- **Requirements** live strictly in `REQUIREMENTS.md`.
- **Verifiable behavior & acceptance criteria** live strictly in `SPEC.md`.
- **Architectural boundaries & invariants** live in `ARCHITECTURE.md`.
- **Do not redefine or duplicate requirements** inside agent instructions, prompts, or task summaries.
- **Do not modify requirements or specifications** merely to make failing tests pass.

---

## 3. Repository Map
- `index.html`: UI entrypoint and accessible interface.
- `js/models.js`: Domain models, schema validation (`NoteModel`, `VALID_CATEGORIES`, `CONSTRAINTS`).
- `js/storage.js`: Persistence repository (`NoteRepository`, `StorageResult`).
- `js/app.js`: UI controller and event bindings.
- `tests/`: Automated unit tests (`tests/notes.test.mjs`).
- `docs/`: Architecture guides and repository map (`docs/REPO_MAP.md`).
- `scripts/`: Deterministic verification and repository contract checks.
- `results/`: Test and audit evidence reports.

---

## 4. Standard Commands
- **Install:** No dependencies to install (`npm --version` / Vanilla JS).
- **Run Locally (Browser):** Open `index.html` in a web browser, or run `npx serve .` / `python -m http.server 8080`.
- **Run Tests:**
  - Windows: `npm.cmd test` or `node --test tests/notes.test.mjs`
  - Linux / macOS / Bash: `npm test` or `node --test tests/notes.test.mjs`
- **Lint / Syntax Check:** `node --check js/models.js js/storage.js js/app.js`
- **Contract Check:** `python scripts/check_repo_contract.py`
- **Unified Full Verification:**
  - Linux / Bash: `./scripts/verify_repo.sh`
  - Windows PowerShell: `powershell -ExecutionPolicy Bypass -File ./scripts/verify_repo.ps1`

---

## 5. Change Rules
- **Strict Scope Boundary:** Keep code changes strictly scoped to the assigned task in `TASK_UNDER_TEST.md`.
- **Preserve Architectural Invariants:**
  - Strictly **NO DELETION**: Never add methods named `delete`, `remove`, `destroy`, `clear`, `pop`, or `truncate` to `NoteRepository`.
  - Strictly **IMMUTABLE ENTITIES**: All note entities returned must remain frozen (`Object.isFrozen`).
- **No Unapproved Infrastructure Modifications:** Do not modify `StorageResult` wrapper shape or signature without explicit task mandate.
- **No Third-Party Runtime Dependencies:** Do not add npm packages to `dependencies` in `package.json`.
- **Preserve Existing Tests:** Never weaken, bypass, or delete existing assertions in `tests/notes.test.mjs`.

---

## 6. Stop Conditions
Stop immediately and request human clarification if:
1. Requirements or acceptance criteria conflict with architectural invariants.
2. A task explicitly or implicitly demands removing the creation-only / no-deletion invariant.
3. An unresolvable dependency, broken runtime environment, or external blocker prevents clean verification.
4. An action requires deleting existing files or modifying Git history.

---

## 7. Definition of Done (DoD)
A task is DONE only when all of the following are satisfied:
1. Requested change satisfies acceptance criteria in `SPEC.md`.
2. All unit tests in `tests/notes.test.mjs` pass cleanly without regressions.
3. New unit tests provide 100% coverage for the new feature and edge cases.
4. Repository contract validation passes cleanly (`python scripts/check_repo_contract.py`).
5. Unified verification passes cleanly (`./scripts/verify_repo.sh` or `./scripts/verify_repo.ps1`).
6. Evidence of passing validation is documented.
