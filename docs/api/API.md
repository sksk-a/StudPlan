# API СтудПлана

Контракт сверён с `server/src/routes/index.js`, контроллерами и Zod на 20.10.2026. Машиночитаемая спецификация: [openapi.json](openapi.json), OpenAPI 3.0.3. Её можно импортировать в локальные Swagger Editor, Postman или Insomnia; работающий Swagger UI в приложение не добавлялся. Внешнему редактору не передавайте реальные токены и личные данные.

## Общие правила

Базовый путь `/api`: при локальной разработке `http://localhost:3001/api`, через frontend — `/api`. Данные JSON, `Content-Type: application/json`, максимум 64 КБ. Даты ISO 8601 с часовым поясом. POST/PUT используют strict Zod: лишние поля, включая `userId`, отклоняются. ID — целое 1–2147483647. Пробелы по краям текстовых полей убираются, email приводится к нижнему регистру.

Защищённые запросы требуют `Authorization: Bearer TOKEN`. JWT подписан HS256, issuer `student-planner`, `sub` — ID пользователя, срок 8 часов. Пароль хранится только в bcrypt-хэше (cost 12). Выход — удаление JWT из sessionStorage; серверного logout и отзыва токенов нет. JWT подписан, но его payload не зашифрован. HTTPS нужен для защиты при передаче.

## Полный перечень операций

| Метод | Путь после /api | Назначение | Тело / параметры | Успех | JWT |
|---|---|---|---|---|---|
| GET | /health | API и SELECT 1 в БД | — | 200 `{status:"ok"}` | Нет |
| POST | /auth/register | Регистрация | username, email, password | 201 Session | Нет |
| POST | /auth/login | Вход | email, password | 200 Session | Нет |
| GET | /auth/me | Профиль | — | 200 User | Да |
| GET | /subjects | Предметы владельца | — | 200 Subject[] с `_count.tasks` | Да |
| POST | /subjects | Создать предмет | SubjectInput | 201 Subject | Да |
| GET | /subjects/:id | Один предмет | id в пути | 200 Subject | Да |
| PUT | /subjects/:id | Заменить поля предмета | id, SubjectInput | 200 Subject | Да |
| DELETE | /subjects/:id | Удалить пустой предмет | id | 204 без тела | Да |
| GET | /tasks | Список и фильтры | query ниже | 200 Task[] | Да |
| POST | /tasks | Создать задачу | TaskInput | 201 Task | Да |
| GET | /tasks/:id | Карточка задачи | id | 200 Task | Да |
| PUT | /tasks/:id | Заменить поля задачи | id, TaskInput | 200 Task | Да |
| PATCH | /tasks/:id/complete | Завершить задачу | id, без тела | 200 Task | Да |
| DELETE | /tasks/:id | Удалить задачу | id | 204 без тела | Да |
| GET | /dashboard | Сводка и рекомендация | — | 200 Dashboard | Да |
| GET | /statistics | Статистика | — | 200 Statistics | Да |

SubjectInput: `name` обязателен, 1–120 символов; `teacher` до 120, default `""`; `color` #RRGGBB, default `#6366f1`. Название уникально внутри пользователя, с учётом регистра.

TaskInput: обязательны `title` 1–200, `subjectId`, `taskType`, `deadline`, `importance` 1–3, `difficulty` 1–3, `estimatedMinutes` 1–525600. Необязательны `description` до 10000 (default `""`), `status` (default planned). Типы: homework, laboratory, practice, coursework, exam, other. Статусы: planned, in_progress, completed. PUT передаёт все обязательные поля; пропущенные необязательные сбрасываются к defaults, поэтому это не частичное редактирование. `completedAt` назначает сервер, при возврате в работу очищает; повторный PATCH сохраняет исходную дату. Контроллер complete не использует тело.

GET /tasks принимает одиночные query-параметры: `search` до 200 символов (подстрока названия, insensitive), `subjectId`, `importance`, `status`, `taskType`, `sort` = deadline / importance / priority / newest. Default sort=deadline. Повторные параметры, массивы, неизвестные ключи и неверные enum возвращают 400. Пустые значения фильтров игнорируются. Пагинации нет. Списки, dashboard и statistics всегда отфильтрованы по userId из JWT.

Task содержит поля записи, вложенный Subject, `priorityScore`, `priorityReason`, `overdue`. Statistics содержит total, completed, inProgress, planned, overdue, completionPercent и bySubject (id, name, color, total, completed). Dashboard содержит statistics, recommendedTask (Task или null), upcomingTasks (до 5 Task). Точные схемы полей в OpenAPI.

## Примеры JSON

Примеры ниже иллюстрируют формат и не являются протоколом реально выполненных запросов или реальными реквизитами.

Регистрация POST /auth/register:

```json
{"username":"Студент","email":"student@example.com","password":"examplePassword123"}
```

Ответ 201 (токен здесь обозначен сокращённо):

```json
{"user":{"id":1,"username":"Студент","email":"student@example.com","createdAt":"2026-10-20T12:00:00.000Z"},"token":"JWT_TOKEN"}
```

Вход POST /auth/login: `{"email":"student@example.com","password":"examplePassword123"}`. Ответ 200 имеет тот же формат Session. GET /auth/me возвращает только объект user без оболочки и токена.

