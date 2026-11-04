# Professional Skill Review — code-review-and-quality

**Reviewer:** Addy Osmani's `code-review-and-quality` (invocada por coding agent)  
**Target:** Branch `feature/phone-search` vs `main` (PR #2)  
**Date:** 2026-10-08  
**Repository:** `Jose-Polanco-Oxte/ada-05-spec-driven-feature`  

---

## 1. Context & Verification Story
- **Propósito del cambio:** Se añade la funcionalidad de búsqueda de clientes por número telefónico (`phone`) tanto de forma individual como en la búsqueda global unificada (`all`), extendiendo el servicio y los parámetros de línea de comandos en `cli.py`.
- **Archivos modificados en el diff:**
  - `src/cli.py` (+2 / -2)
  - `src/search_service.py` (+4 / -1)
  - `tests/test_search_service.py` (+16 / -0)
  - `tests/test_validation.py` (+2 / -2)
- **Suite de pruebas:** Se ejecutó `pytest -v`.
  - 33 tests pasados en 0.24 segundos.
  - La nueva prueba `test_search_by_phone_partial` cubre coincidencia parcial directa y en modo `all`.
  - La prueba `test_validation.py` adaptó el caso de error de `phone` a `address`.
- **Composición de Skills identificada:**
  - La skill sugiere componer con `security-and-hardening` para análisis de validación de entradas telefónicas y `performance-optimization` para inspección de costos de normalización Unicode en colecciones de gran tamaño.

---

## 2. Five-Axis Assessment

### Eje 1: Correctness (Corrección)
- **Evaluación:** El código implementa la lógica de búsqueda por subcadena de forma coherente con los campos existentes (`name` y `email`). Sin embargo, entra en contradicción directa con la especificación normativa del proyecto (`SPEC.md` Regla V-03) que estipula únicamente `{"all", "name", "email"}`. Además, la docstring del método `search` no fue actualizada.

### Eje 2: Readability & Simplicity (Legibilidad y Simplicidad)
- **Evaluación:** El código es limpio y directo, pero sufre de un antipatrón de cálculo prematuro: en cada iteración del bucle `for customer in all_customers:`, se normalizan ansiosamente `name`, `email` y `phone` con Unicode NFKD antes de comprobar qué campo se está buscando. Si el usuario filtra únicamente por `name`, normalizar el teléfono de los 1,000 registros es trabajo redundante.

### Eje 3: Architecture (Arquitectura)
- **Evaluación:** Se respeta la separación entre capa CLI y servicio de dominio. No obstante, existe fuga de alcance: el cambio altera las invariantes del contrato público del servicio sin un proceso de RFC o actualización de especificación previa.

### Eje 4: Security (Seguridad)
- **Evaluación:** La función `normalize_text` maneja valores `None` de forma segura devolviendo `""`, evitando excepciones `AttributeError` en clientes sin teléfono. No hay inyección SQL ni secretos expuestos.

### Eje 5: Performance (Rendimiento)
- **Evaluación:** La prueba de latencia `test_search_latency_under_50ms_for_1000_customers` continúa pasando (< 50ms). Sin embargo, la triple normalización NFKD por cliente dentro del bucle añade costo innecesario de CPU en colecciones extensas.

---

## 3. Findings

### Finding 1: Spec and Contract Drift
- **Severity:** Required (Bloqueante antes de merge)
- **File / Evidence:** `src/search_service.py` (Línea 40, `ALLOWED_FIELDS`) y `src/cli.py` (Líneas 66-70) vs `SPEC.md` (Regla V-03).
- **Engineering Rationale:**
  En desarrollo guiado por especificación, el código no debe preceder a los requerimientos normativos. `SPEC.md` define que los campos válidos son exclusivamente `all`, `name` y `email`. Modificar el conjunto permitido sin actualizar la especificación ni la historia de usuario genera deuda arquitectónica y rompe el contrato acordado con los clientes de la API.
- **Recommended Action:**
  Requerir aprobación del revisor humano y actualizar `SPEC.md` y `REQUIREMENTS.md` con la nueva regla formal, o revertir la inclusión de `phone`.

### Finding 2: Incomplete Method Documentation
- **Severity:** Nit (Opcional / cosmético)
- **File / Evidence:** `src/search_service.py` (Línea 83, docstring de `search`).
  ```python
  :param field: Campo a evaluar ('all', 'name', 'email').
  ```
- **Engineering Rationale:**
  La firma del método acepta ahora `"phone"`, pero la documentación docstring del servicio omitió reflejar este cambio, desorientando a futuros desarrolladores e IDEs.
- **Recommended Action:**
  Actualizar la anotación a `:param field: Campo a evaluar ('all', 'name', 'email', 'phone').`

### Finding 3: Eager Multi-Field Normalization in Loop
- **Severity:** Consider (Sugerencia de optimización / arquitectura)
- **File / Evidence:** `src/search_service.py` (Líneas 103-105):
  ```python
  norm_name = normalize_text(customer.name)
  norm_email = normalize_text(customer.email)
  norm_phone = normalize_text(customer.phone)
  ```
- **Engineering Rationale:**
  La descomposición canónica Unicode NFKD es costosa computacionalmente. Calcular las tres cadenas normalizadas de cada cliente independientemente de la rama `if field == ...` desperdicia ciclos de CPU cuando la consulta se restringe a un solo campo (e.g. `field == "name"`).
- **Recommended Action:**
  Evaluar de forma diferida (*lazy evaluation*):
  ```python
  if field == "name":
      match = norm_query in normalize_text(customer.name)
  elif field == "email":
      match = norm_query in normalize_text(customer.email)
  elif field == "phone":
      match = norm_query in normalize_text(customer.phone)
  elif field == "all":
      match = (norm_query in normalize_text(customer.name)) or \
              (norm_query in normalize_text(customer.email)) or \
              (norm_query in normalize_text(customer.phone))
  ```

---

## 4. Final Verdict

- [ ] **Approve** — Ready to merge
- [X] **Request changes** — Issues must be addressed

**Human decision required:**
El cambio no puede integrarse a la rama principal hasta que un revisor humano decida sobre el Finding 1 (discrepancia normativa con `SPEC.md`).
