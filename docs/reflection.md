# Respuestas a las Preguntas de Reflexión — ADA-08 & ADA-07

**Estudiante:** José Antonio Polanco Oxté  
**Asignatura:** Ingeniería de Software asistida por IA · UADY  
**Institución:** Universidad Autónoma de Yucatán  

---

# ADA-08: Agent-Ready Repository

### 1. ¿Cuál fue el principal obstáculo para el agente en la ejecución BEFORE?
El principal obstáculo fue la **ausencia total de un contrato operativo y de fuentes canónicas de verdad** (`AGENTS.md`, `REQUIREMENTS.md`, `SPEC.md`, `docs/REPO_MAP.md`). Cuando el prompt estándar le indicó al agente implementar el cambio descrito en `TASK_UNDER_TEST.md` (el cual referenciaba `FR-04` y `AC-04`), el agente entró en un bucle de sobre-exploración y confusión: ejecutó 15 llamadas de herramientas buscando archivos inexistentes (`*REQUIREMENTS*`, `*SPEC*`), rastreando el historial de commits y ramas con `git log`, y sufrió una falla inmediata de ejecución al intentar correr `npm test` debido a la política de ejecución de scripts de Windows PowerShell (`PSSecurityException`). Al no tener límites explícitos, también introdujo modificaciones fuera de alcance en la clase de persistencia.

### 2. ¿Qué información tuvo que inferir el agente que un desarrollador experimentado ya conocía?
Un desarrollador experimentado del proyecto conocía conocimiento tácito y tribal crítico que no estaba escrito:
- **Restricción del entorno Windows:** Que en PowerShell no se puede ejecutar `npm test` de forma directa si los scripts no firmados están deshabilitados; debe invocarse `npm.cmd test` o `node --test tests/notes.test.mjs`.
- **Invariante arquitectónica de no-eliminación:** Que el sistema fue concebido como un registro inmutable de auditoría donde está terminantemente prohibido exponer métodos como `delete`, `remove`, `clear` o `destroy`.
- **Fronteras de componentes e invariantes de clases:** Que la clase `StorageResult` es una estructura de transporte de datos sellada del repositorio y no debía mutarse ni añadírsele utilidades arbitrarias (como `[Symbol.iterator]`).
- **Mapeo de arquitectura:** Dónde residía la lógica de validación (`js/models.js`), la persistencia (`js/storage.js`) y cómo se relacionaban entre sí.

### 3. ¿Qué mejora produjo el mayor impacto y por qué?
La combinación de **`AGENTS.md` como contrato operativo junto con `docs/REPO_MAP.md` y las especificaciones estructuradas (`REQUIREMENTS.md`/`SPEC.md`)**. Esta mejora eliminó de raíz la incertidumbre del agente:
- Redujo el esfuerzo exploratorio en más del 73% (de 15 llamadas de herramientas ciegas a 4 lecturas metódicas).
- Le indicó exactamente el orden de lectura prioritario (*Read First*).
- Estableció de antemano los comandos exactos y funcionales para el entorno.
- Impuso reglas de cambio estrictas que impidieron modificaciones fuera de alcance.

### 4. ¿Qué información pertenece en AGENTS.md y qué información NO debería vivir ahí?
- **Pertenece en `AGENTS.md`:** 
  1. El orden de lectura obligatorio (*Read First*).
  2. La declaración de fuentes únicas de verdad (*Sources of Truth*).
  3. Un mapa de directorios de alto nivel.
  4. Los comandos estándar oficiales de ejecución, prueba, lint y verificación.
  5. Las reglas de cambio (*Change Rules*: qué componentes son editables y cuáles están protegidos).
  6. Las condiciones de parada (*Stop Conditions*: cuándo detenerse y consultar a un humano).
  7. La Definición de Terminado (*Definition of Done*).
- **NO debe vivir en `AGENTS.md`:**
  - Los requerimientos funcionales detallados del negocio (pertenecen a `REQUIREMENTS.md`).
  - Los criterios de aceptación minuciosos y casos de prueba (pertenecen a `SPEC.md`).
  - Las decisiones de diseño arquitectónico profundo y diagramas de flujo (pertenecen a `ARCHITECTURE.md`).
  - Duplicar esa información en `AGENTS.md` crearía redundancia y el riesgo latente de divergencia entre documentos.

