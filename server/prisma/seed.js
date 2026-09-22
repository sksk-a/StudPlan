require('../src/config');
const prisma = require('../src/utils/prisma');
const bcrypt = require('bcrypt');
async function seed() {
  if (await prisma.user.findUnique({ where: { email: 'demo@example.com' } })) {
    console.log('Демо-пользователь уже существует. Его данные сохранены.');
    return;
  }
  const passwordHash = await bcrypt.hash('demo12345', 12);
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { username: 'Тимур', email: 'demo@example.com', passwordHash },
    });
    const names = ['Создание программного обеспечения', 'Базы данных', 'Программирование корпоративных систем', 'Английский язык'];
    const colors = ['#6366f1', '#0891b2', '#ea580c', '#16a34a'];
    const teachers = ['Иванов А. П.', 'Смирнова Е. В.', 'Петров И. С.', 'Кузнецова М. А.'];
    const subjects = [];
    for (let i = 0; i < names.length; i++)
      subjects.push(
        await tx.subject.create({
          data: { userId: user.id, name: names[i], teacher: teachers[i], color: colors[i] },
        }),
      );
    const titles = [
      'Лабораторная: массивы и сортировка',
      'Спроектировать ER-диаграмму',
      'Создать веб-приложение',
      'Подготовить рассказ о профессии',
      'Курсовая: структура приложения',
      'Практика: SQL-запросы',
      'Подготовиться к экзамену',
      'Прочитать текст и выписать слова',
      'Реализовать связный список',
      'Нормализация базы данных',
      'Интегралы: домашняя работа',
      'Повторить времена глагола',
    ];
    const types = [
      'laboratory',
      'practice',
      'homework',
      'other',
      'coursework',
      'practice',
      'exam',
      'homework',
      'laboratory',
      'practice',
      'homework',
      'other',
    ];
    const offsets = [-2, 1, 3, 0, 12, 5, 9, 2, -5, -3, 7, 4];
    for (let i = 0; i < titles.length; i++) {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + offsets[i]);
      deadline.setHours(23, 0, 0, 0);
      const status =
        i === 8 || i === 9 || i === 11
          ? 'completed'
          : i === 0 || i === 4
            ? 'in_progress'
            : 'planned';
      await tx.task.create({
        data: {
          userId: user.id,
          subjectId: subjects[i % 4].id,
          title: titles[i],
          description:
            'Подготовить решение, проверить результат и оформить работу для сдачи преподавателю.',
          taskType: types[i],
          deadline,
          importance: 3 - (i % 3),
          difficulty: (i % 3) + 1,
          estimatedMinutes: [90, 60, 120, 30][i % 4],
          status,
          completedAt: status === 'completed' ? new Date() : null,
        },
      });
    }
  });
  console.log('Созданы демо-пользователь, 4 предмета и 12 задач.');
}
seed()
  .catch((e) => {
    console.error('Seed не выполнен:', e.code || e.name);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
