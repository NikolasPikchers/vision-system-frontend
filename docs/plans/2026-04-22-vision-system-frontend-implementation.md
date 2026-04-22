# VisionSystem Frontend Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a React SPA (Vite + TS + Tailwind + shadcn/ui) over the existing VisionSystem HTTP API (:8080) and package it for handoff to a colleague (GitHub repo + zip with pre-built `dist/` + AI instructions).

**Architecture:** SPA raises against CORS-open HTTP API. Zustand for auth, TanStack Query for server cache, React Router v6 for routing. MSW mocks for offline dev. Handoff includes `README.md` for humans and `AI_INSTRUCTIONS.md` for Qwen-based code assistant.

**Tech Stack:** Vite 5, React 18, TypeScript 5, Tailwind CSS 3, shadcn/ui, React Router v6, TanStack Query v5, Zustand, lucide-react, sonner, date-fns (ru), Vitest, React Testing Library, MSW 2.

**Design doc:** [docs/plans/2026-04-22-vision-system-frontend-design.md](./2026-04-22-vision-system-frontend-design.md)

**TDD policy:** Strict TDD for pure logic (log parser, polygon math, auth helpers). For UI components — smoke test + MSW-backed integration test per page. No test for trivial presentational components.

**Frequent commits:** Every task ends with a commit. Use conventional commit messages (`feat:`, `chore:`, `test:`, `docs:`).

---

## Phase 1 — Scaffold and tooling

### Task 1: Scaffold Vite + React + TypeScript

**Files:**
- Create: entire project tree via `npm create vite@latest`

**Step 1: Scaffold**

Run from `~/Projects/vision-system-frontend/`:
```bash
npm create vite@latest . -- --template react-ts
```
When prompted to create in non-empty dir (we already have `docs/` and `.git/`) — choose "Ignore files and continue".

**Step 2: Verify**

```bash
npm install
npm run dev
```
Expected: dev server on `http://localhost:5173`, default React+Vite page renders. Ctrl+C.

**Step 3: Trim defaults**

Delete: `src/App.css`, `src/assets/react.svg`, `public/vite.svg`. Replace `src/App.tsx` with empty shell:
```tsx
export default function App() {
  return <div>VisionSystem</div>;
}
```
Remove `import './App.css'` from App.tsx. Remove `<link rel="icon" ...>` for vite.svg in `index.html`, set `<title>VisionSystem — Русклимат</title>` and `<html lang="ru">`.

**Step 4: Commit**

```bash
git add .
git commit -m "chore: scaffold Vite + React + TypeScript"
```

---

### Task 2: Install runtime and dev dependencies

**Step 1: Install runtime deps**

```bash
npm i react-router-dom@^6 @tanstack/react-query@^5 zustand@^4 \
  clsx tailwind-merge class-variance-authority \
  lucide-react sonner date-fns \
  @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu \
  @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-checkbox \
  @radix-ui/react-label @radix-ui/react-switch @radix-ui/react-tooltip \
  @radix-ui/react-popover @radix-ui/react-toast \
  @fontsource-variable/inter @fontsource-variable/jetbrains-mono
```

**Step 2: Install dev deps**

```bash
npm i -D tailwindcss@^3 postcss autoprefixer \
  @types/node \
  vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom \
  msw@^2 \
  prettier eslint-config-prettier
```

**Step 3: Init Tailwind**

```bash
npx tailwindcss init -p
```

**Step 4: Commit**

```bash
git add package.json package-lock.json tailwind.config.js postcss.config.js
git commit -m "chore: add runtime and dev dependencies"
```

---

### Task 3: Configure TypeScript paths + Tailwind + theme variables

**Files:**
- Modify: `tsconfig.json`, `tsconfig.app.json`, `vite.config.ts`
- Replace: `tailwind.config.js` → `tailwind.config.ts`
- Replace: `src/index.css`
- Create: `src/lib/utils.ts`

**Step 1: `tsconfig.json` — add path alias**

Add to `compilerOptions` (and in `tsconfig.app.json`):
```json
"baseUrl": ".",
"paths": { "@/*": ["./src/*"] }
```

**Step 2: `vite.config.ts`**

```ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    resolve: { alias: { '@': path.resolve(__dirname, './src') } },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
  };
});
```

**Step 3: `tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        success: { DEFAULT: 'hsl(var(--success))', foreground: 'hsl(var(--success-foreground))' },
        warning: { DEFAULT: 'hsl(var(--warning))', foreground: 'hsl(var(--warning-foreground))' },
      },
      borderRadius: { lg: '8px', md: '6px', sm: '4px' },
      fontFamily: {
        sans: ['"Inter Variable"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono Variable"', 'monospace'],
      },
      maxWidth: { content: '1440px' },
    },
  },
  plugins: [],
} satisfies Config;
```

**Step 4: `src/index.css` — full theme**

```css
@import '@fontsource-variable/inter';
@import '@fontsource-variable/jetbrains-mono';

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    --border: 220 13% 91%;
    --input: 220 13% 91%;
    --ring: 221 83% 53%;
    --primary: 224 76% 48%;
    --primary-foreground: 0 0% 100%;
    --secondary: 220 14% 96%;
    --secondary-foreground: 222 47% 11%;
    --muted: 210 40% 98%;
    --muted-foreground: 215 16% 47%;
    --accent: 214 100% 97%;
    --accent-foreground: 222 47% 11%;
    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;
    --success: 142 76% 36%;
    --success-foreground: 0 0% 100%;
    --warning: 41 95% 40%;
    --warning-foreground: 0 0% 100%;
  }
  .dark {
    --background: 222 40% 9%;
    --foreground: 210 20% 90%;
    --card: 222 33% 13%;
    --card-foreground: 210 20% 90%;
    --border: 217 33% 18%;
    --input: 217 33% 18%;
    --ring: 217 91% 60%;
    --primary: 217 91% 60%;
    --primary-foreground: 0 0% 100%;
    --secondary: 217 33% 18%;
    --secondary-foreground: 210 20% 90%;
    --muted: 222 47% 11%;
    --muted-foreground: 215 20% 65%;
    --accent: 217 33% 18%;
    --accent-foreground: 210 20% 90%;
    --destructive: 0 63% 50%;
    --destructive-foreground: 0 0% 100%;
    --success: 142 70% 45%;
    --success-foreground: 0 0% 100%;
    --warning: 41 95% 55%;
    --warning-foreground: 222 47% 11%;
  }
  body { @apply bg-background text-foreground antialiased; font-feature-settings: 'cv11', 'ss01'; }
}
```

**Step 5: `src/lib/utils.ts`**

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Step 6: Verify**

```bash
npm run dev
```
Expected: page renders without errors in light theme, no console errors about missing fonts or Tailwind.

**Step 7: Commit**

```bash
git add .
git commit -m "chore: configure tailwind theme, paths, fonts, vite proxy"
```

