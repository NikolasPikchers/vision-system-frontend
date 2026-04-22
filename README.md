# VisionSystem — фронтенд

Веб-интерфейс для CV-сервиса VisionSystem: контроль зон безопасности на производстве, проверка спецодежды (PPE), интеграция с Trassir NVR и ведение журнала событий. Проект сделан для Русклимата как надстройка над уже существующим Python-бекендом.

Этот репозиторий — только фронт. Бекенд (API на порту `:8080`) поставляется отдельно и задокументирован у автора сервиса.

## Скриншоты

Скриншоты будут добавлены после первого запуска с реальным API. Пока посмотреть UI можно через `VITE_USE_MOCKS=true npm run dev`.

![Камеры](docs/screenshots/cameras.png)
![Журнал](docs/screenshots/journal.png)
![Админка — зоны](docs/screenshots/admin-zones.png)
![Экспорт](docs/screenshots/export.png)

## Требования

- Node.js ≥ 20
- npm ≥ 10
- Запущенный бекенд VisionSystem на доступном хосте (по умолчанию `http://localhost:8080`)

## Быстрый старт (dev)

```bash
# 1. Установить зависимости
npm install

# 2. Скопировать пример окружения
cp .env.example .env

# 3. Поправить VITE_API_BASE_URL под свой бекенд (если нужно)
#    По умолчанию: http://localhost:8080

# 4. Запустить dev-сервер
npm run dev
```

Фронт поднимется на `http://localhost:5173`. Vite проксирует все запросы `/api/*` на `VITE_API_BASE_URL`, так что CORS в dev-режиме не страшен.

## Режим с моками (без реального API)

Если бекенд ещё не запущен — включите MSW-моки:

```bash
VITE_USE_MOCKS=true npm run dev
```

Вход: любой логин/пароль (`admin/admin` гарантированно работает). Доступны 3 камеры, 4 Trassir-канала и около 80 записей лога. Удобно для знакомства с интерфейсом и демонстраций.

## Сборка для продакшена

```bash
npm run build
```

Получится папка `dist/` — статика, готовая к раздаче любым веб-сервером:

- `dist/index.html` — входная точка
- `dist/assets/` — JS/CSS-бандлы с хешами в именах (хорошо кэшируются)
- размер: ~530 KB, ~165 KB gzip

## Как подключить к бекенду

### Вариант 1 — рядом с бекендом (проще всего)

Скопируйте содержимое `dist/` в директорию статики вашего API-сервера. Например, если бекенд — FastAPI:

```python
app.mount("/", StaticFiles(directory="dist", html=True), name="static")
```

Фронт и API окажутся на одном origin — CORS не нужен, `VITE_API_BASE_URL` можно оставить пустым (относительные `/api/*`).

### Вариант 2 — отдельный nginx

```nginx
server {
    listen 80;
    server_name vision.example.local;

    root /var/www/vision-system-frontend/dist;
    index index.html;

    # SPA-роуты: любой неизвестный путь отдаём index.html
    location / {
        try_files $uri /index.html;
    }

    # Проксирование API на бекенд
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # Важно для рисования полигонов поверх кадра
        proxy_pass_header X-Frame-Width;
        proxy_pass_header X-Frame-Height;
    }

    # Статика с долгим кэшем (имена файлов хешированы)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Вариант 3 — быстрая проверка через Python

```bash
cd dist
python -m http.server 3000
```

Откроется на `http://localhost:3000`. API-запросы в этом режиме пойдут напрямую на `VITE_API_BASE_URL`, который был задан на момент сборки — CORS бекенда должен это разрешать.

## Переменные окружения

| Переменная            | По умолчанию            | Назначение                                                                 |
|-----------------------|-------------------------|----------------------------------------------------------------------------|
| `VITE_API_BASE_URL`   | `http://localhost:8080` | Базовый URL бекенда. В dev — цель для Vite proxy. В prod — источник `/api`. |
| `VITE_USE_MOCKS`      | `false`                 | `true` включает MSW-моки, фронт работает без реального API.                 |

Переменные читаются Vite только на этапе сборки/запуска dev-сервера. Менять их в уже собранной статике — нельзя, нужно пересобирать.

## Структура проекта

```
vision-system-frontend/
├── src/
│   ├── api/              # Обёртки над fetch по ресурсам API
│   │   ├── client.ts     # base-клиент, auth-хедер, 401-редирект
│   │   ├── auth.ts       # login / logout
│   │   ├── cameras.ts    # CRUD камер + thumbnail
│   │   ├── logs.ts       # получение логов
│   │   ├── zones.ts      # зоны + кадр для редактора
│   │   ├── trassir.ts    # каналы Trassir NVR
│   │   ├── export.ts     # экспорт отчётов
│   │   └── status.ts     # пинг /api/status
│   ├── components/
│   │   ├── ui/           # 16 примитивов shadcn/ui (button, dialog, table, ...)
│   │   ├── layout/       # AppShell, TopBar, навигация
│   │   └── features/     # PolygonCanvas, CameraThumb, модалки, EventBadge
│   ├── pages/            # по одной странице на верхнеуровневый маршрут
│   │   ├── LoginPage.tsx
│   │   ├── CamerasPage.tsx
│   │   ├── JournalPage.tsx
│   │   ├── ExportPage.tsx
│   │   ├── AdminPage.tsx
│   │   └── admin/        # саб-страницы админки
│   ├── stores/           # Zustand (auth, theme)
│   ├── hooks/            # TanStack Query-хуки
│   ├── lib/              # чистые утилиты (log-parser, polygon, ...)
│   ├── mocks/            # MSW handlers + fixtures
│   ├── types/api.ts      # TypeScript-типы DTO
│   ├── main.tsx          # точка входа
│   └── router.tsx        # маршруты + RequireAuth
├── public/               # MSW service worker и статика
├── docs/
│   └── screenshots/      # UI-скриншоты (добавляются после первого запуска)
├── dist/                 # результат `npm run build` (не в git)
├── .env.example          # шаблон переменных окружения
├── AI_INSTRUCTIONS.md    # инструкция для AI-ассистента, помогающего с интеграцией
└── README.md             # этот файл
```

