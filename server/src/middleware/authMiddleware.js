const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');
const prisma = require('../utils/prisma');
const httpError = require('../utils/httpError');

module.exports = async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.match(/^Bearer (\S+)$/)?.[1];
  if (!token) throw httpError(401, 'Необходимо войти в аккаунт.');
  let payload;
  try {
    payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'], issuer: 'student-planner' });
  } catch {
    throw httpError(401, 'Сессия истекла. Войдите снова.');
  }
  const id = Number(payload.sub);
  if (!Number.isSafeInteger(id) || id <= 0) throw httpError(401, 'Недействительная сессия.');
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true, email: true, createdAt: true },
  });
  if (!user) throw httpError(401, 'Пользователь не найден.');
  req.user = user;
  next();
};
