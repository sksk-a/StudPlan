const request = require('supertest');
const { randomUUID } = require('crypto');
const bcrypt = require('bcrypt');
const app = require('../src/app');
const prisma = require('../src/utils/prisma');
jest.setTimeout(30000);
const runId = randomUUID();
const emails = [`test-${runId}@example.com`, `other-${runId}@example.com`];
let token, otherToken, userId, subjectId, otherSubjectId, taskId;
const auth = () => ({ Authorization: `Bearer ${token}` });
const other = () => ({ Authorization: `Bearer ${otherToken}` });
const body = () => ({
  title: 'Интеграционная задача',
  description: 'Проверка PostgreSQL',
  subjectId,
  taskType: 'laboratory',
  deadline: new Date(Date.now() + 2 * 86400000).toISOString(),
  importance: 3,
  difficulty: 2,
  estimatedMinutes: 90,
  status: 'planned',
});
beforeAll(async () => {
  await prisma.$connect();
});
afterAll(async () => {
  // Удаляем только записи, созданные этим запуском; demo и пользовательские данные не затрагиваем.
  const users = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { id: true },
  });
  const ids = users.map((u) => u.id);
  await prisma.$transaction([
    prisma.task.deleteMany({ where: { userId: { in: ids } } }),
    prisma.subject.deleteMany({ where: { userId: { in: ids } } }),
    prisma.user.deleteMany({ where: { id: { in: ids } } }),
  ]);
  await prisma.$disconnect();
});
test('registration persists a bcrypt hash and returns no password', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ username: 'Тест', email: emails[0], password: 'testPassword123' })
    .expect(201);
  token = res.body.token;
  userId = res.body.user.id;
  expect(res.body.user.passwordHash).toBeUndefined();
  const stored = await prisma.user.findUnique({ where: { id: userId } });
  expect(stored.passwordHash).not.toBe('testPassword123');
  expect(await bcrypt.compare('testPassword123', stored.passwordHash)).toBe(true);
  const second = await request(app)
    .post('/api/auth/register')
    .send({ username: 'Другой', email: emails[1], password: 'testPassword123' })
    .expect(201);
  otherToken = second.body.token;
});
test('duplicate registration, invalid password and invalid fields are rejected', async () => {
  await request(app)
    .post('/api/auth/register')
    .send({ username: 'Тест', email: emails[0], password: 'testPassword123' })
    .expect(409);
  await request(app)
    .post('/api/auth/register')
    .send({ username: '', email: 'wrong', password: 'x' })
    .expect(400);
  await request(app)
    .post('/api/auth/login')
    .send({ email: emails[0], password: 'wrong' })
    .expect(401);
});
test('login and me work, missing and forged tokens fail', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: emails[0].toUpperCase(), password: 'testPassword123' })
    .expect(200);
  token = res.body.token;
  const me = await request(app).get('/api/auth/me').set(auth()).expect(200);
  expect(me.body.id).toBe(userId);
  expect(me.body.passwordHash).toBeUndefined();
  await request(app).get('/api/tasks').expect(401);
  await request(app).get('/api/tasks').set('Authorization', 'Bearer bad').expect(401);
});
test('subject create, read, update and duplicate name handling', async () => {
  const s = await request(app)
    .post('/api/subjects')
    .set(auth())
    .send({ name: 'Базы данных', teacher: 'Иванов', color: '#123abc' })
    .expect(201);
  subjectId = s.body.id;
  await request(app).get(`/api/subjects/${subjectId}`).set(auth()).expect(200);
  await request(app)
    .put(`/api/subjects/${subjectId}`)
    .set(auth())
    .send({ name: 'SQL', teacher: 'Петров', color: '#654321' })
    .expect(200);
  await request(app).post('/api/subjects').set(auth()).send({ name: 'SQL' }).expect(409);
  const s2 = await request(app)
    .post('/api/subjects')
    .set(other())
    .send({ name: 'Чужой предмет' })
    .expect(201);
  otherSubjectId = s2.body.id;
});
test('task creation is persisted and includes computed score', async () => {
  const res = await request(app).post('/api/tasks').set(auth()).send(body()).expect(201);
  taskId = res.body.id;
  expect(res.body.priorityScore).toBe(37);
  expect(res.body.priorityReason).toContain('высокая');
  expect((await prisma.task.findUnique({ where: { id: taskId } })).userId).toBe(userId);
});
test('task server validation rejects invalid numbers, dates, enums and owner injection', async () => {
  for (const change of [
    { importance: 4 },
    { difficulty: 0 },
    { estimatedMinutes: -2 },
    { deadline: '2026-02-30' },
    { taskType: 'wrong' },
    { title: ' ' },
    { userId: 42 },
    { estimatedMinutes: 1.5 },
  ]) {
    await request(app)
      .post('/api/tasks')
      .set(auth())
      .send({ ...body(), ...change })
      .expect(400);
  }
  await request(app).get('/api/tasks/invalid').set(auth()).expect(400);
  await request(app).get('/api/tasks?status=invalid').set(auth()).expect(400);
});
test('list filters, searches and sorting work', async () => {
  const list = await request(app)
    .get('/api/tasks')
    .set(auth())
    .query({
      subjectId,
      status: 'planned',
      taskType: 'laboratory',
      importance: 3,
      search: 'ИНТЕГРАЦИОННАЯ',
      sort: 'priority',
    })
    .expect(200);
  expect(list.body.map((t) => t.id)).toEqual([taskId]);
  const empty = await request(app).get('/api/tasks?status=completed').set(auth()).expect(200);
  expect(empty.body).toEqual([]);
  for (const sort of ['deadline', 'newest', 'importance'])
    await request(app).get('/api/tasks').set(auth()).query({ sort }).expect(200);
});
test('foreign user cannot read, edit, delete or complete a task', async () => {
  await request(app).get(`/api/tasks/${taskId}`).set(other()).expect(404);
  await request(app)
    .put(`/api/tasks/${taskId}`)
    .set(other())
    .send({ ...body(), subjectId: otherSubjectId })
    .expect(404);
  await request(app).delete(`/api/tasks/${taskId}`).set(other()).expect(404);
  await request(app).patch(`/api/tasks/${taskId}/complete`).set(other()).expect(404);
  const list = await request(app).get('/api/tasks').set(other()).expect(200);
  expect(list.body).toEqual([]);
});
test('subjects and task subject reassignment enforce ownership', async () => {
  await request(app).get(`/api/subjects/${subjectId}`).set(other()).expect(404);
  await request(app)
    .put(`/api/subjects/${subjectId}`)
    .set(other())
    .send({ name: 'Hacked' })
    .expect(404);
  await request(app).delete(`/api/subjects/${subjectId}`).set(other()).expect(404);
  await request(app)
    .post('/api/tasks')
    .set(auth())
    .send({ ...body(), subjectId: otherSubjectId })
    .expect(400);
  await request(app)
    .put(`/api/tasks/${taskId}`)
    .set(auth())
    .send({ ...body(), subjectId: otherSubjectId })
    .expect(400);
  await request(app).delete(`/api/subjects/${subjectId}`).set(auth()).expect(409);
  const subjects = await request(app).get('/api/subjects').set(other()).expect(200);
  expect(subjects.body.map((s) => s.id)).toEqual([otherSubjectId]);
});
test('editing affects deadline, priority and dashboard', async () => {
  const res = await request(app)
    .put(`/api/tasks/${taskId}`)
    .set(auth())
    .send({
      ...body(),
      title: 'Обновлённая задача',
      deadline: new Date(Date.now() - 86400000).toISOString(),
      status: 'in_progress',
    })
    .expect(200);
  expect(res.body.priorityScore).toBe(73);
  expect(res.body.overdue).toBe(true);
  const dashboard = await request(app).get('/api/dashboard').set(auth()).expect(200);
  expect(dashboard.body.statistics).toMatchObject({ total: 1, overdue: 1, inProgress: 1 });
  expect(dashboard.body.recommendedTask.id).toBe(taskId);
  const foreign = await request(app).get('/api/dashboard').set(other()).expect(200);
  expect(foreign.body.statistics.total).toBe(0);
});
test('completion is idempotent, updates statistics and removes recommendation', async () => {
  const done = await request(app).patch(`/api/tasks/${taskId}/complete`).set(auth()).expect(200);
  expect(done.body.status).toBe('completed');
  expect(done.body.completedAt).toBeTruthy();
  expect(done.body.priorityScore).toBe(0);
  const again = await request(app).patch(`/api/tasks/${taskId}/complete`).set(auth()).expect(200);
  expect(again.body.completedAt).toBe(done.body.completedAt);
  const dashboard = await request(app).get('/api/dashboard').set(auth()).expect(200);
  expect(dashboard.body.recommendedTask).toBeNull();
  expect(dashboard.body.upcomingTasks).toEqual([]);
  const stats = await request(app).get('/api/statistics').set(auth()).expect(200);
  expect(stats.body).toMatchObject({ total: 1, completed: 1, overdue: 0, completionPercent: 100 });
  const foreign = await request(app).get('/api/statistics').set(other()).expect(200);
  expect(foreign.body.total).toBe(0);
});
test('reopening clears completedAt; deleting task permits subject deletion', async () => {
  const reopened = await request(app)
    .put(`/api/tasks/${taskId}`)
    .set(auth())
    .send(body())
    .expect(200);
  expect(reopened.body.completedAt).toBeNull();
  await request(app).delete(`/api/tasks/${taskId}`).set(auth()).expect(204);
  await request(app).get(`/api/tasks/${taskId}`).set(auth()).expect(404);
  await request(app).delete(`/api/subjects/${subjectId}`).set(auth()).expect(204);
});
test('CORS, health and invalid JSON behave correctly', async () => {
  const health = await request(app)
    .get('/api/health')
    .set('Origin', 'http://localhost:5173')
    .expect(200);
  expect(health.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  const foreign = await request(app)
    .get('/api/health')
    .set('Origin', 'https://untrusted.example')
    .expect(200);
  expect(foreign.headers['access-control-allow-origin']).not.toBe('https://untrusted.example');
  await request(app)
    .post('/api/tasks')
    .set(auth())
    .set('Content-Type', 'application/json')
    .send('{broken')
    .expect(400);
});