### 5. ¿Qué regla convertiste en software/hook/script en lugar de dejarla como instrucción?
La **invariante arquitectónica de no-eliminación y la integridad de contratos del repositorio**. 
En lugar de dejar la regla como una recomendación en lenguaje natural ("*por favor ten cuidado y no agregues métodos de borrado*"), se codificó el script determinista `scripts/check_repo_contract.py`. Este script:
1. Inspecciona estáticamente el archivo `js/storage.js` para asegurar que ningún método o identificador contenga palabras prohibidas (`deleteNote`, `removeNote`, `clearNotes`, `destroyNote`, `delete(`, `remove(`).
2. Verifica la existencia de todos los archivos normativos obligatorios.
3. Valida que `SPEC.md` contenga referencias cruzadas explícitas a los IDs de requerimientos (`FR-01`–`FR-04`, `AC-04`).
4. Comprueba que `AGENTS.md` incluya los comandos estándar y que no se hayan introducido credenciales ni archivos `.env`.

### 6. ¿Qué diferencia observaste entre 'más contexto' y 'mejor contexto'?
- **"Más contexto":** Consiste en sobrecargar la ventana del modelo con archivos masivos, explicaciones redundantes o volcados de código irrelevante. En el BEFORE, la ausencia de límites hizo que el agente leyera todo el árbol de archivos, revisara skills externas y terminara agregando código innecesario (`[Symbol.iterator]` en `StorageResult`).
- **"Mejor contexto":** Consiste en información estructurada, jerárquica y con bajo consumo de tokens bajo el principio de *Progressive Disclosure*. En el AFTER, el agente leyó exactamente lo que necesitaba en el orden correcto, comprendió los contratos en segundos, no tuvo dudas de qué implementar y no tocó nada fuera de su tarea.

### 7. ¿Qué riesgo aparece cuando CLAUDE.md/GEMINI.md/copilot instructions duplican información del proyecto?
Aparece el **problema de la verdad dividida (*Split-Brain Context*) y la desincronización**. Si los requerimientos o criterios se copian dentro de `GEMINI.md` o `CLAUDE.md`, en el momento en que un requisito de negocio cambie en `SPEC.md` y un desarrollador olvide actualizar los archivos específicos de cada herramienta, diferentes modelos o asistentes actuarán bajo premisas contradictorias. La solución correcta es que `GEMINI.md` y similares actúen únicamente como adaptadores delgados que ordenan al asistente leer `AGENTS.md`.

### 8. ¿Qué checks comparten ahora el agente, el desarrollador humano y CI?
Comparten exactamente el mismo contrato unificado de verificación:
- **Local (Bash/Linux/macOS):** `./scripts/verify_repo.sh`
- **Local (Windows PowerShell):** `./scripts/verify_repo.ps1`
- **Pipeline de CI (GitHub Actions):** `.github/workflows/verify.yml` (que ejecuta `./scripts/verify_repo.sh`).

Todos ellos ejecutan idénticamente:
1. Pruebas unitarias automatizadas (`node --test tests/notes.test.mjs`).
2. Chequeo estático de sintaxis y linting (`node --check js/models.js js/storage.js js/app.js`).
3. Validación determinista de contratos del repositorio e invariantes arquitectónicas (`python scripts/check_repo_contract.py`).

### 9. ¿Qué parte del proceso sigue requiriendo decisión humana?
Siguen requiriendo juicio humano:
- La concepción, negociación y priorización de nuevos requerimientos de negocio.
- La evaluación de las condiciones de parada (*Stop Conditions*): si un requerimiento solicitado colisiona con una invariante arquitectónica o requiere modificar una biblioteca central, el agente debe detenerse y pedir autorización.
- La aprobación final del Pull Request y la autorización de despliegue a entornos productivos.

### 10. ¿Qué evidencia demuestra que el AFTER es realmente mejor?
La evidencia es cuantitativa, verificable y reproducible:
- **Puntuación de Repository Readiness:** Aumentó de **31.0/100** a **100.0/100** (Delta de **+69.0 puntos**).
- **Sobrecarga de navegación:** Se redujo en un 73% (de 15 llamadas de herramientas desordenadas a 4 lecturas guiadas).
- **Comandos fallidos:** Pasó de 1 fallo de ejecución de script a 0 fallos.
- **Alcance controlado:** Pasó de 1 modificación indebida fuera de alcance a 0 modificaciones indebidas.
- **Resultado de verificación unificada:** Concluyó con éxito rotundo en las 3 fases emitiendo `VERIFY_REPO: PASS` y pasando los 14 tests unitarios.

