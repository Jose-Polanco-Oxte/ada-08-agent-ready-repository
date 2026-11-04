# Workflow Observation

## Trigger
¿Cuándo debería utilizarse este workflow?
Este workflow se debe usar cuando un desarrollador o agente solicita evaluar un Pull Request o rama de trabajo (`feature branch`) antes de enviarlo a revisión humana o hacer merge. Aplica específicamente para revisiones de "PR readiness": verificar consistencia con los requisitos, calidad de pruebas y ausencia de regresiones.

## Inputs
¿Qué necesita para iniciar?
- Rama o PR a evaluar (en nuestro caso, la rama `feature/phone-search` comparada contra `main`).
- Especificación y arquitectura normativa del repositorio (`REQUIREMENTS.md`, `SPEC.md`, `ARCHITECTURE.md`).
- Historial de cambios y diff de código (`git diff main` o información vía GitHub MCP).
- Suite de pruebas automatizadas y su entorno de ejecución (`pytest`).

## Steps Performed
1. Identifiqué la rama de trabajo `feature/phone-search` y saqué el diff respecto a `main` para conocer los archivos tocados (`src/cli.py`, `src/search_service.py`, `tests/test_search_service.py`, `tests/test_validation.py`).
2. Leí `REQUIREMENTS.md` y `SPEC.md` para entender qué campos estaban originalmente autorizados para búsqueda (`name`, `email` y `all`).
3. Mapeé los cambios del diff contra los requerimientos: detecté que se agregó soporte de búsqueda por `phone` tanto en el servicio como en el CLI, y se modificó `ALLOWED_FIELDS`.
4. Ejecuté la suite completa de pruebas locales con `pytest -v` (33 pruebas pasando en 0.24s), revisando en particular `test_search_by_phone_partial` y la actualización en `test_validation.py` (cambio de `phone` a `address` como campo inválido).
5. Contrasté los hallazgos contra las reglas del proyecto: el código funciona y las pruebas pasan, pero existe una inconsistencia normativa porque ni `REQUIREMENTS.md` ni `SPEC.md` fueron actualizados para incluir `phone`.
6. Clasifiqué los hallazgos según su severidad:
   - **MUST FIX:** Desincronización normativa entre el código y la especificación (regla de negocio no documentada introducida en la rama).
   - **SHOULD FIX:** Actualizar la documentación y tabla de trazabilidad en `docs/traceability.md`.
   - **OPTIONAL:** Mejorar la validación de formato del número telefónico.
7. Redacté el reporte final con recomendaciones claras para que el revisor humano decida si actualiza la especificación o revierte la funcionalidad no aprobada.

## Decisions
¿Qué decisiones requieren criterio del LLM?
- Juzgar si un cambio no contemplado en la especificación es una violación de requerimientos o una mejora admisible que requiere aprobación de producto.
- Asignar la severidad adecuada a cada hallazgo (diferenciar un MUST FIX bloqueante de una sugerencia SHOULD FIX o una mejora cosmética OPTIONAL).
- Interpretar el contexto y la semántica de las pruebas modificadas para validar que no se hayan debilitado aserciones previas.

## Deterministic Work
¿Qué pasos deberían ser scripts/comandos?
- La ejecución de pruebas automatizadas (`pytest -v`).
- La extracción del diff de git (`git diff main`).
- La validación de la estructura del reporte generado (comprobar que existan todas las secciones requeridas, que contenga los conteos correctos y la marca de decisión humana con un script Python).

## Reference Knowledge
¿Qué checklist, criterios o convenciones se consultaron?
- Un checklist de revisión de PR de ingeniería de software (requisitos/spec, código, pruebas, arquitectura, seguridad y evidencia).
- Una guía de severidad para clasificar hallazgos (definiciones claras de MUST FIX, SHOULD FIX y OPTIONAL).

## Output
¿Qué artefacto produce?
Un reporte local estructurado en Markdown: `results/pr-readiness-review.md`.

## Stop Conditions
¿Cuándo debe detenerse y pedir intervención humana?
- Cuando existan contradicciones irreconciliables entre `REQUIREMENTS.md` y `SPEC.md`.
- Cuando se detecte una violación de seguridad o credenciales expuestas.
- Al terminar la redacción y validación del reporte: el agente NO debe comentar en GitHub, NO debe aprobar el PR y NO debe hacer merge. Debe detenerse y presentar el informe al revisor humano.