---

### Task 4: Setup Vitest + testing libraries

**Files:**
- Create: `vitest.config.ts`, `src/test/setup.ts`
- Modify: `package.json` (scripts)

**Step 1: `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
```

**Step 2: `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
afterEach(() => cleanup());
```

**Step 3: Add scripts to `package.json`**

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "typecheck": "tsc --noEmit"
}
```

**Step 4: Smoke test**

Create `src/lib/utils.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('merges tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});
```

Run: `npm run test`
Expected: 1 test passes.

**Step 5: Commit**

```bash
git add .
git commit -m "chore: setup vitest and testing library"
```

---

### Task 5: Bring Rusklimat logo + favicon

**Files:**
- Copy: `~/Downloads/rusklimat.png` → `public/rusklimat.png`
- Create: `public/favicon.svg` (simple camera glyph)
- Modify: `index.html`

**Step 1: Copy logo**

```bash
cp ~/Downloads/rusklimat.png public/rusklimat.png
```

**Step 2: `public/favicon.svg`** — simple blue camera:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#1D4ED8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
```

**Step 3: Update `index.html`**

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

**Step 4: Commit**

```bash
git add public/ index.html
git commit -m "chore: add Rusklimat logo and favicon"
```

---

## Phase 2 — Types and API layer

### Task 6: API types

**Files:**
- Create: `src/types/api.ts`

**Step 1: Write types**

```ts
export interface LoginResponse {
  success: true;
  session_id: string;
  username: string;
  expires_in: number;
  token_type: 'Bearer';
}

export interface Point { x: number; y: number }

export interface Camera {
  id: number;
  name: string;
  enabled: boolean;
  url: string;
  fps_limit: number;
  zone_check_enabled: boolean;
  ppe_check_enabled: boolean;
  timeout_threshold_sec: number;
  zone_polygon?: Point[];
  ppe_zone_polygon?: Point[];
}

export interface CamerasListResponse { success: true; count: number; cameras: Camera[] }
export interface CameraResponse extends Camera { success: true }

export interface AddCameraRequest {
  name: string; url: string; username?: string; password?: string;
  fps_limit: number; zone_check_enabled: boolean; ppe_check_enabled: boolean; timeout_threshold_sec: number;
}

export interface SaveCameraRequest {
  id: number; name?: string; fps_limit?: number;
  zone_check_enabled?: boolean; ppe_check_enabled?: boolean; timeout_threshold_sec?: number; enabled?: boolean;
}

export interface SaveZoneRequest {
  camera_id: number;
  zone_polygon: Point[];
  ppe_zone_polygon: Point[];
  zone_check_enabled: boolean;
  ppe_check_enabled: boolean;
  timeout_threshold_sec: number;
}

export interface TrassirChannel {
  id: number; name: string; enabled: boolean; online: boolean;
  stream_url_main: string; stream_url_sub: string; thumbnail_url: string;
}

export interface TrassirChannelsResponse { success: true; nvr_ip: string; channels: TrassirChannel[] }

export interface StatusResponse {
  status: 'running' | 'stopped'; version: string; uptime_seconds: number; cameras_connected: boolean;
}

export interface LogsResponse { success: true; logs: { message: string }[] }

export interface ExportRequest { start_date: string; end_date: string; type: string }
export interface ExportResponse { success: true; message: string; file: string; start_date: string; end_date: string }

export interface ApiErrorShape { success: false; error?: string; message?: string }

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';
export type LogEventType = 'zone' | 'ppe' | 'system';

export interface LogEvent {
  id: string;             // derived: ts-isoformat + idx
  ts: Date;
  level: LogLevel;
  cameraId?: number;
  cameraName?: string;    // resolved after loading cameras
  type: LogEventType;
  message: string;
  raw: string;
}
```

**Step 2: Commit**

```bash
git add src/types/api.ts
git commit -m "feat: API types"
```

---

### Task 7: API client (TDD for auth header + 401 handling)

**Files:**
- Create: `src/api/client.ts`, `src/api/client.test.ts`, `src/api/errors.ts`

**Step 1: Write failing tests `src/api/client.test.ts`**

```ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { apiRequest } from './client';
import { ApiError } from './errors';

const originalFetch = global.fetch;

function mockFetch(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  global.fetch = vi.fn(async () => ({
    ok: response.ok ?? true,
    status: response.status ?? 200,
    headers: new Headers(response.headers as HeadersInit),
    json: response.json ?? (async () => ({})),
    text: async () => JSON.stringify(await (response.json?.() ?? Promise.resolve({}))),
  })) as unknown as typeof fetch;
}

describe('apiRequest', () => {
  beforeEach(() => {
    localStorage.setItem('vs_auth', JSON.stringify({ state: { sessionId: 'session_abc', expiresAt: Date.now() + 60_000 } }));
  });
  afterEach(() => {
    global.fetch = originalFetch;
    localStorage.clear();
  });

  it('sends Authorization header when session exists', async () => {
    const spy = vi.fn(async () => ({ ok: true, status: 200, headers: new Headers(), json: async () => ({ success: true }), text: async () => '{}' }));
    global.fetch = spy as unknown as typeof fetch;
    await apiRequest('/api/cameras');
    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(headers.get('Authorization')).toBe('session_abc');
  });

  it('throws ApiError on 401 with body message', async () => {
    mockFetch({ ok: false, status: 401, json: async () => ({ success: false, message: 'expired' }) });
    await expect(apiRequest('/api/cameras')).rejects.toBeInstanceOf(ApiError);
  });

  it('parses JSON body on success', async () => {
    mockFetch({ ok: true, status: 200, json: async () => ({ success: true, count: 0, cameras: [] }) });
    const data = await apiRequest<{ count: number }>('/api/cameras');
    expect(data.count).toBe(0);
  });
});
```

Run: `npm run test -- src/api/client.test.ts`
Expected: FAIL (module doesn't exist).

**Step 2: `src/api/errors.ts`**

```ts
export class ApiError extends Error {
  constructor(public status: number, message: string, public raw?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}
```

**Step 3: `src/api/client.ts`**

```ts
import { ApiError } from './errors';

interface StoredAuth { state?: { sessionId?: string | null; expiresAt?: number | null } }

function readSessionId(): string | null {
  try {
    const raw = localStorage.getItem('vs_auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuth;
    return parsed.state?.sessionId ?? null;
  } catch { return null; }
}

export interface RequestOpts { method?: string; body?: unknown; signal?: AbortSignal; headers?: Record<string, string> }

export async function apiRequest<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const sessionId = readSessionId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...opts.headers,
  };
  if (sessionId) headers['Authorization'] = sessionId;

  const res = await fetch(path, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    signal: opts.signal,
  });

  const text = await res.text();
  const data: unknown = text ? JSON.parse(text) : {};

  if (!res.ok) {
    const msg = (data as { message?: string; error?: string }).message
      ?? (data as { error?: string }).error
      ?? res.statusText;
    throw new ApiError(res.status, msg, data);
  }
  return data as T;
}

export async function apiBlob(path: string): Promise<{ blob: Blob; headers: Headers }> {
  const sessionId = readSessionId();
  const headers: Record<string, string> = {};
  if (sessionId) headers['Authorization'] = sessionId;
  const res = await fetch(path, { headers });
  if (!res.ok) throw new ApiError(res.status, res.statusText);
  const blob = await res.blob();
  return { blob, headers: res.headers };
}
```

**Step 4: Run tests**

Run: `npm run test -- src/api/client.test.ts`
Expected: 3 tests pass.

**Step 5: Commit**

```bash
git add src/api/
git commit -m "feat(api): client with auth header and error typing"
```

---

### Task 8: API endpoint wrappers

**Files:**
- Create: `src/api/{auth,cameras,zones,logs,trassir,export}.ts`

**Step 1: Write thin wrappers** (one file each, exports typed functions). Example `auth.ts`:

```ts
import { apiRequest } from './client';
import type { LoginResponse } from '@/types/api';

export const login = (username: string, password: string) =>
  apiRequest<LoginResponse>('/api/login', { method: 'POST', body: { username, password } });

export const logout = () =>
  apiRequest<{ success: true }>('/api/logout', { method: 'POST' });
```

Similarly:
- `cameras.ts`: `listCameras()`, `getCamera(id)`, `addCamera(body)`, `saveCamera(body)`, `takeSnapshot(id)`.
- `zones.ts`: `saveZone(body)`.
- `logs.ts`: `getLogs()` → returns `string[]` (normalised from `{message}[]`).
- `trassir.ts`: `getChannels(body)`, `addChannels(body)`.
- `export.ts`: `exportEvents(body)`.

**Step 2: Type-check**

Run: `npm run typecheck`
Expected: no errors.

**Step 3: Commit**

```bash
git add src/api/
git commit -m "feat(api): endpoint wrappers for auth, cameras, zones, logs, trassir, export"
```

---

### Task 9: Log parser (TDD)

**Files:**
- Create: `src/lib/log-parser.ts`, `src/lib/log-parser.test.ts`

**Step 1: Write failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { parseLogLine } from './log-parser';

describe('parseLogLine', () => {
  it('parses a zone violation WARN line', () => {
    const e = parseLogLine('[2026-04-21 12:01:00] [WARN] Camera 1: Zone violation detected', 0);
    expect(e).toMatchObject({ level: 'WARN', cameraId: 1, type: 'zone' });
    expect(e!.ts.toISOString()).toBe('2026-04-21T12:01:00.000Z');
  });

  it('parses a PPE violation', () => {
    const e = parseLogLine('[2026-04-21 12:02:00] [WARN] Camera 2: PPE missing — no helmet', 1);
    expect(e).toMatchObject({ level: 'WARN', cameraId: 2, type: 'ppe' });
  });

  it('classifies info/system lines', () => {
    const e = parseLogLine('[2026-04-21 12:00:00] [INFO] Camera 1 connected', 0);
    expect(e).toMatchObject({ level: 'INFO', cameraId: 1, type: 'system' });
  });

  it('returns null for unparseable garbage', () => {
    expect(parseLogLine('not a log line', 0)).toBeNull();
  });
});
```

Run: `npm run test -- src/lib/log-parser.test.ts`
Expected: FAIL.

**Step 2: Implement `src/lib/log-parser.ts`**

```ts
import type { LogEvent, LogLevel, LogEventType } from '@/types/api';

const LINE_RE = /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] \[(INFO|WARN|ERROR)\] (?:Camera (\d+)[:]?\s*)?(.*)$/;

function classify(message: string): LogEventType {
  const m = message.toLowerCase();
  if (m.includes('zone violation') || m.includes('zone')) return 'zone';
  if (m.includes('ppe') || m.includes('helmet') || m.includes('without')) return 'ppe';
  return 'system';
}

export function parseLogLine(raw: string, idx: number): LogEvent | null {
  const match = LINE_RE.exec(raw.trim());
  if (!match) return null;
  const [, tsStr, levelStr, camStr, message] = match;
  const ts = new Date(tsStr.replace(' ', 'T') + 'Z');
  if (Number.isNaN(ts.getTime())) return null;
  return {
    id: `${ts.toISOString()}-${idx}`,
    ts,
    level: levelStr as LogLevel,
    cameraId: camStr ? Number(camStr) : undefined,
    type: classify(message),
    message,
    raw,
  };
}

export function parseLogs(lines: string[]): LogEvent[] {
  const out: LogEvent[] = [];
  lines.forEach((ln, i) => {
    const ev = parseLogLine(ln, i);
    if (ev) out.push(ev);
  });
  return out.sort((a, b) => b.ts.getTime() - a.ts.getTime());
}
```

**Step 3: Run tests**

Run: `npm run test -- src/lib/log-parser.test.ts`
Expected: 4 tests pass.

**Step 4: Commit**

```bash
git add src/lib/
git commit -m "feat(lib): log line parser with classification"
```

---

### Task 10: Polygon coordinate scaling (TDD)

**Files:**
- Create: `src/lib/polygon.ts`, `src/lib/polygon.test.ts`

**Step 1: Tests**

```ts
import { describe, it, expect } from 'vitest';
import { scaleToDisplay, scaleToNatural } from './polygon';

describe('polygon scaling', () => {
  const natural = { w: 1920, h: 1080 };
  const display = { w: 1280, h: 720 };

  it('scales natural → display', () => {
    expect(scaleToDisplay({ x: 1920, y: 1080 }, natural, display)).toEqual({ x: 1280, y: 720 });
  });

  it('scales display → natural', () => {
    expect(scaleToNatural({ x: 640, y: 360 }, natural, display)).toEqual({ x: 960, y: 540 });
  });

  it('round-trip preserves coordinates within 1px', () => {
    const p = { x: 357, y: 691 };
    const r = scaleToNatural(scaleToDisplay(p, natural, display), natural, display);
    expect(Math.abs(r.x - p.x)).toBeLessThan(1.5);
    expect(Math.abs(r.y - p.y)).toBeLessThan(1.5);
  });
});
```

**Step 2: Implement**

```ts
import type { Point } from '@/types/api';

export interface Size { w: number; h: number }

export function scaleToDisplay(p: Point, natural: Size, display: Size): Point {
  return { x: Math.round((p.x * display.w) / natural.w), y: Math.round((p.y * display.h) / natural.h) };
}
export function scaleToNatural(p: Point, natural: Size, display: Size): Point {
  return { x: Math.round((p.x * natural.w) / display.w), y: Math.round((p.y * natural.h) / display.h) };
}
```

**Step 3: Tests pass, commit**

```bash
npm run test -- src/lib/polygon.test.ts
git add src/lib/
git commit -m "feat(lib): polygon coordinate scaling"
```

---

## Phase 3 — State, shell, routing

### Task 11: Zustand auth store

**Files:**
- Create: `src/stores/auth.ts`, `src/stores/auth.test.ts`

**Step 1: Tests**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuth } from './auth';

describe('auth store', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuth.setState({ sessionId: null, username: null, expiresAt: null });
  });

  it('setSession stores credentials and expiry', () => {
    useAuth.getState().setSession('sess_1', 'admin', 1800);
    const s = useAuth.getState();
    expect(s.sessionId).toBe('sess_1');
    expect(s.username).toBe('admin');
    expect(s.expiresAt).toBeGreaterThan(Date.now());
  });

  it('isExpired true when past expiry', () => {
    useAuth.setState({ sessionId: 's', expiresAt: Date.now() - 1000 });
    expect(useAuth.getState().isExpired()).toBe(true);
  });

  it('clear resets state', () => {
    useAuth.getState().setSession('s', 'u', 1800);
    useAuth.getState().clear();
    expect(useAuth.getState().sessionId).toBeNull();
  });
});
```

**Step 2: Implement**

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  sessionId: string | null;
  username: string | null;
  expiresAt: number | null;
  setSession: (id: string, username: string, expiresInSec: number) => void;
  clear: () => void;
  isExpired: () => boolean;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      sessionId: null,
      username: null,
      expiresAt: null,
      setSession: (id, username, expiresInSec) =>
        set({ sessionId: id, username, expiresAt: Date.now() + expiresInSec * 1000 }),
      clear: () => set({ sessionId: null, username: null, expiresAt: null }),
      isExpired: () => {
        const exp = get().expiresAt;
        return exp === null || Date.now() >= exp;
      },
    }),
    { name: 'vs_auth' }
  )
);
```

**Step 3: Run tests + commit**

```bash
npm run test -- src/stores/auth.test.ts
git add src/stores/
git commit -m "feat(store): zustand auth store with persist"
```

---

### Task 12: shadcn/ui primitives (manual, not CLI)

**Files:**
- Create: `src/components/ui/{button,card,input,label,dialog,dropdown-menu,select,tabs,checkbox,switch,table,badge,skeleton,tooltip,popover,sonner}.tsx`

**Reasoning:** shadcn CLI initialisation writes files we've essentially already laid out via Tailwind config. We hand-write the primitives we'll use (fewer than a full `shadcn init`).

**Step 1: Create Button** (example — pattern repeats for other primitives; use standard shadcn/ui sources from https://ui.shadcn.com/docs/components/button):

```tsx
// src/components/ui/button.tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-6',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';
```

**Step 2: Add remaining primitives.** Copy canonical sources from https://ui.shadcn.com/docs/components/ for: card, input, label, dialog, dropdown-menu, select, tabs, checkbox, switch, table, badge, skeleton, tooltip, popover. For toasts use `sonner` re-export:

```tsx
// src/components/ui/sonner.tsx
import { Toaster as Sonner } from 'sonner';
import { useTheme } from '@/stores/theme';
export function Toaster() {
  const { theme } = useTheme();
  return <Sonner theme={theme} position="bottom-right" richColors closeButton />;
}
```

**Step 3: Build check**

Run: `npm run typecheck && npm run build`
Expected: build succeeds.

**Step 4: Commit**

```bash
git add src/components/ui/
git commit -m "feat(ui): shadcn/ui primitives"
```

---

### Task 13: Theme store + provider

**Files:**
- Create: `src/stores/theme.ts`, `src/components/layout/ThemeInit.tsx`

**Step 1: `src/stores/theme.ts`**

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  toggle: () => void;
}

export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (t) => set({ theme: t }),
      toggle: () => set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
    }),
    { name: 'vs_theme' }
  )
);
```

