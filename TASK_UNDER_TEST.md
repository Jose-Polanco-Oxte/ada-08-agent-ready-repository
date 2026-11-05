# Task Under Test

Change ID: CR-01

## Goal
Implement category-based filtering in NoteRepository by adding a `filterByCategory(category)` method that returns stored notes matching the specified category, preserving chronological descending order and entity immutability.

## Requirements Covered
- FR-04: Note Filtering by Category
- AC-04.1: Retrieve notes matching valid category in descending order
- AC-04.2: Return empty array when valid category has no matching notes
- AC-04.3: Reject invalid or non-string category inputs with descriptive error
- AC-04.4: Invariant preservation (entities remain frozen; no mutation or deletion)

## Verification
Automated unit tests covering valid category retrieval, zero matches, invalid category error handling, and immutability validation. All tests must execute cleanly via test runner.

## Constraints
- Use REQUIREMENTS.md and SPEC.md as the source of truth.
- Keep changes scoped to this task.
- Do not redefine requirements in this file.
