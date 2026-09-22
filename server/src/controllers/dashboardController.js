const prisma = require('../utils/prisma');
const { summarize, dashboard } = require('../services/statisticsService');
async function data(userId) {
  return prisma.$transaction(
    [
      prisma.task.findMany({ where: { userId }, include: { subject: true } }),
      prisma.subject.findMany({ where: { userId }, orderBy: { name: 'asc' } }),
    ],
    { isolationLevel: 'RepeatableRead' },
  );
}
exports.dashboard = async (req, res) => res.json(dashboard(...(await data(req.user.id))));
exports.statistics = async (req, res) => res.json(summarize(...(await data(req.user.id))));
