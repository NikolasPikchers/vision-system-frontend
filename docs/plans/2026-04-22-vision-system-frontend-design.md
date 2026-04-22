# VisionSystem Frontend — Design Document

**Дата:** 2026-04-22
**Автор:** Николай Проклов (+ Claude brainstorming)
**Статус:** Approved, ready for implementation
**Стек:** Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui

---

## 1. Контекст

CV-сервис коллеги (VisionSystem, API на `http://localhost:8080`) детектирует:
- нарушения спецодежды (PPE — отсутствие касок/спецодежды)
- нарушения зон безопасности (загромождение запасных проходов, люди в опасной зоне)

Текущий фронт сервиса неудобен. Задача — сделать красивый, понятный оператору диспетчерской интерфейс и передать коллеге (корпоративного GitLab пока нет) через публичный GitHub + zip.

API не трогаем — работаем только с тем, что уже задокументировано в `Описание API проекта.txt` (от 2026-04-21, v1.0). Пожелания по расширению API собраны в отдельный список внутри `AI_INSTRUCTIONS.md`.

## 2. Ограничения API (важно учесть в дизайне)

1. `/api/logs` возвращает **plain-text строки** вида `[2026-04-21 12:01:00] [WARN] Camera 1: Zone violation detected` — нет структурированных событий с id, confidence, bbox. Журнал парсим регэкспом.
2. В момент события кадр не сохраняется — в модалке детали показываем **текущий** кадр с камеры, а не исторический.
3. Bounding box'ы (жёлтые/зелёные рамки на скрине 2) — видимо прожигаются в кадр самим CV-сервисом. Проверим на интеграции.
4. `/api/export` кладёт xlsx на диск сервера и не отдаёт файл клиенту — пользователю показываем путь + предупреждение.
5. Сессия 30 мин без refresh — при истечении редирект на /login.
6. Нет эндпоинта удаления камеры — в админке используем `enabled: false` через `/api/camera/save`.

## 3. Архитектура

**Тип приложения:** SPA, раздаётся как статика из `dist/`.

**Стек:**
- Vite + React 18 + TypeScript
- Tailwind CSS v3 + shadcn/ui
- React Router v6
- TanStack Query (server state, кэш API)
- Zustand + persist middleware (auth state)
- lucide-react (иконки)
- sonner (тосты)
- date-fns (форматирование времени, локаль ru)
- MSW (моки API для dev без реального бекенда)

