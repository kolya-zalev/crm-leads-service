# crm-leads-service

Микросервис лидов CRM: лиды, заметки, задачи, история действий и аналитика.
Отвечает на вопрос «с кем работаем и что по ним делаем».

- транспорт: **TCP :4003** (`@nestjs/microservices`), HTTP нет
- база: **`leads_db`** (PostgreSQL, Prisma)
- вызывается только из [crm-gateway](https://github.com/kolya-zalev/crm-gateway)
- контракты: [@crm/shared](https://github.com/kolya-zalev/crm-shared)

Хранит только **id** пользователей (`assignedToId`, `closedById`), имена приносит gateway из users-service.

## Сообщения

| Группа | Сообщения |
|---|---|
| Лиды | `leads.findAll`, `leads.findOne`, `leads.create`, `leads.update`, `leads.remove` |
| Заметки | `notes.findByLead`, `notes.create`, `notes.remove` |
| Задачи | `tasks.findAll`, `tasks.findByLead`, `tasks.create`, `tasks.update`, `tasks.remove` |
| Активности | `activities.findByLead` |
| Аналитика | `analytics.leads`, `analytics.employees` |

`leads.update` возвращает лид **и** `changes` (что поменялось) — по ним gateway решает, какие уведомления отправить.

## Данные

- `Lead` — статус, теги, ответственный, `statusChangedAt`, `closedAt`
- `Note` — заметки к лиду
- `Activity` — лента действий по лиду
- `Task` — задачи с приоритетом и сроком

## Локальный запуск

```bash
cp .env.example .env
npm install
npx prisma generate
npm run start:dev
```

## Миграции

```bash
npx prisma migrate dev --name <имя>
npx prisma migrate deploy
npx prisma studio
```

## Docker

`Dockerfile` → `npm ci` → `prisma generate` → `nest build`.
`start.sh` → `prisma migrate deploy` → `node dist/main`.

Запуск вместе с остальными — [crm-infra](https://github.com/kolya-zalev/crm-infra).
