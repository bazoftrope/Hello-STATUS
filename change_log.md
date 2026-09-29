# Журнал изменений — Hello-STATUS

**Дата:** 2026-09-23  
**Ветка:** `main` (не закоммичено, `git status` — 21 файл изменён, build успешен)  
**Основание:** список из 10 замечаний (doc/activities.md, сообщение 2026-09-23)

---

## 1. Параметры → Вес: любое значение (`>0` .. `1000`)

**Проблема:** `type="number" step="0.1" min="0.01"` не позволял ввести произвольные значения (например `7.25`, `0.5`), блокировал запятую.

**Решение:**
- `src/pages/admin/parameters.tsx:106-122` — `FormInput` сменён на `type="text" inputMode="decimal"`, фильтр `^[0-9]*[.,]?[0-9]*$`, placeholder `7 или 2.5`, hint дополнен.
- `src/server/services/parameters.ts:166-175` — `parseWeight()` теперь `value.trim().replace(',', '.')` перед `Number()`, принимает точку и запятую.

**Проверка:** создание/редактирование параметра с `7`, `2.5`, `0.5`, `3,5`, `999.99`, `1000` → `201/200`; `0`, `1000.01`, `abc` → `400 "Вес должен быть..."`.

---

## 2. Статистика руководителя — видит только свою

**Проблема:** `src/pages/stats.tsx:235` всегда `GET /api/stats/personal`, `GET /api/stats/department` существовал (`src/pages/api/stats/department.ts:19`, `src/server/services/stats.ts:63`) но не использовался в UI.

**Решение:**
- `src/pages/stats.tsx:1,227-260` — добавлен `useSession`, `isManager`, состояние `viewMode: 'personal'|'department'`, `effectiveView`. Переключатель «Моя статистика / По отделу» (только для manager).
- При `viewMode==='department'` → `GET /api/stats/department`, отдельный стейт `deptStats: DepartmentStats` (интерфейсы `DepartmentUserStat`).
- Рендер для отдела: карты `Всего баллов (отдел)`, `Сотрудников с баллами`, таблица `Сотрудники отдела`, графики `по параметрам (отдел)`. `PageHeader` меняет заголовок.
- `src/server/services/stats.ts:166-256` — во всех `getDepartment*` добавлен фильтр `eq(users.role,'employee')` (чтобы руководитель не учитывался).

**Проверка:** manager видит две вкладки; employee — только «Моя статистика».

---

## 3. Тёмная тема — текст чёрный в журнале / всех диапазонах дат

**Проблема:** `src/components/ui/Form.module.css:12` и `src/styles/base.css:32` не задавали `color` и `color-scheme` для `input[type=date]` — UA оставлял чёрный текст на `var(--color-surface) #1e293b`.

**Решение:**
- `src/styles/base.css:1-6` — добавлен `html { color-scheme: light dark }`, `input,select,textarea { color: var(--color-text); background: var(--color-surface) }`.
- `src/components/ui/Form.module.css:12-33` — `.input { color: var(--color-text); color-scheme: light dark }`, `::-webkit-calendar-picker-indicator` + `filter: invert(0.7)` для `data-theme='dark'` и `prefers-color-scheme: dark`.
- `src/styles/tokens.css:99-103` — унифицирован `primary` для системной тёмной темы `#5F9EA0` (был `#3b82f6`).
- `src/components/ui/Modal.module.css:1-13` — оверлей `rgba(0,0,0,0.65)` для dark.

**Затронуто:** `src/pages/history.tsx:241`, `src/pages/admin/entries.tsx:246`, `src/pages/stats.tsx:284`, `src/pages/rating.tsx:125`, `src/pages/login.tsx:74`.

---

## 4. При входе в тёмной теме цвет вводимого текста чёрный

**Решение:** тот же фикс, что в п.3 — `Form.module.css` и `base.css` покрывают `login.tsx`. Проверено для `type=email/password`.

---

## 5. В рейтинге сотрудник видит всех → только топ-5

**Проблема:** `src/server/services/rating.ts:17` возвращал всех, `src/pages/api/rating/index.ts:25` без лимита, `src/pages/rating.tsx:169` рендерил всё.

**Решение:**
- `src/server/services/rating.ts:32` — добавлен `eq(users.role,'employee')` в `where`.
- `src/pages/api/rating/index.ts:25-31` — `if (role!=='manager') return result.slice(0,5)` (manager видит всех).
- `src/pages/rating.tsx:1,68-108` — `useSession` → `isManager`, `PageHeader title='Топ-5 лидеров отдела'` + `subtitle` для employee.

