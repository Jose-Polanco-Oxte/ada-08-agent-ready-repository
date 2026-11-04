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

describe('Query & Filtering: NoteRepository Category Filter (FR-04)', () => {
  it('should retrieve notes matching valid category in descending chronological order (AC-04.1)', () => {
    const repo = new NoteRepository();

    const note1 = NoteModel.create({
      title: 'Nota 1 Trabajo',
      category: 'Trabajo',
      content: 'Primer entregable de la empresa.'
    });

    const note2 = NoteModel.create({
      title: 'Nota 2 Personal',
      category: 'Personal',
      content: 'Comprar provisiones para el fin de semana.'
    });

    const note3 = NoteModel.create({
      title: 'Nota 3 Trabajo',
      category: 'Trabajo',
      content: 'Segundo entregable de la empresa.'
    });

    repo.saveNote(note1);
    repo.saveNote(note2);
    repo.saveNote(note3);

    const result = repo.filterByCategory('Trabajo');
    assert.equal(result.success, true);
    assert.equal(Array.isArray(result.data), true);
    assert.equal(result.data.length, 2);

    // note3 was saved after note1, so note3 must appear first (chronological descending)
    assert.equal(result.data[0].id, note3.id);
    assert.equal(result.data[1].id, note1.id);
    assert.equal(result.data[0].category, 'Trabajo');
    assert.equal(result.data[1].category, 'Trabajo');

    // Verify trimming tolerance for valid category inputs
    const resultWithSpaces = repo.filterByCategory('  Trabajo  ');
    assert.equal(resultWithSpaces.success, true);
    assert.equal(resultWithSpaces.data.length, 2);
  });

  it('should return empty array when valid category has no matching notes (AC-04.2)', () => {
    const repo = new NoteRepository();

    const note = NoteModel.create({
      title: 'Nota de Ideas',
      category: 'Ideas',
      content: 'Nueva idea innovadora para el proyecto.'
    });
    repo.saveNote(note);

    const result = repo.filterByCategory('Urgente');
    assert.equal(result.success, true);
    assert.equal(Array.isArray(result.data), true);
    assert.equal(result.data.length, 0);
    assert.deepEqual(result.data, []);
  });

  it('should reject invalid or non-string category inputs with descriptive error (AC-04.3)', () => {
    const repo = new NoteRepository();

    const invalidInputs = [
      null,
      undefined,
      123,
      true,
      false,
      {},
      [],
      () => {},
      Symbol('cat')
    ];

    for (const input of invalidInputs) {
      // @ts-ignore
      const result = repo.filterByCategory(input);
      assert.equal(result.success, false, `Expected rejection for input: ${String(input)}`);
      assert.ok(result.error, `Expected error message for input: ${String(input)}`);
      assert.match(
        result.error,
        /cadena de texto/i,
        `Expected descriptive error for non-string input: ${String(input)}`
      );
    }

    // Empty or whitespace-only strings
    const emptyResult = repo.filterByCategory('');
    assert.equal(emptyResult.success, false);
    assert.ok(emptyResult.error);

    const whitespaceResult = repo.filterByCategory('    ');
    assert.equal(whitespaceResult.success, false);
    assert.ok(whitespaceResult.error);

    // Unrecognized / non-allowed category strings
    const unknownResult = repo.filterByCategory('CategoriaInexistente');
    assert.equal(unknownResult.success, false);
    assert.ok(unknownResult.error);
    assert.match(unknownResult.error, /Categoría inválida/i);
    assert.match(unknownResult.error, /General|Trabajo|Estudio/i);
  });

  it('should guarantee entity immutability and storage invariant preservation (AC-04.4)', () => {
    const repo = new NoteRepository();

    const note = NoteModel.create({
      title: 'Nota de Estudio',
      category: 'Estudio',
      content: 'Revisar apuntes de arquitectura de software.'
    });
    repo.saveNote(note);

    const result = repo.filterByCategory('Estudio');
    assert.equal(result.success, true);
    const retrievedNote = result.data[0];

    // 1. Entities remain frozen
    assert.equal(Object.isFrozen(retrievedNote), true);
    assert.throws(() => {
      // @ts-ignore
      retrievedNote.title = 'Título modificado';
    }, TypeError);
    assert.throws(() => {
      // @ts-ignore
      retrievedNote.category = 'Urgente';
    }, TypeError);

    // 2. Modifying returned collection does not mutate stored collection
    result.data.pop();
    assert.equal(result.data.length, 0);

    const freshResult = repo.filterByCategory('Estudio');
    assert.equal(freshResult.data.length, 1);
    assert.equal(freshResult.data[0].id, note.id);

    // 3. Storage invariant: notes count in getAllNotes remains unchanged
    const allNotes = repo.getAllNotes();
    assert.equal(allNotes.data.length, 1);
    assert.equal(allNotes.data[0].id, note.id);
  });

  it('should filter correctly when localStorage persistence is available', () => {
    const store = new Map();
    // @ts-ignore
    globalThis.window = {
      localStorage: {
        getItem: (key) => store.get(key) || null,
        setItem: (key, val) => store.set(key, String(val)),
        removeItem: (key) => store.delete(key),
        clear: () => store.clear()
      }
    };

    try {
      const repo = new NoteRepository();
      assert.equal(repo.isUsingFallback(), false);

      const note1 = NoteModel.create({
        title: 'Nota Persistente 1',
        category: 'Personal',
        content: 'Contenido persistente uno.'
      });
      const note2 = NoteModel.create({
        title: 'Nota Persistente 2',
        category: 'Personal',
        content: 'Contenido persistente dos.'
      });
      const note3 = NoteModel.create({
        title: 'Nota Trabajo Persistente',
        category: 'Trabajo',
        content: 'Contenido trabajo persistente.'
      });

      repo.saveNote(note1);
      repo.saveNote(note2);
      repo.saveNote(note3);

      const filtered = repo.filterByCategory('Personal');
      assert.equal(filtered.success, true);
      assert.equal(filtered.data.length, 2);
      assert.equal(filtered.data[0].id, note2.id);
      assert.equal(filtered.data[1].id, note1.id);
      assert.equal(Object.isFrozen(filtered.data[0]), true);
      assert.equal(Object.isFrozen(filtered.data[1]), true);
    } finally {
      // @ts-ignore
      delete globalThis.window;
    }
  });
});
