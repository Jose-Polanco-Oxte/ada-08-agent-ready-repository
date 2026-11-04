# Anatomía y Análisis de Skill Profesional: `code-review-and-quality`

**Autor:** Addy Osmani (`addyosmani/agent-skills`)  
**Estudiante:** José Antonio Polanco Oxté  
**Asignatura:** Ingeniería de Software asistida por IA · UADY  

---

## 1. Routing
La descripción del frontmatter está diseñada para funcionar como un filtro semántico muy específico para el sistema de orquestación de agentes:
- **Disparador primario:** Se enfoca en el momento clave del ciclo de vida: *"before merging any change"*.
- **Flexibilidad de entrada:** Cubre explícitamente código generado por humanos, por el mismo agente o por otros modelos, incluyendo diffs provistos en texto plano inline.
- **Diferenciación:** No se confunde con tareas de codificación activa o generación de features; su propósito único es juzgar y evaluar la salud del código existente a través de múltiples dimensiones.

---

## 2. Workflow y Quality Gates
El flujo de revisión se organiza en 5 etapas secuenciales con compuertas de calidad rigurosas:

```
[ Paso 1: Understand Context ]
         │
         ▼
[ Paso 2: Review Tests First ] ──► (Quality Gate: Mutation test / coverage check)
         │
         ▼
[ Paso 3: Review Implementation ] ──► (Quality Gate: 5-Axis inspection)
         │
         ▼
[ Paso 4: Categorize Findings ] ──► (Quality Gate: Severity labeling & prioritization)
         │
         ▼
[ Paso 5: Verify the Verification ] ──► (Quality Gate: Green suite + documentation)
         │
         ▼
    [ Human Verdict ]
```

1. **Step 1 (Entender el contexto):** Identificar la intención, especificación o bug report antes de mirar una sola línea de diff.
2. **Step 2 (Revisar los tests primero):** Inspeccionar primero los tests para entender el comportamiento esperado. Plantea una técnica experimental de mutación: invertir una condición en el código para corroborar que los tests realmente fallen si algo se rompe.
3. **Step 3 (Revisar la implementación):** Evaluación de cada archivo modificado bajo los cinco ejes de ingeniería.
4. **Step 4 (Categorizar hallazgos):** Clasificar cada observación con etiquetas de severidad claras para evitar que el autor pierda tiempo en sugerencias opcionales.
5. **Step 5 (Verificar la verificación):** Comprobar que el autor presente evidencia reproducible de pruebas pasando y build exitoso.

---

## 3. Review Axes (Los Cinco Ejes de Calidad)
La skill estructura su criterio de revisión en cinco ejes transversales:

| Eje | Enfoque Principal | Preguntas Clave de Evaluación |
|---|---|---|
| **1. Correctness** | Funcionalidad y precisión | ¿Cumple con la especificación? ¿Se manejan casos nulos, vacíos y valores frontera? ¿Se cubren caminos de error? ¿Los tests prueban comportamiento y no detalles internos? |
| **2. Readability & Simplicity** | Claridad y mantenibilidad | ¿Los nombres son autodescriptivos? ¿El flujo de control es plano o tiene anidamientos innecesarios? ¿Se podría escribir en menos líneas sin perder claridad? ¿Se evitan abstracciones prematuras? |
| **3. Architecture** | Coherencia del sistema | ¿Respeta la arquitectura y patrones existentes? ¿Los refactors reducen la complejidad o solo la mudan de sitio? ¿Se evita que lógica específica contamine módulos generales? |
| **4. Security** | Resiliencia y amenazas | ¿Se sanean y validan las entradas en las fronteras del sistema? ¿Existen secretos en el código? ¿Las consultas están parametrizadas? ¿Se trata a toda fuente externa como no confiable? |
| **5. Performance** | Eficiencia computacional | ¿Existen consultas N+1 o bucles sin límites? ¿Hay operaciones bloqueantes sincrónicas? ¿Se generan objetos pesados en trayectorias calientes (*hot paths*)? |

---

## 4. Severity (Modelo de Severidad)
Para evitar discusiones estériles y priorizar el esfuerzo del equipo, la skill introduce una convención explícita de prefijos:

- **Sin prefijo / Required:** Cambio requerido obligatorio. El cambio debe resolverse antes del merge.
- **`Critical:`:** Bloqueante absoluto de merge (vulnerabilidades de seguridad graves, corrupción de datos, funcionalidad rota).
- **`Nit:`:** Observación menor opcional (preferencias de formato, estilo cosmético o comentarios menores) que el autor puede ignorar.
- **`Optional:` / `Consider:`:** Sugerencia técnica para que el autor la considere, pero sin bloquear la entrega.
- **`FYI:`:** Contexto puramente informativo para el futuro sin acción requerida.

---

## 5. Verification (Exigencia de Evidencia)
La skill exige evidencia verificable antes de otorgar el veredicto:
- Pruebas automatizadas en verde y suite ejecutada.
- Build completado con éxito sin advertencias suprimidas injustificadamente.
- Cobertura de regresión comprobada mediante análisis o mutación de condiciones.
- Verificación manual o capturas de pantalla documentadas en cambios visuales.

---

## 6. Composition (Composición con Otras Skills)
En lugar de convertirse en un documento gigante monolítico con miles de líneas, `code-review-and-quality` implementa composición modular:
- Delega el análisis profundo de seguridad a `security-and-hardening` y `references/security-checklist.md`.
- Delega el análisis de profiling y rendimiento a `performance-optimization` y `references/performance-checklist.md`.
- Conecta con `constraint-driven-development` para métricas de mutación y calidad de pruebas.
- Se articula con `shipping-and-launch` para el despliegue una vez aprobado el cambio.

---

## 7. Boundaries (Límites y Decisión Humana)
La skill establece límites éticos y operacionales determinantes:
- **Autoridad humana final:** El agente no aprueba ni hace merge por su cuenta; propone el veredicto (`Approve` o `Request changes`) pero la decisión definitiva reside en el revisor humano.
- **Prohibición de borrado silencioso de código muerto:** Establece la regla *"Ask before deleting"*, donde el agente lista elementos en desuso pero solicita confirmación explícita antes de eliminarlos.
- **Evitar la complacencia (*Anti-sycophancy*):** Prohíbe los "LGTM" sin evidencia y exige señalar problemas estructurales con firmeza sin suavizar fallas críticas, respetando siempre el juicio justificado del autor humano.
