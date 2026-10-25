import {parseCron, describeCron, nextRuns} from '/src/cron.js';

const $ = (id) => document.getElementById(id);
const cronInput = $('cron-input');
const fromInput = $('from-input');
const feedback = $('cron-feedback');
const description = $('cron-description');
const runsList = $('runs-list');
const emptyState = $('empty-state');
const copyRunsButton = $('copy-runs');
const fieldValues = [...document.querySelectorAll('[data-cron-field]')];
const presets = [...document.querySelectorAll('[data-expression]')];
let lastRuns = [];

function localDateTimeValue(date) {
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 16);
}

function setNow() {
  fromInput.value = localDateTimeValue(new Date());
  render();
}

function readableDate(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).format(date);
}

function renderTimeline(dates) {
  runsList.replaceChildren();
  dates.forEach((date, index) => {
    const item = document.createElement('li');
    item.className = 'timeline-item';
    const number = document.createElement('span');
    number.className = 'timeline-index';
    number.textContent = String(index + 1).padStart(2, '0');
    const details = document.createElement('div');
    details.className = 'timeline-details';
    const primary = document.createElement('strong');
    primary.textContent = readableDate(date);
    const secondary = document.createElement('span');
    secondary.textContent = date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
    details.append(primary, secondary);
    item.append(number, details);
    runsList.append(item);
  });
}

function render() {
  const expression = cronInput.value.trim();
  presets.forEach((button) => {
    const active = button.dataset.expression === expression;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });

  try {
    const fields = parseCron(expression);
    const start = fromInput.value ? new Date(fromInput.value) : new Date();
    if (!Number.isFinite(start.getTime())) throw new Error('Informe uma data inicial válida.');
    lastRuns = nextRuns(expression, 8, start);
    fieldValues.forEach((field, index) => { field.textContent = fields[index]; });
    description.textContent = describeCron(expression);
    renderTimeline(lastRuns);
    feedback.textContent = 'Expressão válida. Oito execuções calculadas.';
    feedback.className = 'feedback is-valid';
    cronInput.setAttribute('aria-invalid', 'false');
    emptyState.hidden = true;
    runsList.hidden = false;
    copyRunsButton.disabled = false;
  } catch (error) {
    lastRuns = [];
    fieldValues.forEach((field) => { field.textContent = '—'; });
    description.textContent = 'Revise a expressão para calcular os horários.';
    runsList.replaceChildren();
    runsList.hidden = true;
    emptyState.hidden = false;
    emptyState.textContent = error instanceof Error ? error.message : 'Expressão inválida.';
    feedback.textContent = error instanceof Error ? error.message : 'Expressão inválida.';
    feedback.className = 'feedback is-error';
    cronInput.setAttribute('aria-invalid', 'true');
    copyRunsButton.disabled = true;
  }
}

async function copyText(text, successLabel) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard indisponível');
    await navigator.clipboard.writeText(text);
    feedback.textContent = successLabel;
    feedback.className = 'feedback is-valid';
  } catch {
    feedback.textContent = 'Não foi possível copiar automaticamente. Selecione e copie o texto.';
    feedback.className = 'feedback is-error';
  }
}

cronInput.addEventListener('input', render);
fromInput.addEventListener('change', render);
$('reset-date').addEventListener('click', setNow);
$('copy-cron').addEventListener('click', () => copyText(cronInput.value, 'Expressão copiada.'));
copyRunsButton.addEventListener('click', () => {
  if (!lastRuns.length) return;
  copyText(lastRuns.map((date, index) => (index + 1) + '. ' + readableDate(date)).join('\n'), 'Horários copiados.');
});
presets.forEach((button) => button.addEventListener('click', () => {
  cronInput.value = button.dataset.expression;
  render();
  cronInput.focus();
}));

try {
  $('timezone-label').textContent = 'Fuso: ' + Intl.DateTimeFormat().resolvedOptions().timeZone;
} catch {
  $('timezone-label').textContent = 'Fuso horário do dispositivo';
}
setNow();
