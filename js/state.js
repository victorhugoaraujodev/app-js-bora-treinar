import { createEmptyState, createSeedState } from './data.js';

export function createStore({ storage } = {}) {
  let state = storage?.load?.() ?? createEmptyState();
  const listeners = new Set();

  function notify() {
    for (const listener of listeners) {
      listener(state);
    }
  }

  return {
    getState() {
      return state;
    },

    setState(updater) {
      const nextState = typeof updater === 'function' ? updater(state) : updater;
      state = nextState;
      storage?.save?.(state);
      notify();
      return state;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    reset(nextState = createSeedState()) {
      state = nextState;
      storage?.save?.(state);
      notify();
      return state;
    },
  };
}