POST /subjects и PUT /subjects/1:

```json
{"name":"Базы данных","teacher":"Преподаватель","color":"#0891b2"}
```

Ответ 201 или 200:

```json
{"id":1,"userId":1,"name":"Базы данных","teacher":"Преподаватель","color":"#0891b2","createdAt":"2026-10-20T12:00:00.000Z"}
```

POST /tasks и PUT /tasks/1:

```json
{"title":"ER-диаграмма","description":"Подготовить схему","subjectId":1,"taskType":"practice","deadline":"2026-12-25T15:00:00Z","importance":3,"difficulty":2,"estimatedMinutes":90,"status":"planned"}
```

Task ответ (priorityReason зависит от момента запроса):

```json
{"id":1,"userId":1,"subjectId":1,"title":"ER-диаграмма","description":"Подготовить схему","taskType":"practice","deadline":"2026-12-25T15:00:00.000Z","importance":3,"difficulty":2,"estimatedMinutes":90,"status":"planned","createdAt":"2026-10-20T12:00:00.000Z","updatedAt":"2026-10-20T12:00:00.000Z","completedAt":null,"subject":{"id":1,"userId":1,"name":"Базы данных","teacher":"Преподаватель","color":"#0891b2","createdAt":"2026-10-20T12:00:00.000Z"},"priorityScore":17,"priorityReason":"До дедлайна 67 дн.; важность: высокая; сложность: 2/3; 90 мин.","overdue":false}
```

GET /tasks?status=planned&sort=priority возвращает массив таких объектов. PATCH /tasks/1/complete возвращает объект с status=completed, completedAt с серверным временем, priorityScore=0, overdue=false. DELETE /tasks/1 возвращает 204 без JSON.

Пример пустого dashboard:

```json
{"statistics":{"total":0,"completed":0,"inProgress":0,"planned":0,"overdue":0,"completionPercent":0,"bySubject":[]},"recommendedTask":null,"upcomingTasks":[]}
```

GET /statistics возвращает непосредственно вложенный здесь statistics.

## Ошибки и авторизация

| Статус | Причина | Применение |
|---|---|---|
| 400 | Zod, неверный JSON, ID, фильтр или чужой subjectId в задаче | POST/PUT, ID и фильтры |
| 401 | Нет JWT, подпись/issuer неверны, срок истёк, пользователь удалён; неверный пароль | Защищённые маршруты, login |
| 404 | Объект не найден или принадлежит другому | GET/PUT/PATCH/DELETE по ID |
| 409 | Дубликат email/названия; у предмета есть задачи | register, subjects, конфликт FK |
| 413 | JSON превышает 64 КБ | Запросы с JSON |
| 429 | Общий лимит register/login: 100 запросов за 15 минут на IP | register/login |
| 500 | Непредвиденная ошибка/недоступность БД | Все операции |

Формат: `{"message":"Проверьте поля формы.","errors":{"title":["Название: заполните поле"]}}`; ошибки без полей имеют только message. Stack trace и пароль в ответ не попадают. 403 **не используется**: ресурсы другого владельца скрываются через 404, так нельзя отличить чужой ID от отсутствующего. Это осознанное правило, не отсутствие авторизации. Неизвестный маршрут после middleware может потребовать JWT (401), затем вернуть 404. HEAD и OPTIONS могут обслуживаться Express/CORS автоматически, самостоятельных бизнес-операций для них нет. XML и загрузки файлов не поддерживаются и не требуются методичкой, где JSON указан как обычный формат.

## Демонстрация в PowerShell

После локального запуска (сначала создаётся новый учебный аккаунт):

```powershell
$base = 'http://localhost:3001/api'
$body = @{username='Студент';email="defense-$([guid]::NewGuid())@example.com";password='examplePassword123'} | ConvertTo-Json
$session = Invoke-RestMethod "$base/auth/register" -Method Post -ContentType 'application/json' -Body ([Text.Encoding]::UTF8.GetBytes($body))
$headers = @{Authorization="Bearer $($session.token)"}
Invoke-RestMethod "$base/auth/me" -Headers $headers
$subject = Invoke-RestMethod "$base/subjects" -Method Post -Headers $headers -ContentType 'application/json' -Body '{"name":"SQL"}'
$taskBody = @{title='ER';subjectId=$subject.id;taskType='practice';deadline=[DateTime]::UtcNow.AddDays(2).ToString('o');importance=3;difficulty=2;estimatedMinutes=90} | ConvertTo-Json
$task = Invoke-RestMethod "$base/tasks" -Method Post -Headers $headers -ContentType 'application/json' -Body $taskBody
Invoke-RestMethod "$base/tasks/$($task.id)/complete" -Method Patch -Headers $headers
Invoke-RestMethod "$base/statistics" -Headers $headers
Invoke-RestMethod "$base/tasks/$($task.id)" -Method Delete -Headers $headers
Invoke-RestMethod "$base/subjects/$($subject.id)" -Method Delete -Headers $headers
```

Не показывайте полный `$session` на проекторе: он содержит JWT. Доказательства изоляции двух аккаунтов, неверного JWT, CRUD и статусов находятся в `server/tests/api.test.js`; запуск `npm.cmd test`. CORS не заменяет авторизацию: внешние программы могут обращаться к API независимо от браузерных ограничений.
