const { z } = require('zod');
const text = (max, label) =>
  z.string().trim().min(1, `${label}: заполните поле`).max(max, `Не более ${max} символов`);
const email = z.string().trim().toLowerCase().email('Некорректный email').max(254);
const password = z
  .string()
  .min(8, 'Минимум 8 символов')
  .refine((v) => Buffer.byteLength(v, 'utf8') <= 72, 'Пароль должен занимать не более 72 байт');
exports.registerSchema = z.object({ username: text(80, 'Имя'), email, password }).strict();
exports.loginSchema = z.object({ email, password: z.string().min(1).max(200) }).strict();
exports.subjectSchema = z
  .object({
    name: text(120, 'Предмет'),
    teacher: z.string().trim().max(120).default(''),
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, 'Выберите цвет')
      .default('#6366f1'),
  })
  .strict();
exports.taskSchema = z
  .object({
    title: text(200, 'Название'),
    description: z.string().trim().max(10000).default(''),
    subjectId: z.number().int().positive().max(2147483647),
    taskType: z.enum(['homework', 'laboratory', 'practice', 'coursework', 'exam', 'other']),
    deadline: z.iso
      .datetime({ offset: true, message: 'Укажите корректные дату и время' })
      .transform((v) => new Date(v)),
    importance: z.number().int().min(1).max(3),
    difficulty: z.number().int().min(1).max(3),
    estimatedMinutes: z.number().int().min(1).max(525600),
    status: z.enum(['planned', 'in_progress', 'completed']).default('planned'),
  })
  .strict();
