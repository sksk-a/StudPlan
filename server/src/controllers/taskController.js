const prisma = require('../utils/prisma');
const httpError = require('../utils/httpError');
const { calculatePriority, comparePriority } = require('../services/priorityService');
const where = (req) => ({ id: req.objectId, userId: req.user.id });
const enrich = (task) => ({ ...task, ...calculatePriority(task) });
async function ownSubject(subjectId, userId) {
  if (!(await prisma.subject.findFirst({ where: { id: subjectId, userId } })))
    throw httpError(400, 'Выберите свой предмет.');
}
exports.list = async (req, res) => {
  const allowed = ['search', 'subjectId', 'status', 'taskType', 'importance', 'sort'];
  if (
    Object.keys(req.query).some(
      (key) => !allowed.includes(key) || typeof req.query[key] !== 'string',
    )
  )
    throw httpError(400, 'Некорректные фильтры.');
  const q = req.query;
  const filter = { userId: req.user.id };
  if (q.search) {
    if (q.search.length > 200) throw httpError(400, 'Поиск: не более 200 символов.');
    filter.title = { contains: q.search, mode: 'insensitive' };
  }
  for (const key of ['subjectId', 'importance'])
    if (q[key]) {
      if (
        !/^\d+$/.test(q[key]) ||
        Number(q[key]) < 1 ||
        Number(q[key]) > (key === 'importance' ? 3 : 2147483647)
      )
        throw httpError(400, 'Некорректный фильтр.');
      filter[key] = Number(q[key]);
    }
  for (const [key, values] of Object.entries({
    status: ['planned', 'in_progress', 'completed'],
    taskType: ['homework', 'laboratory', 'practice', 'coursework', 'exam', 'other'],
  }))
    if (q[key]) {
      if (!values.includes(q[key])) throw httpError(400, 'Некорректный фильтр.');
      filter[key] = q[key];
    }
  const sort = q.sort || 'deadline';
  if (!['deadline', 'importance', 'priority', 'newest'].includes(sort))
    throw httpError(400, 'Некорректная сортировка.');
  const orderBy =
    sort === 'importance'
      ? [{ importance: 'desc' }, { deadline: 'asc' }]
      : sort === 'newest'
        ? [{ createdAt: 'desc' }]
        : [{ deadline: 'asc' }];
  const tasks = (
    await prisma.task.findMany({
      where: filter,
      include: { subject: true },
      orderBy: [...orderBy, { id: 'asc' }],
    })
  ).map(enrich);
  if (sort === 'priority') tasks.sort(comparePriority);
  res.json(tasks);
};
exports.get = async (req, res) => {
  const task = await prisma.task.findFirst({ where: where(req), include: { subject: true } });
  if (!task) throw httpError(404, 'Задача не найдена.');
  res.json(enrich(task));
};
exports.create = async (req, res) => {
  await ownSubject(req.body.subjectId, req.user.id);
  const data = {
    ...req.body,
    userId: req.user.id,
    completedAt: req.body.status === 'completed' ? new Date() : null,
  };
  res.status(201).json(enrich(await prisma.task.create({ data, include: { subject: true } })));
};
exports.update = async (req, res) => {
  const existing = await prisma.task.findFirst({ where: where(req) });
  if (!existing) throw httpError(404, 'Задача не найдена.');
  await ownSubject(req.body.subjectId, req.user.id);
  const completedAt = req.body.status === 'completed' ? existing.completedAt || new Date() : null;
  const task = await prisma.task.update({
    where: where(req),
    data: { ...req.body, completedAt },
    include: { subject: true },
  });
  res.json(enrich(task));
};
exports.complete = async (req, res) => {
  const existing = await prisma.task.findFirst({ where: where(req) });
  if (!existing) throw httpError(404, 'Задача не найдена.');
  res.json(
    enrich(
      await prisma.task.update({
        where: where(req),
        data: { status: 'completed', completedAt: existing.completedAt || new Date() },
        include: { subject: true },
      }),
    ),
  );
};
exports.remove = async (req, res) => {
  await prisma.task.delete({ where: where(req) });
  res.status(204).end();
};