### 11. ¿Qué mejora realizada para el agente también beneficia a un desarrollador que entra por primera vez al proyecto?
Todas las mejoras benefician directamente al nuevo desarrollador:
- `docs/REPO_MAP.md` le permite conocer en 2 minutos la arquitectura del código y dónde se encuentra cada módulo.
- `scripts/verify_repo.ps1` y `scripts/verify_repo.sh` le permiten validar sus cambios localmente con un solo comando sin tener que aprender de memoria comandos complejos ni tropezar con las restricciones de PowerShell.
- `REQUIREMENTS.md` y `SPEC.md` le proporcionan una fuente transparente para saber qué hace el sistema y cómo se verifican sus funciones.

### 12. ¿Qué variable no controlada podría afectar tu comparación BEFORE/AFTER?
Las variables no controladas potenciales son la **estocasticidad inherente al modelo de lenguaje (temperatura > 0)** y el **mecanismo de context-caching del proveedor**. Para mitigar estas amenazas a la validez:
- Se utilizó idéntico modelo (`Gemini 3.8 Flash High`).
- Se utilizó el prompt textual exacto exigido por la rúbrica oficial.
- Se mantuvieron idénticas herramientas y permisos.
- La ejecución AFTER partió de una sesión completamente limpia e independiente en la rama `ada-08`.

### 13. ¿Qué elementos de este ADA conservarás como base para tu proyecto final?
Se conservará la arquitectura completa de repositorio agent-ready:
1. `AGENTS.md` como estándar de interacción y gobernanza operativa.
2. La arquitectura de documentación desacoplada (`REQUIREMENTS.md` -> `SPEC.md` -> `ARCHITECTURE.md` -> `TASKS.md` -> `REPO_MAP.md`).
3. El script de verificación unificado ejecutable tanto en local como en GitHub Actions (`verify_repo.sh` / `verify.yml`).
4. Los guardrails deterministas en Python (`check_repo_contract.py`) para evitar que se rompan contratos arquitectónicos de forma accidental.

---

# ADA-07: Respuestas de Reflexión (Skill Design)

### 1. ¿Qué parte del workflow pertenece al juicio del LLM y cuál debe ser determinista?
- **Juicio del LLM:** El análisis semántico del código, la interpretación de si un cambio viola la intención de los requisitos en `REQUIREMENTS.md` y `SPEC.md`, la asignación de severidad a los hallazgos y la redacción de explicaciones claras para el revisor humano.
- **Determinista:** La ejecución de la suite de pruebas (`pytest -v`), la extracción del diff con `git`, y la validación de la estructura del reporte mediante `scripts/validate_review_report.py` (verificar que existan todas las secciones y el indicador de decisión humana con exit code).

### 2. ¿Qué información moviste de SKILL.md a references/ y por qué?
Moví el checklist exhaustivo de revisión a `references/review_checklist.md` y las definiciones detalladas de severidad a `references/severity_guide.md`. La razón principal es el principio de **Progressive Disclosure**: si metemos todo ese texto en `SKILL.md`, inflamos innecesariamente el prompt inicial del agente en cada interacción. Al tenerlo en `references/`, el agente solo carga esos criterios especializados cuando el workflow llega al paso que realmente los necesita.

### 3. ¿Qué función cumple la description del frontmatter en el routing?
Funciona como el algoritmo de decisión que le permite al orquestador del agente saber cuándo activar la skill y cuándo ignorarla. No es solo un texto descriptivo para humanos; el LLM o sistema de enrutamiento compara la intención del usuario contra lo que la descripción declara que hace y contra los anti-triggers de lo que explícitamente NO debe hacer.

### 4. ¿Qué prompt negativo fue más difícil de evitar que activara la Skill?
El prompt `"Merge PR #42."` y el caso de frontera `"Review PR #42 and merge it if everything looks good."`. Como ambos mencionan un PR y palabras relacionadas a revisión o integración, el agente tendía a engancharse con la palabra "PR". Tuve que agregar anti-triggers muy explícitos en el frontmatter (`Do NOT use to approve PRs, merge PRs...`) para que el agente rechazara activar la skill para tareas de merge.

