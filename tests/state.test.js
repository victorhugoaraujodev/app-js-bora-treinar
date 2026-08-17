import test from 'node:test';
import assert from 'node:assert/strict';

import { createEmptyState, createSeedState } from '../js/data.js';
import { createStore } from '../js/state.js';

test('resets to the requested state', () => {
  const storage = {
    load: () => createSeedState(),
    save: () => true,
  };
  const store = createStore({ storage });

  store.reset(createEmptyState());

  assert.equal(store.getState().workouts.length, 0);
  assert.equal(store.getState().sessions.length, 0);
});
