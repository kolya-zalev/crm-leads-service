# crm-leads-service

Микросервис лидов CRM: лиды, заметки к ним, история действий и аналитика.
Отвечает на вопрос «какие клиенты в работе, на каком этапе и кто ими занимается».

- транспорт: **TCP :4003** (`@nestjs/microservices`), HTTP нет
- база: **`leads_db`** (PostgreSQL, TypeORM)
- вызывается только из [crm-gateway](https://github.com/kolya-zalev/crm-gateway)
- контракты: [@crm/shared](https://github.com/kolya-zalev/crm-shared) (`leadsMessages`, `LeadsContract`)

Задачи вынесены в [crm-tasks-service](https://github.com/kolya-zalev/crm-tasks-service):
связь с лидами через событие `lead.deleted`.
`LeadDto` не содержит вложенных заметок, задач и истории (shared v2): их отдают
отдельные сообщения. Ответ списка лидов уменьшился с 18,2 КБ до 2 КБ.

## Сообщения

| Сообщение | Что делает |
|---|---|
| `leads.findAll`, `leads.findOne` | список лидов, один лид |
| `leads.create` | создать лид + запись «Lead was created» в истории |
| `leads.update` | изменить лид с проверкой прав; пишет историю (статус, исполнитель); возвращает `changes` для уведомлений |
| `leads.remove` | удалить лид; заметки и история удаляются каскадом в базе |
| `notes.findByLead`, `notes.create`, `notes.remove` | заметки лида + запись в истории |
| `activities.findByLead` | история действий лида |
| `analytics.leads`, `analytics.employees` | дашборд и аналитика по сотрудникам |

Ошибки (`NotFoundException`, `ForbiddenException`…) превращаются в RPC-ошибки с `statusCode`
через `HttpToRpcExceptionFilter`.

## Данные

| Таблица | Связь |
|---|---|
| `Lead` | индексы `(status, statusChangedAt)`, `closedById`, `assignedToId` |
| `Note` | `leadId` → `Lead`, `ON DELETE CASCADE` |
| `Activity` | `leadId` → `Lead`, `ON DELETE CASCADE` |

**Транзакции.** Изменение лида или заметки и запись в историю выполняются в одной транзакции
(`dataSource.transaction`): либо обе записи, либо ни одной.

**id** генерирует приложение (`@BeforeInsert` → `randomUUID()`), поэтому строки
создаются только через `create` + `save`.

**Аналитика** на QueryBuilder (`GROUP BY` + `COUNT`). `COUNT` из Postgres приходит строкой
(`bigint`), поэтому приводится через `Number(...)`.

## Переменные окружения

| Переменная | Пример |
|---|---|
| `LEADS_DATABASE_URL` | `postgresql://USER:PASSWORD@localhost:5432/leads_db` |
| `LEADS_SERVICE_PORT` | `4003` |

## Локальный запуск

```bash
cp .env.example .env
npm install
npm run migration:run
npm run start:dev
```

Даты хранятся в `timestamp(3)` без часового пояса (наследие Prisma, всегда UTC).
Процесс должен работать в UTC: в Docker это так по умолчанию, локально нужно `TZ=UTC`.

## Миграции

```bash
npm run migration:generate -- src/migrations/<Имя>
npm run migration:run
npm run migration:revert
npx typeorm-ts-node-commonjs migration:generate -d src/data-source.ts src/migrations/Check --dryrun   # проверка: No changes
```

`synchronize` выключен: схема меняется только миграциями.

### Переход с Prisma

| Миграция | Зачем |
|---|---|
| `Init` | полная схема `Lead`, `Note`, `Activity`. На **новой** базе создаёт таблицы |
| `AlignDefaults` | Prisma записала default дат как `CURRENT_TIMESTAMP`, TypeORM пишет `now()`. Это одна и та же функция; миграция выравнивает запись |

На существующей базе `Init` один раз отмечена как выполненная вручную:

```sql
INSERT INTO migrations (timestamp, name) VALUES (1794844863570, 'Init1794844863570');
```

Таблица `_prisma_migrations` осталась от Prisma и больше не используется.

## Docker

`Dockerfile` → `npm ci` → `nest build`.
`start.sh` → `typeorm migration:run -d dist/data-source.js` → `node dist/main`.

Запуск вместе с остальными: [crm-infra](https://github.com/kolya-zalev/crm-infra).
