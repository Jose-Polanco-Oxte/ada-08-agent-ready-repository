/**
 * @file storage.js
 * @description Resilient storage repository for notes.
 * Strictly adheres to the creation-only invariant (no deletion methods).
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const models = require('./models.js');
    module.exports = factory(models);
  } else {
    root.NoteAppStorage = factory(root.NoteAppModels);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (models) {
  'use strict';

  const { NoteModel, VALID_CATEGORIES } = models;
  const STORAGE_KEY = 'ada07_notes_v1';
  const STORAGE_SCHEMA_VERSION = 1;

  /**
   * Result wrapper for storage operations.
   * @template T
   */
  class StorageResult {
    /**
     * @param {boolean} success
     * @param {T} [data]
     * @param {string} [error]
     */
    constructor(success, data, error) {
      this.success = success;
      this.data = data;
      this.error = error;
    }

    static ok(data) {
      return new StorageResult(true, data);
    }

    static fail(error) {
      return new StorageResult(false, undefined, error);
    }

    /**
     * Facilitates iteration over data when data is an iterable (e.g. Array).
     */
    [Symbol.iterator]() {
      if (this.data && typeof this.data[Symbol.iterator] === 'function') {
        return this.data[Symbol.iterator]();
      }
      return [][Symbol.iterator]();
    }
  }

  /**
   * Repository managing note persistence.
   * Guarantees:
   * - Fallback in-memory storage if localStorage is blocked/unavailable.
   * - QuotaExceededError detection and recovery.
   * - Data corruption resistance (filters invalid objects).
   * - Immutability of past notes: strictly no delete operation provided.
   */
  class NoteRepository {
    constructor() {
      /** @type {Array<any>} */
      this._memoryFallback = [];
      this._isFallbackActive = !this._checkLocalStorageAvailability();
    }

    /**
     * Checks if localStorage is accessible and writable in the current runtime.
     * @private
     * @returns {boolean}
     */
    _checkLocalStorageAvailability() {
      try {
        if (typeof window === 'undefined' || !window.localStorage) {
          return false;
        }
        const testKey = '__storage_test_key__';
        window.localStorage.setItem(testKey, testKey);
        window.localStorage.removeItem(testKey);
        return true;
      } catch (err) {
        return false;
      }
    }

    /**
     * Indicates whether the repository is currently relying on the in-memory fallback.
     * @returns {boolean}
     */
    isUsingFallback() {
      return this._isFallbackActive;
    }

    /**
     * Retrieves all saved notes sorted chronologically descending (newest first).
     * @returns {StorageResult<Array<import('./models').NoteEntity>>}
     */
    getAllNotes() {
      if (this._isFallbackActive) {
        return StorageResult.ok([...this._memoryFallback]);
      }

      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          return StorageResult.ok([]);
        }

        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.notes)) {
          // Schema mismatch or corrupted root structure
          return StorageResult.ok([]);
        }

        // Validate each note entity against domain invariants
        const sanitizedNotes = [];
        for (const item of parsed.notes) {
          if (NoteModel.isNoteEntity(item)) {
            sanitizedNotes.push(Object.freeze({ ...item }));
          }
        }

        // Ensure chronological descending order (newest first)
        sanitizedNotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return StorageResult.ok(sanitizedNotes);
      } catch (err) {
        // Corrupted JSON in localStorage: gracefully fallback without terminating application
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido al leer almacenamiento.';
        console.warn('Fallo al leer localStorage, conmutando a memoria temporal:', errorMsg);
        this._isFallbackActive = true;
        return StorageResult.ok([...this._memoryFallback]);
      }
    }

    /**
     * Persists a newly created note.
     * @param {import('./models').NoteEntity} note
     * @returns {StorageResult<import('./models').NoteEntity>}
     */
    saveNote(note) {
      if (!NoteModel.isNoteEntity(note)) {
        return StorageResult.fail('La entidad proporcionada no cumple con el esquema de Nota.');
      }

      if (this._isFallbackActive) {
        this._memoryFallback.unshift(note);
        return StorageResult.ok(note);
      }

      try {
        const currentResult = this.getAllNotes();
        const existingNotes = currentResult.success && currentResult.data ? currentResult.data : [];

        // Insert new note at the beginning
        const updatedNotes = [note, ...existingNotes];

        const payload = JSON.stringify({
          version: STORAGE_SCHEMA_VERSION,
          lastUpdated: new Date().toISOString(),
          notes: updatedNotes
        });

        window.localStorage.setItem(STORAGE_KEY, payload);
        return StorageResult.ok(note);
      } catch (err) {
        // Quota exceeded or security permission denied
        if (err instanceof Error && (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
          console.error('Almacenamiento local lleno. Activando fallback en memoria temporal.');
          this._isFallbackActive = true;
          this._memoryFallback.unshift(note);
          return StorageResult.fail('Límite de almacenamiento del navegador excedido. La nota se mantuvo en memoria temporal.');
        }

        // Other storage failure: switch to in-memory fallback
        this._isFallbackActive = true;
        this._memoryFallback.unshift(note);
        return StorageResult.fail('No se pudo guardar en almacenamiento persistente; se conservó en memoria de la sesión.');
      }
    }

    /**
     * Filters stored notes matching the specified category in chronological descending order.
     * Guarantees entity immutability and non-destructive retrieval (FR-04, AC-04.1 - AC-04.4).
     * @param {string} category - Valid category name.
     * @returns {StorageResult<Array<import('./models').NoteEntity>>}
     */
    filterByCategory(category) {
      if (typeof category !== 'string') {
        return StorageResult.fail('La categoría debe ser una cadena de texto válida.');
      }

      const trimmedCategory = category.trim();
      const validCategories = VALID_CATEGORIES || [
        'General',
        'Trabajo',
        'Estudio',
        'Personal',
        'Ideas',
        'Urgente'
      ];

      if (!trimmedCategory || !validCategories.includes(trimmedCategory)) {
        return StorageResult.fail(
          `Categoría inválida: "${category}". Las categorías permitidas son: ${validCategories.join(', ')}.`
        );
      }

      const allNotesResult = this.getAllNotes();
      if (!allNotesResult.success || !Array.isArray(allNotesResult.data)) {
        return StorageResult.fail(
          allNotesResult.error || 'Error al recuperar las notas para filtrado.'
        );
      }

      // Filter notes matching category and ensure entity immutability
      const matchingNotes = allNotesResult.data
        .filter((note) => note.category === trimmedCategory)
        .map((note) => (Object.isFrozen(note) ? note : Object.freeze({ ...note })));

      // Preserve chronological descending order (newest first)
      matchingNotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return StorageResult.ok(matchingNotes);
    }
  }

  return {
    StorageResult,
    NoteRepository
  };
});