**Step 2: `ThemeInit.tsx`** — applies class to `<html>`:

```tsx
import { useEffect } from 'react';
import { useTheme } from '@/stores/theme';

export function ThemeInit() {
  const theme = useTheme((s) => s.theme);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  return null;
}
```

**Step 3: Commit**

```bash
git add src/stores/theme.ts src/components/layout/ThemeInit.tsx
git commit -m "feat(theme): light/dark store with html class toggle"
```

---

### Task 14: Router + QueryClient + RequireAuth

**Files:**
- Replace: `src/main.tsx`, `src/App.tsx`
- Create: `src/components/layout/RequireAuth.tsx`, `src/router.tsx`

**Step 1: `src/router.tsx`**

```tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { RequireAuth } from '@/components/layout/RequireAuth';
import { LoginPage } from '@/pages/LoginPage';
import { CamerasPage } from '@/pages/CamerasPage';
import { JournalPage } from '@/pages/JournalPage';
import { ExportPage } from '@/pages/ExportPage';
import { AdminPage } from '@/pages/AdminPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth><AppShell /></RequireAuth>,
    children: [
      { path: '/', element: <Navigate to="/cameras" replace /> },
      { path: '/cameras', element: <CamerasPage /> },
      { path: '/journal', element: <JournalPage /> },
      { path: '/export', element: <ExportPage /> },
      { path: '/admin/*', element: <AdminPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/cameras" replace /> },
]);
```

