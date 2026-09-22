const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { jwtSecret } = require('../config');
const httpError = require('../utils/httpError');
const publicUser = ({ id, username, email, createdAt }) => ({ id, username, email, createdAt });
const session = (user) => ({
  user: publicUser(user),
  token: jwt.sign({}, jwtSecret, {
    subject: String(user.id),
    issuer: 'student-planner',
    expiresIn: '8h',
    algorithm: 'HS256',
  }),
});
exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  if (await prisma.user.findUnique({ where: { email } }))
    throw httpError(409, 'Пользователь с таким email уже существует.');
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { username, email, passwordHash } });
  res.status(201).json(session(user));
};
exports.login = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.body.email } });
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash)))
    throw httpError(401, 'Неверный email или пароль.');
  res.json(session(user));
};
exports.me = (req, res) => res.json(req.user);
