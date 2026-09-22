const router = require('express').Router();
const { rateLimit } = require('express-rate-limit');
const auth = require('../controllers/authController');
const subjects = require('../controllers/subjectController');
const tasks = require('../controllers/taskController');
const reports = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');
const { validate, validateId } = require('../middleware/validateRequest');
const { registerSchema, loginSchema, subjectSchema, taskSchema } = require('../utils/schemas');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Слишком много попыток входа. Повторите через 15 минут.' },
});
router.post('/auth/register', limiter, validate(registerSchema), auth.register);
router.post('/auth/login', limiter, validate(loginSchema), auth.login);
router.use(authMiddleware);
router.get('/auth/me', auth.me);
router.get('/subjects', subjects.list);
router.post('/subjects', validate(subjectSchema), subjects.create);
router.get('/subjects/:id', validateId, subjects.get);
router.put('/subjects/:id', validateId, validate(subjectSchema), subjects.update);
router.delete('/subjects/:id', validateId, subjects.remove);
router.get('/tasks', tasks.list);
router.post('/tasks', validate(taskSchema), tasks.create);
router.get('/tasks/:id', validateId, tasks.get);
router.put('/tasks/:id', validateId, validate(taskSchema), tasks.update);
router.patch('/tasks/:id/complete', validateId, tasks.complete);
router.delete('/tasks/:id', validateId, tasks.remove);
router.get('/dashboard', reports.dashboard);
router.get('/statistics', reports.statistics);
module.exports = router;