**Step 2: `src/components/layout/RequireAuth.tsx`**

```tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/stores/auth';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const location = useLocation();
  if (!auth.sessionId || auth.isExpired()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
```

**Step 3: `src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './router';
import { ThemeInit } from './components/layout/ThemeInit';
import { Toaster } from './components/ui/sonner';
import './index.css';

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

async function bootstrap() {
  if (import.meta.env.VITE_USE_MOCKS === 'true') {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={qc}>
        <ThemeInit />
        <RouterProvider router={router} />
        <Toaster />
      </QueryClientProvider>
    </React.StrictMode>
  );
}
bootstrap();
```

**Step 4: Stub pages** (will be filled in later tasks):

For each page file below — start with `export function PageName() { return <div>PageName</div>; }` so router compiles. Files:
- `src/pages/LoginPage.tsx`
- `src/pages/CamerasPage.tsx`
- `src/pages/JournalPage.tsx`
- `src/pages/ExportPage.tsx`
- `src/pages/AdminPage.tsx`
- `src/components/layout/AppShell.tsx` — `export function AppShell() { return <Outlet />; }` with `Outlet` import from react-router-dom.

**Step 5: Build check**

Run: `npm run typecheck && npm run dev`
Expected: `/login` shows "LoginPage", `/cameras` redirects to `/login` since no auth.

**Step 6: Commit**

```bash
git add .
git commit -m "feat(routing): router, RequireAuth, QueryClient, page stubs"
```

---

### Task 15: AppShell with TopBar + status indicator

**Files:**
- Replace: `src/components/layout/AppShell.tsx`
- Create: `src/components/layout/TopBar.tsx`, `src/components/layout/StatusIndicator.tsx`

