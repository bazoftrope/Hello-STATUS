# Статус — Рейтинг продуктивности сотрудников

Веб-приложение (PWA) для формирования и мониторинга рейтинга продуктивности сотрудников. Сотрудники фиксируют выполненные рабочие действия, система рассчитывает баллы с учётом веса каждого действия и строит рейтинг и статистику.

## Быстрый старт

### Локальная разработка

1. Установите зависимости:
   ```bash
   npm install
   ```

2. Скопируйте файл переменных окружения:
   ```bash
   cp .env.example .env
   ```

3. Запустите PostgreSQL (или используйте Docker):
   ```bash
   docker-compose up -d postgres
   ```

4. Примените миграции:
   ```bash
   npm run db:migrate
   ```

5. Заполните тестовыми данными:
   ```bash
   npm run db:seed
   ```

6. Запустите разработку:
   ```bash
   npm run dev
   ```

### Docker Compose (продакшн)

1. Соберите и запустите все сервисы:
   ```bash
   docker-compose up -d --build
   ```

2. Приложение будет доступно по адресу: http://localhost:3000

## Тестовые аккаунты

| Роль | Email | Пароль |
|---|---|---|
| Руководитель | `manager@status.app` | `manager123` |
| Сотрудник | `employee@status.app` | `employee123` |

## Переменные окружения

| Переменная | Описание | По умолчанию |
|---|---|---|
| `DATABASE_URL` | Строка подключения к PostgreSQL | `postgresql://postgres:postgres@localhost:5432/status` |
| `NEXTAUTH_SECRET` | Секретный ключ Auth.js (сменить в продакшне!) | `status-production-secret-change-me` |
| `NEXTAUTH_URL` | Базовый URL приложения | `http://localhost:3000` |

> **Важно:** В продакшне обязательно задайте уникальный `NEXTAUTH_SECRET` через переменные окружения.

## Команды

| Команда | Описание |
|---|---|
| `npm run dev` | Запуск в режиме разработки |
| `npm run build` | Сборка приложения |
| `npm run start` | Запуск в продакшн-режиме |
| `npm run lint` | Проверка кода ESLint |
| `npm run db:generate` | Генерация миграций Drizzle |
| `npm run db:migrate` | Применение миграций |
| `npm run db:push` | Push схемы в БД (без миграций) |
| `npm run db:studio` | Запуск Drizzle Studio |
| `npm run db:seed` | Заполнение тестовыми данными |

## Стек технологий

| Слой | Технология |
|---|---|
| Фреймворк | Next.js 14 (Pages Router) + TypeScript |
| Стили | CSS (глобальные стили с CSS-переменными) |
| ORM | Drizzle ORM + PostgreSQL |
| Аутентификация | Auth.js (Credentials провайдер, JWT) |
| PWA | next-pwa (Service Worker, манифест) |
| Деплой | Docker Compose (postgres + next-app) |

## API-эндпоинты

| Метод | Путь | Описание | Доступ |
|---|---|---|---|
| POST | `/api/auth/*` | Вход/выход (Auth.js) | все |
| GET | `/api/parameters` | Список параметров отдела | все |
| POST | `/api/parameters` | Создать параметр | руководитель |
| PATCH | `/api/parameters/:id` | Изменить параметр | руководитель |
| GET | `/api/entries` | Записи (свои или по отделу) | все |
| POST | `/api/entries` | Добавить запись | все (для себя) |
| PATCH | `/api/entries/:id` | Изменить запись | автор / руководитель |
| DELETE | `/api/entries/:id` | Удалить запись | автор / руководитель |
| GET | `/api/rating` | Рейтинг отдела за период | все |
| GET | `/api/stats/personal` | Личная статистика | все |
| GET | `/api/stats/department` | Статистика по отделу | руководитель |
| GET | `/api/audit` | Аудит-лог изменений | руководитель |

## Структура проекта

```
src/
├── pages/              # Страницы и API-роуты
│   ├── api/            # REST API
│   └── admin/          # Административные страницы
├── server/
│   ├── db/             # Схема, подключение, миграции
│   ├── services/       # Бизнес-логика (entries, parameters, rating, stats, audit)
│   └── auth.ts         # Конфигурация Auth.js
├── components/         # UI-компоненты (Layout, Toast)
├── styles/             # Глобальные стили
└── lib/                # Утилиты (даты)
```

## Частые проблемы

### Приложение не стартует после `docker-compose up`
- Убедитесь, что PostgreSQL健康的: `docker-compose logs postgres`
- Проверьте переменные окружения в `.env` или `docker-compose.yml`

### Миграции не применяются
- `drizzle-kit migrate` требует корректного `DATABASE_URL`
- В Docker-контейнере БД доступна по адресу `postgres:5432`

### Ошибка 401 Unauthorized
- Проверьте `NEXTAUTH_SECRET` — он должен быть одинаковым между запусками
- Очистите localStorage браузера и cookies

### PWA не устанавливается
- PWA работает только через HTTPS (или localhost)
- В режиме разработки Service Worker отключён автоматически

## Лицензия

MIT
