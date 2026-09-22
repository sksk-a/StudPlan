export const statuses = {
  planned: 'Запланировано',
  in_progress: 'В процессе',
  completed: 'Выполнено',
};
export const types = {
  homework: 'Домашняя работа',
  laboratory: 'Лабораторная',
  practice: 'Практическая',
  coursework: 'Курсовой проект',
  exam: 'Экзамен',
  other: 'Другое',
};
export const importance = { 1: 'Низкая', 2: 'Средняя', 3: 'Высокая' };
export const difficulty = { 1: 'Лёгкая', 2: 'Средняя', 3: 'Сложная' };
export const dateTime = (value) =>
  new Date(value).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
export function localInput(value) {
  const date = new Date(value);
  return new Date(date - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
export function dateKey(value) {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