---

## 6. Лого «Статус» крупнее

- `src/components/Layout.module.css:38` — `height 36px → 52px`.
- `src/pages/login.module.css:11` — `height 80px width 100px → 110px auto max-width 180px object-fit:contain`.
- `src/pages/register.module.css:11` — `40px → 80px auto max-160`.

---

## 7. История у руководителя → «История активностей подразделения»

- `src/pages/history.tsx:2,143-227` — `useSession` → `pageTitle`, `pageHeadTitle`, subtitle `· Все сотрудники отдела`, расширение `Entry {userId?, userName?}`, условный столбец `<Th>Сотрудник</Th>` и `canEdit = isManager || isToday`.
- `src/components/Layout.tsx:63` — nav: `isManager ? 'История подразделения' : 'История'`.

---

## 8. Руководителя не должно быть в рейтинге

- `src/server/services/rating.ts:32` и `src/server/services/stats.ts:182,216,246` — `eq(users.role,'employee')` исключает `manager` из всех агрегатов.

---

## 9. Чёрный шрифт в тёмной теме при изменении параметров

- Покрыто фиксом п.3/4 — модалка `ParameterFormModal` использует `FormInput/FormTextarea` (`Form.module.css`), теперь `color: var(--color-text)` и `color-scheme: dark`.

---

## 10. Функционал руководителя по добавлению данных за работников

**Проблема:** `src/pages/api/entries/index.ts:56-62` → `create(session.user.id)` только за себя; UI `src/pages/admin/entries.tsx` только edit/delete.

**Решение:**
- `src/server/services/entries.ts:131-166` — `create(userId,input,actor?)` с проверкой `isUserInDepartment` если `actor.role==='manager' && actor.id!==userId`; после вставки `writeAudit(...,'create')`. `writeAudit` расширен `action: 'update'|'delete'|'create'` и `oldValue=null` для create.
- `src/pages/api/entries/index.ts:56-86` — разбор `body.userId`, валидация `manager` + `isUserInDepartment`, прокидывает `actor={id,role,departmentId}` в `create`.
- `src/pages/admin/entries.tsx:1-342` — добавлен `CreateEntryModal` (select сотрудник из `GET /api/users` фильтрованный `isActive && role==='employee'`, select параметр из `GET /api/parameters` `!isArchived`, quantity/date/comment), состояние `ModalState | {type:'create'}`, `handleCreate` → `POST /api/entries {userId,parameterId,quantity,entryDate,comment}`, кнопка `Добавить за сотрудника` в `PageHeader.actions`.

**Аудит:** каждое создание за другого → `audit_log {action:'create', actorId, entryUserId, oldValue:null, newValue: json}`.

**Не реализовано (по согласованию):** bulk-добавление (множественная вставка/импорт) — отложено.

---

## Изменённые файлы (21)

```
src/components/Layout.module.css
src/components/Layout.tsx
src/components/ui/Form.module.css
src/components/ui/Modal.module.css
src/pages/admin/entries.tsx
src/pages/admin/parameters.tsx
src/pages/api/entries/index.ts
src/pages/api/rating/index.ts
src/pages/history.tsx
src/pages/login.module.css
src/pages/rating.tsx
src/pages/register.module.css
src/pages/stats.tsx
src/server/services/entries.ts
src/server/services/parameters.ts
src/server/services/rating.ts
src/server/services/stats.ts
src/styles/base.css
src/styles/tokens.css
public/sw.js, public/workbox-*.js (автогенерация next-pwa)
```

## Проверка

- `npm run build` — ✓ Compiled successfully (Next.js 14.2.29), все страницы `○/ƒ` собраны, только `no-img-element` warnings.
- `git diff --stat HEAD` — 589 insertions / 62 deletions.
- Ручная проверка (рекомендуется): `npm run dev`, переключить тему (ThemeToggle), проверить `type=date`/`text` в `/login`, `/history`, `/admin/entries`, `/admin/parameters`, `/stats`; логин `employee@status.app` → рейтинг 5, без manager; `manager@status.app` → рейтинг полный без себя, `/stats` вкладка «По отделу», `/history` заголовок подразделения, `/admin/entries` кнопка создания.

## Открытые вопросы (сняты)

- Bulk-добавление — не требуется (ответ 2026-09-23).
