# Comparación de Skills de Revisión de Código — ADA-07

**Estudiante:** José Antonio Polanco Oxté  
**Asignatura:** Ingeniería de Software asistida por IA · UADY  
**Fecha:** 2026-10-08  
**Cambio Evaluado:** Rama `feature/phone-search` vs `main` (PR #2) en repositorio `Jose-Polanco-Oxte/ada-05-spec-driven-feature`  

---

## 1. Datos de Identificación y Fuente (Parte II)

- **Repositorio de origen:** https://github.com/addyosmani/agent-skills
- **Skill seleccionada:** `code-review-and-quality`
- **Autor / Mantenedor:** Addy Osmani
- **Commit inspeccionado:** `1401c8b8030e023baeebb31781a6653fe8e93026`
- **Ruta instalada local:** `.agents/skills/code-review-and-quality/`
- **Skill propia comparada:** `reviewing-pull-requests` (v1.0.1)

---

## 2. Matriz Comparativa Multidimensional

| Dimensión | Tu Skill (`reviewing-pull-requests`) | Profesional (`code-review-and-quality`) | Conclusión |
|---|---|---|---|
| **Trigger / routing** | Altamente enfocado en "PR readiness" y verificación de ramas contra especificaciones del repositorio. | Amplio; cubre cualquier revisión de código previa a merge, diffs inline y código escrito por humanos u otros agentes. | La profesional es un enrutador general de calidad; la mía actúa como una compuerta especializada de pre-revisión de PRs. |
| **Scope / boundaries** | Estrictamente Draft-Only; no modifica código, no hace merge ni comentarios en GitHub; produce un reporte local. | Asesora y emite veredicto (`Approve` / `Request changes`); prohíbe borrado silencioso de código muerto ("Ask before deleting"). | Mi skill impone barreras de contención más rígidas; la profesional modela un flujo interactivo de pair programming. |
| **Workflow depth** | Flujo secuencial de 10 pasos con validación determinista obligatoria mediante script Python. | Flujo de 5 pasos con "quality gates", técnicas de prueba por mutación, análisis de tamaño de cambio y reglas de dependencias. | La profesional posee mayor riqueza en heurísticas de ingeniería de software; mi skill destaca por automatización determinista. |
| **Correctness** | Centrada en el cumplimiento estricto de la especificación (`REQUIREMENTS.md`, `SPEC.md`) y paso de tests. | Evalúa cumplimiento de spec, pero profundiza en caminos de error, valores frontera y mutación lógica de condiciones. | Ambas detectaron la falta de cobertura en la spec; la profesional indaga más en la robustez intrínseca del código. |
| **Architecture** | Revisa fronteras de capas documentadas en `ARCHITECTURE.md` y coherencia de módulos. | Analiza antipatrones como reubicar complejidad en lugar de reducirla, fugas de lógica a módulos compartidos y tamaño de archivo. | La profesional ofrece un marco de razonamiento arquitectónico más maduro y aplicable a sistemas grandes. |
| **Security** | Checklist directo: ausencia de credenciales, permisos mínimos y saneamiento de entradas externas. | Principios de datos no confiables en fronteras, saneamiento y delegación modular a `security-and-hardening`. | Ambas son efectivas; la profesional utiliza composición externa para no inflar su propio contexto. |
| **Performance** | Verificación del cumplimiento del requisito no funcional medible en tests (< 50ms según NFR-01). | Detección proactiva de antipatrones de diseño, tales como cálculos ansiosos en bucles o problemas N+1. | La profesional descubrió un cálculo redundante en CPU que mi skill pasó por alto porque el test pasaba en 0.24s. |
| **Tests / verification** | Ejecución de `pytest -v`, verificación de pruebas agregadas y no regresión de la suite existente. | Regla "Review Tests First" y verificación experimental por mutación (invertir una condición para asegurar que falle). | El enfoque de mutación de la profesional previene aserciones triviales o falsos positivos con mayor eficacia. |
| **Severity model** | 3 niveles rígidos: `MUST FIX`, `SHOULD FIX`, `OPTIONAL`. | 5 niveles con prefijos explícitos: `Critical:`, `Required` (sin prefijo), `Consider:`, `Nit:`, `FYI:`. | La granularidad de la profesional (`Nit` vs `Consider`) reduce fricción en la comunicación con el autor. |
| **Human review** | Reporte escrito que culmina en `Human decision required: YES`. No toma veredicto de merge. | Emite una recomendación de veredicto formal (`Approve` o `Request changes`) orientando la decisión humana. | Ambas respetan al humano como autoridad final; la profesional ayuda a decidir bajo el estándar de "mejora de salud de código". |
| **References / composition** | Usa `references/` internas (`review_checklist.md`, `severity_guide.md`) cargadas progresivamente. | Diseñada para componerse con skills hermanas (`security-and-hardening`, `performance-optimization`, etc.). | Ambas aplican *Progressive Disclosure*, pero la profesional lo escala a un ecosistema multi-skill. |
| **Reusability** | Reutilizable en cualquier proyecto estructurado con Spec-Driven Development y tests unitarios. | Universalmente reutilizable en cualquier lenguaje de programación, framework o tamaño de repositorio. | La profesional tiene un espectro de adopción más universal; la mía es óptima para flujos normativos regulados. |

---

## 3. Análisis Crítico y Preguntas Reflexivas

### 1. ¿Qué hace la Skill profesional que tu Skill no contempló?
- **Técnica de mutación experimental en tests:** Propone alterar una condición lógica agregada (e.g. invertir un `if`) para verificar empíricamente que la suite de pruebas falle, en lugar de solo confiar en que los tests están en verde.
- **Detección de cálculo ansioso en bucles:** Identificó que llamar a `normalize_text()` para tres campos en cada iteración de los clientes es computacionalmente ineficiente si el usuario solo está buscando por un campo específico.
- **Estándar de aprobación pragmático:** Establece explícitamente el criterio de *"aprobar un cambio si mejora la salud global del código, aunque no sea perfecto"*, lo que evita bloqueos innecesarios por preferencias estilísticas del revisor.

### 2. ¿Qué elementos de tu Skill son más específicos al curso/proyecto y conviene conservar?
- **Validación determinista mediante script (`validate_review_report.py`):** Ninguna skill comunitaria que revisé incluye un script para auto-validar la estructura de sus propios reportes con exit codes de sistema operativo. Esto evita que el LLM olvide secciones obligatorias.
- **Alineación con Spec-Driven Development:** Mi skill exige contrastar el diff contra `REQUIREMENTS.md` y `SPEC.md`, detectando desviaciones de alcance antes de que el código llegue a revisión humana.
- **Contención estricta Draft-Only:** La delimitación de seguridad de mi skill garantiza que el agente no pueda comentar, aprobar ni hacer merge por accidente en GitHub.

### 3. ¿Qué agregarías a una versión 2 de tu Skill?
- Incorporar la técnica de mutación de pruebas como un paso explícito en el checklist.
- Adoptar la convención de prefijos de severidad más granular (`Critical:`, `Required:`, `Consider:`, `Nit:`, `FYI:`).
- Incluir una regla en `references/review_checklist.md` que alerte sobre cálculos redundantes o normalizaciones dentro de bucles de datos (*eager evaluation*).

### 4. ¿Qué NO copiarías y por qué?
- **No copiaría la ausencia de un validador determinista:** Confiar únicamente en que el LLM recuerde el formato del reporte suele provocar inconsistencias de salida en diferentes modelos o temperaturas.
- **No copiaría la dependencia excesiva en un ecosistema amplio de 25 skills externas:** Para proyectos o laboratorios concretos, una skill autónoma y autocontenida (con sus propias carpetas `references/` y `scripts/`) es mucho más portable y fácil de auditar que una que dependa de múltiples paquetes externos.

### 5. ¿Cuál produjo hallazgos más accionables? Incluye dos ejemplos concretos.
La skill profesional produjo hallazgos más accionables a nivel de implementación y optimización de código:
1. **Ejemplo 1 (Optimización de Normalización Perezosa):** En lugar de solo decir que el código funcionaba, la skill profesional identificó que `norm_name`, `norm_email` y `norm_phone` se calculaban en cada vuelta del ciclo aunque se buscara solo por nombre, y propuso el bloque de código exacto con evaluación perezosa (*lazy evaluation*) para evitar llamadas superfluas a Unicode NFKD.
2. **Ejemplo 2 (Corrección de Documentación de API):** Detectó que la docstring de `CustomerSearchService.search()` no había sido actualizada tras agregar el parámetro `phone`, etiquetándolo de forma muy práctica como un `Nit:` fácil de corregir por el desarrollador.

---

## 4. Findings Únicos por Skill

### Findings únicos identificados por la Skill Profesional:
1. **Cálculo redundante y falta de evaluación perezosa en `search_service.py`:** Llamadas innecesarias a la función de normalización de cadenas dentro del ciclo de iteración de clientes.
2. **Desincronización en docstring de interfaz:** Omisión del parámetro `'phone'` en la documentación interna del método `search()`.

### Findings únicos identificados por Mi Skill:
1. **Violación formal de la regla normativa V-03 (`SPEC.md`):** Identificación precisa de que `ALLOWED_FIELDS` fue modificado sin una actualización formal del documento de especificación del proyecto.
2. **Desactualización de la matriz de trazabilidad (`docs/traceability.md`):** Omisión del registro del nuevo requerimiento y de la prueba `test_search_by_phone_partial` en los documentos de control del proyecto.

---

## 5. Auditoría de Seguridad y Cadena de Suministro (Supply Chain)

- **Identificación:** Repositorio oficial público de Addy Osmani (`addyosmani/agent-skills`).
- **Pinning:** Versión congelada en commit `1401c8b8030e023baeebb31781a6653fe8e93026`.
- **Inspección de código:** Auditoría completa de las 399 líneas de `SKILL.md`. No se encontraron scripts binarios, código malicioso ni peticiones no autorizadas de red.
- **Permisos:** La skill no solicita tokens de GitHub, ni claves API de terceros, ni permisos de escritura en el sistema de archivos del proyecto.
- **Decisión de Adopción:** Aprobada para uso en entorno de laboratorio y revisión consultiva local.

---

## 6. Conclusión Humana
Comparar una skill desarrollada a medida contra una diseñada por ingenieros líderes de la industria demuestra que una buena Agent Skill no es simplemente un prompt largo, sino un procedimiento de ingeniería modular. Mi skill destaca por su rigor determinista y contención de seguridad (Draft-Only con validador Python), mientras que la profesional destaca por sus heurísticas avanzadas de calidad de software y su capacidad para guiar al revisor con empatía y pragmatismo técnico. La combinación de ambas metodologías en una versión 2 representaría una herramienta de revisión de nivel de producción excepcional.
