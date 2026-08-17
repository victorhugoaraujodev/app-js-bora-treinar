import test from 'node:test';
import assert from 'node:assert/strict';

import { createSeedState } from '../js/data.js';
import { validateState } from '../js/storage.js';
import { sanitizeColor } from '../js/ui.js';
import { validateWorkoutInput } from '../js/domain.js';

test('accepts the complete seed state', () => {
  assert.equal(validateState(createSeedState()), true);
});

test('rejects a state with malformed nested workout data', () => {
  const state = createSeedState();
  state.workouts[0].exercises = [{ name: 'Exercício inválido' }];

  assert.equal(validateState(state), false);
});

test('rejects non-finite and negative set values', () => {
  const result = validateWorkoutInput({
    name: 'Treino',
    exercises: [{
      name: 'Supino',
      sets: [{ repetitions: Number.NaN, load: -1, rest_seconds: -5 }],
    }],
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('As repetições devem ser maiores que zero.'));
  assert.ok(result.errors.includes('A carga não pode ser negativa.'));
  assert.ok(result.errors.includes('O descanso não pode ser negativo.'));
});

test('rejects malformed session set adjustments', () => {
  const state = createSeedState();
  state.sessions.push({
    id: 'session-invalid',
    workout_id: state.workouts[0].id,
    date: '2026-08-17',
    status: 'in_progress',
    completed_sets: {},
    set_overrides: {
      'exercise-1': {
        'set-1': { load: 20, rest_seconds: -1 },
      },
    },
  });

  assert.equal(validateState(state), false);
});

test('allows only safe hexadecimal colors', () => {
  assert.equal(sanitizeColor('#315bd6'), '#315bd6');
  assert.equal(sanitizeColor('red; background:url(javascript:alert(1))'), '#315bd6');
  assert.equal(sanitizeColor(undefined), '#315bd6');
});
