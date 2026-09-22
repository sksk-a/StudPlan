const { test, expect } = require('@playwright/test');
const { randomUUID } = require('crypto');
const prisma = require('../../server/src/utils/prisma');
const email = `browser-${randomUUID()}@example.com`;
test.afterAll(async () => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user)
    await prisma.$transaction([
      prisma.task.deleteMany({ where: { userId: user.id } }),
      prisma.subject.deleteMany({ where: { userId: user.id } }),
      prisma.user.delete({ where: { id: user.id } }),
    ]);
  await prisma.$disconnect();
});
test('demo dashboard, filters, calendar, charts and mobile navigation', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/login');
  await page.getByLabel('Email').fill('demo@example.com');
  await page.getByLabel('Пароль').fill('demo12345');
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Привет/ })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Рекомендуем выполнить следующим' }),
  ).toBeVisible();
  await page.screenshot({ path: 'artifacts/dashboard-desktop.png', fullPage: true });
  await page.getByRole('link', { name: 'Задачи', exact: true }).click();
  await expect(page.locator('.task-card')).toHaveCount(12);
  await page.getByLabel('Поиск по названию').fill('ER-диаграмму');
  await expect(page.locator('.task-card')).toHaveCount(1);
  await page.getByLabel('Поиск по названию').fill('');
  await page.getByLabel('Все статусы').selectOption('completed');
  await expect(page.locator('.task-card')).toHaveCount(3);
  await page.getByRole('link', { name: 'Календарь', exact: true }).click();
  await expect(page.locator('.calendar-task').first()).toBeVisible();
  await page.locator('.calendar-task').first().click();
  await expect(page.getByRole('link', { name: 'Редактировать', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Статистика', exact: true }).click();
  await expect(page.locator('canvas')).toHaveCount(2);
  await expect(page.getByText('25% учебного плана выполнено')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('link', { name: 'Обзор', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Привет/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: 'artifacts/dashboard-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Выйти' }).click();
  await expect(page).toHaveURL(/login/);
  await page.goto('/tasks');
  await expect(page).toHaveURL(/login/);
  expect(errors).toEqual([]);
});
test('registration, subject CRUD, task CRUD, completion and persistence through reload', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/register');
  await page.getByLabel('Имя', { exact: true }).fill('Браузерный тест');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Пароль', { exact: true }).fill('browserTest123');
  await page.getByRole('button', { name: 'Зарегистрироваться' }).click();
  await expect(page.getByRole('heading', { name: /Привет/ })).toBeVisible();
  await page.getByRole('link', { name: 'Новая задача' }).click();
  await expect(page.getByRole('heading', { name: 'Сначала добавьте предмет' })).toBeVisible();
  await page.getByRole('link', { name: 'Перейти к предметам' }).click();
  await page.getByLabel('Название *', { exact: true }).fill('Тестовый предмет');
  await page.getByLabel('Преподаватель').fill('Преподаватель');
  await page.getByLabel('Цвет').fill('#0891b2');
  await page.getByRole('button', { name: 'Добавить предмет' }).click();
  await expect(page.getByRole('heading', { name: 'Тестовый предмет' })).toBeVisible();
  await page.getByRole('button', { name: 'Редактировать предмет: Тестовый предмет' }).click();
  await page.getByLabel('Название *', { exact: true }).fill('Обновлённый предмет');
  await page.getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Обновлённый предмет' })).toBeVisible();
  await page.getByRole('link', { name: 'Задачи', exact: true }).click();
  await page.getByRole('link', { name: 'Новая задача' }).click();
  await page.getByLabel('Название *', { exact: true }).fill('Браузерная задача');
  await page.getByLabel('Описание', { exact: true }).fill('Проверка сохранения');
  await page
    .getByLabel('Предмет *', { exact: true })
    .selectOption({ label: 'Обновлённый предмет' });
  await page.getByLabel('Дедлайн *').fill('2026-12-25T18:00');
  await page.getByRole('button', { name: 'Сохранить задачу' }).click();
  await expect(page.getByRole('link', { name: 'Браузерная задача', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('link', { name: 'Браузерная задача', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Редактировать: Браузерная задача' }).click();
  await page.getByLabel('Название *', { exact: true }).fill('Обновлённая задача');
  await page.getByLabel('Статус *').selectOption('in_progress');
  await page.getByRole('button', { name: 'Сохранить задачу' }).click();
  await expect(page.getByRole('link', { name: 'Обновлённая задача', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Выполнено', exact: true }).click();
  await expect(page.locator('.status-completed')).toHaveText('Выполнено');
  await page.getByRole('link', { name: 'Обзор', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Всё выполнено!' })).toBeVisible();
  await page.getByRole('link', { name: 'Задачи', exact: true }).click();
  await page.getByRole('button', { name: 'Удалить: Обновлённая задача' }).click();
  await page.getByRole('button', { name: 'Отмена', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Обновлённая задача', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Удалить: Обновлённая задача' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Удалить', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Задач не найдено' })).toBeVisible();
  await page.getByRole('link', { name: 'Предметы', exact: true }).click();
  await page.getByRole('button', { name: 'Удалить предмет: Обновлённый предмет' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Удалить', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Добавьте первый предмет' })).toBeVisible();
  await page.getByRole('button', { name: 'Выйти' }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Пароль').fill('wrongPassword');
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Неверный email или пароль');
  expect(errors).toEqual([]);
});
