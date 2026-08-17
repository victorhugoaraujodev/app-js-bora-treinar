const DEFAULT_REST_SECONDS = 60;

export function createId(prefix = 'item') {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createSet(position, repetitions, load, restSeconds = DEFAULT_REST_SECONDS) {
  return {
    id: `set-${position}`,
    position,
    repetitions,
    load,
    load_unit: 'kg',
    rest_seconds: restSeconds,
  };
}

function createExercise(id, name, muscleGroup, values, notes = '') {
  return {
    id,
    name,
    muscle_group: muscleGroup,
    position: 1,
    notes,
    created_at: '2026-08-17T12:00:00.000Z',
    updated_at: '2026-08-17T12:00:00.000Z',
    sets: values.map((value, index) => {
      const [repetitions, load, restSeconds] = value;
      return createSet(index + 1, repetitions, load, restSeconds);
    }),
  };
}

function createWorkout(id, name, muscleGroup, daysOfWeek, exercises, color) {
  return {
    id,
    name,
    description: `Foco em ${muscleGroup.toLowerCase()}`,
    muscle_group: muscleGroup,
    color,
    days_of_week: daysOfWeek,
    archived: false,
    created_at: '2026-08-17T12:00:00.000Z',
    updated_at: '2026-08-17T12:00:00.000Z',
    exercises: exercises.map((exercise, index) => ({
      ...exercise,
      position: index + 1,
    })),
  };
}

export function createSeedState() {
  return {
    version: 1,
    profile: {
      id: 'profile-local',
      name: 'Victor',
      created_at: '2026-08-17T12:00:00.000Z',
      updated_at: '2026-08-17T12:00:00.000Z',
    },
    workouts: [
      createWorkout(
        'workout-a',
        'Treino A - Peitoral',
        'Peitoral',
        [1, 4],
        [
          createExercise('a-supino-reto', 'Supino reto', 'Peitoral', [[10, 20], [10, 20], [10, 20], [10, 20]]),
          createExercise('a-supino-inclinado', 'Supino inclinado com halteres', 'Peitoral', [[12, 16], [12, 16], [10, 18]]),
          createExercise('a-crucifixo', 'Crucifixo', 'Peitoral', [[12, 12], [12, 12], [12, 12]]),
          createExercise('a-borboleta', 'Peck deck', 'Peitoral', [[15, 35], [15, 35], [12, 40]]),
          createExercise('a-triceps', 'Tríceps na polia', 'Tríceps', [[12, 25], [12, 25], [10, 30]]),
        ],
        '#315bd6',
      ),
      createWorkout(
        'workout-b',
        'Treino B - Pernas',
        'Pernas',
        [2, 5],
        [
          createExercise('b-agachamento', 'Agachamento livre', 'Pernas', [[10, 30], [10, 30], [8, 35]]),
          createExercise('b-leg-press', 'Leg press', 'Pernas', [[12, 100], [12, 100], [10, 120]]),
          createExercise('b-extensora', 'Cadeira extensora', 'Pernas', [[15, 40], [15, 40], [12, 45]]),
          createExercise('b-flexora', 'Mesa flexora', 'Posterior', [[12, 35], [12, 35], [12, 35]]),
        ],
        '#c47b29',
      ),
      createWorkout(
        'workout-c',
        'Treino C - Braços',
        'Braços',
        [3],
        [
          createExercise('c-rosca-direta', 'Rosca direta', 'Bíceps', [[12, 12], [12, 12], [10, 14]]),
          createExercise('c-rosca-martelo', 'Rosca martelo', 'Bíceps', [[12, 10], [12, 10], [10, 12]]),
          createExercise('c-triceps-testa', 'Tríceps testa', 'Tríceps', [[12, 10], [12, 10], [10, 12]]),
        ],
        '#7c5ac7',
      ),
      createWorkout(
        'workout-d',
        'Treino D - Ombro',
        'Ombro',
        [6],
        [
          createExercise('d-desenvolvimento', 'Desenvolvimento', 'Ombro', [[10, 14], [10, 14], [8, 16]]),
          createExercise('d-elevacao-lateral', 'Elevação lateral', 'Ombro', [[15, 8], [15, 8], [12, 10]]),
          createExercise('d-face-pull', 'Face pull', 'Ombro', [[15, 20], [15, 20], [15, 20]]),
        ],
        '#2b8a78',
      ),
      createWorkout(
        'workout-e',
        'Treino E - Costas',
        'Costas',
        [0],
        [
          createExercise('e-puxada', 'Puxada frontal', 'Costas', [[12, 35], [12, 35], [10, 40]]),
          createExercise('e-remada', 'Remada baixa', 'Costas', [[12, 35], [12, 35], [10, 40]]),
          createExercise('e-remada-unilateral', 'Remada unilateral', 'Costas', [[12, 18], [12, 18], [10, 20]]),
          createExercise('e-encolhimento', 'Encolhimento', 'Trapézio', [[15, 20], [15, 20], [12, 24]]),
        ],
        '#b54b73',
      ),
    ],
    sessions: [],
    settings: {
      first_day_of_week: 0,
      default_rest_seconds: DEFAULT_REST_SECONDS,
    },
  };
}

export function createEmptyState() {
  const now = new Date().toISOString();

  return {
    version: 1,
    profile: {
      id: 'profile-local',
      name: '',
      created_at: now,
      updated_at: now,
    },
    workouts: [],
    sessions: [],
    settings: {
      first_day_of_week: 0,
      default_rest_seconds: DEFAULT_REST_SECONDS,
    },
  };
}
