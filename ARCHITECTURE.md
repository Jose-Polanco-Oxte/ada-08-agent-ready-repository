# Architecture & System Boundaries

## 1. Architectural Style & Layers
The system follows a strict 3-tier unidirectional decoupled architecture designed for predictability and testability:

```
[ Presentation Layer: DOM / HTML / CSS ]
                   ↓ (calls controller)
[ Application Layer: js/app.js (UI Controller & Event Orchestration) ]
                   ↓ (creates & queries)
[ Domain Layer: js/models.js (Entities, Validation, Schema Invariants) ]
                   ↓ (persists entities)
[ Persistence Layer: js/storage.js (NoteRepository, StorageResult, LocalStorage/Memory) ]
```

---

## 2. Component Responsibilities

| Layer / File | Primary Responsibility | Allowed Dependencies | Prohibited Actions |
|---|---|---|---|
| `js/models.js` | Domain models, validation schema (`CONSTRAINTS`), entity factory (`NoteModel.create`), immutability enforcement. | Pure JavaScript (zero imports). | DOM operations, network calls, storage operations. |
| `js/storage.js` | Persistence abstraction (`NoteRepository`), fallback switching, versioning, querying. | Imports `NoteModel` & `VALID_CATEGORIES` from `models.js`. | Any deletion/removal method (`delete`, `remove`, `clear`). Modifying `StorageResult` signature without mandate. |
| `js/app.js` | UI rendering, DOM event handlers, accessibility announcements (WCAG AA). | Imports models & storage. | Direct persistence manipulation bypassing repository. Bypassing domain validation. |
| `index.html` & `css/` | Accessible UI markup and styling. | Standard web standards. | Inline script execution, unescaped user inputs. |

---

## 3. Strict Architectural Invariants
1. **Creation-Only Invariant (Audit Trail):**
   - The system is an append-and-query system.
   - No deletion, clearing, or in-place modification of existing notes is permitted in any layer.
2. **Entity Immutability:**
   - Every note returned or created is deeply frozen with `Object.freeze()`.
3. **Resilient Persistence:**
   - Persistence failures (such as `QuotaExceededError` or blocked `localStorage`) must degrade gracefully to in-memory storage without breaking the user session.
4. **Zero-Build Dependency:**
   - Core modules must execute in standard browsers using UMD/IIFE wrappers and in Node.js test runners using CommonJS/ESM interop.
