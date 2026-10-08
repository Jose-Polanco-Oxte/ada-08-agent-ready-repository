/**
 * @file app.js
 * @description Application controller, UI interactions, accessibility and rendering logic.
 */

(function () {
  'use strict';

  // Ensure dependencies are loaded
  const { NoteModel, CONSTRAINTS, VALID_CATEGORIES, VALID_PRIORITIES } = window.NoteAppModels;
  const { NoteRepository } = window.NoteAppStorage;

  // Instantiate singleton repository
  const repository = new NoteRepository();

  // Date formatter for display
  const dateTimeFormatter = new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  // DOM Elements Cache
  const elements = {
    // Form & Controls
    form: /** @type {HTMLFormElement} */ (document.getElementById('note-form')),
    titleInput: /** @type {HTMLInputElement} */ (document.getElementById('note-title')),
    categorySelect: /** @type {HTMLSelectElement} */ (document.getElementById('note-category')),
    prioritySelect: /** @type {HTMLSelectElement} */ (document.getElementById('note-priority')),
    contentInput: /** @type {HTMLTextAreaElement} */ (document.getElementById('note-content')),
    submitBtn: /** @type {HTMLButtonElement} */ (document.getElementById('submit-btn')),
    resetBtn: /** @type {HTMLButtonElement} */ (document.getElementById('reset-btn')),

    // Counters & Validation messages
    titleCounter: /** @type {HTMLElement} */ (document.getElementById('title-counter')),
    contentCounter: /** @type {HTMLElement} */ (document.getElementById('content-counter')),
    titleError: /** @type {HTMLElement} */ (document.getElementById('title-error')),
    contentError: /** @type {HTMLElement} */ (document.getElementById('content-error')),
    statusBanner: /** @type {HTMLElement} */ (document.getElementById('status-banner')),

    // Filters & Search
    searchInput: /** @type {HTMLInputElement} */ (document.getElementById('search-input')),
    categoryFilter: /** @type {HTMLSelectElement} */ (document.getElementById('category-filter')),
    priorityFilter: /** @type {HTMLSelectElement} */ (document.getElementById('priority-filter')),
    clearFiltersBtn: /** @type {HTMLButtonElement} */ (document.getElementById('clear-filters-btn')),

    // Views & Counters
    notesContainer: /** @type {HTMLElement} */ (document.getElementById('notes-container')),
    notesCountBadge: /** @type {HTMLElement} */ (document.getElementById('notes-count-badge')),
    emptyState: /** @type {HTMLElement} */ (document.getElementById('empty-state')),
    storageWarning: /** @type {HTMLElement} */ (document.getElementById('storage-warning'))
  };

  /**
   * Safe notification announcer using ARIA live regions.
   * @param {string} message
   * @param {'success' | 'error' | 'info'} type
   */
  function showStatusNotification(message, type = 'info') {
    if (!elements.statusBanner) return;

    elements.statusBanner.textContent = message;
    elements.statusBanner.className = `status-banner status-${type} is-visible`;

    // Auto-dismiss after 4.5 seconds for success/info
    if (type !== 'error') {
      setTimeout(() => {
        if (elements.statusBanner.textContent === message) {
          elements.statusBanner.classList.remove('is-visible');
        }
      }, 4500);
    }
  }

  /**
   * Updates live character counter display and warning styles.
   * @param {HTMLInputElement | HTMLTextAreaElement} input
   * @param {HTMLElement} counterElement
   * @param {number} max
   */
  function updateCharacterCount(input, counterElement, max) {
    if (!input || !counterElement) return;
    const currentLength = input.value.length;
    counterElement.textContent = `${currentLength} / ${max}`;

    if (currentLength >= max) {
      counterElement.classList.add('limit-reached');
    } else {
      counterElement.classList.remove('limit-reached');
    }
  }

  /**
   * Resets inline form error visual indicators.
   */
  function clearValidationErrors() {
    if (elements.titleError) {
      elements.titleError.textContent = '';
      elements.titleError.hidden = true;
    }
    if (elements.contentError) {
      elements.contentError.textContent = '';
      elements.contentError.hidden = true;
    }
    elements.titleInput.removeAttribute('aria-invalid');
    elements.contentInput.removeAttribute('aria-invalid');
  }

  /**
   * Renders validation errors to the DOM and synchronizes ARIA states.
   * @param {Record<string, string>} errors
   */
  function displayValidationErrors(errors) {
    clearValidationErrors();

    let firstInvalidField = null;

    if (errors.title && elements.titleError) {
      elements.titleError.textContent = errors.title;
      elements.titleError.hidden = false;
      elements.titleInput.setAttribute('aria-invalid', 'true');
      firstInvalidField = elements.titleInput;
    }

    if (errors.content && elements.contentError) {
      elements.contentError.textContent = errors.content;
      elements.contentError.hidden = false;
      elements.contentInput.setAttribute('aria-invalid', 'true');
      if (!firstInvalidField) {
        firstInvalidField = elements.contentInput;
      }
    }

    if (firstInvalidField) {
      firstInvalidField.focus();
    }
  }

  /**
   * Builds an isolated, XSS-safe DOM Card element for a Note entity.
   * Note: Strictly does NOT contain any deletion button or trigger.
   * @param {import('./models').NoteEntity} note
   * @returns {HTMLElement}
   */
  function createNoteCardElement(note) {
    const article = document.createElement('article');
    article.className = 'note-card';
    article.setAttribute('data-id', note.id);
    article.setAttribute('aria-labelledby', `note-title-${note.id}`);

    // Header metadata row
    const cardHeader = document.createElement('header');
    cardHeader.className = 'note-card-header';

    const badgesContainer = document.createElement('div');
    badgesContainer.className = 'note-card-badges';

    // Category badge
    const categoryBadge = document.createElement('span');
    categoryBadge.className = `badge badge-category badge-cat-${note.category.toLowerCase()}`;
    categoryBadge.textContent = note.category;

    // Priority badge
    const priorityBadge = document.createElement('span');
    priorityBadge.className = `badge badge-priority badge-prio-${note.priority}`;
    priorityBadge.textContent = `Prioridad ${note.priority.charAt(0).toUpperCase() + note.priority.slice(1)}`;

    badgesContainer.appendChild(categoryBadge);
    badgesContainer.appendChild(priorityBadge);

    // Formatted date
    const dateElement = document.createElement('time');
    dateElement.className = 'note-timestamp';
    const dateObj = new Date(note.createdAt);
    dateElement.dateTime = note.createdAt;
    dateElement.textContent = !Number.isNaN(dateObj.getTime())
      ? dateTimeFormatter.format(dateObj)
      : note.createdAt;
    dateElement.title = `Fecha de registro: ${note.createdAt}`;

    cardHeader.appendChild(badgesContainer);
    cardHeader.appendChild(dateElement);

    // Title element
    const titleHeading = document.createElement('h3');
    titleHeading.id = `note-title-${note.id}`;
    titleHeading.className = 'note-card-title';
    titleHeading.textContent = note.title;

    // Body content element
    const bodyParagraph = document.createElement('p');
    bodyParagraph.className = 'note-card-content';
    bodyParagraph.textContent = note.content;

    // Footer with immutability notice (affirming creation-only contract)
    const cardFooter = document.createElement('footer');
    cardFooter.className = 'note-card-footer';

    const noticePill = document.createElement('span');
    noticePill.className = 'immutable-notice';
    noticePill.textContent = 'Nota permanente • Registro inmutable';
    noticePill.title = 'El sistema opera bajo política estricta de solo creación (sin eliminación)';

    cardFooter.appendChild(noticePill);

    // Assemble structure
    article.appendChild(cardHeader);
    article.appendChild(titleHeading);
    article.appendChild(bodyParagraph);
    article.appendChild(cardFooter);

    return article;
  }

  /**
   * Applies active search and filters to the note collection and renders them.
   */
  function renderNotesView() {
    const result = repository.getAllNotes();
    const allNotes = result.success && result.data ? result.data : [];

    // Filter values
    const query = (elements.searchInput.value || '').trim().toLowerCase();
    const categoryFilter = elements.categoryFilter.value;
    const priorityFilter = elements.priorityFilter.value;

    const filteredNotes = allNotes.filter((note) => {
      // 1. Text filter (Title or Content)
      if (query) {
        const matchesTitle = note.title.toLowerCase().includes(query);
        const matchesContent = note.content.toLowerCase().includes(query);
        if (!matchesTitle && !matchesContent) {
          return false;
        }
      }

      // 2. Category filter
      if (categoryFilter && note.category !== categoryFilter) {
        return false;
      }

      // 3. Priority filter
      if (priorityFilter && note.priority !== priorityFilter) {
        return false;
      }

      return true;
    });

    // Update count badge
    if (elements.notesCountBadge) {
      if (allNotes.length === filteredNotes.length) {
        elements.notesCountBadge.textContent = `${allNotes.length} ${allNotes.length === 1 ? 'nota' : 'notas'}`;
      } else {
        elements.notesCountBadge.textContent = `${filteredNotes.length} de ${allNotes.length} notas`;
      }
    }

    // Clear current DOM container safely
    while (elements.notesContainer.firstChild) {
      elements.notesContainer.removeChild(elements.notesContainer.firstChild);
    }

    // Toggle Empty State vs List
    if (filteredNotes.length === 0) {
      elements.emptyState.hidden = false;
      if (allNotes.length > 0 && (query || categoryFilter || priorityFilter)) {
        elements.emptyState.querySelector('.empty-message').textContent =
          'No se encontraron notas con los filtros seleccionados.';
      } else {
        elements.emptyState.querySelector('.empty-message').textContent =
          'Aún no hay notas registradas. Crea la primera usando el formulario.';
      }
    } else {
      elements.emptyState.hidden = true;
      const fragment = document.createDocumentFragment();
      for (const note of filteredNotes) {
        fragment.appendChild(createNoteCardElement(note));
      }
      elements.notesContainer.appendChild(fragment);
    }

    // Show fallback warning if localStorage is unavailable
    if (elements.storageWarning) {
      elements.storageWarning.hidden = !repository.isUsingFallback();
    }
  }

  /**
   * Handles Form submission, validation, persistence, and UI reset.
   * @param {SubmitEvent} event
   */
  function handleFormSubmit(event) {
    event.preventDefault();
    clearValidationErrors();

    const rawPayload = {
      title: elements.titleInput.value,
      category: elements.categorySelect.value,
      priority: elements.prioritySelect.value,
      content: elements.contentInput.value
    };

    const validation = NoteModel.validate(rawPayload);

    if (!validation.valid || !validation.data) {
      displayValidationErrors(validation.errors);
      showStatusNotification('Por favor revisa los campos señalados en el formulario.', 'error');
      return;
    }

    try {
      const newNote = NoteModel.create(rawPayload);
      const saveResult = repository.saveNote(newNote);

      if (!saveResult.success) {
        showStatusNotification(
          saveResult.error || 'No se pudo guardar la nota en almacenamiento persistente.',
          'error'
        );
      } else {
        showStatusNotification(`¡Nota "${newNote.title}" creada con éxito!`, 'success');
      }

      // Reset form and counters
      elements.form.reset();
      updateCharacterCount(elements.titleInput, elements.titleCounter, CONSTRAINTS.TITLE_MAX_LENGTH);
      updateCharacterCount(elements.contentInput, elements.contentCounter, CONSTRAINTS.CONTENT_MAX_LENGTH);
      elements.titleInput.focus();

      // Refresh view
      renderNotesView();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error inesperado al crear la nota.';
      showStatusNotification(errorMsg, 'error');
    }
  }

  /**
   * Resets form values, counters, and errors.
   */
  function handleFormReset() {
    clearValidationErrors();
    setTimeout(() => {
      updateCharacterCount(elements.titleInput, elements.titleCounter, CONSTRAINTS.TITLE_MAX_LENGTH);
      updateCharacterCount(elements.contentInput, elements.contentCounter, CONSTRAINTS.CONTENT_MAX_LENGTH);
    }, 0);
  }

  /**
   * Resets all search and filter dropdowns.
   */
  function handleClearFilters() {
    elements.searchInput.value = '';
    elements.categoryFilter.value = '';
    elements.priorityFilter.value = '';
    renderNotesView();
    elements.searchInput.focus();
  }

  /**
   * Syncs aria-invalid with native input states.
   * @param {Event} event
   */
  function handleInputBlurOrChange(event) {
    const target = /** @type {HTMLInputElement | HTMLTextAreaElement} */ (event.target);
    if (target === elements.titleInput) {
      const title = target.value.trim();
      if (title.length > 0 && title.length < CONSTRAINTS.TITLE_MIN_LENGTH) {
        if (elements.titleError) {
          elements.titleError.textContent = `El título debe tener al menos ${CONSTRAINTS.TITLE_MIN_LENGTH} caracteres.`;
          elements.titleError.hidden = false;
        }
        target.setAttribute('aria-invalid', 'true');
      } else if (title.length >= CONSTRAINTS.TITLE_MIN_LENGTH) {
        if (elements.titleError) elements.titleError.hidden = true;
        target.removeAttribute('aria-invalid');
      }
    } else if (target === elements.contentInput) {
      const content = target.value.trim();
      if (content.length > 0 && content.length < CONSTRAINTS.CONTENT_MIN_LENGTH) {
        if (elements.contentError) {
          elements.contentError.textContent = `El contenido debe tener al menos ${CONSTRAINTS.CONTENT_MIN_LENGTH} caracteres.`;
          elements.contentError.hidden = false;
        }
        target.setAttribute('aria-invalid', 'true');
      } else if (content.length >= CONSTRAINTS.CONTENT_MIN_LENGTH) {
        if (elements.contentError) elements.contentError.hidden = true;
        target.removeAttribute('aria-invalid');
      }
    }
  }

  /**
   * Attaches all event listeners and bootstraps initial UI state.
   */
  function init() {
    // Populate Category select options dynamically to ensure single source of truth
    const categoryOptions = VALID_CATEGORIES.map(
      (cat) => `<option value="${cat}">${cat}</option>`
    ).join('');

    elements.categorySelect.innerHTML = categoryOptions;
    elements.categoryFilter.innerHTML = `<option value="">Todas las categorías</option>${categoryOptions}`;

    // Populate Priority select options
    const priorityOptions = VALID_PRIORITIES.map(
      (prio) => `<option value="${prio}">${prio.charAt(0).toUpperCase() + prio.slice(1)}</option>`
    ).join('');
    elements.prioritySelect.innerHTML = priorityOptions;
    elements.prioritySelect.value = 'media';

    elements.priorityFilter.innerHTML = `<option value="">Todas las prioridades</option>${priorityOptions}`;

    // Live character count listeners
    elements.titleInput.addEventListener('input', () => {
      updateCharacterCount(elements.titleInput, elements.titleCounter, CONSTRAINTS.TITLE_MAX_LENGTH);
    });

    elements.contentInput.addEventListener('input', () => {
      updateCharacterCount(elements.contentInput, elements.contentCounter, CONSTRAINTS.CONTENT_MAX_LENGTH);
    });

    // Inline validation synchronization
    elements.titleInput.addEventListener('blur', handleInputBlurOrChange);
    elements.contentInput.addEventListener('blur', handleInputBlurOrChange);

    // Form submission & reset
    elements.form.addEventListener('submit', handleFormSubmit);
    elements.form.addEventListener('reset', handleFormReset);

    // Search and filter listeners
    elements.searchInput.addEventListener('input', renderNotesView);
    elements.categoryFilter.addEventListener('change', renderNotesView);
    elements.priorityFilter.addEventListener('change', renderNotesView);
    elements.clearFiltersBtn.addEventListener('click', handleClearFilters);

    // Initial character counters setup
    updateCharacterCount(elements.titleInput, elements.titleCounter, CONSTRAINTS.TITLE_MAX_LENGTH);
    updateCharacterCount(elements.contentInput, elements.contentCounter, CONSTRAINTS.CONTENT_MAX_LENGTH);

    // Initial render
    renderNotesView();
  }

  // Bootstrap when DOM is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
