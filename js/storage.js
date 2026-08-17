import { createEmptyState } from './data.js';

export const STORAGE_KEY = 'bora_treinar_state_v1';

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function isValidSet(set) {
  return Boolean(
    set
      && typeof set.id === 'string'
      && Number.isInteger(set.position)
      && set.position > 0
      && isFiniteNumber(set.repetitions)
      && set.repetitions > 0
      && (set.load === null || isFiniteNumber(set.load))
      && set.load !== undefined
      && isFiniteNumber(set.rest_seconds)
      && set.rest_seconds >= 0,
  );
}

function isValidWorkout(workout) {
  return Boolean(
    workout
      && typeof workout.id === 'string'
      && typeof workout.name === 'string'
      && Array.isArray(workout.days_of_week)
      && workout.days_of_week.every((day) => Number.isInteger(day) && day >= 0 && day <= 6)
      && Array.isArray(workout.exercises)
      && workout.exercises.every((exercise) => (
        exercise
          && typeof exercise.id === 'string'
          && typeof exercise.name === 'string'
          && Array.isArray(exercise.sets)
          && exercise.sets.length > 0
          && exercise.sets.every(isValidSet)
      )),
  );
}

function isValidSetOverrides(overrides) {
  return Boolean(
    overrides
      && typeof overrides === 'object'
      && Object.values(overrides).every((exerciseOverrides) => (
        exerciseOverrides
          && typeof exerciseOverrides === 'object'
          && Object.values(exerciseOverrides).every((details) => (
            details
              && (details.load === null || isFiniteNumber(details.load))
              && isFiniteNumber(details.rest_seconds)
              && details.rest_seconds >= 0
          ))
      )),
  );
}

export function validateState(state) {
  return Boolean(
    state
      && state.version === 1
      && state.profile
      && typeof state.profile.name === 'string'
      && Array.isArray(state.workouts)
      && state.workouts.every(isValidWorkout)
      && Array.isArray(state.sessions)
      && state.sessions.every((session) => (
        session
          && typeof session.id === 'string'
          && typeof session.workout_id === 'string'
          && typeof session.date === 'string'
          && ['in_progress', 'completed', 'cancelled'].includes(session.status)
          && session.completed_sets
          && typeof session.completed_sets === 'object'
          && (session.set_overrides === undefined || isValidSetOverrides(session.set_overrides))
      ))
      && state.settings
      && typeof state.settings === 'object',
  );
}

export function createStorage(storageLike = globalThis.localStorage) {
  return {
    load() {
      try {
        const raw = storageLike?.getItem(STORAGE_KEY);
        if (!raw) {
          return createEmptyState();
        }

        const parsed = JSON.parse(raw);
        return validateState(parsed) ? parsed : createEmptyState();
      } catch (error) {
        return createEmptyState();
      }
    },

    save(state) {
      try {
        storageLike?.setItem(STORAGE_KEY, JSON.stringify(state));
        return true;
      } catch (error) {
        return false;
      }
    },

    clear() {
      try {
        storageLike?.removeItem(STORAGE_KEY);
      } catch (error) {
        return false;
      }

      return true;
    },
  };
}
