/**
 * @file models.js
 * @description Domain models, schema definitions, and validation logic for Notes.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NoteAppModels = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * Domain-specific validation error.
   */
  class ValidationError extends Error {
    /**
     * @param {string} message
     * @param {Record<string, string>} fields
     */
    constructor(message, fields = {}) {
      super(message);
      this.name = 'ValidationError';
      this.fields = fields;
    }
  }

  /**
   * Allowed categories with corresponding human-readable labels and color themes.
   * @type {readonly string[]}
   */
  const VALID_CATEGORIES = Object.freeze([
    'General',
    'Trabajo',
    'Estudio',
    'Personal',
    'Ideas',
    'Urgente'
  ]);

  /**
   * Allowed priority levels.
   * @type {readonly string[]}
   */
  const VALID_PRIORITIES = Object.freeze([
    'baja',
    'media',
    'alta'
  ]);

  /**
   * Constraints definition for note validation.
   */
  const CONSTRAINTS = Object.freeze({
    TITLE_MIN_LENGTH: 3,
    TITLE_MAX_LENGTH: 80,
    CONTENT_MIN_LENGTH: 5,
    CONTENT_MAX_LENGTH: 1000
  });

  /**
   * Note entity model and factory.
   */
  class NoteModel {
    /**
     * @typedef {Object} NotePayload
     * @property {string} title
     * @property {string} [category]
     * @property {string} [priority]
     * @property {string} content
     */

    /**
     * @typedef {Object} NoteEntity
     * @property {string} id
     * @property {string} title
     * @property {string} category
     * @property {string} priority
     * @property {string} content
     * @property {string} createdAt
     */

    /**
     * Validates raw payload against business constraints.
     * @param {Partial<NotePayload>} payload
     * @returns {{ valid: boolean, errors: Record<string, string>, data?: { title: string, category: string, priority: string, content: string } }}
     */
    static validate(payload) {
      const errors = {};

      if (!payload || typeof payload !== 'object') {
        return {
          valid: false,
          errors: { global: 'La carga de datos no es válida.' }
        };
      }

      // 1. Title validation
      const rawTitle = typeof payload.title === 'string' ? payload.title.trim() : '';
      if (!rawTitle) {
        errors.title = 'El título es obligatorio.';
      } else if (rawTitle.length < CONSTRAINTS.TITLE_MIN_LENGTH) {
        errors.title = `El título debe tener al menos ${CONSTRAINTS.TITLE_MIN_LENGTH} caracteres.`;
      } else if (rawTitle.length > CONSTRAINTS.TITLE_MAX_LENGTH) {
        errors.title = `El título no puede exceder ${CONSTRAINTS.TITLE_MAX_LENGTH} caracteres.`;
      }

      // 2. Category validation
      const rawCategory = typeof payload.category === 'string' ? payload.category.trim() : 'General';
      const category = VALID_CATEGORIES.includes(rawCategory) ? rawCategory : 'General';

      // 3. Priority validation
      const rawPriority = typeof payload.priority === 'string' ? payload.priority.trim().toLowerCase() : 'media';
      const priority = VALID_PRIORITIES.includes(rawPriority) ? rawPriority : 'media';

      // 4. Content validation
      const rawContent = typeof payload.content === 'string' ? payload.content.trim() : '';
      if (!rawContent) {
        errors.content = 'El contenido de la nota es obligatorio.';
      } else if (rawContent.length < CONSTRAINTS.CONTENT_MIN_LENGTH) {
        errors.content = `El contenido debe tener al menos ${CONSTRAINTS.CONTENT_MIN_LENGTH} caracteres.`;
      } else if (rawContent.length > CONSTRAINTS.CONTENT_MAX_LENGTH) {
        errors.content = `El contenido no puede exceder ${CONSTRAINTS.CONTENT_MAX_LENGTH} caracteres.`;
      }

      const isValid = Object.keys(errors).length === 0;

      return {
        valid: isValid,
        errors,
        ...(isValid ? {
          data: {
            title: rawTitle,
            category,
            priority,
            content: rawContent
          }
        } : {})
      };
    }

    /**
     * Generates a validated, immutable Note entity.
     * @param {NotePayload} payload
     * @returns {NoteEntity}
     * @throws {ValidationError} if payload fails validation
     */
    static create(payload) {
      const validation = this.validate(payload);
      if (!validation.valid || !validation.data) {
        throw new ValidationError('Datos de nota inválidos.', validation.errors);
      }

      const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : 'note_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);

      const note = Object.freeze({
        id,
        title: validation.data.title,
        category: validation.data.category,
        priority: validation.data.priority,
        content: validation.data.content,
        createdAt: new Date().toISOString()
      });

      return note;
    }

    /**
     * Verifies if an arbitrary object matches the required Note schema.
     * @param {unknown} obj
     * @returns {boolean}
     */
    static isNoteEntity(obj) {
      if (!obj || typeof obj !== 'object') return false;
      const candidate = /** @type {Record<string, unknown>} */ (obj);
      return (
        typeof candidate.id === 'string' &&
        typeof candidate.title === 'string' &&
        candidate.title.length > 0 &&
        typeof candidate.content === 'string' &&
        candidate.content.length > 0 &&
        typeof candidate.category === 'string' &&
        VALID_CATEGORIES.includes(candidate.category) &&
        typeof candidate.priority === 'string' &&
        VALID_PRIORITIES.includes(candidate.priority) &&
        typeof candidate.createdAt === 'string' &&
        !Number.isNaN(Date.parse(candidate.createdAt))
      );
    }
  }

  return {
    ValidationError,
    VALID_CATEGORIES,
    VALID_PRIORITIES,
    CONSTRAINTS,
    NoteModel
  };
});
