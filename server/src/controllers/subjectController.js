const prisma = require('../utils/prisma');
const httpError = require('../utils/httpError');
const where = (req) => ({ id: req.objectId, userId: req.user.id });
exports.list = async (req, res) =>
  res.json(
    await prisma.subject.findMany({
      where: { userId: req.user.id },
      orderBy: { name: 'asc' },
      include: { _count: { select: { tasks: true } } },
    }),
  );
exports.get = async (req, res) => {
  const subject = await prisma.subject.findFirst({ where: where(req) });
  if (!subject) throw httpError(404, 'Предмет не найден.');
  res.json(subject);
};
exports.create = async (req, res) =>
  res.status(201).json(await prisma.subject.create({ data: { ...req.body, userId: req.user.id } }));
exports.update = async (req, res) =>
  res.json(await prisma.subject.update({ where: where(req), data: req.body }));
exports.remove = async (req, res) => {
  // Restrict в БД не позволит потерять задачи при удалении предмета.
  await prisma.subject.delete({ where: where(req) });
  res.status(204).end();
};