**Step 1: `TopBar.tsx`**

```tsx
import { NavLink, useNavigate } from 'react-router-dom';
import { Camera, FileText, Download, Settings, Moon, Sun, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/stores/theme';
import { useAuth } from '@/stores/auth';
import { logout } from '@/api/auth';
import { StatusIndicator } from './StatusIndicator';
import { cn } from '@/lib/utils';

const tabs = [
  { to: '/cameras', label: 'Камеры', icon: Camera },
  { to: '/journal', label: 'Журнал', icon: FileText },
  { to: '/export', label: 'Экспорт', icon: Download },
  { to: '/admin', label: 'Администрирование', icon: Settings },
];

export function TopBar() {
  const { theme, toggle } = useTheme();
  const auth = useAuth();
  const navigate = useNavigate();

  async function onLogout() {
    try { await logout(); } finally {
      auth.clear();
      navigate('/login', { replace: true });
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-content items-center gap-6 px-6">
        <img src="/rusklimat.png" alt="Русклимат" className="h-8" />
        <nav className="flex items-center gap-1">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <StatusIndicator />
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Сменить тему">
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </Button>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            <LogOut size={16} /> Выйти
          </Button>
        </div>
      </div>
    </header>
  );
}
```

**Step 2: `StatusIndicator.tsx`**

```tsx
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/api/client';
import type { StatusResponse } from '@/types/api';
import { cn } from '@/lib/utils';

export function StatusIndicator() {
  const { data, isError } = useQuery({
    queryKey: ['status'],
    queryFn: () => apiRequest<StatusResponse>('/api/status'),
    refetchInterval: 30_000,
  });
  const online = !isError && data?.status === 'running';
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className={cn('inline-block h-2 w-2 rounded-full', online ? 'bg-success' : 'bg-destructive')} />
      {online ? 'Сервер онлайн' : 'Нет связи'}
    </div>
  );
}
```

**Step 3: `AppShell.tsx`**

```tsx
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';

export function AppShell() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <main className="mx-auto max-w-content px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
```

**Step 4: Verify**

Run: `npm run dev`, hack in sessionId into localStorage `vs_auth` to bypass `/login`, check that all 4 tabs render and theme toggle flips.

**Step 5: Commit**

```bash
git add .
git commit -m "feat(layout): AppShell with TopBar, status indicator, theme toggle"
```

---

## Phase 4 — Pages

### Task 16: LoginPage

**Files:**
- Replace: `src/pages/LoginPage.tsx`
- Create: `src/pages/LoginPage.test.tsx`

**Step 1: Test (smoke + login flow via MSW-less direct mock)**

```tsx
// src/pages/LoginPage.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';

vi.mock('@/api/auth', () => ({
  login: vi.fn(async () => ({ success: true, session_id: 'S', username: 'admin', expires_in: 1800, token_type: 'Bearer' })),
  logout: vi.fn(),
}));

beforeEach(() => localStorage.clear());

describe('LoginPage', () => {
  it('submits credentials and stores session', async () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    await userEvent.type(screen.getByLabelText('Логин'), 'admin');
    await userEvent.type(screen.getByLabelText('Пароль'), 'admin');
    await userEvent.click(screen.getByRole('button', { name: 'Войти' }));
    expect(localStorage.getItem('vs_auth')).toContain('"sessionId":"S"');
  });
});
```

**Step 2: Implement `LoginPage.tsx`**

```tsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { login } from '@/api/auth';
import { useAuth } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

export function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuth((s) => s.setSession);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(username, password);
      setSession(res.session_id, res.username, res.expires_in);
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/cameras';
      navigate(from, { replace: true });
    } catch (err) {
      toast.error('Неверный логин или пароль');
    } finally { setLoading(false); }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-6 flex flex-col items-center gap-3">
          <img src="/rusklimat.png" alt="Русклимат" className="h-10" />
          <h1 className="text-xl font-semibold">VisionSystem</h1>
          <p className="text-sm text-muted-foreground">Вход для оператора</p>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="username">Логин</Label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Пароль</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading}>{loading ? 'Вход…' : 'Войти'}</Button>
        </form>
      </Card>
    </div>
  );
}
```

**Step 3: Run test + commit**

```bash
npm run test -- src/pages/LoginPage.test.tsx
git add src/pages/
git commit -m "feat(login): login page with session storage"
```

---

### Task 17: CamerasPage + CameraCard

**Files:**
- Create: `src/components/features/CameraCard.tsx`, `src/components/features/CameraThumb.tsx`, `src/hooks/useCameras.ts`
- Replace: `src/pages/CamerasPage.tsx`

**Step 1: `hooks/useCameras.ts`**

```ts
import { useQuery } from '@tanstack/react-query';
import { listCameras } from '@/api/cameras';
export function useCameras() {
  return useQuery({ queryKey: ['cameras'], queryFn: listCameras, staleTime: 30_000 });
}
```

**Step 2: `CameraThumb.tsx` — self-refreshing JPEG**

```tsx
import { useEffect, useState } from 'react';

export function CameraThumb({ cameraId, intervalMs = 2000, className }: { cameraId: number; intervalMs?: number; className?: string }) {
  const [ts, setTs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setTs(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return (
    <img
      src={`/api/camera/${cameraId}/thumbnail?t=${ts}`}
      alt={`Камера ${cameraId}`}
      className={className}
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3'; }}
    />
  );
}
```

Note: auth header cannot be attached to `<img src>` directly. The API currently accepts Authorization but for `<img>` this means we must either (a) rely on the server also accepting unauthenticated GET of thumbnails (unlikely), or (b) fetch as blob with Authorization and use `URL.createObjectURL`. **Pragmatic decision:** use (b). See `BlobImage` below.

**Step 2b: Replace with `BlobImage` approach**

```tsx
import { useEffect, useState } from 'react';
import { apiBlob } from '@/api/client';

export function CameraThumb({ cameraId, intervalMs = 2000, className }: { cameraId: number; intervalMs?: number; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    let currentUrl: string | null = null;
    async function load() {
      try {
        const { blob } = await apiBlob(`/api/camera/${cameraId}/thumbnail?t=${Date.now()}`);
        if (disposed) return;
        const next = URL.createObjectURL(blob);
        setUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return next; });
        currentUrl = next;
      } catch { /* leave previous frame on screen */ }
    }
    load();
    const id = setInterval(load, intervalMs);
    return () => { disposed = true; clearInterval(id); if (currentUrl) URL.revokeObjectURL(currentUrl); };
  }, [cameraId, intervalMs]);

  return url ? <img src={url} alt={`Камера ${cameraId}`} className={className} /> : <div className={className + ' bg-muted'} />;
}
```

**Step 3: `CameraCard.tsx`**

