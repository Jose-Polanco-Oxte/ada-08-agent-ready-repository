# Third-Party Skill Pre-Install Audit

Repository: https://github.com/addyosmani/agent-skills  
Selected skill: code-review-and-quality  
Version / commit inspected: 1401c8b8030e023baeebb31781a6653fe8e93026  
Installed path: `.agents/skills/code-review-and-quality`  

## Purpose
Establecer un proceso profesional de revisión de código multi-eje (correctness, readability/simplicity, architecture, security, performance) con compuertas de calidad (quality gates) antes de permitir el merge de cualquier cambio a la rama principal.

## Trigger / Description
- **Nombre:** `code-review-and-quality`
- **Description:** "Conducts multi-axis code review. Use before merging any change. Use when reviewing code written by yourself, another agent, or a human. Use when you need to assess code quality across multiple dimensions before it enters the main branch. Use when asked to review a diff or a pull request, even when the diff is pasted inline."
- **Disparadores positivos:**
  - Antes de hacer merge de cualquier Pull Request o cambio de código.
  - Al completar la implementación de una característica o fix.
  - Al evaluar código producido por otro agente o por un humano.
  - Durante refactorizaciones o revisiones de pruebas de regresión.
  - Solicitudes explícitas de revisión de un diff o PR.
- **Tareas fuera de alcance:**
  - No escribe la implementación de la feature ni genera código sustituto.
  - No aprueba ni hace merge directamente en GitHub.
  - No realiza despliegues a producción (delega a skills como `shipping-and-launch`).

## Supporting References
- La skill menciona composición con referencias externas:
  - `security-checklist.md` (asociada a `security-and-hardening`).
  - `performance-checklist.md` (asociada a `performance-optimization`).
  - `constraint-driven-development` para puntuación de mutación en tests.

## Tools / Commands / Permissions
- **Herramientas requeridas:** Solo lectura de archivos (`view_file`), inspección de diffs (`git diff`), y ejecución de la suite de pruebas local (`pytest -v`).
- **Comandos / Scripts ejecutables:** No incluye scripts deterministas propios (no tiene carpeta `scripts/` con ejecutables Python o Bash embebidos). Todo el control del flujo se realiza mediante instrucciones Markdown estructuradas.
- **Permisos requeridos:** Lectura del repositorio local. No solicita tokens de GitHub ni permisos de escritura en la API.

## Potential Risks
- **Riesgo de Supply-chain:** Al descargarse de un repositorio comunitario, un cambio no controlado en el repositorio remoto podría introducir instrucciones no deseadas. Se mitiga mediante congelación de commit (pinning).
- **Riesgo de Inyección Indirecta de Prompt:** Si el diff de un PR incluye comentarios o strings diseñados para alterar el comportamiento del LLM, podría intentar manipular el veredicto del revisor. Se mitiga manteniendo al humano como tomador de decisión final.
- **Evaluación de herramientas de escaneo:** Al ejecutar la instalación con `npx skills`, la herramienta arrojó:
  - Gen: Safe
  - Socket: 0 alerts
  - Snyk: Med Risk (asociado a la capacidad habitual de ejecución de código de los agentes de codificación).

## Supply Chain Controls

| Control | Evidencia |
|---|---|
| **Source** | Repositorio público oficial `addyosmani/agent-skills`, mantenido por Addy Osmani. |
| **Pinning** | Commit exacto verificado e inspeccionado: `1401c8b8030e023baeebb31781a6653fe8e93026`. |
| **Audit** | Archivo `SKILL.md` (399 líneas) auditado y leído por completo antes de su ejecución. |
| **Secrets** | No contiene, no genera y no solicita Personal Access Tokens (PATs) ni credenciales en código. |
| **Commands** | No ejecuta scripts binarios ni daemons en segundo plano; depende únicamente del runner de pruebas del proyecto (`pytest`). |
| **Permissions** | Permisos limitados al entorno de trabajo local; sin llamadas externas de red adicionales. |
| **Change control** | Instalado de forma local estática en `.agents/skills/code-review-and-quality/` sin auto-actualización silenciosa. |

## Decision
[X] Install  
[ ] Do not install  

Reason:
La skill proviene de una fuente reputada y ampliamente validada en la comunidad, está completamente escrita en Markdown sin scripts ofuscados ni dependencias binarias, opera en modo de análisis multi-eje sin privilegios de escritura en GitHub y complementa adecuadamente los criterios de revisión del proyecto.
