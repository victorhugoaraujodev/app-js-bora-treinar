import test from 'node:test';
import assert from 'node:assert/strict';

import { createEmptyState, createSeedState } from '../js/data.js';
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

test('returns an empty state when there is no stored data', () => {
  const memoryStorage = createMemoryStorage();
  const storage = createStorage(memoryStorage);

  const state = storage.load();

  const emptyState = createEmptyState();
  assert.equal(state.version, emptyState.version);
  assert.deepEqual(state.profile.name, emptyState.profile.name);
  assert.deepEqual(state.settings, emptyState.settings);
  assert.equal(state.workouts.length, 0);
  assert.equal(state.sessions.length, 0);
});

test('returns a fresh empty state when stored JSON is malformed', () => {
  const memoryStorage = createMemoryStorage();
  memoryStorage.setItem(STORAGE_KEY, '{malformed');
  const storage = createStorage(memoryStorage);

  const state = storage.load();

  assert.equal(state.version, 1);
  assert.ok(Array.isArray(state.workouts));
  assert.equal(state.workouts.length, 0);
  assert.notEqual(state, createSeedState());
});