```tsx
import { Camera as CamIcon, ShieldAlert, HardHat } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CameraThumb } from './CameraThumb';
import type { Camera } from '@/types/api';

export function CameraCard({ camera, onClick }: { camera: Camera; onClick?: () => void }) {
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer overflow-hidden transition-shadow hover:ring-1 hover:ring-primary/30 hover:shadow-sm"
    >
      <div className="relative aspect-video bg-muted">
        <CameraThumb cameraId={camera.id} className="h-full w-full object-cover" />
        {!camera.enabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-medium text-white">Отключена</div>
        )}
      </div>
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CamIcon size={14} className="text-muted-foreground" />
          {camera.name}
        </div>
        <div className="flex items-center gap-1">
          {camera.zone_check_enabled && <Badge variant="outline" className="gap-1"><ShieldAlert size={12} className="text-destructive" /> Зона</Badge>}
          {camera.ppe_check_enabled && <Badge variant="outline" className="gap-1"><HardHat size={12} className="text-success" /> СИЗ</Badge>}
        </div>
      </div>
    </Card>
  );
}
```

**Step 4: `CamerasPage.tsx`**

```tsx
import { useState } from 'react';
import { useCameras } from '@/hooks/useCameras';
import { CameraCard } from '@/components/features/CameraCard';
import { CameraLiveModal } from '@/components/features/CameraLiveModal';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

export function CamerasPage() {
  const { data, isLoading } = useCameras();
  const [search, setSearch] = useState('');
  const [onlyActive, setOnlyActive] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const cameras = (data?.cameras ?? [])
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    .filter((c) => !onlyActive || c.enabled);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-semibold">Камеры</h1>
        <div className="ml-auto flex items-center gap-3">
          <Input placeholder="Поиск по имени" value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
          <div className="flex items-center gap-2">
            <Switch id="only-active" checked={onlyActive} onCheckedChange={setOnlyActive} />
            <Label htmlFor="only-active">Только активные</Label>
          </div>
        </div>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-video" />)}
        </div>
      ) : cameras.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Камеры не найдены</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {cameras.map((c) => <CameraCard key={c.id} camera={c} onClick={() => setSelectedId(c.id)} />)}
        </div>
      )}
      {selectedId !== null && <CameraLiveModal cameraId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
```

**Step 5: Commit (defer CameraLiveModal to next task, stub it for now)**

Stub `src/components/features/CameraLiveModal.tsx`:
```tsx
export function CameraLiveModal(_: { cameraId: number; onClose: () => void }) { return null; }
```

```bash
npm run typecheck
git add .
git commit -m "feat(cameras): grid page with filters and thumbnails"
```

---

### Task 18: CameraLiveModal + snapshot

**Files:**
- Replace: `src/components/features/CameraLiveModal.tsx`

**Step 1: Implement**

```tsx
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CameraThumb } from './CameraThumb';
import { toast } from 'sonner';
import { takeSnapshot } from '@/api/cameras';
import { useCameras } from '@/hooks/useCameras';

export function CameraLiveModal({ cameraId, onClose }: { cameraId: number; onClose: () => void }) {
  const { data } = useCameras();
  const camera = data?.cameras.find((c) => c.id === cameraId);

  async function onSnapshot() {
    try {
      const res = await takeSnapshot(cameraId);
      toast.success(`Снимок сохранён: ${res.filename}`);
    } catch {
      toast.error('Не удалось сделать снимок');
    }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-4xl">
        <DialogHeader><DialogTitle>{camera?.name ?? `Камера ${cameraId}`}</DialogTitle></DialogHeader>
        <div className="overflow-hidden rounded-md bg-muted">
          <CameraThumb cameraId={cameraId} intervalMs={1000} className="w-full" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Закрыть</Button>
          <Button onClick={onSnapshot}>Сделать снимок</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat(cameras): live preview modal with snapshot action"
```

---

### Task 19: JournalPage with filters and table

**Files:**
- Create: `src/hooks/useLogs.ts`, `src/pages/JournalPage.tsx`, `src/components/features/JournalFilters.tsx`, `src/components/features/EventBadge.tsx`

**Step 1: `hooks/useLogs.ts`**

```ts
import { useQuery } from '@tanstack/react-query';
import { getLogs } from '@/api/logs';
import { parseLogs } from '@/lib/log-parser';

export function useLogs() {
  return useQuery({
    queryKey: ['logs'],
    queryFn: async () => parseLogs(await getLogs()),
    refetchInterval: 10_000,
  });
}
```

**Step 2: `EventBadge.tsx`**

```tsx
import type { LogEventType, LogLevel } from '@/types/api';
import { Badge } from '@/components/ui/badge';

const typeLabel: Record<LogEventType, string> = { zone: 'Нарушение зоны', ppe: 'Нарушение СИЗ', system: 'Системное' };
const typeClass: Record<LogEventType, string> = {
  zone: 'bg-destructive/10 text-destructive border-destructive/30',
  ppe: 'bg-warning/10 text-warning border-warning/30',
  system: 'bg-muted text-muted-foreground border-border',
};
export function TypeBadge({ type }: { type: LogEventType }) {
  return <Badge variant="outline" className={typeClass[type]}>{typeLabel[type]}</Badge>;
}

const levelClass: Record<LogLevel, string> = {
  INFO: 'bg-muted text-muted-foreground',
  WARN: 'bg-warning/15 text-warning',
  ERROR: 'bg-destructive/15 text-destructive',
};
export function LevelBadge({ level }: { level: LogLevel }) {
  return <Badge variant="outline" className={levelClass[level]}>{level}</Badge>;
}
```

**Step 3: `JournalFilters.tsx`** — camera select, type select, level select, period buttons. (straightforward form, no snippet — follow shadcn Select docs)

**Step 4: `JournalPage.tsx`** — two-column layout: filters aside + table on right. Table rows show: CameraThumb 72×40, camera name, `<TypeBadge>`, formatted `ts` via `date-fns` ru locale, `<LevelBadge>`, button "Подробнее" that opens `JournalDetailModal`.

Filtering applied client-side from `useLogs()` data + `useCameras()` (to resolve `cameraName` and populate camera filter).

**Step 5: Commit**

```bash
git add .
git commit -m "feat(journal): filters + table + live log polling"
```

---

### Task 20: JournalDetailModal

**Files:**
- Create: `src/components/features/JournalDetailModal.tsx`

**Step 1: Implement** — Dialog showing: CameraThumb (refresh 1s), event metadata (camera, time, type, level, raw log line in mono), button to camera page and to export.

**Step 2: Commit** `feat(journal): detail modal with live frame`.

---

### Task 21: ExportPage

**Files:**
- Replace: `src/pages/ExportPage.tsx`

**Step 1: Implement**

