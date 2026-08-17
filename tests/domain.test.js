import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getTodayWorkouts,
  getSetDetails,
  getWorkoutStats,
  toggleSetCompletion,
  updateSetDetails,
  validateWorkoutInput,
} from '../js/domain.js';

const workout = {
  id: 'workout-a',
  name: 'Treino A - Peitoral',
  archived: false,
  days_of_week: [1],
  exercises: [
    {
      id: 'exercise-1',
      name: 'Supino reto',
      sets: [
        { id: 'set-1', repetitions: 10 },
        { id: 'set-2', repetitions: 10 },
        { id: 'set-3', repetitions: 10 },
        { id: 'set-4', repetitions: 10 },
      ],
    },
  ],
};

test('returns active workouts scheduled for the local weekday', () => {
  const monday = new Date(2026, 7, 17, 12, 0, 0);
  const result = getTodayWorkouts([workout], monday);

  assert.deepEqual(result.map((item) => item.id), ['workout-a']);
});

test('calculates exercise and workout set progress from the current session', () => {
  const session = {
    completed_sets: {
      'exercise-1': ['set-1', 'set-2'],
    },
  };

  const stats = getWorkoutStats(workout, session);

  assert.equal(stats.total_sets, 4);
  assert.equal(stats.completed_sets, 2);
  assert.equal(stats.percentage, 50);
  assert.deepEqual(stats.exercises['exercise-1'], {
    total_sets: 4,
    completed_sets: 2,
    percentage: 50,
  });
});

test('toggles one set without changing the other completed sets', () => {
  const session = {
    completed_sets: {
      'exercise-1': ['set-1'],
    },
  };

  const completed = toggleSetCompletion(session, 'exercise-1', 'set-2');
  assert.deepEqual(completed.completed_sets['exercise-1'], ['set-1', 'set-2']);

  const uncompleted = toggleSetCompletion(completed, 'exercise-1', 'set-1');
  assert.deepEqual(uncompleted.completed_sets['exercise-1'], ['set-2']);
});

test('updates load and rest for one set in the current session', () => {
  const session = { completed_sets: {} };
  const updated = updateSetDetails(session, 'exercise-1', 'set-1', { load: 32.5, rest_seconds: 90 });

  assert.deepEqual(getSetDetails(workout.exercises[0].sets[0], updated, 'exercise-1'), {
    load: 32.5,
    rest_seconds: 90,
  });
  assert.deepEqual(getSetDetails(workout.exercises[0].sets[1], updated, 'exercise-1'), {
    load: null,
    rest_seconds: 0,
  });
});

test('clears the session load when it is left blank', () => {
  const session = updateSetDetails(
    { completed_sets: {} },
    'exercise-1',
    'set-1',
    { load: '', rest_seconds: 45 },
  );

  assert.deepEqual(session.set_overrides['exercise-1']['set-1'], { load: null, rest_seconds: 45 });
});

test('rejects a workout without a name or exercise sets', () => {
  const result = validateWorkoutInput({
    name: ' ',
    exercises: [{ name: 'Supino reto', sets: [] }],
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('Informe o nome do treino.'));
  assert.ok(result.errors.includes('Cada exercício precisa de pelo menos uma série.'));
});

test('accepts a workout with a name and valid exercises', () => {
  const result = validateWorkoutInput({
    name: 'Treino A - Peitoral',
    exercises: [
      {
        name: 'Supino reto',
        sets: [{ repetitions: 10 }],
      },
    ],
  });

  assert.deepEqual(result, { valid: true, errors: [] });
});
