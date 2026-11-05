# Implicit Knowledge Found

## IK-01: PowerShell Script Execution Policy for NPM
- **What:** On Windows PowerShell, executing `npm test` invokes `npm.ps1`, which fails immediately with a `PSSecurityException` due to Windows Execution Policy. The test command must be executed via `npm.cmd test` or directly via `node --test tests/notes.test.mjs`.
- **How was it discovered:** The agent ran `npm test` and encountered an `UnauthorizedAccess` error, forcing it to test alternative command invocations.
- **Should this remain implicit?** NO.
- **Where should it become explicit?** `AGENTS.md` (Standard Commands) and `scripts/verify_repo.sh` / `scripts/verify_repo.ps1`.

---

## IK-02: Missing Canonical Specifications and Requirement IDs
- **What:** Requirement identifiers (such as `FR-04` and `AC-04`) and business invariants were not codified in structured files (`REQUIREMENTS.md` and `SPEC.md`); they existed solely in human descriptive text inside `README.md` and test case descriptions.
- **How was it discovered:** The agent ran multiple filesystem greps and git log queries looking for `REQUIREMENTS.md` and `SPEC.md`, finding nothing.
- **Should this remain implicit?** NO.
- **Where should it become explicit?** `REQUIREMENTS.md`, `SPEC.md`, `ARCHITECTURE.md`, and `TASKS.md`.

---

## IK-03: Architectural Invariant of Strict Creation-Only / Non-Deletion
- **What:** The note system strictly forbids any deletion, removal, or destructive methods (`delete`, `remove`, `clear`, `pop`, `destroy`) in `NoteRepository`. Any implementation of deletion violates the system invariant.
- **How was it discovered:** Found in a single paragraph in `README.md` and in an assertion loop in `tests/notes.test.mjs`.
- **Should this remain implicit?** NO.
- **Where should it become explicit?** `AGENTS.md` (Change Rules & Stop Conditions), `docs/REPO_MAP.md`, `ARCHITECTURE.md`, and automated in `scripts/check_repo_contract.py`.

---

## IK-04: Scope Boundary and Inviolable Classes
- **What:** `StorageResult` is an internal infrastructure wrapper and must not have its API surface expanded or altered during bounded feature tasks without explicit approval.
- **How was it discovered:** The agent casually added `[Symbol.iterator]` to `StorageResult` during BEFORE because there was no explicit boundary warning against modifying core infrastructure classes.
- **Should this remain implicit?** NO.
- **Where should it become explicit?** `AGENTS.md` (Change Rules: *"Keep changes scoped to the requested task"*, *"Do not modify storage infrastructure wrappers without explicit task mandate"*), and `docs/REPO_MAP.md` (Change Guide).

---

## IK-05: Single Deterministic Verification Contract
- **What:** To declare a change "DONE", running unit tests alone is insufficient: files must be checked against repository contracts, code syntax/style must be validated, and no sensitive or unwanted files may be committed.
- **How was it discovered:** The agent only ran unit tests and assumed the task was complete, lacking any holistic verification step.
- **Should this remain implicit?** NO.
- **Where should it become explicit?** `scripts/verify_repo.sh`, `scripts/check_repo_contract.py`, `AGENTS.md` (Definition of Done), and `.github/workflows/verify.yml`.