### 5. ¿Qué diferencia práctica observaste entre una Skill y un MCP Server?
El **MCP Server** aporta la capacidad y el alcance externo (*reach / tools*), como poder consultar GitHub o leer issues vía una API. La **Skill** aporta el procedimiento y el conocimiento profesional (*know-how*), es decir, los pasos ordenados, los criterios de ingeniería y las compuertas de calidad que el agente debe seguir para usar esas u otras herramientas de forma consistente.

### 6. ¿Qué aporta el script que no conviene resolver con instrucciones de lenguaje natural?
Aporta predictibilidad absoluta (*Shift Intelligence Left*). Los LLMs a veces sufren de alucinaciones o pueden olvidar una sección del reporte si la ventana de contexto es larga o la temperatura varía. El script de Python no "opina": revisa expresiones regulares y presencia de encabezados en milisegundos y devuelve un código de salida (exit code 0 o distinto de 0) que el agente puede usar de inmediato para corregir el documento si le faltó algo.

### 7. ¿Qué riesgo existiría si esta Skill pudiera comentar o hacer merge en GitHub?
El riesgo de que una alucinación o un falso positivo del modelo apruebe un cambio no autorizado en producción o genere ruido en el repositorio. En nuestro caso, la rama agregaba búsqueda por teléfono: si el agente tuviera permisos de merge, habría fusionado a `main` una característica que viola la regla V-03 de `SPEC.md` sin que ningún humano hubiera validado si el negocio realmente quería esa funcionalidad.

### 8. ¿Qué cambió entre la primera y la última versión de tu Skill?
En la versión 1.0.0, la descripción era genérica y no tenía anti-triggers claros, y la sección de límites no prohibía de forma tajante el merge, por lo que en el boundary case el agente intentaba buscar cómo hacer merge. En la versión 1.0.1 estreché la descripción con anti-triggers, fijé la regla de parar y exigir decisión humana (`Human decision required: YES`), y reforcé la contención como Draft-Only.

### 9. ¿Qué evidencia te permite afirmar que la Skill es reutilizable?
La estructura de la skill no está acoplada al código específico de búsqueda de clientes. Utiliza interfaces estandarizadas: busca `REQUIREMENTS.md` y `SPEC.md` normativos, corre la suite de pruebas del proyecto, aplica un checklist agnóstico de buenas prácticas y valida el reporte contra una plantilla fija. Se probó tanto con ramas locales como con referencias de PR remotos, funcionando igual en cualquier repositorio con documentación de ingeniería.

### 10. ¿Qué otro proceso profesional de Ingeniería de Software convertirías en una Skill?
Un workflow de **Generación y Verificación de Casos de Prueba de Regresión**: una skill que, al reportarse un bug en un issue, cree automáticamente una prueba unitaria que reproduzca el fallo (en rojo), verifique que la prueba falle por la causa correcta, guíe la implementación mínima (en verde) y corra la suite completa para confirmar que no se rompieron otras áreas.

### 11. ¿Qué diferencia de diseño fue más evidente entre tu Skill y code-review-and-quality?
La skill profesional de Addy Osmani está orientada a heurísticas avanzadas de diseño de código (legibilidad, simplificación, antipatrones como cálculos ansiosos en loops y pruebas de mutación) y se compone con otras skills del ecosistema. Mi skill está mucho más enfocada en la gobernanza normativa (Spec-Driven Development), compuertas rígidas de seguridad (Draft-Only) y verificación determinista de artefactos con scripts.

### 12. ¿Qué ventaja y qué costo observaste al usar una Skill mucho más extensa y opinionated?
- **Ventaja:** Es extremadamente perspicaz; fue capaz de notar que `normalize_text()` se ejecutaba de más en cada iteración del bucle, ofreciendo una solución concreta con evaluación perezosa.
- **Costo:** Requiere mayor consumo de tokens (el archivo tiene casi 400 líneas), asume convenciones de diseño muy particulares del autor y carece de un validador determinista con script para garantizar que la salida mantenga siempre el mismo formato exacto.

### 13. ¿Qué controles aplicarías antes de adoptar una Skill de terceros en un repositorio empresarial?
1. **Auditoría de código fuente:** Leer todo el archivo `SKILL.md` y sus referencias buscando instrucciones maliciosas o vectores de prompt injection.
2. **Revisión de scripts y comandos:** Verificar si incluye ejecutables locales y auditar qué comandos del sistema operativo intenta correr.
3. **Control de permisos y secretos:** Confirmar que no solicite variables de entorno con tokens, llaves SSH o credenciales empresariales.
