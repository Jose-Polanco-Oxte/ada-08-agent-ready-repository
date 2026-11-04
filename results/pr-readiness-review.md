# PR Readiness Review

## Review Context
PR / Branch: PR #2 (`feature/phone-search` into `main`)
Reviewer Agent: Coding Agent (reviewing-pull-requests skill)
Date: 2026-10-08

## Requirements / Acceptance Criteria Reviewed
- Documentos normativos consultados: `REQUIREMENTS.md` y `SPEC.md`.
- Alcance original especificado:
  - Búsqueda de clientes por nombre (`FR-01`), correo electrónico (`FR-02`), y unificada (`FR-03`).
  - Validación de campos permitidos (`V-03`): `{"all", "name", "email"}`.
  - Validación de términos y longitud mínima (`FR-04`, `V-01`, `V-02`).
  - Filtro por estado y salida tabular en CLI (`FR-05`, `FR-06`, `AC-06`).
  - Restricción arquitectónica de solo biblioteca estándar de Python (`C-01`).
- Evaluación de los cambios:
  - El PR implementa la capacidad de buscar por número telefónico (`phone`) tanto individualmente como en el modo unificado (`all`), modificando `ALLOWED_FIELDS` en `src/search_service.py` y los argumentos de `src/cli.py`.
  - No obstante, esta capacidad representa una regla de negocio y comportamiento no documentado en `REQUIREMENTS.md` ni en `SPEC.md`, creando una divergencia normativa directa con la Regla V-03.

## Test Evidence
- Comando ejecutado: `pytest -v`
- Resultado: 33 pruebas ejecutadas, 33 exitosas (0.24 segundos). Cobertura y rendimiento válidos (< 50ms por NFR-01).
- Pruebas modificadas y agregadas analizadas:
  - `tests/test_search_service.py::test_search_by_phone_partial`: Agrega cobertura para coincidencia parcial en teléfono tanto con `field="phone"` como con `field="all"`.
  - `tests/test_validation.py::test_invalid_field_error`: Se sustituyó `'phone'` por `'address'` como ejemplo de campo no permitido. Esto confirma que anteriormente la especificación prohibía de forma explícita el campo `'phone'`.
  - Las 31 pruebas unitarias, de rendimiento y CLI existentes continúan pasando limpiamente, garantizando que no se introdujeron regresiones funcionales en las características previas.

## MUST FIX

### RF-01
Requirement / AC: Violación de la regla normativa V-03 (`SPEC.md`) y requerimientos funcionales FR-01 / FR-03 (`REQUIREMENTS.md`).
File: `src/search_service.py` (líneas 40, 105-115) y `src/cli.py` (líneas 66-72).
Evidence:
- `SPEC.md` establece taxativamente:
  > "Regla V-03 (Campo válido): El campo de búsqueda debe pertenecer a `{"all", "name", "email"}`. Cualquier otro valor lanzará `InvalidFieldError`."
- El código en `src/search_service.py` modifica la constante a:
  > `ALLOWED_FIELDS = {"all", "name", "email", "phone"}`
- `REQUIREMENTS.md` define en la historia de usuario y en FR-03 que la búsqueda global sólo evalúa nombre y correo electrónico.
Problem:
El Pull Request incorpora una regla de negocio y una extensión del alcance del producto sin haber actualizado previamente la especificación ni los requerimientos normativos aprobados. Esto introduce deuda técnica y rompe la política de desarrollo guiado por especificación (Spec-Driven Development).
Recommended next step:
Detener la integración hasta que el equipo humano decida si formaliza el cambio (actualizando `REQUIREMENTS.md` con un nuevo requerimiento FR-07 y `SPEC.md` con la actualización de V-03 y criterios de aceptación) o si revierte los cambios en `search_service.py` y `cli.py` para apegarse al alcance original.

## SHOULD FIX

### SF-01
Requirement / AC: Mantenibilidad y trazabilidad documental (NFR-02).
File: `docs/traceability.md`
Evidence:
El archivo `docs/traceability.md` no contiene registro del soporte de búsqueda por teléfono ni de la prueba unitaria `test_search_by_phone_partial`.
Problem:
Si el cambio es aceptado, la matriz de trazabilidad quedará desactualizada respecto al código implementado.
Recommended next step:
En caso de que el revisor humano autorice incorporar la búsqueda por teléfono, actualizar la matriz de trazabilidad incluyendo el nuevo requerimiento y sus pruebas correspondientes.

## OPTIONAL

### OP-01
Requirement / AC: Robustez de búsqueda y usabilidad.
File: `src/search_service.py` (línea 105)
Evidence:
La comparación telefónica se realiza con `norm_phone = normalize_text(customer.phone)` y `norm_query in norm_phone`.
Problem:
`normalize_text` elimina acentos y pasa a minúsculas, pero conserva espacios y caracteres como `+` o `-`. Si un usuario busca el teléfono continuo "9991234567", no coincidirá con un registro almacenado como "+52 999 123 4567".
Recommended next step:
Evaluar para una futura iteración una función de saneamiento que compare únicamente los dígitos numéricos eliminando caracteres no alfanuméricos.

## Open Questions
- ¿La adición del campo de teléfono responde a una petición formal de producto o fue una iniciativa no solicitada del desarrollador?
- En caso de conservarse, ¿la búsqueda global unificada (`field="all"`) debe incluir teléfono o únicamente nombre y correo para evitar coincidencias inesperadas?

## Final Review Summary
MUST FIX count: 1
SHOULD FIX count: 1
OPTIONAL count: 1

Human decision required:
YES
