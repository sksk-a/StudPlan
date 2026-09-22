const path = require('path');
const { defineConfig } = require('prisma/config');
require('dotenv').config({ path: path.join(__dirname, '.env') });

module.exports = defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'node prisma/seed.js' },
});
