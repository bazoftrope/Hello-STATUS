# Статус - Рейтинг продуктивности сотрудников

Веб-приложение для формирования и мониторинга рейтинга продуктивности сотрудников.

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

### Docker Compose

1. Запустите все сервисы:
   ```bash
   docker-compose up -d
   ```

2. Приложение будет доступно по адресу: http://localhost:3000

## Тестовые аккаунты

- Руководитель: `manager@status.app` / `manager123`
- Сотрудник: `employee@status.app` / `employee123`

## Команды

- `npm run dev` - Запуск в режиме разработки
- `npm run build` - Сборка приложения
- `npm run start` - Запуск в продакшн режиме
- `npm run lint` - Проверка кода
- `npm run db:generate` - Генерация миграций Drizzle
- `npm run db:migrate` - Применение миграций
- `npm run db:push` - Push схемы в БД
- `npm run db:studio` - Запуск Drizzle Studio
- `npm run db:seed` - Заполнение тестовыми данными

## Стек технологий

- Next.js (Pages Router) + TypeScript
- Drizzle ORM + PostgreSQL
- Auth.js (Credentials провайдер)
- CSS (глобальные стили с CSS-переменными)
- Docker Compose

## Структура проекта

```
src/
├── pages/          # Страницы и API-роуты
├── server/         # Серверная логика
│   ├── db/         # Схема и подключение к БД
│   ├── services/   # Бизнес-логика
│   └── auth.ts     # Конфигурация Auth.js
├── components/     # UI-компоненты
├── styles/         # Глобальные стили
└── lib/            # Утилиты
```

## Лицензия

MIT
