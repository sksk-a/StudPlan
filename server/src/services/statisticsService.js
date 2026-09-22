const { calculatePriority, getRecommendedTask } = require('./priorityService');
function summarize(tasks, subjects, now = new Date()) {
  const completed = tasks.filter((t) => t.status === 'completed').length;
  return {
    total: tasks.length,
    completed,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    planned: tasks.filter((t) => t.status === 'planned').length,
    overdue: tasks.filter((t) => t.status !== 'completed' && new Date(t.deadline) < now).length,
    completionPercent: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
    bySubject: subjects.map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color,
      total: tasks.filter((t) => t.subjectId === s.id).length,
      completed: tasks.filter((t) => t.subjectId === s.id && t.status === 'completed').length,
    })),
  };
}
function dashboard(tasks, subjects, now = new Date()) {
  return {
    statistics: summarize(tasks, subjects, now),
    recommendedTask: getRecommendedTask(tasks, now),
    upcomingTasks: tasks
      .filter((t) => t.status !== 'completed')
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 5)
      .map((t) => ({ ...t, ...calculatePriority(t, now) })),
  };
}
module.exports = { summarize, dashboard };