```tsx
import { useState } from 'react';
import { exportEvents } from '@/api/export';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export function ExportPage() {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [result, setResult] = useState<string | null>(null);

  async function onExport() {
    if (!start || !end) { toast.error('Укажите даты'); return; }
    try {
      const res = await exportEvents({ start_date: start, end_date: end, type: 'events' });
      setResult(res.file);
      toast.success('Экспорт готов');
    } catch { toast.error('Ошибка экспорта'); }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Экспорт событий</h1>
      <Card className="max-w-xl p-6 flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="flex-1 flex flex-col gap-2">
            <Label htmlFor="start">От</Label>
            <Input id="start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <Label htmlFor="end">До</Label>
            <Input id="end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>
        <Button onClick={onExport}>Выгрузить</Button>
        {result && (
          <div className="rounded-md border border-border bg-muted p-3 text-sm">
            <div className="font-medium mb-1">Файл создан на сервере:</div>
            <code className="font-mono text-xs">{result}</code>
            <div className="mt-2 text-xs text-muted-foreground">
              Текущее API кладёт файл на диск сервера и не отдаёт его напрямую. Попросите администратора забрать файл.
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/pages/ExportPage.tsx
git commit -m "feat(export): date-range export page"
```

---

### Task 22: AdminPage shell + routing

**Files:**
- Replace: `src/pages/AdminPage.tsx`
- Create: `src/pages/admin/{CamerasAdmin,ZonesAdmin,TrassirAdmin,SystemLog}.tsx`

**Step 1: `AdminPage.tsx`**

```tsx
import { NavLink, Route, Routes, Navigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { CamerasAdmin } from './admin/CamerasAdmin';
import { ZonesAdmin } from './admin/ZonesAdmin';
import { TrassirAdmin } from './admin/TrassirAdmin';
import { SystemLog } from './admin/SystemLog';

const subtabs = [
  { to: 'cameras', label: 'Камеры' },
  { to: 'zones', label: 'Зоны контроля' },
  { to: 'trassir', label: 'Trassir NVR' },
  { to: 'logs', label: 'Лог системы' },
];

export function AdminPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Администрирование</h1>
      <nav className="flex gap-1 border-b border-border">
        {subtabs.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn(
              'px-4 py-2 text-sm border-b-2 -mb-px',
              isActive ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <Routes>
        <Route index element={<Navigate to="cameras" replace />} />
        <Route path="cameras" element={<CamerasAdmin />} />
        <Route path="zones" element={<ZonesAdmin />} />
        <Route path="trassir" element={<TrassirAdmin />} />
        <Route path="logs" element={<SystemLog />} />
      </Routes>
    </div>
  );
}
```

**Step 2: Stub each subtab file** with placeholder. Commit.

```bash
git add src/pages/
git commit -m "feat(admin): shell with subtab routing"
```

---

### Task 23: Admin → Cameras CRUD

**Files:**
- Replace: `src/pages/admin/CamerasAdmin.tsx`
- Create: `src/components/features/CameraFormDialog.tsx`

**Step 1: Implement** — Table of cameras with columns (Name, URL, FPS, Timeout, Zone, PPE, Enabled, Actions). Row actions: Edit (opens `CameraFormDialog`), Toggle Enabled (PATCH-like via `saveCamera` with `enabled`). "Add camera" button above table opens same dialog in create mode.

- Create mode: POST `/api/camera/add` with `AddCameraRequest`.
- Edit mode: POST `/api/camera/save` with `SaveCameraRequest`.
- On success: `queryClient.invalidateQueries({ queryKey: ['cameras'] })`.

**Step 2: Commit**

```bash
git add .
git commit -m "feat(admin): cameras CRUD with form dialog"
```

---

### Task 24: PolygonCanvas component (TDD for scaling)

**Files:**
- Create: `src/components/features/PolygonCanvas.tsx`, `src/components/features/PolygonCanvas.test.tsx`

**Design:** SVG overlay on top of background image. Click empty area = add point to active polygon. Click existing point = start drag (mousemove updates, mouseup ends). Right-click point = delete. Two polygon colors: red (`#EC4899`) and green (`#22C55E`). Active polygon selector outside (toggle buttons).

**Step 1: Smoke test** — renders two polygons with correct SVG `points` attributes given pixel-scale inputs.

**Step 2: Implement** — controlled component:

```tsx
interface Props {
  naturalSize: { w: number; h: number };
  displaySize: { w: number; h: number };
  redPolygon: Point[];
  greenPolygon: Point[];
  activePolygon: 'red' | 'green';
  onChange: (poly: 'red' | 'green', next: Point[]) => void;
  imageSrc: string;
}
```

Internal state: `dragIndex`. Events: on svg click — add point (scaled to natural via `scaleToNatural`). On point mousedown — set dragIndex. On svg mousemove — if dragIndex != null, update point position.

**Step 3: Commit** `feat(admin): polygon canvas for zone drawing`.

---

### Task 25: Admin → Zones page

**Files:**
- Replace: `src/pages/admin/ZonesAdmin.tsx`

**Step 1: Implement**

- Camera select (from `useCameras`).
- On change: `apiBlob('/api/camera/{id}/zone-frame')` → read `X-Frame-Width/Height` → `URL.createObjectURL(blob)` → pass to `PolygonCanvas`.
- State: red + green polygons (init from camera.zone_polygon and camera.ppe_zone_polygon).
- Active polygon toggle (red/green buttons), "Очистить активный" button.
- Timeout threshold input.
- Two toggles: `zone_check_enabled`, `ppe_check_enabled`.
- Save button → POST `/api/camera/zone/save`.

**Step 2: Commit** `feat(admin): zones editor with polygon canvas`.

---

### Task 26: Admin → Trassir NVR

**Files:**
- Replace: `src/pages/admin/TrassirAdmin.tsx`