**Структура папок:**
```
vision-system-frontend/
├── AI_INSTRUCTIONS.md       # инструкция для AI-ассистента коллеги (Qwen 3.5)
├── README.md                # человеческая инструкция
├── .env.example             # VITE_API_BASE_URL=..., VITE_USE_MOCKS=false
├── public/rusklimat.png
├── src/
│   ├── api/
│   │   ├── client.ts        # fetch + auth header + 401 handling
│   │   ├── auth.ts
│   │   ├── cameras.ts
│   │   ├── zones.ts
│   │   ├── logs.ts
│   │   ├── trassir.ts
│   │   └── export.ts
│   ├── components/
│   │   ├── ui/              # shadcn
│   │   ├── layout/          # AppShell, TopBar
│   │   └── features/        # CameraCard, JournalRow, PolygonCanvas, ...
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── CamerasPage.tsx
│   │   ├── JournalPage.tsx
│   │   ├── ExportPage.tsx
│   │   └── AdminPage.tsx (4 саб-таба)
│   ├── stores/auth.ts
│   ├── lib/
│   │   ├── log-parser.ts    # единственное место парсинга строк логов
│   │   ├── date.ts
│   │   └── polygon.ts
│   ├── mocks/               # MSW handlers + фикстуры
│   ├── types/               # Camera, LogEvent, ZonePolygon, ...
│   ├── App.tsx              # роутер + QueryClientProvider + ThemeProvider
│   └── main.tsx
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

**Роутинг:**
- `/login` — публичный
- `/cameras` (default после логина), `/journal`, `/export`, `/admin/*` — под `<RequireAuth>`

**Dev proxy:** Vite проксирует `/api/*` на `VITE_API_BASE_URL`. В prod сборке фронт раздаётся с того же origin, что API (или через nginx с proxy_pass).

## 4. Страницы и UX

### `/login`
Центрированная карточка: логотип Русклимат, заголовок «VisionSystem», поля username/password (дефолт admin/admin), кнопка «Войти». POST `/api/login` → session_id + expires_in в Zustand + localStorage. 401 — красный тост.

### AppShell
- **TopBar:** лого Русклимат (32px), 4 таба по центру с синей заливкой активного (`#1D4ED8`), справа — тумблер темы, индикатор статуса сервера (зелёная точка ← `/api/status` каждые 30 сек), меню «Выйти».

### `/cameras` — Живой мониторинг
- Responsive сетка карточек (2/3/4 колонки). На каждой: thumbnail `/api/camera/{id}/thumbnail?t=<ts>` с автообновлением раз в 2 сек, имя, бейджи включённых проверок (🔴 Зона / 🟢 Спецодежда), индикатор онлайн.
- Клик → модалка живого просмотра (обновление раз в секунду) + кнопка «Сделать снимок» (POST `/api/camera/{id}/snapshot`).
- Фильтр: поиск по имени, «Только активные».

### `/journal` — Журнал событий
- Левая колонка фильтров: Камера (select), Тип (Все / Зона / Спецодежда / Системные), Уровень (INFO / WARN / ERROR), Период (За всё время / Сегодня / 24ч / 7д / Произвольный).
- Таблица: thumbnail камеры, Камера, Тип, Время, Уровень, действие «Подробнее».
- Данные: `/api/logs` с `refetchInterval: 10s`, парсинг через `log-parser.ts`. Фильтры и сортировка на клиенте.
- Модалка «Подробнее»: текущий кадр камеры + метаданные.

### `/export`
Два date-picker, select типа `events`, «Выгрузить» → POST `/api/export` → показ пути к файлу на сервере + предупреждение об ограничении API.

### `/admin` (саб-табы)
1. **Камеры** — CRUD: таблица, формы Add/Edit (name, url, fps_limit, timeout, чекбоксы zone/ppe), «Удаление» через `enabled: false`.
2. **Зоны контроля** — выбор камеры → `/api/camera/{id}/zone-frame` (1280px + `X-Frame-Width/Height`) с SVG-канвасом поверх. Рисуем два полигона: 🔴 `zone_polygon` (`#EC4899`) и 🟢 `ppe_zone_polygon` (`#22C55E`). Координаты ресайзим обратно в натуральные перед POST `/api/camera/zone/save`.
3. **Trassir NVR** — форма IP/port/login/pass → POST `/api/trassir/channels` → список каналов с превью → чекбоксы → POST `/api/trassir/add`.
4. **Лог системы** — сырой `/api/logs` в моноширинном окне для админа.

## 5. Дизайн-система

**Референс:** корпоративный светлый стиль со скринов заказчика. Spacing > декор.

**Цвета (CSS variables через shadcn theme):**

Light:
- bg `#FFFFFF`, fg `#0F172A`, card `#FFFFFF`, border `#E5E7EB`
- muted `#F8FAFC`, muted-fg `#64748B`
- primary `#1D4ED8`, accent `#EFF6FF`

Dark:
- bg `#0B1220`, fg `#E5E7EB`, card `#111827`, border `#1F2937`
- muted `#0F172A`, muted-fg `#94A3B8`
- primary `#3B82F6`

Semantic: success `#16A34A`, warning `#CA8A04`, danger `#DC2626`, info `#2563EB`.

Polygon: красный `#EC4899`, зелёный `#22C55E`, заливка 15%, контур 2px.

**Типографика:** Inter Variable (UI), JetBrains Mono (логи, координаты). `text-sm` основной, `text-2xl font-semibold` заголовки.

**Радиусы:** `rounded-md` (6px) inputs/buttons, `rounded-lg` (8px) cards, `rounded-full` бейджи.

**Сетка:** `max-w-[1440px] mx-auto`, `px-6 py-4`, `gap-4` между карточками.

**Иконки:** lucide-react.

**Микро:** sonner-тосты, shadcn Skeleton при загрузке, fade-in thumbnail'ов по onLoad, hover карточек `ring-1 ring-primary/20`.

## 6. Auth flow

Zustand + persist:
```ts
{ sessionId: string | null, username: string | null, expiresAt: number | null }
```

- Login → сохраняем `{sessionId, username, expiresAt = Date.now() + expires_in*1000}`.
- 401 от сервера или expired `expiresAt` → чистим стор, редирект `/login?reason=expired`, тост «Сессия истекла».
- Logout: POST `/api/logout` + чистка стор независимо от ответа.
- `<RequireAuth>` wrapper.
- Keep-alive: GET `/api/status` раз в 30 сек (двойная роль — индикатор онлайн + продление активности).

## 7. API-слой

`client.ts`:
- `apiRequest<T>(path, opts)` — JSON → типизированный `T` или `ApiError { status, message }`.
- `apiBlob(path)` — для `/frame`, `/thumbnail`, `/zone-frame` → `{ blob, headers }`.
- Автоматом подставляет `Authorization: <sessionId>`.

TanStack Query:
- `useCameras()` staleTime 30s
- `useCamera(id)` staleTime 30s
- `useLogs()` refetchInterval 10s
- `useStatus()` refetchInterval 30s

Thumbnail'ы — вне Query: `<img src="..&t=<ts>">` с key от timestamp раз в 2 сек.

## 8. Парсинг логов

`lib/log-parser.ts`:
```ts
parseLogLine(raw): { ts: Date, level: 'INFO'|'WARN'|'ERROR', cameraId?: number, message: string, type: 'zone'|'ppe'|'system' }
```
Регэкспы: `Zone violation` → `zone`; `PPE|helmet|without` → `ppe`; else → `system`. Изменение формата логов — только одно место.

## 9. Обработка ошибок

- Network/CORS → красный тост «Нет связи с сервером» + retry-кнопка.
- 400 → тост с `error.message`.
- 401 → auto-logout.
- 404 → пустое состояние «Не найдено».
- 500 → тост «Ошибка сервера» + сырой message в консоль.
- `<ErrorBoundary>` на каждой странице.

## 10. MSW-моки

`src/mocks/` с handlers на все эндпоинты + фикстуры (2-3 камеры, 50 строк логов, зоны). Включается через `VITE_USE_MOCKS=true` в `.env`. Нужно чтобы автор и коллега могли пощёлкать фронт до/без реального CV-сервиса.

## 11. Handoff

### .env.example
```
VITE_API_BASE_URL=http://localhost:8080
VITE_USE_MOCKS=false
```

### README.md (на русском)
Секции: Что это, Скриншоты, Требования (Node ≥20), Быстрый старт dev, Сборка prod, 3 варианта подключения к бекенду (рядом с бекендом / nginx / python http.server), Переменные окружения, Траблшутинг, Список пожеланий к API.

### AI_INSTRUCTIONS.md (и в git, и в zip)
Инструкция для AI-ассистента коллеги (Qwen 3.5). Содержит:
1. Контекст проекта
2. Задача AI (интегрировать, не переписывать)
3. Чек-лист интеграции по шагам (install → dev → login → cameras → journal → zones → build → подключить к бекенду)
4. Карта кода (client.ts, api/*, stores/auth, pages/*, log-parser)
5. Правила модификации (не ломать типы, не трогать дизайн-систему, UI на русском)
6. Типичные проблемы (CORS, кэш thumbnail'ов, X-Frame-* headers для зон, пустые логи, экспорт)
7. Запрещено без подтверждения (не менять API URL в коде, не коммитить секреты, не включать PPE на всех камерах)
8. Проверка до лезания в код (curl к /api/status и /api/login)

### Zip-структура
`vision-system-frontend.zip`:
```
vision-system-frontend/
├── dist/                    # pre-built статика
├── src/
├── public/
├── AI_INSTRUCTIONS.md, README.md, .env.example
├── package.json, vite.config.ts, tsconfig.json, tailwind.config.ts
── NE: node_modules/, .env, .git/
```

### GitHub
`NikolasPikchers/vision-system-frontend`, public. `dist/` в gitignore.

## 12. Пожелания к API (передать коллеге)

1. `GET /api/detections` — структурированные события с id, timestamp, cameraId, type, confidence, bbox_url.
2. Streaming через MJPEG или WebSocket вместо поллинга.
3. `GET /api/export/{filename}` — скачивание xlsx.
4. Refresh-token endpoint для долгих смен оператора.
5. `DELETE /api/camera/{id}` — сейчас нет.
6. `Access-Control-Expose-Headers: X-Frame-Width, X-Frame-Height` в CORS.

## 13. Out of scope (YAGNI)

- Графики/дашборды аналитики (нет данных от API)
- Управление пользователями (в API только один админ)
- Мультиязычность (только RU)
- Мобильный layout (оператор работает с ПК диспетчерской)
- Push-уведомления о нарушениях (требует WebSocket, API не поддерживает)