## Скрипты

| Команда              | Что делает                                                         |
|----------------------|--------------------------------------------------------------------|
| `npm run dev`        | Vite dev-сервер на `:5173` с HMR                                   |
| `npm run build`      | TypeScript + Vite prod-сборка в `dist/`                            |
| `npm run preview`    | Локальный предпросмотр собранной `dist/`                           |
| `npm run typecheck`  | Только проверка типов, без эмита                                   |
| `npm run test`       | Vitest один прогон (28 тестов)                                     |
| `npm run test:watch` | Vitest в watch-режиме                                              |
| `npm run lint`       | ESLint по всему проекту                                            |

## Траблшутинг

1. **CORS-ошибки в консоли браузера.** Бекенд не разрешает запросы с origin фронта. Варианты: поднять фронт и API на одном origin (см. «Вариант 1» выше), либо добавить на бекенд заголовок `Access-Control-Allow-Origin` с нужным значением и `Access-Control-Allow-Credentials: true`.

2. **401 сразу после успешного логина.** Обычно значит, что заголовок `Authorization: <session_id>` не доходит до бекенда — проверьте в DevTools → Network, что он реально отправляется. В `localStorage` должен быть ключ `vs_auth` с содержимым вида `{"state":{"sessionId":"..."}}`.

3. **Превью камер не обновляются.** К URL `/api/camera/{id}/thumbnail` фронт автоматически добавляет `?t=<timestamp>`, чтобы обойти кэш. Если всё равно висит старая картинка — проверьте прокси/nginx: добавьте `Cache-Control: no-store` на `/api/camera/*/frame` и `/api/camera/*/thumbnail`.

4. **Формат строк лога отличается.** Парсер ожидает строки вида `[YYYY-MM-DD HH:MM:SS] [LEVEL] Camera N: message`. Если бекенд пишет логи иначе — правьте регэкспы **только** в `src/lib/log-parser.ts`. UI перечитывать не нужно.

5. **Рисование зон «прыгает» при масштабировании.** Холст полигонов работает с натуральными координатами кадра. Бекенд должен возвращать их в заголовках `X-Frame-Width` и `X-Frame-Height` при запросе `/api/zone-frame`. Важно: эти заголовки должны быть перечислены в `Access-Control-Expose-Headers`, иначе браузер их скроет.

6. **Экспорт возвращает путь, но файл не скачивается.** Сейчас бекенд только кладёт файл на диск сервера и возвращает строку с путём — этого достаточно, если бекенд и фронт на одном хосте и пользователь имеет к нему доступ. Если нужен download прямо из браузера — заведите эндпоинт вида `GET /api/export/download/{filename}` и подключите его в `src/api/export.ts`.

## Для интеграции через AI-ассистента

Если вы используете Qwen 3.5 / Claude / другую кодовую модель для интеграции — передайте ей файл `AI_INSTRUCTIONS.md` вместе с этими исходниками. Там расписан чек-лист подключения фронта к реальному бекенду, карта кода и типичные грабли.

## Список пожеланий к API

Во время разработки фронта стали видны места, где бекенду имеет смысл помочь фронту. Ни одно из них не блокирующее — фронт уже работает, — но улучшит UX:

1. **Структурированный эндпоинт детекций.** Сейчас журнал парсится из текстового лога регэкспами. Если добавить `GET /api/events` с типизированным JSON (id, camera_id, level, timestamp, zone, details) — можно будет выбросить `log-parser.ts` и получить фильтры/сортировку бесплатно.
2. **MJPEG-стрим для live-предпросмотра.** Сейчас `CameraLiveModal` перезапрашивает `/thumbnail` каждую секунду. Реальный MJPEG-эндпоинт (`multipart/x-mixed-replace`) снимет нагрузку на API и даст плавную картинку.
3. **Download-эндпоинт для экспорта.** `GET /api/export/download/{filename}` с `Content-Disposition: attachment` — тогда кнопка «Скачать» в `/export` будет работать честно.
4. **Refresh-токен.** Сейчас сессия ровно 30 минут, после этого — форсированный релогин. `POST /api/refresh` продлит жизнь без ввода пароля.
5. **DELETE камеры.** В админке есть добавить/редактировать, но `DELETE /api/camera/{id}` бекенд пока не умеет — кнопка удаления на фронте disabled.
6. **CORS `Access-Control-Expose-Headers`.** `X-Frame-Width`, `X-Frame-Height`, `X-Total-Count` — эти заголовки уже отдаёт бекенд, но без expose браузер их не показывает фронту.

## Лицензия / авторство

Сделано Николаем Прокловым (NikolasPikchers) для Русклимата. 2026.
