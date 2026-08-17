import test from 'node:test';
import assert from 'node:assert/strict';

import { createSeedState } from '../js/data.js';
import { createStorage, STORAGE_KEY } from '../js/storage.js';

function createMemoryStorage() {
  const values = new Map();

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

test('saves and loads the application state from the configured key', () => {
  const memoryStorage = createMemoryStorage();
  const storage = createStorage(memoryStorage);
  const state = createSeedState();

  storage.save(state);

  assert.ok(memoryStorage.getItem(STORAGE_KEY));
  assert.deepEqual(storage.load(), state);
});

test('returns a fresh seed state when stored JSON is malformed', () => {
  const memoryStorage = createMemoryStorage();
  memoryStorage.setItem(STORAGE_KEY, '{malformed');
  const storage = createStorage(memoryStorage);

  const state = storage.load();

  assert.equal(state.version, 1);
  assert.ok(Array.isArray(state.workouts));
  assert.notEqual(state, createSeedState());
});
