import { createId } from './data.js';

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayWorkouts(workouts = [], date = new Date()) {
  const weekday = date.getDay();

  return workouts
    .filter((workout) => !workout.archived)
    .filter((workout) => workout.days_of_week?.includes(weekday))
    .sort((first, second) => first.name.localeCompare(second.name, 'pt-BR'));
}

export function getWorkoutStats(workout, session = {}) {
  const completedSets = session.completed_sets ?? {};
  const exerciseStats = {};
  let totalSets = 0;
  let completedSetCount = 0;
  let completedExerciseCount = 0;

  for (const exercise of workout?.exercises ?? []) {
    const exerciseSetIds = new Set(completedSets[exercise.id] ?? []);
    const exerciseTotal = exercise.sets?.length ?? 0;
    const exerciseCompleted = (exercise.sets ?? []).filter((set) => exerciseSetIds.has(set.id)).length;
    const percentage = exerciseTotal ? Math.round((exerciseCompleted / exerciseTotal) * 100) : 0;

    exerciseStats[exercise.id] = {
      total_sets: exerciseTotal,
      completed_sets: exerciseCompleted,
      percentage,
    };

    totalSets += exerciseTotal;
    completedSetCount += exerciseCompleted;

    if (exerciseTotal > 0 && exerciseCompleted === exerciseTotal) {
      completedExerciseCount += 1;
    }
  }

  return {
    total_sets: totalSets,
    completed_sets: completedSetCount,
    total_exercises: workout?.exercises?.length ?? 0,
    completed_exercises: completedExerciseCount,
    percentage: totalSets ? Math.round((completedSetCount / totalSets) * 100) : 0,
    exercises: exerciseStats,
  };
}

export function toggleSetCompletion(session = {}, exerciseId, setId) {
  const completedSets = Object.fromEntries(
    Object.entries(session.completed_sets ?? {}).map(([key, values]) => [key, [...values]]),
  );
  const exerciseSets = completedSets[exerciseId] ?? [];
  const setIndex = exerciseSets.indexOf(setId);

  if (setIndex >= 0) {
    exerciseSets.splice(setIndex, 1);
  } else {
    exerciseSets.push(setId);
  }

  completedSets[exerciseId] = exerciseSets;

  return {
    ...session,
    completed_sets: completedSets,
    updated_at: new Date().toISOString(),
  };
}

export function getSetDetails(set = {}, session = {}, exerciseId) {
  const override = session.set_overrides?.[exerciseId]?.[set.id];

  return {
    load: override ? override.load : (set.load ?? null),
    rest_seconds: override ? override.rest_seconds : (set.rest_seconds ?? 0),
  };
}

export function updateSetDetails(session = {}, exerciseId, setId, details = {}) {
  const setOverrides = Object.fromEntries(
    Object.entries(session.set_overrides ?? {}).map(([key, values]) => [key, { ...values }]),
  );
  const exerciseOverrides = setOverrides[exerciseId] ?? {};
  const load = details.load === null || details.load === '' || details.load === undefined
    ? null
    : Number(details.load);
  const restSeconds = Number(details.rest_seconds ?? 0);

  if ((load !== null && (!Number.isFinite(load) || load < 0))
    || !Number.isFinite(restSeconds)
    || restSeconds < 0) {
    return session;
  }

  setOverrides[exerciseId] = {
    ...exerciseOverrides,
    [setId]: { load, rest_seconds: restSeconds },
  };

  return {
    ...session,
    set_overrides: setOverrides,
    updated_at: new Date().toISOString(),
  };
}

export function createSession(workoutId, date = new Date()) {
  return {
    id: createId('session'),
    workout_id: workoutId,
    date: getLocalDateKey(date),
    started_at: new Date().toISOString(),
    finished_at: null,
    completed_sets: {},
    status: 'in_progress',
  };
}

export function getActiveSession(state, workoutId, date = new Date()) {
  const dateKey = getLocalDateKey(date);

  return state.sessions.find(
    (session) => session.workout_id === workoutId
      && session.date === dateKey
      && session.status === 'in_progress',
  );
}

export function finishSession(session, status = 'completed') {
  return {
    ...session,
    status,
    finished_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function validateWorkoutInput(input = {}) {
  const errors = [];
  const name = String(input.name ?? '').trim();

  if (!name) {
    errors.push('Informe o nome do treino.');
  }

  for (const exercise of input.exercises ?? []) {
    if (!String(exercise.name ?? '').trim()) {
      errors.push('Informe o nome do exercício.');
    }

    if (!exercise.sets?.length) {
      errors.push('Cada exercício precisa de pelo menos uma série.');
    }

    for (const set of exercise.sets ?? []) {
      const repetitions = Number(set.repetitions);
      const load = set.load === null || set.load === '' || set.load === undefined ? null : Number(set.load);
      const restSeconds = Number(set.rest_seconds ?? 0);

      if (!Number.isFinite(repetitions) || repetitions <= 0) {
        errors.push('As repetições devem ser maiores que zero.');
      }

      if (load !== null && (!Number.isFinite(load) || load < 0)) {
        errors.push('A carga não pode ser negativa.');
      }

      if (!Number.isFinite(restSeconds) || restSeconds < 0) {
        errors.push('O descanso não pode ser negativo.');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors: [...new Set(errors)],
  };
}
