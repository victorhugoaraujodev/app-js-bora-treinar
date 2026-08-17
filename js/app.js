import { createEmptyState, createId } from './data.js';
import {
  createSession,
  finishSession,
  getActiveSession,
  getLocalDateKey,
  getSetDetails,
  getTodayWorkouts,
  getWorkoutStats,
  toggleSetCompletion,
  updateSetDetails,
  validateWorkoutInput,
} from './domain.js';
import { createStore } from './state.js';
import { createStorage, validateState } from './storage.js';
import {
  escapeHtml,
  formatDateLong,
  formatDateShort,
  formatDateTime,
  formatDayName,
  formatLoad,
  formatNumber,
  formatPercentage,
  formatRest,
  getInitials,
  sanitizeColor,
} from './ui.js';

const mainContent = document.querySelector('#main-content');
const sidebar = document.querySelector('#sidebar');
const sidebarOverlay = document.querySelector('#sidebar-overlay');
const sidebarWorkouts = document.querySelector('#sidebar-workouts');
const modalRoot = document.querySelector('#modal-root');
const toastRoot = document.querySelector('#toast-root');
const globalSearch = document.querySelector('#global-search');
const clearSearchButton = document.querySelector('#clear-search');
const searchResults = document.querySelector('#search-results');
const profileChip = document.querySelector('#profile-chip');
const storage = createStorage();
const store = createStore({ storage });

const uiState = {
  expandedExercises: new Set(),
  searchQuery: '',
  searchActiveIndex: -1,
};

let lastFocusedElement = null;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function renderIcon(name, className = '') {
  const paths = {
    dumbbell: '<path d="M6 9v6M18 9v6M3 11v2M21 11v2M6 12h12M8 7v10M16 7v10" />',
    check: '<path d="m5 12 4 4L19 6" />',
    edit: '<path d="m4 16-.8 4.8L8 20l10.8-10.8-4-4L4 16Z" /><path d="m13.5 6.5 4 4M4 16l4 4" />',
    home: '<path d="m4 11 8-7 8 7v8H4zM9 19v-5h6v5" />',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" />',
    list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />',
    history: '<circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2M4 4v4h4" />',
    settings: '<path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" /><path d="m19 13 .1-1-.1-1 2-1.5-2-3.5-2.4 1a8 8 0 0 0-1.7-1L14.5 3h-5L9 6a8 8 0 0 0-1.7 1l-2.4-1-2 3.5L5 11a8 8 0 0 0 0 2l-2.1 1.5 2 3.5 2.4-1a8 8 0 0 0 1.7 1l.5 3h5l.5-3a8 8 0 0 0 1.7-1l2.4 1 2-3.5L19 13Z" />',
  };

  return `<svg class="ui-icon ${escapeHtml(className)}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[name] ?? paths.check}</svg>`;
}

function getRoute() {
  const hash = window.location.hash || '#/inicio';
  const [pathPart, queryPart = ''] = hash.split('?');
  const segments = pathPart.replace(/^#\/?/, '').split('/').filter(Boolean);

  return {
    name: segments[0] || 'inicio',
    id: segments[1] || null,
    query: new URLSearchParams(queryPart),
  };
}

function navigate(path) {
  if (window.location.hash === path) {
    renderAll();
    return;
  }

  window.location.hash = path;
}

function closeMobileSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.hidden = true;
  document.querySelector('#sidebar-toggle')?.setAttribute('aria-expanded', 'false');
}

function getWorkout(state, workoutId) {
  return state.workouts.find((workout) => workout.id === workoutId);
}

function getDisplaySession(state, workoutId) {
  return getActiveSession(state, workoutId) ?? { completed_sets: {} };
}

function getScheduledWorkout(state, route) {
  const scheduled = getTodayWorkouts(state.workouts);
  const requestedId = route.query.get('workout');

  return scheduled.find((workout) => workout.id === requestedId) ?? scheduled[0];
}

function renderProgressBar(percentage, label = '') {
  return `
    <div class="progress-block">
      <div class="progress-header">
        <span>${escapeHtml(label)}</span>
        <strong>${formatPercentage(percentage)}</strong>
      </div>
      <div class="progress-track" role="progressbar" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100" aria-label="${escapeHtml(label)}">
        <div class="progress-value ${percentage === 100 ? 'success' : ''}" style="width: ${percentage}%"></div>
      </div>
    </div>
  `;
}

function renderSidebar(state, route) {
  const activeRoute = route.name === 'treinos' ? 'treinos' : route.name;

  document.querySelectorAll('[data-route]').forEach((item) => {
    item.classList.toggle('active', item.dataset.route === activeRoute);
  });

  sidebarWorkouts.innerHTML = state.workouts
    .filter((workout) => !workout.archived)
    .map((workout) => `
      <a
        class="sidebar-workout-item ${route.id === workout.id ? 'active' : ''}"
        href="#/treinos/${encodeURIComponent(workout.id)}"
        title="${escapeHtml(workout.name)}"
      >
        <span class="workout-color-dot" style="background: ${sanitizeColor(workout.color)}"></span>
        <span class="sidebar-workout-name">${escapeHtml(workout.name.replace(/^Treino\s+/i, ''))}</span>
        <span class="sidebar-workout-count">${workout.exercises.length}</span>
      </a>
    `)
    .join('');

  profileChip.textContent = getInitials(state.profile.name);
  profileChip.title = state.profile.name;
}

