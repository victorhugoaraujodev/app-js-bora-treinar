const dateShortFormatter = new Intl.DateTimeFormat('pt-BR');
const dateLongFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

export function escapeHtml(value) {
  const characters = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };

  return String(value ?? '').replace(/[&<>"']/g, (character) => characters[character]);
}

export function sanitizeColor(value, fallback = '#315bd6') {
  return /^#[0-9a-f]{6}$/i.test(String(value ?? '')) ? String(value) : fallback;
}

export function formatDateShort(date) {
  return dateShortFormatter.format(date);
}

export function formatDateLong(date = new Date()) {
  const value = dateLongFormatter.format(date);
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatDateTime(value) {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatPercentage(value) {
  return `${Math.max(0, Math.round(Number(value) || 0))}%`;
}

export function formatNumber(value) {
  return new Intl.NumberFormat('pt-BR').format(Number(value) || 0);
}

export function formatLoad(load, unit = 'kg') {
  if (load === null || load === undefined || load === '') {
    return 'Peso corporal';
  }

  const formattedLoad = new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 2,
  }).format(Number(load));

  return `${formattedLoad} ${unit}`;
}

export function formatRest(seconds) {
  const totalSeconds = Number(seconds) || 0;
  if (!totalSeconds) {
    return 'Sem descanso definido';
  }

  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return remainingSeconds ? `${minutes}min ${remainingSeconds}s` : `${minutes}min`;
}

export function formatDayName(day) {
  return ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][day] ?? '—';
}

export function getInitials(name = '') {
  const initials = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  return initials || 'V';
}
