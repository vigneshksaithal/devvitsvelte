# AGENTS.md

## Build & Development Commands

| Command | Script | Purpose |
|---------|--------|---------|
| `pnpm install` | - | Install dependencies (auto-runs build via postinstall) |
| `pnpm dev` | `concurrently` vite watch + devvit playtest | Start dev server (opens Reddit playtest URL) |
| `pnpm build` | `vite build` | Production build to dist/ |
| `pnpm type-check` | `tsc --build` | TypeScript composite build check (all 3 projects) |
| `pnpm check` | `svelte-check` | Svelte-specific type checking (client only) |
| `pnpm deploy` | `build && devvit upload` | Build and upload to Devvit |
| `pnpm launch` | `build && deploy && devvit publish` | Full release pipeline |

**Before committing:**
```bash
pnpm type-check
```

> **Not yet configured:** No test runner (vitest/jest), linter (eslint/biome), or formatter
> (prettier/biome) is installed. `pnpm test` is broken (circular self-reference). Do not
> add these tools without explicit instruction.

---

## Architecture

Devvit app running inside Reddit posts as a sandboxed webview.

```
src/
├── client/           # Svelte 5 + Tailwind CSS 4 (sandboxed webview)
│   ├── App.svelte    # Root component
│   ├── app.css       # @import "tailwindcss"
│   ├── main.ts       # Entry: mount(App, { target })
│   └── index.html    # Entry HTML
├── server/           # Hono.js routes (serverless)
│   ├── index.ts      # Hono app, route handlers, createServer()
│   └── post.ts       # Post creation logic
└── shared/           # Shared TypeScript (project references, no source files yet)
    └── tsconfig.json
```

Data flow: `User Action → Svelte → fetch('/api/...') → Hono → Redis/Reddit API → Response → UI`

**Key packages:** Svelte 5.x, Tailwind CSS 4.x, Hono, TypeScript 5.x, Vite 8.x-beta, @devvit/web 0.12.x, pnpm

---

## Hard Constraints

| # | Rule | Why |
|---|------|-----|
| 1 | Svelte 5 runes syntax ONLY (`$state`, `$derived`, `$effect`) | Svelte 4 syntax won't compile |
| 2 | Tailwind CSS ONLY -- no `<style>` blocks | Consistency, bundle size |
| 3 | Server routes: `/api/*` (public) or `/internal/*` (triggers/menu) | Devvit routing requirement |
| 4 | No `localStorage` / `sessionStorage` in client | Sandboxed webview, fails silently |
| 5 | No direct external `fetch()` from client | Must proxy through server endpoints |
| 6 | Named exports only (no `export default`) | Tree-shaking; exception: `.svelte` files |
| 7 | No scrolling in inline views -- content must fit viewport | Broken UX on Reddit |
| 8 | Serverless: no long-running processes, no `setInterval` | 30s max request timeout |
| 9 | Redis: 500MB storage, 1000 cmd/sec, 4MB request payload | Platform hard limits |

---

## Code Style

### TypeScript

- **`strict: true`** with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals`, `noUnusedParameters`
- Array/object index access returns `T | undefined` -- always handle it
- Use `const` by default, `let` only if reassigned, never `var`
- Prefer `unknown` over `any`, then narrow with `instanceof` or type guards
- Use `as const` for literal arrays/objects
- Explicit return types on exported/public functions
- Arrow function expressions for all functions: `const foo = (): void => {}`
- Keep functions <=30 lines, single responsibility

### Naming

| Thing | Convention | Example |
|-------|-----------|---------|
| Variables, functions | camelCase | `getUserScore` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_ATTEMPTS` |
| Types, interfaces | PascalCase | `GameState` |
| Svelte components | PascalCase file | `GameBoard.svelte` |
| Non-component files | kebab-case | `game-logic.ts` |
| API routes | kebab-case | `/api/game-state` |
| Redis keys | colon-delimited | `user:{userId}:stats` |

### Imports

```typescript
// External packages first, then local. Named imports only.
import { Hono } from 'hono'
import type { Context } from 'hono'            // type-only imports use `import type`
import { context, redis, reddit } from '@devvit/web/server'

// Relative imports for local modules
import { createPost } from './post'
import './app.css'                              // Side-effect imports last

// Svelte files are the ONE exception to "no default exports"
import App from './App.svelte'
```

### Error Handling

```typescript
// Server routes: try/catch with instanceof narrowing
try {
  const result = await doThing()
  return c.json({ status: 'success', data: result })
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error'
  return c.json({ status: 'error', message }, 500)
}

// Guard clauses for required context
const { subredditName } = context
if (!subredditName) {
  throw new Error('subredditName is required')
}
```

**Response shapes:**
- Success: `{ status: 'success', data: { ... } }`
- Error: `{ status: 'error', message: 'Human-readable' }`
- Navigation (menu items): `{ navigateTo: 'https://reddit.com/...' }`

### HTTP Status Constants

```typescript
const HTTP_STATUS_BAD_REQUEST = 400
const HTTP_STATUS_NOT_FOUND = 404
const HTTP_STATUS_INTERNAL_ERROR = 500
```

---

## Server Patterns

Routes are defined in `src/server/index.ts` using Hono. Menu items and triggers are declared in `devvit.json` and map to `/internal/*` endpoints.

```typescript
import { Hono } from 'hono'
import { context, redis, reddit, createServer, getServerPort } from '@devvit/web/server'

const app = new Hono()

// Public API endpoint (called by client via fetch)
app.get('/api/game/:id', async (c) => { ... })

// Internal endpoint (triggered by devvit.json menu/trigger config)
app.post('/internal/menu/post-create', async (c) => { ... })

// Server bootstrap
const port = getServerPort()
createServer(app.fetch, { port })
```

**Redis key naming:** `{entity}:{id}:{field}` -- e.g. `user:t2_abc:stats`, `game:t3_xyz:state`

**Context variables** (available in server via `context`):
- `context.userId` -- logged-in user (`"t2_..."` or undefined)
- `context.postId` -- current post (`"t3_..."` or undefined)
- `context.subredditId`, `context.subredditName` -- always available

---

## Svelte / Client Patterns

- Use Svelte 5 runes: `$state()`, `$derived()`, `$effect()`
- Mount with `mount()` from `'svelte'`, not `new Component()`
- Tailwind classes only, mobile-first (`text-sm md:text-base lg:text-lg`)
- No scrolling: use `h-full`, `overflow-hidden`, `flex` + `flex-shrink`; never `overflow-y-auto`, `min-h-screen`, `h-screen`
- Test at minimum 320x320px viewport

---

## Git Conventions

**Branches:** `feat/short-description`, `fix/short-description`, `chore/...`, `refactor/...`

**Commits:** `type(scope): imperative description` (max 72 chars)
```
feat(game): add difficulty selector dropdown
fix(timer): stop timer when puzzle completed
chore(deps): update svelte to 5.x
refactor(validation): extract isValidMove function
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`

---

## Where to Put New Code

- Svelte component (reusable) -> `src/client/components/`
- Svelte component (page-level) -> `src/client/views/`
- Client utility -> `src/client/lib/`
- API endpoint -> `src/server/routes/` (or in `src/server/index.ts` if small)
- Shared types/constants -> `src/shared/`
- Server utility -> `src/server/lib/`

## Supplemental Docs

Detailed guides in `agent_docs/`: `database.md`, `reddit.md`, `code-patterns.md`, `style-guide.md`, `workflow.md`, `troubleshooting.md`
