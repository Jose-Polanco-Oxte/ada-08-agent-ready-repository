# ADA-07: Sistema de Administración de Notas (Módulo de Creación Inmutable)

**Asignatura:** Ingeniería de Software asistida por IA  
**Institución:** Universidad Autónoma de Yucatán (UADY)  
**Estudiante:** José Antonio Polanco Oxté  
**Enfoque:** Creación y Consulta de Notas con Inmutabilidad (Sin Eliminación)

---

## 1. Descripción del Proyecto

Aplicación web modular y accesible desarrollada en Vanilla JavaScript, HTML5 semántico y CSS3 moderno para la administración de notas personales y profesionales. Siguiendo estrictamente los requisitos establecidos, el sistema implementa **exclusivamente el flujo de creación y consulta** de notas, omitiendo deliberadamente cualquier mecanismo o interfaz de eliminación para garantizar la inmutabilidad de los registros.

---

## 2. Invariantes del Sistema y Diseño

1. **Invariante de Solo Creación (Sin Eliminación):**
   - El dominio y la capa de almacenamiento (`NoteRepository`) no exponen métodos de borrado (`delete`, `remove`, `clear`).
   - Las entidades generadas son selladas e inmutables (`Object.freeze`).
   - La interfaz gráfica no provee botones, disparadores ni atajos de teclado destructivos.

2. **Validación Defensiva en Dos Capas:**
   - **Capa HTML5:** Validación nativa mediante atributos `required`, `minlength`, `maxlength` y pseudo-clases `:user-invalid` / `:user-valid`.
   - **Capa de Dominio (`NoteModel`):** Saneamiento de cadenas (`trim()`), verificación de longitudes mínimas/máximas y lista blanca de categorías y prioridades permitidas.

3. **Inmunidad contra XSS:**
   - Todo renderizado en el DOM de datos suministrados por el usuario utiliza `document.createElement()` y `textContent`, prohibiendo la interpolación insegura de cadenas dentro de `innerHTML`.

4. **Persistencia Resiliente con Fallback en Memoria:**
   - Almacenamiento local mediante `localStorage` con versionado de esquema.
   - En caso de que el navegador bloquee `localStorage` (modo incógnito estricto) o se exceda la cuota (`QuotaExceededError`), el repositorio conmuta automáticamente a un almacén en memoria sin interrumpir la experiencia de usuario.

5. **Accesibilidad (WCAG 2.1 AA):**
   - Región en vivo ARIA (`role="status"`, `aria-live="polite"`) para el anuncio accesible de notas creadas.
   - Campos de formulario enlazados con `<label>`, descripciones y mensajes de error con `aria-describedby` y `aria-invalid`.
   - Contraste visual verificado y estados de foco visibles (`:focus-visible`).

---

## 3. Estructura del Proyecto

```
ada-07/
├── index.html            # Interfaz semántica y estructura accesible
├── css/
│   └── styles.css        # Diseño responsivo, variables CSS, micro-interacciones
├── js/
│   ├── models.js         # Entidades de dominio, validadores y constantes
│   ├── storage.js        # Repositorio de almacenamiento resiliente (sin eliminación)
│   └── app.js            # Controlador UI, manejo de eventos y renderizado
├── tests/
│   └── notes.test.mjs    # Pruebas automatizadas con node:test
├── package.json          # Metadatos del proyecto y scripts de ejecución
└── README.md             # Documentación técnica y guía de uso
```

---

## 4. Instrucciones de Ejecución

### Opción A: Abrir Directamente en el Navegador
Al no depender de herramientas de compilación externas ni CDN de terceros, el proyecto puede ejecutarse directamente haciendo doble clic o abriendo el archivo `index.html` en cualquier navegador web moderno (Google Chrome, Firefox, Safari, Edge).

### Opción B: Servidor Local Estático
Si prefieres servir la aplicación mediante HTTP:
```bash
# Con Node.js npx serve
npx serve .

# O con Python
python -m http.server 8080
```

### Opción C: Ejecución de Pruebas Unitarias
El proyecto cuenta con una suite de pruebas automatizadas nativas en Node.js (`node:test`):
```bash
npm test
```
Salida esperada:
```text
▶ Domain Model: NoteModel Validation & Creation
  ✔ should successfully create a valid note with all fields provided
  ✔ should reject titles shorter than minimum constraint
  ✔ should trim whitespace from title and content
  ✔ should reject whitespace-only titles
  ✔ should fallback to defaults for unknown category or priority
  ✔ should reject content shorter than minimum constraint
  ✔ should guarantee that note entities are frozen (immutable)
▶ Architectural Invariant: No Deletion Capability
  ✔ should verify NoteRepository strictly exposes no delete or remove method
▶ Persistence: NoteRepository In-Memory Fallback
  ✔ should store and retrieve notes in chronological descending order
  ✔ should reject invalid entity shapes during save
ℹ tests 10
ℹ pass 10
```

---

## 5. Características de la Interfaz

- **Formulario de Registro:**
  - Título con contador en tiempo real (mínimo 3, máximo 80 caracteres).
  - Selector de Categorías (`General`, `Trabajo`, `Estudio`, `Personal`, `Ideas`, `Urgente`).
  - Selector de Prioridad (`Baja`, `Media`, `Alta`).
  - Área de Contenido con contador en tiempo real (mínimo 5, máximo 1000 caracteres).
  - Notificaciones inmediatas de éxito y validación.
- **Herramientas de Administración y Consulta:**
  - Búsqueda en tiempo real por término en título o contenido.
  - Filtro por categoría.
  - Filtro por prioridad.
  - Indicador dinámico de total de notas registradas y filtradas.
  - Tarjetas con visualización de hora/fecha local, insignias semánticas y aviso de registro inmutable.
