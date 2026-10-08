import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const models = require('../js/models.js');
const storage = require('../js/storage.js');

const { NoteModel, ValidationError, CONSTRAINTS, VALID_CATEGORIES, VALID_PRIORITIES } = models;
const { NoteRepository, StorageResult } = storage;

describe('Domain Model: NoteModel Validation & Creation', () => {
  it('should successfully create a valid note with all fields provided', () => {
    const payload = {
      title: 'Nota de Arquitectura',
      category: 'Trabajo',
      priority: 'alta',
      content: 'Diseñar el módulo de persistencia inmutable.'
    };

    const validation = NoteModel.validate(payload);
    assert.equal(validation.valid, true);
    assert.deepEqual(validation.errors, {});
    assert.ok(validation.data);
    assert.equal(validation.data.title, 'Nota de Arquitectura');
    assert.equal(validation.data.category, 'Trabajo');
    assert.equal(validation.data.priority, 'alta');

    const note = NoteModel.create(payload);
    assert.ok(note.id);
    assert.equal(note.title, 'Nota de Arquitectura');
    assert.equal(note.content, 'Diseñar el módulo de persistencia inmutable.');
    assert.ok(!Number.isNaN(Date.parse(note.createdAt)));
    assert.equal(NoteModel.isNoteEntity(note), true);
  });

  it('should reject titles shorter than minimum constraint', () => {
    const payload = {
      title: 'Ab',
      content: 'Contenido válido de la nota.'
    };
    const validation = NoteModel.validate(payload);
    assert.equal(validation.valid, false);
    assert.ok(validation.errors.title);
    assert.throws(
      () => NoteModel.create(payload),
      ValidationError
    );
  });

  it('should trim whitespace from title and content', () => {
    const payload = {
      title: '   Título con espacios   ',
      category: 'Ideas',
      content: '   Cuerpo de la nota con espacios alrededor.   '
    };
    const note = NoteModel.create(payload);
    assert.equal(note.title, 'Título con espacios');
    assert.equal(note.content, 'Cuerpo de la nota con espacios alrededor.');
  });

  it('should reject whitespace-only titles', () => {
    const payload = {
      title: '       ',
      content: 'Contenido válido de prueba.'
    };
    const validation = NoteModel.validate(payload);
    assert.equal(validation.valid, false);
    assert.ok(validation.errors.title);
  });

  it('should fallback to defaults for unknown category or priority', () => {
    const payload = {
      title: 'Nota con categoría desconocida',
      category: 'CategoriaInexistente',
      priority: 'prioridadInvalida',
      content: 'Texto suficientemente largo de prueba.'
    };
    const note = NoteModel.create(payload);
    assert.equal(note.category, 'General');
    assert.equal(note.priority, 'media');
  });

  it('should reject content shorter than minimum constraint', () => {
    const payload = {
      title: 'Título Válido',
      content: '123'
    };
    const validation = NoteModel.validate(payload);
    assert.equal(validation.valid, false);
    assert.ok(validation.errors.content);
  });

  it('should guarantee that note entities are frozen (immutable)', () => {
    const note = NoteModel.create({
      title: 'Nota Inmutable',
      content: 'Esta nota no debe permitir mutación de atributos.'
    });
    assert.ok(Object.isFrozen(note));
    assert.throws(() => {
      // @ts-ignore
      note.title = 'Nuevo título';
    }, TypeError);
  });
});

describe('Architectural Invariant: No Deletion Capability', () => {
  it('should verify NoteRepository strictly exposes no delete or remove method', () => {
    const repo = new NoteRepository();
    const prototypeProps = Object.getOwnPropertyNames(Object.getPrototypeOf(repo));

    const forbiddenTerms = ['delete', 'remove', 'destroy', 'clear', 'drop', 'truncate', 'pop'];
    for (const term of forbiddenTerms) {
      const match = prototypeProps.find((prop) => prop.toLowerCase().includes(term));
      assert.equal(
        match,
        undefined,
        `Violación de invariante: se detectó el método '${match}' en NoteRepository.`
      );
    }
  });
});

describe('Persistence: NoteRepository In-Memory Fallback', () => {
  it('should store and retrieve notes in chronological descending order', () => {
    const repo = new NoteRepository();
    assert.equal(repo.isUsingFallback(), true); // En Node.js window.localStorage no existe

    const note1 = NoteModel.create({
      title: 'Primera Nota',
      content: 'Primer contenido de prueba'
    });

    const note2 = NoteModel.create({
      title: 'Segunda Nota',
      content: 'Segundo contenido de prueba'
    });

    const res1 = repo.saveNote(note1);
    assert.equal(res1.success, true);

    const res2 = repo.saveNote(note2);
    assert.equal(res2.success, true);

    const all = repo.getAllNotes();
    assert.equal(all.success, true);
    assert.equal(all.data.length, 2);
    // note2 fue guardada después, debe estar en la posición 0
    assert.equal(all.data[0].id, note2.id);
    assert.equal(all.data[1].id, note1.id);
  });

  it('should reject invalid entity shapes during save', () => {
    const repo = new NoteRepository();
    // @ts-ignore
    const result = repo.saveNote({ invalid: 'shape' });
    assert.equal(result.success, false);
    assert.ok(result.error);
  });
});
