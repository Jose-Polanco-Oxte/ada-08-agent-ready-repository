# Respuestas a las Preguntas de Reflexión — ADA-07

**Estudiante:** José Antonio Polanco Oxté  
**Asignatura:** Ingeniería de Software asistida por IA · UADY  
**Fecha:** 2026-10-08  

---

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
4. **Pinning de versión:** Clonar la skill fijando un commit o tag hash inmutable para evitar que actualizaciones automáticas del repositorio de origen cambien silenciosamente el comportamiento en el pipeline.

### 14. Después de estudiar la Skill profesional, ¿qué cambiarías en una versión 2 de tu Skill y cómo evaluarías que realmente mejoró?
- **Cambios para v2:**
  1. Agregar la técnica de **prueba de mutación** en el paso de revisión de tests (invertir una condición en el código para verificar que los tests fallen de verdad).
  2. Incorporar el chequeo de **cálculo ansioso vs perezoso** (*lazy evaluation*) en bucles dentro de `references/review_checklist.md`.
  3. Adoptar el esquema de etiquetas de severidad con `Nit:` y `Consider:`.
- **Evaluación de mejora:** Mediría la tasa de hallazgos relevantes en nuevos PRs sintéticos (creando un caso de prueba donde una prueba unitaria sea un falso positivo trivial que no falle al mutar el código), confirmando que la v2 detecte la debilidad del test mientras que la v1 la hubiera pasado por alto.
