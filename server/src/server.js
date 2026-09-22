const app = require('./app');
const prisma = require('./utils/prisma');
const { port } = require('./config');
async function start() {
  await prisma.$connect();
  const server = app.listen(port, () => console.log(`API: http://localhost:${port}`));
  const shutdown = () =>
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
start().catch((error) => {
  console.error('Не удалось запустить API:', error.code || error.name);
  process.exit(1);
});
