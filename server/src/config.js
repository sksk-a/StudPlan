const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('Задайте JWT_SECRET длиной не менее 32 символов в server/.env');
}
module.exports = {
  port: Number(process.env.PORT || 3001),
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET,
};
