/** Five-field cron parser and evaluator. No external dependencies. */
const RANGES = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 7]];
const LABELS = ['minuto', 'hora', 'dia do mês', 'mês', 'dia da semana'];
const MONTHS = Object.fromEntries(['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'].map((v, i) => [v, i + 1]));
const DAYS = Object.fromEntries(['SUN','MON','TUE','WED','THU','FRI','SAT'].map((v, i) => [v, i]));
const NAMES = [null, null, null, MONTHS, DAYS];

function asNumber(token, index) {
  const key = token.toUpperCase();
  if (NAMES[index] && Object.hasOwn(NAMES[index], key)) return NAMES[index][key];
  if (!/^\d{1,2}$/.test(key)) throw new Error(LABELS[index] + ': valor inválido (' + token + ').');
  const value = Number(key);
  const [min, max] = RANGES[index];
  if (value < min || value > max) throw new Error(LABELS[index] + ': valor fora de ' + min + '–' + max + '.');
  return value;
}

function expandSegment(segment, index, values) {
  if (!segment) throw new Error(LABELS[index] + ': item vazio.');
  const pieces = segment.split('/');
  if (pieces.length > 2 || (pieces.length === 2 && !/^[1-9]\d*$/.test(pieces[1]))) {
    throw new Error(LABELS[index] + ': passo inválido.');
  }
  const step = pieces.length === 2 ? Number(pieces[1]) : 1;
  if (!Number.isSafeInteger(step) || step > 100000) throw new Error(LABELS[index] + ': passo inválido.');
  const base = pieces[0];
  const [min, max] = RANGES[index];
  let start = min;
  let end = max;
  if (base !== '*') {
    const ends = base.split('-');
    if (ends.length > 2) throw new Error(LABELS[index] + ': intervalo inválido.');
    start = asNumber(ends[0], index);
    end = ends.length === 2 ? asNumber(ends[1], index) : pieces.length === 2 ? max : start;
  }
  if (start > end) throw new Error(LABELS[index] + ': intervalo invertido.');
  for (let n = start; n <= end; n += step) values.add(index === 4 && n === 7 ? 0 : n);
}

function compileField(field, index) {
  const values = new Set();
  for (const segment of field.split(',')) expandSegment(segment, index, values);
  return values;
}

export function parseCron(expression) {
  if (typeof expression !== 'string' || expression.length > 200) {
    throw new Error('A expressão cron deve ser um texto de até 200 caracteres.');
  }
  const fields = expression.trim().toUpperCase().split(/\s+/);
  if (fields.length !== 5) throw new Error('Use exatamente 5 campos: minuto hora dia mês dia-da-semana.');
  fields.forEach((field, i) => compileField(field, i));
  return fields;
}

function compile(expression) {
  const fields = parseCron(expression);
  return {fields, values: fields.map(compileField)};
}

function matches(compiled, date) {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) throw new Error('Data inválida.');
  const [minute, hour, day, month, weekday] = compiled.values;
  if (!minute.has(date.getMinutes()) || !hour.has(date.getHours()) || !month.has(date.getMonth() + 1)) return false;
  const dom = day.has(date.getDate());
  const dow = weekday.has(date.getDay());
  const domRestricted = compiled.fields[2] !== '*';
  const dowRestricted = compiled.fields[4] !== '*';
  // Vixie cron: when both day fields are restricted, either one may match.
  return domRestricted && dowRestricted ? dom || dow : dom && dow;
}

export function matchesCron(expression, date) {
  return matches(compile(expression), date);
}

export function nextRuns(expression, count = 8, from = new Date()) {
  if (!Number.isInteger(count) || count < 1 || count > 20) throw new Error('Quantidade deve estar entre 1 e 20.');
  if (!(from instanceof Date) || !Number.isFinite(from.getTime())) throw new Error('Data inicial inválida.');
  const compiled = compile(expression);
  const runs = [];
  const minute = 60_000;
  const start = Math.floor(from.getTime() / minute) * minute + minute;
  const end = start + 366 * 5 * 24 * 60 * minute;
  for (let t = start; t <= end && runs.length < count; t += minute) {
    const candidate = new Date(t);
    if (matches(compiled, candidate)) runs.push(candidate);
  }
  if (!runs.length) throw new Error('Nenhuma ocorrência encontrada nos próximos cinco anos.');
  return runs;
}

export function describeCron(expression) {
  const [minute, hour, day, month, weekday] = parseCron(expression);
  let summary;
  if (minute === '*' && hour === '*') summary = 'A cada minuto';
  else if (/^\*\/[1-9]\d*$/.test(minute) && hour === '*') summary = 'A cada ' + minute.slice(2) + ' minutos';
  else if (/^\d{1,2}$/.test(minute) && /^\d{1,2}$/.test(hour)) summary = 'Às ' + hour.padStart(2, '0') + ':' + minute.padStart(2, '0');
  else summary = 'Quando minuto ' + minute + ' e hora ' + hour + ' coincidirem';
  if (month !== '*') summary += ', nos meses ' + month;
  if (day !== '*' && weekday !== '*') summary += ', nos dias ' + day + ' do mês OU nos dias da semana ' + weekday;
  else if (day !== '*') summary += ', nos dias ' + day + ' do mês';
  else if (weekday !== '*') summary += ', nos dias da semana ' + weekday;
  return summary + '.';
}

export const CRON_FIELDS = Object.freeze(LABELS);
