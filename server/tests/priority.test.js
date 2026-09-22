const { calculatePriority, getRecommendedTask } = require('../src/services/priorityService');
const { summarize } = require('../src/services/statisticsService');
const now = new Date('2026-09-22T12:00:00Z');
const base = {
  id: 1,
  subjectId: 1,
  status: 'planned',
  importance: 2,
  difficulty: 2,
  estimatedMinutes: 60,
};
const taskAt = (hours) => ({ ...base, deadline: new Date(+now + hours * 3600000) });
test.each([
  [-1, 71],
  [0, 43],
  [24, 43],
  [24.01, 35],
  [72, 35],
  [72.01, 27],
  [168, 27],
  [169, 15],
])('deadline boundary %s hours yields %s points', (hours, score) => {
  expect(calculatePriority(taskAt(hours), now).priorityScore).toBe(score);
});
test('importance, difficulty and duration affect priority independently', () => {
  const task = taskAt(48);
  const score = calculatePriority(task, now).priorityScore;
  expect(calculatePriority({ ...task, importance: 3 }, now).priorityScore).toBe(score + 3);
  expect(calculatePriority({ ...task, difficulty: 3 }, now).priorityScore).toBe(score + 2);
  expect(calculatePriority({ ...task, estimatedMinutes: 30 }, now).priorityScore).toBe(score + 1);
  expect(calculatePriority({ ...task, estimatedMinutes: 61 }, now).priorityScore).toBe(score - 1);
});
test('completed tasks are neither overdue nor recommended', () => {
  const completed = { ...taskAt(-48), status: 'completed' };
  expect(calculatePriority(completed, now)).toMatchObject({ priorityScore: 0, overdue: false });
  expect(getRecommendedTask([completed], now)).toBeNull();
  expect(getRecommendedTask([], now)).toBeNull();
});
test('recommendations react to changed deadlines and break ties deterministically', () => {
  const a = { ...taskAt(48), id: 1 };
  const b = { ...taskAt(60), id: 2 };
  expect(getRecommendedTask([b, a], now).id).toBe(1);
  expect(getRecommendedTask([a, { ...b, deadline: taskAt(-1).deadline }], now).id).toBe(2);
  expect(getRecommendedTask([{ ...a, id: 2 }, a], now).id).toBe(1);
});
test('statistics use completed status rather than expired deadline', () => {
  const result = summarize(
    [{ ...taskAt(-24), status: 'completed' }, taskAt(-1), { ...taskAt(4), status: 'in_progress' }],
    [{ id: 1, name: 'Math', color: '#ffffff' }],
    now,
  );
  expect(result).toMatchObject({
    total: 3,
    completed: 1,
    overdue: 1,
    inProgress: 1,
    completionPercent: 33,
  });
  expect(result.bySubject[0]).toMatchObject({ total: 3, completed: 1 });
  expect(summarize([], [], now).completionPercent).toBe(0);
});