function renderDashboard(state) {
  const today = new Date();
  const scheduledWorkouts = getTodayWorkouts(state.workouts, today);
  const todayWorkout = scheduledWorkouts[0];
  const session = todayWorkout ? getDisplaySession(state, todayWorkout.id) : { completed_sets: {} };
  const stats = todayWorkout ? getWorkoutStats(todayWorkout, session) : null;
  const activeTodaySession = todayWorkout ? getActiveSession(state, todayWorkout.id) : null;
  const activeWorkouts = state.workouts.filter((workout) => !workout.archived);
  const completedSessions = state.sessions.filter((item) => item.status === 'completed');

  return `
    <div class="content-container">
      <header class="page-header">
        <div class="page-title-group">
          <p class="eyebrow">${escapeHtml(formatDateLong(today))}</p>
          <h1 class="page-title">Olá, ${escapeHtml(state.profile.name || 'atleta')}!</h1>
          <p class="page-subtitle">Organize seu treino e acompanhe cada série no seu ritmo.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" type="button" data-action="new-workout">＋ Novo treino</button>
        </div>
      </header>

      <section class="dashboard-grid" aria-label="Resumo do dia">
        ${todayWorkout ? `
          <article class="surface-card today-card">
            <div class="today-card-content">
              <p class="card-kicker">Treino do dia</p>
              <h2 class="today-card-title">${escapeHtml(todayWorkout.name)}</h2>
              <p class="today-card-description">${escapeHtml(todayWorkout.description || 'Sua rotina planejada para hoje.')}</p>
              <div class="today-card-progress" style="--progress-angle: ${Math.max(0, Math.min(100, stats.percentage)) * 3.6}deg" role="img" aria-label="${formatPercentage(stats.percentage)} concluído"><span>${formatPercentage(stats.percentage)}</span></div>
              <div class="today-card-context" aria-label="Status do treino">
                <span class="status-badge ${activeTodaySession ? 'warning' : 'success'}">${activeTodaySession ? 'Sessão em andamento' : 'Pronto para começar'}</span>
                <span class="status-badge">${stats.completed_sets} de ${stats.total_sets} séries</span>
              </div>
              <div class="today-card-footer">
                <button class="btn btn-primary" type="button" data-action="start-workout" data-workout-id="${escapeHtml(todayWorkout.id)}">
                  ${activeTodaySession ? 'Continuar treino' : 'Começar treino'}
                </button>
              </div>
            </div>
          </article>
        ` : `
          <article class="surface-card empty-state">
            <div class="empty-state-icon" aria-hidden="true">✓</div>
            <h3>Nenhum treino programado para hoje</h3>
            <p>Escolha um treino existente ou crie uma nova rotina para começar.</p>
            <button class="btn btn-secondary" type="button" data-action="open-workouts">Ver meus treinos</button>
          </article>
        `}

        <article class="surface-card summary-card">
          <div>
            <p class="summary-card-title">Visão geral</p>
            <p class="summary-big-number">${formatNumber(activeWorkouts.length)}</p>
            <p class="page-subtitle">treinos ativos</p>
          </div>
          <div class="summary-list">
            <div class="summary-list-item"><span>Sessões concluídas</span><strong>${formatNumber(completedSessions.length)}</strong></div>
            <div class="summary-list-item"><span>Exercícios cadastrados</span><strong>${formatNumber(activeWorkouts.reduce((total, item) => total + item.exercises.length, 0))}</strong></div>
            <div class="summary-list-item"><span>Data de hoje</span><strong>${formatDateShort(today)}</strong></div>
          </div>
        </article>
      </section>

      ${todayWorkout ? renderProgressBar(stats.percentage, `Progresso do ${todayWorkout.name}`) : ''}

      <div class="section-heading">
        <div>
          <h2>Rotinas de treino</h2>
          <p>Acesse rapidamente qualquer rotina cadastrada.</p>
        </div>
        <a class="btn btn-quiet" href="#/treinos">Ver todos →</a>
      </div>

      <section class="surface-card workout-list-card" aria-label="Rotinas de treino">
        <div class="list-toolbar">
          <span class="list-toolbar-title">Meus treinos</span>
          <span class="page-subtitle">${activeWorkouts.length} rotina(s)</span>
        </div>
        ${activeWorkouts.length ? activeWorkouts.slice(0, 5).map(renderWorkoutListRow).join('') : renderEmptyState('Nenhum treino cadastrado', 'Crie seu primeiro treino para começar.', 'new-workout')}
      </section>
    </div>
  `;
}

function renderWorkoutListRow(workout) {
  const days = (workout.days_of_week ?? []).map((day) => formatDayName(day).slice(0, 3));

  return `
    <a class="workout-row" href="#/treinos/${encodeURIComponent(workout.id)}">
      <span class="workout-row-color" style="background: ${sanitizeColor(workout.color)}"></span>
      <span class="workout-row-main">
        <span class="workout-row-title">${escapeHtml(workout.name)}</span>
        <span class="workout-row-meta">${formatNumber(workout.exercises.length)} exercício(s) · ${escapeHtml(workout.muscle_group || 'Foco livre')}</span>
      </span>
      <span class="workout-row-days">${days.map((day) => `<span class="day-pill">${escapeHtml(day)}</span>`).join('')}</span>
      <span class="nav-icon" aria-hidden="true">›</span>
    </a>
  `;
}

function renderWorkoutSwitcher(workouts, selectedWorkout) {
  if (workouts.length <= 1) {
    return '';
  }

  return `
    <div class="workout-switcher">
      <label for="today-workout-select">Treino de hoje</label>
      <select id="today-workout-select" data-action="select-today-workout">
        ${workouts.map((workout) => `
          <option value="${escapeHtml(workout.id)}" ${workout.id === selectedWorkout.id ? 'selected' : ''}>${escapeHtml(workout.name)}</option>
        `).join('')}
      </select>
    </div>
  `;
}

function renderTodayPage(state, route) {
  const scheduledWorkouts = getTodayWorkouts(state.workouts);
  const workout = getScheduledWorkout(state, route);

  if (!workout) {
    return `
      <div class="content-container">
        <header class="page-header">
          <div class="page-title-group">
            <p class="eyebrow">${escapeHtml(formatDateLong())}</p>
            <h1 class="page-title">Treino do dia</h1>
            <p class="page-subtitle">Sua rotina aparecerá aqui quando estiver associada ao dia atual.</p>
          </div>
        </header>
        <section class="surface-card empty-state">
          <div class="empty-state-icon" aria-hidden="true">✓</div>
          <h3>Nenhum treino programado para hoje</h3>
          <p>Você pode escolher um treino existente ou criar uma rotina nova.</p>
          <div class="page-actions">
            <button class="btn btn-primary" type="button" data-action="open-workouts">Escolher treino</button>
            <button class="btn btn-secondary" type="button" data-action="new-workout">＋ Criar treino</button>
          </div>
        </section>
      </div>
    `;
  }

  return `
    <div class="content-container">
      <header class="page-header">
        <div class="page-title-group">
          <p class="eyebrow">${escapeHtml(formatDateLong())}</p>
          <h1 class="page-title">Treino do dia</h1>
          <p class="page-subtitle">Clique em um exercício para ver as séries que você precisa fazer.</p>
        </div>
      </header>
      ${renderWorkoutSwitcher(scheduledWorkouts, workout)}
      ${renderExecutionWorkout(workout, state)}
    </div>
  `;
}

function renderExecutionWorkout(workout, state) {
  const session = getDisplaySession(state, workout.id);
  const stats = getWorkoutStats(workout, session);
  const activeSession = getActiveSession(state, workout.id);

  return `
    <section class="surface-card workout-header-card" aria-label="Resumo do treino">
      <div class="workout-header-main">
        <span class="workout-header-icon" style="background: ${sanitizeColor(workout.color)}">${renderIcon('dumbbell')}</span>
        <div class="workout-header-copy">
          <h2 class="workout-header-title">${escapeHtml(workout.name)}</h2>
          <div class="workout-header-meta">
            <span>${formatNumber(workout.exercises.length)} exercícios</span>
            <span>${formatNumber(stats.total_sets)} séries</span>
            <span>${escapeHtml(workout.muscle_group || 'Rotina de treino')}</span>
          </div>
        </div>
        <div class="workout-header-actions">
          <a class="btn btn-secondary" href="#/treinos/${encodeURIComponent(workout.id)}">Editar treino</a>
          ${activeSession ? `
            <button class="btn btn-primary" type="button" data-action="finish-session" data-workout-id="${escapeHtml(workout.id)}">Finalizar treino</button>
          ` : `
            <button class="btn btn-primary" type="button" data-action="start-workout" data-workout-id="${escapeHtml(workout.id)}">Começar treino</button>
          `}
        </div>
      </div>
      <div class="stats-strip">
        <div class="stat-item"><span class="stat-label">Exercícios concluídos</span><strong class="stat-value">${stats.completed_exercises} / ${stats.total_exercises}</strong></div>
        <div class="stat-item"><span class="stat-label">Séries concluídas</span><strong class="stat-value">${stats.completed_sets} / ${stats.total_sets}</strong></div>
        <div class="stat-item"><span class="stat-label">Progresso</span><strong class="stat-value">${formatPercentage(stats.percentage)}</strong></div>
      </div>
      <div style="margin-top: 18px">${renderProgressBar(stats.percentage, 'Progresso do treino')}</div>
    </section>

    <div class="section-heading">
      <div>
        <h2>Exercícios</h2>
        <p>Abra cada item para acompanhar suas séries.</p>
      </div>
      <span class="status-badge ${activeSession ? 'warning' : 'success'}">${activeSession ? 'Sessão em andamento' : 'Pronto para começar'}</span>
    </div>

    <section class="surface-card workout-list-card exercise-list" aria-label="Exercícios do treino">
      ${workout.exercises.length ? renderExerciseList(workout, session, true) : renderEmptyState('Este treino ainda não possui exercícios', 'Adicione exercícios para começar a montar sua rotina.', 'add-exercise', workout.id)}
    </section>
  `;
}

