const DAY = 24 * 60 * 60 * 1000;

function calculatePriority(task, now = new Date()) {
  if (task.status === 'completed')
    return { priorityScore: 0, priorityReason: 'Задача выполнена', overdue: false };
  const remaining = new Date(task.deadline) - now;
  const overdue = remaining < 0;
  const days = Math.ceil(remaining / DAY);
  // Срочность: просрочено=10, <=24 ч=8, <=3 суток=6, <=7 суток=4, иначе=1.
  const urgency = overdue
    ? 10
    : remaining <= DAY
      ? 8
      : remaining <= 3 * DAY
        ? 6
        : remaining <= 7 * DAY
          ? 4
          : 1;
  // Короткие задачи получают небольшой бонус; просроченные — ещё 20 баллов.
  const quickBonus = task.estimatedMinutes <= 30 ? 2 : task.estimatedMinutes <= 60 ? 1 : 0;
  const priorityScore =
    urgency * 4 + task.importance * 3 + task.difficulty * 2 + quickBonus + (overdue ? 20 : 0);
  const deadlineReason = overdue
    ? `Просрочено на ${Math.ceil(-remaining / DAY)} дн.`
    : remaining <= DAY
      ? 'До дедлайна не более 24 часов'
      : `До дедлайна ${days} дн.`;
  const priorityReason = `${deadlineReason}; важность: ${['', 'низкая', 'средняя', 'высокая'][task.importance]}; сложность: ${task.difficulty}/3; ${task.estimatedMinutes} мин.${quickBonus ? ' — бонус за короткую задачу' : ''}`;
  return { priorityScore, priorityReason, overdue };
}

function comparePriority(a, b) {
  return (
    b.priorityScore - a.priorityScore || new Date(a.deadline) - new Date(b.deadline) || a.id - b.id
  );
}
function getRecommendedTask(tasks, now = new Date()) {
  return (
    tasks
      .filter((t) => t.status !== 'completed')
      .map((t) => ({ ...t, ...calculatePriority(t, now) }))
      .sort(comparePriority)[0] || null
  );
}
module.exports = { calculatePriority, getRecommendedTask, comparePriority };
