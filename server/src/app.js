const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { origin, trustProxyHops } = require('./config');
const prisma = require('./utils/prisma');
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', trustProxyHops);
app.use(helmet());
app.use(cors({ origin }));
app.use(express.json({ limit: '64kb' }));
app.get('/api/health', async (req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: 'ok' });
});
app.use('/api', require('./routes'));
app.use((req, res) => res.status(404).json({ message: 'Маршрут не найден.' }));
app.use(require('./middleware/errorMiddleware'));
module.exports = app;