function renderExerciseList(workout, session, executionMode) {
  const stats = getWorkoutStats(workout, session);

  return workout.exercises
    .slice()
    .sort((first, second) => first.position - second.position)
    .map((exercise) => renderExerciseRow(workout, exercise, session, stats.exercises[exercise.id], executionMode))
    .join('');
}

function renderExerciseRow(workout, exercise, session, exerciseStats, executionMode) {
  const exerciseKey = `${workout.id}:${exercise.id}`;
  const expanded = uiState.expandedExercises.has(exerciseKey);
  const isComplete = exerciseStats.total_sets > 0 && exerciseStats.completed_sets === exerciseStats.total_sets;
  const detailId = `exercise-detail-${exercise.id}`;

  return `
    <article class="exercise-row">
      <div class="exercise-row-header">
        <button class="exercise-toggle" type="button" data-action="toggle-exercise" data-exercise-key="${escapeHtml(exerciseKey)}" aria-label="${expanded ? 'Recolher' : 'Expandir'} ${escapeHtml(exercise.name)}" aria-expanded="${expanded}" aria-controls="${escapeHtml(detailId)}">›</button>
        <span class="exercise-checkbox ${isComplete ? 'completed' : ''}" aria-hidden="true">${isComplete ? '✓' : ''}</span>
        <button class="exercise-row-copy exercise-row-copy-button" type="button" data-action="toggle-exercise" data-exercise-key="${escapeHtml(exerciseKey)}" aria-expanded="${expanded}" aria-controls="${escapeHtml(detailId)}">
          <span class="exercise-name">${escapeHtml(exercise.name)}</span>
          <span class="exercise-meta">
            <span>${escapeHtml(exercise.muscle_group || 'Exercício')}</span>
            <span>${formatNumber(exercise.sets.length)} séries</span>
            ${exercise.notes ? `<span>${escapeHtml(exercise.notes)}</span>` : ''}
          </span>
        </button>
        <span class="exercise-progress">
          <span class="exercise-progress-label">${exerciseStats.completed_sets} de ${exerciseStats.total_sets}</span>
          <span class="progress-track"><span class="progress-value ${isComplete ? 'success' : ''}" style="width: ${exerciseStats.percentage}%"></span></span>
        </span>
        <span class="exercise-actions">
          ${executionMode ? '' : `
            <button class="btn btn-quiet" type="button" data-action="edit-exercise" data-workout-id="${escapeHtml(workout.id)}" data-exercise-id="${escapeHtml(exercise.id)}">Editar</button>
            <button class="btn btn-quiet" type="button" data-action="delete-exercise" data-workout-id="${escapeHtml(workout.id)}" data-exercise-id="${escapeHtml(exercise.id)}">Excluir</button>
          `}
        </span>
      </div>
      ${expanded ? `
        <div id="${escapeHtml(detailId)}" class="exercise-detail">
          ${renderSetList(workout, exercise, session, executionMode)}
          ${exercise.notes ? `<p class="exercise-note"><strong>Observação:</strong> ${escapeHtml(exercise.notes)}</p>` : ''}
        </div>
      ` : ''}
    </article>
  `;
}