**Step 1: Implement** — Form (IP, port, login, pass), submit → `getChannels`. Show channels as grid of cards with thumbnail (via `thumbnail_url` directly — it's outside our API), checkbox per channel. Per-channel config: name, fps_limit, zone_check, ppe_check, timeout. "Добавить выбранные" → `addChannels`. Show count added via toast.

**Step 2: Commit** `feat(admin): Trassir NVR channel import`.

---

### Task 27: Admin → System Log (raw)

**Files:**
- Replace: `src/pages/admin/SystemLog.tsx`

**Step 1: Implement** — Pre block with last 100 raw lines, auto-refresh 5s, button "Копировать всё", filter by substring.

**Step 2: Commit** `feat(admin): raw system log viewer`.

---

## Phase 5 — MSW mocks + polish

### Task 28: MSW handlers and fixtures

**Files:**
- Create: `src/mocks/browser.ts`, `src/mocks/handlers.ts`, `src/mocks/fixtures.ts`
- Create: `public/mockServiceWorker.js` via `npx msw init public/ --save`

**Step 1: Init MSW**

```bash
npx msw init public/ --save
```

**Step 2: `src/mocks/fixtures.ts`** — two cameras with zones, 50 log strings covering zone/ppe/system/INFO/WARN/ERROR, a status response.

**Step 3: `src/mocks/handlers.ts`** — handlers for every endpoint in API docs. For `/api/camera/:id/thumbnail` and `/zone-frame` — generate placeholder images on the fly using a data URL or small canvas-encoded JPEG; or bundle a static asset in `src/mocks/assets/`.

**Step 4: `src/mocks/browser.ts`**

```ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';
export const worker = setupWorker(...handlers);
```

**Step 5: Verify**

Run with mocks:
```bash
VITE_USE_MOCKS=true npm run dev
```
Log in with any credentials (mock accepts admin/admin), verify all pages render with mock data.

**Step 6: Commit**

```bash
git add .
git commit -m "chore: MSW handlers and fixtures for offline dev"
```

---

### Task 29: Error boundaries + 401 global handling

**Files:**
- Create: `src/components/layout/ErrorBoundary.tsx`
- Modify: `src/api/client.ts` (emit custom event on 401)
- Modify: `src/main.tsx` or a new `src/components/layout/AuthExpiryListener.tsx`

**Step 1: Emit 401 event**

In `client.ts`, on `ApiError` with status 401, also `window.dispatchEvent(new CustomEvent('vs:session-expired'))`.

**Step 2: Listener**

`AuthExpiryListener.tsx`:
```tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/stores/auth';

export function AuthExpiryListener() {
  const clear = useAuth((s) => s.clear);
  const nav = useNavigate();
  useEffect(() => {
    const h = () => { clear(); toast.error('Сессия истекла'); nav('/login', { replace: true }); };
    window.addEventListener('vs:session-expired', h);
    return () => window.removeEventListener('vs:session-expired', h);
  }, [clear, nav]);
  return null;
}
```

Mount inside `<RouterProvider>` children tree (easiest: add inside `AppShell`).

**Step 3: ErrorBoundary**

Standard react-error-boundary pattern (or hand-roll). Wrap each route element in router config.

**Step 4: Commit** `feat(error): global 401 handler + per-page error boundaries`.

---

### Task 30: Accessibility + responsive pass

**Files:** various.

**Steps:**
- Ensure all form inputs have `<Label htmlFor>` linked.
- Check keyboard navigation of modals (Esc closes, focus trap from Radix Dialog).
- Check grid collapses to 1 column below `md` breakpoint (already `md:grid-cols-3`, add `grid-cols-1 sm:grid-cols-2`).
- Check dark theme on every page — no hardcoded bg/text colors, only CSS variables.

**Step 1: Run `npm run build && npm run preview`** and click through every page in both themes.

**Step 2: Fix anything broken. Commit** `polish: a11y and responsive fixes`.

---

## Phase 6 — Handoff

### Task 31: `.env.example`

**Step 1:**

```bash
cat > .env.example <<EOF
# Базовый URL VisionSystem API
VITE_API_BASE_URL=http://localhost:8080

# Использовать MSW-моки вместо реального API (true/false). В проде всегда false.
VITE_USE_MOCKS=false
EOF
```

**Step 2: Commit** `chore: add .env.example`.

---

### Task 32: README.md

**Files:**
- Create: `README.md`
- Create: `docs/screenshots/` with 4 PNGs captured via `npm run preview` (manual step — write the doc and place placeholders, fill screenshots at the very end).

**Content sections** (per design doc §11):
1. Что это
2. Скриншоты
3. Требования: Node ≥ 20, npm ≥ 10
4. Быстрый старт (dev)
5. Продакшен-сборка
6. Как подключить к бекенду (3 варианта)
7. Переменные окружения
8. Траблшутинг (CORS, 401, thumbnails, log format, X-Frame-* headers, export)
9. Список пожеланий к API

**Commit** `docs: README.md with setup, deploy, troubleshooting`.

---

### Task 33: AI_INSTRUCTIONS.md

**Files:**
- Create: `AI_INSTRUCTIONS.md`

**Content** (per brainstorm section 5): 8 numbered sections — Контекст, Задача AI, Чек-лист интеграции (7 шагов), Карта кода, Правила модификации, Типичные проблемы, Запрещено без подтверждения, Проверка до лезания в код. Plus section on `VITE_USE_MOCKS`.

**Commit** `docs: AI_INSTRUCTIONS.md for Qwen-based integration assistant`.

---

### Task 34: Build, verify, capture screenshots

**Steps:**
1. `npm run typecheck` — 0 errors.
2. `npm run test` — all tests green.
3. `npm run build` — produces `dist/`.
4. `npm run preview` — open each page in both themes, take 4 screenshots (cameras grid, journal with filters, detection modal, admin zones), save to `docs/screenshots/`.
5. Update README to embed screenshots.
6. Commit: `docs: add screenshots`.

---

### Task 35: GitHub repo + push

**Steps:**
1. Create repo `NikolasPikchers/vision-system-frontend` (public) via `gh repo create`:
   ```bash
   gh repo create NikolasPikchers/vision-system-frontend --public --source=. --description="Frontend для VisionSystem — CV-контроль зон безопасности и спецодежды (Русклимат)" --push
   ```
   If `gh` not authed: `gh auth login` first.
2. Verify URL works: `gh repo view --web`.

**Commit step:** none (no code change).

---

### Task 36: Create handoff zip

**Steps:**
1. From project root, ensure `dist/` is fresh: `npm run build`.
2. Create zip that includes `dist/` but excludes `node_modules/`, `.env`, `.git/`:
   ```bash
   cd ~/Projects
   zip -r vision-system-frontend.zip vision-system-frontend \
     -x "vision-system-frontend/node_modules/*" \
     -x "vision-system-frontend/.git/*" \
     -x "vision-system-frontend/.env"
   ```
3. Verify: `unzip -l vision-system-frontend.zip | head -30` — should show `dist/`, `src/`, `AI_INSTRUCTIONS.md`, `README.md`.
4. Print final handoff message with:
   - GitHub URL
   - Zip path (`~/Projects/vision-system-frontend.zip`)
   - Instructions for Николай: send both to colleague with the AI_INSTRUCTIONS.md note.

**No commit step** (zip is an artefact).

---

## Success criteria

- [ ] All tests pass (`npm run test`) — expect ≥ 10 test suites.
- [ ] `npm run typecheck` clean.
- [ ] `npm run build` produces `dist/` under ~500 KB gzip.
- [ ] All 4 main tabs functional in both light and dark themes against MSW mocks.
- [ ] Against real API (when available), login + cameras list + journal parsing works without code changes, only `.env` update.
- [ ] `vision-system-frontend.zip` contains pre-built `dist/`, source, `README.md`, `AI_INSTRUCTIONS.md`, `.env.example`, but NOT `node_modules/`, `.env`, `.git/`.
- [ ] GitHub repo `NikolasPikchers/vision-system-frontend` is public with the same contents.