function renderSetList(workout, exercise, session, executionMode) {
  const completedSets = session.completed_sets?.[exercise.id] ?? [];

  return `
    <div class="set-list" aria-label="Séries de ${escapeHtml(exercise.name)}">
      <div class="set-list-header">
        <span>Séries planejadas</span>
        <span>Ações</span>
      </div>
      ${exercise.sets.map((set) => {
        const completed = completedSets.includes(set.id);
        const details = getSetDetails(set, session, exercise.id);
        return `
          <div class="set-row ${completed ? 'completed' : ''}">
            <div class="set-row-main">
              <div class="set-number"><span>SÉRIE</span><strong>${String(set.position).padStart(2, '0')}</strong></div>
              <div class="set-summary">
                <strong>Série ${String(set.position).padStart(2, '0')}</strong>
                <div class="set-summary-meta">
                  <span>${set.repetitions} repetições</span>
                  <span>${escapeHtml(formatLoad(details.load, set.load_unit))}</span>
                  <span>Descanso ${escapeHtml(formatRest(details.rest_seconds))}</span>
                </div>
              </div>
            </div>
            <span class="set-action">
              ${executionMode ? `
                <button class="set-edit" type="button" data-action="edit-set" data-workout-id="${escapeHtml(workout.id)}" data-exercise-id="${escapeHtml(exercise.id)}" data-set-id="${escapeHtml(set.id)}" aria-label="Editar carga e descanso da série ${set.position}">${renderIcon('edit')}<span>Editar</span></button>
                <button class="set-toggle" type="button" data-action="toggle-set" data-workout-id="${escapeHtml(workout.id)}" data-exercise-id="${escapeHtml(exercise.id)}" data-set-id="${escapeHtml(set.id)}">
                  ${renderIcon('check')}<span>${completed ? 'Concluída' : 'Concluir série'}</span>
                </button>
              ` : '<span class="page-subtitle">Planejada</span>'}
            </span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderWorkoutsPage(state) {
  const workouts = state.workouts.filter((workout) => !workout.archived);

  return `
    <div class="content-container">
      <header class="page-header">
        <div class="page-title-group">
          <p class="eyebrow">Organização</p>
          <h1 class="page-title">Meus treinos</h1>
          <p class="page-subtitle">Crie suas rotinas e deixe cada exercício pronto para o dia do treino.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" type="button" data-action="new-workout">＋ Novo treino</button>
        </div>
      </header>
      <section class="surface-card workout-list-card" aria-label="Lista de treinos">
        <div class="list-toolbar">
          <span class="list-toolbar-title">Lista</span>
          <span class="page-subtitle">${workouts.length} rotina(s)</span>
        </div>
        ${workouts.length ? workouts.map(renderWorkoutListRow).join('') : renderEmptyState('Nenhum treino cadastrado', 'Crie sua primeira rotina para começar.', 'new-workout')}
      </section>
    </div>
  `;
}

function renderWorkoutDetailPage(state, route) {
  const workout = getWorkout(state, route.id);

  if (!workout) {
    return renderNotFound('Treino não encontrado', 'A rotina selecionada não existe ou foi removida.');
  }

  const session = { completed_sets: {} };

  return `
    <div class="content-container">
      <header class="page-header">
        <div class="page-title-group">
          <p class="eyebrow"><a href="#/treinos">Meus treinos</a> / Detalhes</p>
          <h1 class="page-title">${escapeHtml(workout.name)}</h1>
          <p class="page-subtitle">Edite a rotina e configure as séries de cada exercício.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" type="button" data-action="edit-workout" data-workout-id="${escapeHtml(workout.id)}">Editar treino</button>
          <button class="btn btn-danger" type="button" data-action="delete-workout" data-workout-id="${escapeHtml(workout.id)}">Excluir</button>
        </div>
      </header>

      <section class="surface-card workout-header-card" aria-label="Detalhes do treino">
        <div class="workout-header-main">
        <span class="workout-header-icon" style="background: ${sanitizeColor(workout.color)}">${renderIcon('dumbbell')}</span>
          <div class="workout-header-copy">
            <h2 class="workout-header-title">${escapeHtml(workout.name)}</h2>
            <div class="workout-header-meta">
              <span>${formatNumber(workout.exercises.length)} exercícios</span>
              <span>${escapeHtml(workout.muscle_group || 'Foco livre')}</span>
              <span>${(workout.days_of_week ?? []).map(formatDayName).join(', ') || 'Sem dia definido'}</span>
            </div>
          </div>
        </div>
        ${workout.description ? `<p class="page-subtitle" style="margin-top: 16px">${escapeHtml(workout.description)}</p>` : ''}
      </section>

      <div class="section-heading">
        <div>
          <h2>Exercícios da rotina</h2>
          <p>Clique em um exercício para consultar as séries planejadas.</p>
        </div>
        <button class="btn btn-primary" type="button" data-action="add-exercise" data-workout-id="${escapeHtml(workout.id)}">＋ Adicionar exercício</button>
      </div>

      <section class="surface-card workout-list-card exercise-list" aria-label="Exercícios do treino">
        ${workout.exercises.length ? renderExerciseList(workout, session, false) : renderEmptyState('Este treino ainda não possui exercícios', 'Adicione o primeiro exercício desta rotina.', 'add-exercise', workout.id)}
      </section>
    </div>
  `;
}

function renderHistory(state) {
  const sessions = [...state.sessions].sort((first, second) => {
    return String(second.started_at).localeCompare(String(first.started_at));
  });

  return `
    <div class="content-container">
      <header class="page-header">
        <div class="page-title-group">
          <p class="eyebrow">Acompanhamento</p>
          <h1 class="page-title">Histórico</h1>
          <p class="page-subtitle">Veja as sessões que você registrou neste navegador.</p>
        </div>
      </header>
      <section class="history-list" aria-label="Histórico de sessões">
        ${sessions.length ? sessions.map((session) => {
          const workout = getWorkout(state, session.workout_id);
          const stats = workout ? getWorkoutStats(workout, session) : null;
          const isCompleted = session.status === 'completed';

          return `
            <article class="surface-card history-row">
              <div class="history-row-main">
                <p class="history-row-title">${escapeHtml(workout?.name || 'Treino removido')}</p>
                <p class="history-row-meta">${escapeHtml(formatDateTime(session.finished_at || session.started_at))} · ${stats ? `${stats.completed_sets} de ${stats.total_sets} séries` : 'Dados indisponíveis'}</p>
              </div>
              <div>
                <span class="status-badge ${isCompleted ? 'success' : 'warning'}">${isCompleted ? `${formatPercentage(stats?.percentage ?? 0)} concluído` : 'Em andamento'}</span>
              </div>
            </article>
          `;
        }).join('') : renderEmptyState('Nenhuma sessão registrada', 'Comece um treino e marque suas séries para construir seu histórico.', 'open-today')}
      </section>
    </div>
  `;
}

function renderSettings(state) {
  return `
    <div class="content-container">
      <header class="page-header">
        <div class="page-title-group">
          <p class="eyebrow">Preferências</p>
          <h1 class="page-title">Configurações</h1>
          <p class="page-subtitle">Personalize o perfil local e faça cópias dos seus dados.</p>
        </div>
      </header>

      <div class="settings-grid">
        <section class="surface-card settings-card">
          <h2>Perfil local</h2>
          <p>Esse perfil existe apenas neste navegador e não usa senha ou autenticação de servidor.</p>
          <form data-form="profile">
            <div class="form-errors" hidden></div>
            <div class="form-field">
              <label for="profile-name">Seu nome</label>
              <input id="profile-name" name="name" type="text" value="${escapeHtml(state.profile.name)}" maxlength="80" required>
            </div>
            <div class="form-actions">
              <button class="btn btn-primary" type="submit">Salvar perfil</button>
            </div>
          </form>
        </section>

        <section class="surface-card settings-card">
          <h2>Dados locais</h2>
          <p>Faça uma cópia dos seus treinos antes de limpar o navegador ou trocar de dispositivo.</p>
          <div class="settings-actions">
            <button class="btn btn-secondary" type="button" data-action="export-data">↓ Exportar dados</button>
            <label class="file-input-label" for="import-file">↑ Importar dados <input id="import-file" type="file" accept="application/json,.json"></label>
            <button class="btn btn-secondary" type="button" data-action="restore-demo">Restaurar dados de exemplo</button>
            <button class="btn btn-danger" type="button" data-action="reset-data">Apagar dados locais</button>
          </div>
        </section>
      </div>
    </div>
  `;
}

function renderEmptyState(title, description, action, workoutId = '') {
  const actionMarkup = action === 'new-workout'
    ? '<button class="btn btn-primary" type="button" data-action="new-workout">＋ Criar treino</button>'
    : action === 'add-exercise'
      ? `<button class="btn btn-primary" type="button" data-action="add-exercise" data-workout-id="${escapeHtml(workoutId)}">＋ Adicionar exercício</button>`
      : action === 'open-workouts'
        ? '<a class="btn btn-primary" href="#/treinos">Ver meus treinos</a>'
        : action === 'open-today'
          ? '<a class="btn btn-primary" href="#/treino-do-dia">Ver treino do dia</a>'
          : '';

  return `
    <div class="empty-state">
      <div class="empty-state-icon" aria-hidden="true">✓</div>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(description)}</p>
      ${actionMarkup}
    </div>
  `;
}

function renderNotFound(title, description) {
  return `
    <div class="content-container">
      <section class="surface-card empty-state">
        <div class="empty-state-icon" aria-hidden="true">?</div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(description)}</p>
        <a class="btn btn-primary" href="#/inicio">Voltar ao início</a>
      </section>
    </div>
  `;
}

function renderPage(state, route) {
  if (route.name === 'inicio') {
    return renderDashboard(state);
  }

  if (route.name === 'treino-do-dia') {
    return renderTodayPage(state, route);
  }

  if (route.name === 'treinos' && route.id) {
    return renderWorkoutDetailPage(state, route);
  }

  if (route.name === 'treinos') {
    return renderWorkoutsPage(state);
  }

  if (route.name === 'historico') {
    return renderHistory(state);
  }

  if (route.name === 'configuracoes') {
    return renderSettings(state);
  }

  return renderNotFound('Página não encontrada', 'O caminho acessado não está disponível.');
}

function renderSearchResults(state) {
  const query = uiState.searchQuery.trim().toLocaleLowerCase('pt-BR');
  clearSearchButton.hidden = !query;

  if (!query) {
    searchResults.innerHTML = '';
    globalSearch.setAttribute('aria-expanded', 'false');
    globalSearch.removeAttribute('aria-activedescendant');
    return;
  }

  const results = [];

  for (const workout of state.workouts.filter((item) => !item.archived)) {
    const workoutText = `${workout.name} ${workout.muscle_group ?? ''}`.toLocaleLowerCase('pt-BR');
    if (workoutText.includes(query)) {
      results.push({
        title: workout.name,
        meta: `Treino · ${workout.exercises.length} exercícios`,
        href: `#/treinos/${encodeURIComponent(workout.id)}`,
        icon: 'dumbbell',
      });
    }

    for (const exercise of workout.exercises) {
      const exerciseText = `${exercise.name} ${exercise.muscle_group ?? ''}`.toLocaleLowerCase('pt-BR');
      if (exerciseText.includes(query)) {
        results.push({
          title: exercise.name,
          meta: `Exercício em ${workout.name}`,
          href: `#/treinos/${encodeURIComponent(workout.id)}`,
          icon: 'check',
          exerciseKey: `${workout.id}:${exercise.id}`,
        });
      }
    }
  }

  if (!results.length) {
    searchResults.innerHTML = '<div class="search-empty">Nenhum treino ou exercício encontrado.</div>';
    globalSearch.setAttribute('aria-expanded', 'true');
    globalSearch.removeAttribute('aria-activedescendant');
    return;
  }

  const visibleResults = results.slice(0, 12);
  uiState.searchActiveIndex = Math.min(Math.max(uiState.searchActiveIndex, -1), visibleResults.length - 1);
  searchResults.innerHTML = visibleResults.map((result, index) => `
    <button id="search-option-${index}" class="search-result" role="option" aria-selected="${index === uiState.searchActiveIndex}" type="button" data-action="search-result" data-href="${escapeHtml(result.href)}" data-exercise-key="${escapeHtml(result.exerciseKey ?? '')}">
      <span class="search-result-icon">${renderIcon(result.icon)}</span>
      <span class="search-result-copy">
        <span class="search-result-title">${escapeHtml(result.title)}</span>
        <span class="search-result-meta">${escapeHtml(result.meta)}</span>
      </span>
    </button>
  `).join('');
  globalSearch.setAttribute('aria-expanded', 'true');
  if (uiState.searchActiveIndex >= 0) {
    globalSearch.setAttribute('aria-activedescendant', `search-option-${uiState.searchActiveIndex}`);
  } else {
    globalSearch.removeAttribute('aria-activedescendant');
  }
}

function renderAll() {
  const state = store.getState();
  const route = getRoute();

  renderSidebar(state, route);
  mainContent.innerHTML = renderPage(state, route);
  globalSearch.value = uiState.searchQuery;
  renderSearchResults(state);
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon" aria-hidden="true">${type === 'error' ? '!' : type === 'warning' ? '⚠' : '✓'}</span><span class="toast-message"></span>`;
  toast.querySelector('.toast-message').textContent = message;
  toastRoot.append(toast);

  window.setTimeout(() => toast.remove(), 3600);
}

function closeModal() {
  modalRoot.innerHTML = '';
  document.body.classList.remove('modal-open');
  lastFocusedElement?.focus?.();
  lastFocusedElement = null;
}

function openModal(title, description, body) {
  lastFocusedElement = document.activeElement;
  modalRoot.innerHTML = `
    <div class="modal-backdrop" data-action="close-modal">
      <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1">
        <header class="modal-header">
          <div>
            <h2 id="modal-title" class="modal-title">${escapeHtml(title)}</h2>
            ${description ? `<p class="modal-description">${escapeHtml(description)}</p>` : ''}
          </div>
          <button class="modal-close" type="button" data-action="close-modal" aria-label="Fechar">×</button>
        </header>
        ${body}
      </section>
    </div>
  `;
  document.body.classList.add('modal-open');
}

function renderDaysPicker(selectedDays = []) {
  return `
    <div class="days-picker">
      ${[0, 1, 2, 3, 4, 5, 6].map((day) => `
        <label class="day-option">
          <input type="checkbox" name="days_of_week" value="${day}" ${selectedDays.includes(day) ? 'checked' : ''}>
          <span>${formatDayName(day).slice(0, 3)}</span>
        </label>
      `).join('')}
    </div>
  `;
}

function renderColorOptions(selectedColor = '#315bd6') {
  const colors = ['#315bd6', '#c47b29', '#7c5ac7', '#2b8a78', '#b54b73', '#5c7898'];

  return `
    <div class="color-options">
      ${colors.map((color) => `
        <label class="color-option">
          <input type="radio" name="color" value="${color}" ${selectedColor === color ? 'checked' : ''}>
          <span style="background: ${color}"></span>
        </label>
      `).join('')}
    </div>
  `;
}

function openWorkoutModal(workoutId = null) {
  const state = store.getState();
  const workout = workoutId ? getWorkout(state, workoutId) : null;
  const editing = Boolean(workout);

  openModal(
    editing ? 'Editar treino' : 'Novo treino',
    'Defina o nome, o foco e os dias em que essa rotina será sugerida.',
    `
      <form class="modal-body" data-form="workout" data-workout-id="${escapeHtml(workout?.id ?? '')}">
        <div id="workout-form-errors" class="form-errors" hidden></div>
        <div class="form-grid">
          <div class="form-field form-field-full">
            <label for="workout-name">Nome do treino</label>
            <input id="workout-name" name="name" type="text" value="${escapeHtml(workout?.name ?? '')}" placeholder="Ex.: Treino A - Peitoral" maxlength="80" required>
          </div>
          <div class="form-field">
            <label for="workout-muscle-group">Foco principal</label>
            <input id="workout-muscle-group" name="muscle_group" type="text" value="${escapeHtml(workout?.muscle_group ?? '')}" placeholder="Ex.: Peitoral">
          </div>
          <div class="form-field">
            <span class="form-label">Cor de identificação</span>
            ${renderColorOptions(workout?.color)}
          </div>
          <div class="form-field form-field-full">
            <label for="workout-description">Descrição</label>
            <textarea id="workout-description" name="description" placeholder="Uma observação geral sobre a rotina.">${escapeHtml(workout?.description ?? '')}</textarea>
          </div>
          <div class="form-field form-field-full">
            <span class="form-label">Dias da semana</span>
            ${renderDaysPicker(workout?.days_of_week ?? [])}
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn-secondary" type="button" data-action="close-modal">Cancelar</button>
          <button class="btn btn-primary" type="submit">Salvar treino</button>
        </div>
      </form>
    `,
  );

  modalRoot.querySelector('#workout-name')?.focus();
}

function renderSetEditorRows(sets = []) {
  const values = sets.length ? sets : [{ repetitions: 10, load: '', rest_seconds: 60 }];

  return values.map((set, index) => `
    <div class="set-editor-row" data-set-id="${escapeHtml(set.id ?? '')}">
      <span class="set-editor-index">Série ${index + 1}</span>
      <input name="repetitions" type="number" min="1" step="1" value="${escapeHtml(set.repetitions ?? 10)}" aria-label="Repetições da série ${index + 1}" placeholder="Reps">
      <input name="load" type="number" min="0" step="0.5" value="${set.load ?? ''}" aria-label="Carga da série ${index + 1}" placeholder="Carga">
      <input name="rest_seconds" type="number" min="0" step="5" value="${escapeHtml(set.rest_seconds ?? 60)}" aria-label="Descanso da série ${index + 1}" placeholder="Descanso (s)">
      <button class="set-remove-button" type="button" data-action="remove-set-row" aria-label="Remover série ${index + 1}">×</button>
    </div>
  `).join('');
}

function openExerciseModal(workoutId, exerciseId = null) {
  const state = store.getState();
  const workout = getWorkout(state, workoutId);
  const exercise = workout?.exercises.find((item) => item.id === exerciseId);
  const editing = Boolean(exercise);

  if (!workout) {
    return;
  }

  openModal(
    editing ? 'Editar exercício' : 'Adicionar exercício',
    `Configure as séries para ${workout.name}.`,
    `
      <form class="modal-body" data-form="exercise" data-workout-id="${escapeHtml(workout.id)}" data-exercise-id="${escapeHtml(exercise?.id ?? '')}">
        <div id="exercise-form-errors" class="form-errors" hidden></div>
        <div class="form-grid">
          <div class="form-field">
            <label for="exercise-name">Nome do exercício</label>
            <input id="exercise-name" name="name" type="text" value="${escapeHtml(exercise?.name ?? '')}" placeholder="Ex.: Supino reto" maxlength="80" required>
          </div>
          <div class="form-field">
            <label for="exercise-muscle-group">Grupo muscular</label>
            <input id="exercise-muscle-group" name="muscle_group" type="text" value="${escapeHtml(exercise?.muscle_group ?? workout.muscle_group ?? '')}" placeholder="Ex.: Peitoral">
          </div>
          <div class="form-field form-field-full">
            <label for="exercise-notes">Observação</label>
            <textarea id="exercise-notes" name="notes" placeholder="Ex.: controlar a descida.">${escapeHtml(exercise?.notes ?? '')}</textarea>
          </div>
          <div class="form-field form-field-full set-editor">
            <div class="set-editor-heading">
              <span>Séries planejadas</span>
              <span class="page-subtitle">Reps · carga (kg) · descanso (s)</span>
            </div>
            <div id="set-editor-rows">${renderSetEditorRows(exercise?.sets ?? [])}</div>
            <button class="set-add-button" type="button" data-action="add-set-row">＋ Adicionar série</button>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn-secondary" type="button" data-action="close-modal">Cancelar</button>
          <button class="btn btn-primary" type="submit">Salvar exercício</button>
        </div>
      </form>
    `,
  );

  modalRoot.querySelector('#exercise-name')?.focus();
}

function openSetAdjustmentModal(workoutId, exerciseId, setId) {
  const state = store.getState();
  const workout = getWorkout(state, workoutId);
  const exercise = workout?.exercises.find((item) => item.id === exerciseId);
  const set = exercise?.sets.find((item) => item.id === setId);
  const session = workout ? getDisplaySession(state, workout.id) : null;
  const details = set && session ? getSetDetails(set, session, exercise.id) : null;

  if (!workout || !exercise || !set || !details) {
    return;
  }

  openModal(
    `Ajustar série ${set.position}`,
    `${exercise.name} · ${workout.name}`,
    `
      <form class="modal-body" data-form="set-adjustment" data-workout-id="${escapeHtml(workoutId)}" data-exercise-id="${escapeHtml(exerciseId)}" data-set-id="${escapeHtml(setId)}">
        <div id="set-adjustment-form-errors" class="form-errors" hidden></div>
        <div class="form-grid">
          <div class="form-field">
            <label for="adjustment-load">Carga (kg)</label>
            <input id="adjustment-load" name="load" type="number" min="0" step="0.5" value="${details.load ?? ''}" placeholder="Peso corporal">
          </div>
          <div class="form-field">
            <label for="adjustment-rest">Descanso (segundos)</label>
            <input id="adjustment-rest" name="rest_seconds" type="number" min="0" step="5" value="${details.rest_seconds}" required>
          </div>
        </div>
        <p class="page-subtitle">Este ajuste vale apenas para a sessão atual e não altera sua rotina planejada.</p>
        <div class="form-actions">
          <button class="btn btn-secondary" type="button" data-action="close-modal">Cancelar</button>
          <button class="btn btn-primary" type="submit">Salvar ajuste</button>
        </div>
      </form>
    `,
  );

  modalRoot.querySelector('#adjustment-load')?.focus();
}

function showFormErrors(form, errors) {
  const container = form.querySelector('.form-errors');
  if (!container) {
    return;
  }

  container.innerHTML = errors.map((error) => `<div>${escapeHtml(error)}</div>`).join('');
  container.hidden = errors.length === 0;
}

function saveWorkout(form) {
  const state = store.getState();
  const workoutId = form.dataset.workoutId;
  const name = form.elements.name.value.trim();
  const daysOfWeek = [...form.querySelectorAll('input[name="days_of_week"]:checked')].map((input) => Number(input.value));
  const color = form.querySelector('input[name="color"]:checked')?.value || '#315bd6';

  if (!name) {
    showFormErrors(form, ['Informe o nome do treino.']);
    return;
  }

  const timestamp = new Date().toISOString();
  store.setState((current) => {
    if (workoutId) {
      return {
        ...current,
        workouts: current.workouts.map((workout) => workout.id === workoutId ? {
          ...workout,
          name,
          description: form.elements.description.value.trim(),
          muscle_group: form.elements.muscle_group.value.trim(),
          days_of_week: daysOfWeek,
          color,
          updated_at: timestamp,
        } : workout),
      };
    }

    const newWorkout = {
      id: createId('workout'),
      name,
      description: form.elements.description.value.trim(),
      muscle_group: form.elements.muscle_group.value.trim(),
      days_of_week: daysOfWeek,
      color,
      archived: false,
      created_at: timestamp,
      updated_at: timestamp,
      exercises: [],
    };

    return {
      ...current,
      workouts: [...current.workouts, newWorkout],
    };
  });

  const savedId = workoutId || store.getState().workouts.at(-1).id;
  closeModal();
  showToast(workoutId ? 'Treino atualizado com sucesso.' : 'Treino criado com sucesso.');
  navigate(`#/treinos/${encodeURIComponent(savedId)}`);
}

function saveExercise(form) {
  const state = store.getState();
  const workoutId = form.dataset.workoutId;
  const exerciseId = form.dataset.exerciseId;
  const workout = getWorkout(state, workoutId);
  const name = form.elements.name.value.trim();
  const timestamp = new Date().toISOString();
  const rows = [...form.querySelectorAll('.set-editor-row')];
  const sets = rows.map((row, index) => {
    const loadValue = row.querySelector('[name="load"]').value;
    return {
      id: row.dataset.setId || createId('set'),
      position: index + 1,
      repetitions: Number(row.querySelector('[name="repetitions"]').value),
      load: loadValue === '' ? null : Number(loadValue),
      load_unit: 'kg',
      rest_seconds: Number(row.querySelector('[name="rest_seconds"]').value) || 0,
    };
  });
  const validation = validateWorkoutInput({
    name: workout?.name,
    exercises: [{ name, sets }],
  });

  if (!workout || !validation.valid) {
    showFormErrors(form, validation.errors);
    return;
  }

  const exerciseData = {
    id: exerciseId || createId('exercise'),
    name,
    muscle_group: form.elements.muscle_group.value.trim(),
    notes: form.elements.notes.value.trim(),
    position: exerciseId ? workout.exercises.find((item) => item.id === exerciseId)?.position ?? workout.exercises.length + 1 : workout.exercises.length + 1,
    created_at: exerciseId ? workout.exercises.find((item) => item.id === exerciseId)?.created_at ?? timestamp : timestamp,
    updated_at: timestamp,
    sets,
  };

  store.setState((current) => ({
    ...current,
    workouts: current.workouts.map((item) => {
      if (item.id !== workoutId) {
        return item;
      }

      const exercises = exerciseId
        ? item.exercises.map((exercise) => exercise.id === exerciseId ? exerciseData : exercise)
        : [...item.exercises, exerciseData];

      return {
        ...item,
        exercises,
        updated_at: timestamp,
      };
    }),
  }));

  closeModal();
  showToast(exerciseId ? 'Exercício atualizado com sucesso.' : 'Exercício adicionado ao treino.');
  uiState.expandedExercises.add(`${workoutId}:${exerciseData.id}`);
  navigate(`#/treinos/${encodeURIComponent(workoutId)}`);
}

function saveSetAdjustment(form) {
  const loadValue = form.elements.load.value;
  const restSeconds = Number(form.elements.rest_seconds.value);

  if (restSeconds < 0 || !Number.isFinite(restSeconds) || (loadValue !== '' && (!Number.isFinite(Number(loadValue)) || Number(loadValue) < 0))) {
    showFormErrors(form, ['Informe uma carga e um descanso válidos.']);
    return;
  }

  const { workoutId, exerciseId, setId } = form.dataset;
  store.setState((current) => {
    const activeSession = getActiveSession(current, workoutId) ?? createSession(workoutId);
    const nextSession = updateSetDetails(activeSession, exerciseId, setId, {
      load: loadValue,
      rest_seconds: restSeconds,
    });
    const sessionExists = current.sessions.some((session) => session.id === activeSession.id);

    return {
      ...current,
      sessions: sessionExists
        ? current.sessions.map((session) => session.id === activeSession.id ? nextSession : session)
        : [...current.sessions, nextSession],
    };
  });

  closeModal();
  showToast('Carga e descanso atualizados para esta sessão.');
}

function startWorkout(workoutId) {
  const workout = getWorkout(store.getState(), workoutId);
  if (!workout) {
    return;
  }

  store.setState((current) => {
    if (getActiveSession(current, workoutId)) {
      return current;
    }

    return {
      ...current,
      sessions: [...current.sessions, createSession(workoutId)],
    };
  });

  showToast('Treino iniciado. Marque cada série conforme concluir.');
  navigate(`#/treino-do-dia?workout=${encodeURIComponent(workoutId)}`);
}

function toggleSet(workoutId, exerciseId, setId) {
  store.setState((current) => {
    const activeSession = getActiveSession(current, workoutId) ?? createSession(workoutId);
    const nextSession = toggleSetCompletion(activeSession, exerciseId, setId);
    const sessionExists = current.sessions.some((session) => session.id === activeSession.id);

    return {
      ...current,
      sessions: sessionExists
        ? current.sessions.map((session) => session.id === activeSession.id ? nextSession : session)
        : [...current.sessions, nextSession],
    };
  });
}

function finishWorkout(workoutId) {
  const state = store.getState();
  const workout = getWorkout(state, workoutId);
  const session = getActiveSession(state, workoutId);

  if (!workout || !session) {
    return;
  }

  const stats = getWorkoutStats(workout, session);
  if (stats.completed_sets < stats.total_sets && !window.confirm('Ainda existem séries pendentes. Deseja finalizar mesmo assim?')) {
    return;
  }

  store.setState((current) => ({
    ...current,
    sessions: current.sessions.map((item) => item.id === session.id ? finishSession(item, 'completed') : item),
  }));
  showToast('Sessão registrada no histórico.');
}

function deleteWorkout(workoutId) {
  const state = store.getState();
  const workout = getWorkout(state, workoutId);
  if (!workout || !window.confirm(`Excluir o treino “${workout.name}”? Essa ação não pode ser desfeita.`)) {
    return;
  }

  store.setState((current) => ({
    ...current,
    workouts: current.workouts.filter((item) => item.id !== workoutId),
    sessions: current.sessions.filter((session) => session.workout_id !== workoutId),
  }));
  showToast('Treino excluído.', 'warning');
  navigate('#/treinos');
}

function deleteExercise(workoutId, exerciseId) {
  const state = store.getState();
  const workout = getWorkout(state, workoutId);
  const exercise = workout?.exercises.find((item) => item.id === exerciseId);
  if (!workout || !exercise || !window.confirm(`Excluir o exercício “${exercise.name}”?`)) {
    return;
  }

  store.setState((current) => ({
    ...current,
    workouts: current.workouts.map((item) => item.id === workoutId ? {
      ...item,
      exercises: item.exercises
        .filter((currentExercise) => currentExercise.id !== exerciseId)
        .map((currentExercise, index) => ({ ...currentExercise, position: index + 1 })),
      updated_at: new Date().toISOString(),
    } : item),
  }));
  showToast('Exercício excluído.', 'warning');
}

function exportData() {
  const blob = new Blob([JSON.stringify(store.getState(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `bora-treinar-${getLocalDateKey()}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  showToast('Dados exportados com sucesso.');
}

function importData(file) {
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!validateState(imported)) {
        throw new Error('invalid-state');
      }

      if (!window.confirm('Importar os dados substituirá o conteúdo atual. Deseja continuar?')) {
        return;
      }

      store.setState(imported);
      showToast('Dados importados com sucesso.');
    } catch (error) {
      showToast('O arquivo selecionado não possui um formato compatível.', 'error');
    }
  });
  reader.readAsText(file);
}

function saveProfile(form) {
  const name = form.elements.name.value.trim();
  if (!name) {
    showFormErrors(form, ['Informe seu nome.']);
    return;
  }

  store.setState((current) => ({
    ...current,
    profile: {
      ...current.profile,
      name,
      updated_at: new Date().toISOString(),
    },
  }));
  showToast('Perfil atualizado com sucesso.');
}

function handleClick(event) {
  const actionElement = event.target.closest('[data-action]');
  if (!actionElement) {
    return;
  }

  const action = actionElement.dataset.action;

  if (action === 'close-modal') {
    if (event.target === actionElement || actionElement.classList.contains('modal-close')) {
      closeModal();
    }
    return;
  }

  if (action === 'toggle-exercise') {
    const key = actionElement.dataset.exerciseKey;
    if (key) {
      if (uiState.expandedExercises.has(key)) {
        uiState.expandedExercises.delete(key);
      } else {
        uiState.expandedExercises.add(key);
      }
      renderAll();
    }
    return;
  }

  if (action === 'toggle-set') {
    event.stopPropagation();
    toggleSet(actionElement.dataset.workoutId, actionElement.dataset.exerciseId, actionElement.dataset.setId);
    return;
  }

  if (action === 'edit-set') {
    event.stopPropagation();
    openSetAdjustmentModal(actionElement.dataset.workoutId, actionElement.dataset.exerciseId, actionElement.dataset.setId);
    return;
  }

  if (action === 'start-workout') {
    startWorkout(actionElement.dataset.workoutId);
    return;
  }

  if (action === 'finish-session') {
    finishWorkout(actionElement.dataset.workoutId);
    return;
  }

  if (action === 'new-workout') {
    openWorkoutModal();
    return;
  }

  if (action === 'open-workouts') {
    navigate('#/treinos');
    return;
  }

  if (action === 'open-today') {
    navigate('#/treino-do-dia');
    return;
  }

  if (action === 'edit-workout') {
    openWorkoutModal(actionElement.dataset.workoutId);
    return;
  }

  if (action === 'delete-workout') {
    deleteWorkout(actionElement.dataset.workoutId);
    return;
  }

  if (action === 'add-exercise') {
    openExerciseModal(actionElement.dataset.workoutId);
    return;
  }

  if (action === 'edit-exercise') {
    openExerciseModal(actionElement.dataset.workoutId, actionElement.dataset.exerciseId);
    return;
  }

  if (action === 'delete-exercise') {
    deleteExercise(actionElement.dataset.workoutId, actionElement.dataset.exerciseId);
    return;
  }

  if (action === 'add-set-row') {
    const rows = modalRoot.querySelector('#set-editor-rows');
    const currentRows = rows.querySelectorAll('.set-editor-row');
    rows.insertAdjacentHTML('beforeend', renderSetEditorRows([{ repetitions: 10, load: '', rest_seconds: 60 }]));
    const newRow = rows.lastElementChild;
    newRow.dataset.setId = '';
    newRow.querySelector('.set-editor-index').textContent = `Série ${currentRows.length + 1}`;
    return;
  }

  if (action === 'remove-set-row') {
    const rows = modalRoot.querySelectorAll('.set-editor-row');
    if (rows.length <= 1) {
      showToast('O exercício precisa de pelo menos uma série.', 'warning');
      return;
    }
    actionElement.closest('.set-editor-row').remove();
    modalRoot.querySelectorAll('.set-editor-row').forEach((row, index) => {
      row.querySelector('.set-editor-index').textContent = `Série ${index + 1}`;
    });
    return;
  }

  if (action === 'export-data') {
    exportData();
    return;
  }

  if (action === 'restore-demo') {
    if (window.confirm('Restaurar os dados de exemplo substituirá seus dados atuais. Deseja continuar?')) {
      store.reset();
      showToast('Dados de exemplo restaurados.', 'warning');
    }
    return;
  }

  if (action === 'reset-data') {
    if (window.confirm('Apagar todos os dados locais? Essa ação não pode ser desfeita.')) {
      storage.clear();
      store.reset(createEmptyState());
      showToast('Dados locais apagados.');
    }
    return;
  }

  if (action === 'search-result') {
    const exerciseKey = actionElement.dataset.exerciseKey;
    uiState.searchQuery = '';
    uiState.searchActiveIndex = -1;
    if (exerciseKey) {
      uiState.expandedExercises.add(exerciseKey);
    }
    navigate(actionElement.dataset.href);
    return;
  }

  if (action === 'clear-search') {
    uiState.searchQuery = '';
    uiState.searchActiveIndex = -1;
    globalSearch.value = '';
    renderSearchResults(store.getState());
  }
}

function handleSubmit(event) {
  const form = event.target.closest('form[data-form]');
  if (!form) {
    return;
  }

  event.preventDefault();
  const formType = form.dataset.form;

  if (formType === 'workout') {
    saveWorkout(form);
  } else if (formType === 'exercise') {
    saveExercise(form);
  } else if (formType === 'set-adjustment') {
    saveSetAdjustment(form);
  } else if (formType === 'profile') {
    saveProfile(form);
  }
}

function handleChange(event) {
  if (event.target.matches('#today-workout-select')) {
    navigate(`#/treino-do-dia?workout=${encodeURIComponent(event.target.value)}`);
    return;
  }

  if (event.target.matches('#import-file') && event.target.files?.[0]) {
    importData(event.target.files[0]);
  }
}

function handleSearchKeydown(event) {
  if (event.target !== globalSearch || !uiState.searchQuery.trim()) {
    return false;
  }

  const options = searchResults.querySelectorAll('[role="option"]');
  if (!options.length) {
    return false;
  }

  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    const direction = event.key === 'ArrowDown' ? 1 : -1;
    uiState.searchActiveIndex = (uiState.searchActiveIndex + direction + options.length) % options.length;
    renderSearchResults(store.getState());
    return true;
  }

  if (event.key === 'Enter' && uiState.searchActiveIndex >= 0) {
    event.preventDefault();
    options[uiState.searchActiveIndex].click();
    return true;
  }

  return false;
}

function handleKeydown(event) {
  if (handleSearchKeydown(event)) {
    return;
  }

  if (event.key === 'Escape') {
    if (modalRoot.innerHTML) {
      closeModal();
    } else {
      closeMobileSidebar();
    }
    return;
  }

  if (event.key === 'Tab' && modalRoot.innerHTML) {
    const modal = modalRoot.querySelector('[role="dialog"]');
    const focusable = [...modal.querySelectorAll('button, input, select, textarea, a[href]')]
      .filter((element) => !element.disabled && element.offsetParent !== null);

    if (focusable.length) {
      const first = focusable[0];
      const last = focusable.at(-1);

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    return;
  }

  const exerciseHeader = event.target.closest('[data-action="toggle-exercise"]');
  if (exerciseHeader && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    exerciseHeader.click();
  }
}

document.addEventListener('click', handleClick);
document.addEventListener('submit', handleSubmit);
document.addEventListener('change', handleChange);
document.addEventListener('keydown', handleKeydown);

window.addEventListener('hashchange', () => {
  closeMobileSidebar();
  renderAll();
  mainContent.focus({ preventScroll: true });
});

document.querySelector('#sidebar-toggle').addEventListener('click', () => {
  const isOpen = sidebar.classList.toggle('open');
  sidebarOverlay.hidden = !isOpen;
  document.querySelector('#sidebar-toggle').setAttribute('aria-expanded', String(isOpen));
});

sidebarOverlay.addEventListener('click', closeMobileSidebar);

globalSearch.addEventListener('input', (event) => {
  uiState.searchQuery = event.target.value;
  uiState.searchActiveIndex = -1;
  renderSearchResults(store.getState());
});

store.subscribe(renderAll);
renderAll();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {
      // A aplicação continua funcionando normalmente sem Service Worker.
    });
  });
}
