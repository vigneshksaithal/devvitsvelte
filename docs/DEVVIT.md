# Devvit App — Complete Reference

> Combined documentation for the Devvit + Svelte 5 + Hono app. Covers architecture, build commands, constraints, code style, database, Reddit API, patterns, troubleshooting, and workflow.

---

## Table of Contents

- [Build & Development Commands](#build--development-commands)
- [Architecture](#architecture)
- [Hard Constraints](#hard-constraints)
- [Code Style](#code-style)
- [Server Patterns](#server-patterns)
- [Svelte / Client Patterns](#svelte--client-patterns)
- [Redis Database](#redis-database)
- [Reddit API](#reddit-api)
- [Code Patterns & Decision Trees](#code-patterns--decision-trees)
- [Style Guide](#style-guide)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)
- [Git Conventions](#git-conventions)
- [Where to Put New Code](#where-to-put-new-code)

---

## Build & Development Commands

| Command | Script | Purpose |
|---------|--------|---------|
| `bun install` | - | Install dependencies (auto-runs build via postinstall) |
| `bun run dev` | `concurrently` vite watch + devvit playtest | Start dev server (opens Reddit playtest URL) |
| `bun run build` | `vite build` | Production build to dist/ |
| `bun run type-check` | `tsc --build` | TypeScript composite build check (all 3 projects) |
| `bun run check` | `svelte-check` | Svelte-specific type checking (client only) |
| `bun run deploy` | `build && devvit upload` | Build and upload to Devvit |
| `bun run launch` | `build && deploy && devvit publish` | Full release pipeline |

**Before committing:**
```bash
bun run type-check
```

> **Not yet configured:** No test runner (vitest/jest), linter (eslint/biome), or formatter
> (prettier/biome) is installed. `bun run test` is broken (circular self-reference). Do not
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

**Key packages:** Svelte 5.x, Tailwind CSS 4.x, Hono, TypeScript 5.x, Vite 8.x-beta, @devvit/web 0.12.x, Bun (package manager)

### devvit.json Configuration

Routes are wired via `devvit.json`:

- **Post webview:** `dist/client` served as inline webview (`height: "tall"`)
- **Server:** `dist/server/index.cjs`
- **Menu items:** Mapped to `/internal/menu/*` endpoints
- **Triggers:** e.g. `onAppInstall` → `/internal/on-app-install`

---

## Hard Constraints

| # | Rule | Why |
|---|------|-----|
| 1 | Svelte 5 runes syntax ONLY (`$state`, `$derived`, `$effect`) | Svelte 4 syntax won't compile |
| 2 | Tailwind CSS ONLY — no `<style>` blocks | Consistency, bundle size |
| 3 | Server routes: `/api/*` (public) or `/internal/*` (triggers/menu) | Devvit routing requirement |
| 4 | No `localStorage` / `sessionStorage` in client | Sandboxed webview, fails silently |
| 5 | No direct external `fetch()` from client | Must proxy through server endpoints |
| 6 | Named exports only (no `export default`) | Tree-shaking; exception: `.svelte` files |
| 7 | No scrolling in inline views — content must fit viewport | Broken UX on Reddit |
| 8 | Serverless: no long-running processes, no `setInterval` | 30s max request timeout |
| 9 | Redis: 500MB storage, 1000 cmd/sec, 4MB request payload | Platform hard limits |

---

## Code Style

### TypeScript

- **`strict: true`** with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals`, `noUnusedParameters`
- Array/object index access returns `T | undefined` — always handle it
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

**Redis key naming:** `{entity}:{id}:{field}` — e.g. `user:t2_abc:stats`, `game:t3_xyz:state`

**Context variables** (available in server via `context`):
- `context.userId` — logged-in user (`"t2_..."` or undefined)
- `context.postId` — current post (`"t3_..."` or undefined)
- `context.subredditId`, `context.subredditName` — always available

---

## Svelte / Client Patterns

- Use Svelte 5 runes: `$state()`, `$derived()`, `$effect()`
- Mount with `mount()` from `'svelte'`, not `new Component()`
- Tailwind classes only, mobile-first (`text-sm md:text-base lg:text-lg`)
- No scrolling: use `h-full`, `overflow-hidden`, `flex` + `flex-shrink`; never `overflow-y-auto`, `min-h-screen`, `h-screen`
- Test at minimum 320x320px viewport

### Svelte 5 Component with Async Data

```svelte
<script lang="ts">
  import { onMount } from 'svelte'

  type GameState = {
    board: string
    difficulty: string
  }

  let gameState = $state<GameState | null>(null)
  let loading = $state(true)
  let error = $state<string | null>(null)

  onMount(async () => {
    try {
      const response = await fetch('/api/game/state')
      if (!response.ok) throw new Error('Failed to load')
      gameState = await response.json()
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error'
    } finally {
      loading = false
    }
  })
</script>

{#if loading}
  <div class="animate-pulse">Loading...</div>
{:else if error}
  <div class="text-red-500">{error}</div>
{:else if gameState}
  <div>{gameState.board}</div>
{/if}
```

### No-Scroll Rules

| Rule | Implementation |
|------|----------------|
| Never use `overflow-y-auto` or `overflow-scroll` | Content must fit, period |
| Never use `min-h-screen` or `h-screen` | Use `h-full` relative to container |
| Always use `h-full` on root container | Fills available space without exceeding |
| Use `flex` + `flex-shrink` for adaptive layouts | Elements shrink to fit |
| Test at MINIMUM viewport | 320px × 320px is your worst case |
| Use `overflow-hidden` on root | Prevents any accidental scroll |

### Root Layout Pattern (REQUIRED)

```svelte
<!-- App.svelte - Root component -->
<div class="
  h-full w-full
  overflow-hidden
  flex flex-col
  bg-[var(--bg-primary)]
  p-2 sm:p-4
">
  <!-- Header: Fixed size, won't shrink -->
  <header class="flex-none h-10 flex items-center justify-between">
    <!-- header content -->
  </header>

  <!-- Main: Takes remaining space, content must fit -->
  <main class="flex-1 min-h-0 flex flex-col items-center justify-center">
    <!-- game content -->
  </main>

  <!-- Footer: Fixed size, won't shrink -->
  <footer class="flex-none">
    <!-- controls -->
  </footer>
</div>
```

---

## Redis Database

Redis is your database in Devvit. It's fast, free, and pre-configured. Each subreddit installation gets 500MB of Redis storage with support for 1,000 commands per second.

### Basic Operations

```typescript
import { redis } from '@devvit/web/server'

// Basic operations
await redis.set('key', 'value')
const value = await redis.get('key')

// Numbers
await redis.incrBy('counter', 1)

// Hashes (objects)
await redis.hSet('user:123', { name: 'Alice', score: '100' })
const user = await redis.hGetAll('user:123')

// Sorted Sets (leaderboards)
await redis.zAdd('leaderboard', { member: 'alice', score: 100 })
const top10 = await redis.zRange('leaderboard', 0, 9, { by: 'score', reverse: true })

// Expiration
await redis.expire('session:abc', 3600) // 1 hour
```

### Redis Key Naming Convention

Use hierarchical, colon-delimited keys:

```text
{entity}:{identifier}:{attribute}
```

| Use Case | Pattern | Example |
|----------|---------|---------|
| Game state | `game:{postId}:state` | `game:t3_abc:state` |
| User stats | `user:{userId}:stats` | `user:t2_xyz:stats` |
| Per-game user data | `user:{userId}:game:{postId}` | `user:t2_xyz:game:t3_abc` |
| Leaderboard | `leaderboard:{scope}:{timeframe}` | `leaderboard:wins:daily:2025-01-15` |
| Global counter | `stats:{metric}` | `stats:totalGames` |

### Example Schema for a Game

```text
┌─────────────────────────────────────────────────────────────────┐
│ GAME INSTANCE                                                   │
├─────────────────────────────────────────────────────────────────┤
│ game:{postId}:puzzle      String   The puzzle (81 chars)        │
│ game:{postId}:solution    String   The solution (81 chars)      │
│ game:{postId}:difficulty  String   easy|medium|hard|expert      │
│ game:{postId}:created     String   ISO timestamp                │
├─────────────────────────────────────────────────────────────────┤
│ USER PROGRESS                                                   │
├─────────────────────────────────────────────────────────────────┤
│ user:{uId}:game:{pId}:board     String   Current state (81)     │
│ user:{uId}:game:{pId}:time      Number   Seconds elapsed        │
│ user:{uId}:game:{pId}:complete  String   "true" or absent       │
├─────────────────────────────────────────────────────────────────┤
│ USER STATS (GLOBAL)                                             │
├─────────────────────────────────────────────────────────────────┤
│ user:{userId}:stats       Hash     {solved, bestTime, streak}   │
├─────────────────────────────────────────────────────────────────┤
│ LEADERBOARDS                                                    │
├─────────────────────────────────────────────────────────────────┤
│ leaderboard:solved        ZSet     userId → solve count         │
│ leaderboard:speed:{diff}  ZSet     `${uId}:${pId}` → time       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Reddit API

All Reddit API calls are made from server-side code only.

### Common Operations

```typescript
import { reddit, context } from '@devvit/web/server'

// Get current user
const user = await reddit.getCurrentUser()
console.log(user?.username)

// Get current subreddit
const subreddit = await reddit.getCurrentSubreddit()

// Submit a comment
await reddit.submitComment({
  postId: context.postId!,
  text: 'Great solve! 🎉'
})

// Set user flair
await reddit.setUserFlair({
  subredditName: context.subredditName!,
  username: user!.username,
  text: 'Game Master 🏆'
})
```

### Context Variables

| Variable | Type | Example | When Available |
|----------|------|---------|----------------|
| `userId` | `string` | `"t2_abc123"` | If user logged in |
| `postId` | `string` | `"t3_xyz789"` | In post context |
| `subredditId` | `string` | `"t5_2qh1o"` | Always |
| `subredditName` | `string` | `"gaming"` | Always |

---

## Code Patterns & Decision Trees

### Where to Store Data?

```text
Need to store data?
│
├─ Is it <2KB AND needed immediately on page load?
│   └─ YES → Post Data (in devvit.json splash config)
│   └─ NO ↓
│
├─ Is it user-specific?
│   └─ YES → Redis: user:{userId}:*
│   └─ NO ↓
│
├─ Is it game/post-specific?
│   └─ YES → Redis: game:{postId}:*
│   └─ NO ↓
│
└─ Global data → Redis: stats:* or config:*
```

### DO / DON'T Quick Reference

#### Client-Side

| ❌ DON'T | ✅ DO |
|----------|-------|
| `localStorage.setItem()` | `fetch('/api/save', { body: data })` |
| `fetch('https://external.com')` | Create server endpoint that fetches |
| `<style>` blocks in components | Tailwind classes |
| `export default Component` | `export { Component }` |
| `import * as icons from 'lucide'` | `import {Icon}Icon from '@lucide/svelte/icons/{icon}'` |

#### Server-Side

| ❌ DON'T | ✅ DO |
|----------|-------|
| `setInterval()` / long processes | Use scheduler for recurring tasks |
| `require('fs').writeFile()` | Use Redis or media.upload() |
| `import sharp from 'sharp'` | Use external service (Cloudinary) |
| Multiple round-trip Redis calls | Batch with `mGet`, `hGetAll` |

#### General

| ❌ DON'T | ✅ DO |
|----------|-------|
| `any` type | `unknown` then narrow |
| Magic numbers | Named constants: `const MAX_LIVES = 3` |
| `console.log` in production | Remove or use proper logging |
| Catch and rethrow same error | Handle meaningfully or let propagate |
| Nested ternaries | Early returns or switch |

---

## Style Guide

### CSS / Tailwind Theme Colors (defined in `src/client/app.css`)

```css
:root {
  --color-bg: theme(colors.white);
  --color-text: theme(colors.gray.900);
  --color-primary: theme(colors.blue.600);
  --color-cell-given: theme(colors.gray.200);
  --color-cell-empty: theme(colors.white);
  --color-cell-error: theme(colors.red.100);
}

.dark {
  --color-bg: theme(colors.gray.900);
  --color-text: theme(colors.gray.100);
  --color-primary: theme(colors.blue.400);
  --color-cell-given: theme(colors.gray.700);
  --color-cell-empty: theme(colors.gray.800);
  --color-cell-error: theme(colors.red.900);
}
```

### Mobile-First Breakpoints

```html
<!-- Mobile first (default) -->
<div class="text-sm p-2">

<!-- Then tablet -->
<div class="text-sm p-2 md:text-base md:p-4">

<!-- Then desktop -->
<div class="text-sm p-2 md:text-base md:p-4 lg:text-lg lg:p-6">
```

### Functions

```typescript
// ✅ Good: Small, single-purpose, descriptive name
const calculateScore = (time: number, mistakes: number): number => {
  const baseScore = 1000
  const timePenalty = Math.floor(time / 10)
  const mistakePenalty = mistakes * 50
  return Math.max(0, baseScore - timePenalty - mistakePenalty)
}

// ❌ Bad: Too long, multiple responsibilities, vague name
const handle = (data) => {
  // 50 lines doing validation, calculation, saving, logging...
}
```

**Target:** ≤30 lines per function

### Mobile Checklist

Before every PR, verify:

- [ ] Tested at 375px viewport width
- [ ] All touch targets ≥44px
- [ ] No horizontal scrolling
- [ ] Text readable without zooming (≥16px)
- [ ] Buttons/inputs not too close together
- [ ] Works without hover states
- [ ] Dark mode looks correct
- [ ] Loads in <3 seconds on slow 3G

---

## Development Workflow

### Why Devvit Needs a Different Workflow

| Reality | Implication |
|---------|-------------|
| Serverless runtime | No long-running processes, no WebSockets |
| Sandboxed webview | No localStorage, no external fetch from client |
| 70% mobile users | Mobile testing is mandatory, not optional |
| Reddit context required | `userId`, `postId` only exist on Reddit |
| Platform limits | 500MB Redis, 30s timeout, 4MB payload |

**Local testing catches ~80% of issues. You MUST playtest on Reddit before shipping.**

### The Devvit Development Loop

```text
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│  CHECK  │ → │  PLAN   │ → │  BUILD  │ → │  TEST   │ → │PLAYTEST │ → │  SHIP   │
└─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘
     │             │             │             │             │             │
     ▼             ▼             ▼             ▼             ▼             ▼
 Can this      Write plan    TDD: test     Local:        On Reddit:    Changelog
 work on       Get approval  then code     type-check    mobile test   Commit
 Devvit?       (3-7 bullets) Small chunks  lint, test    real device   PR
```

### Phase 1: CHECK — Can This Work on Devvit?

Before writing any code, verify the feature is possible:

| Question | If YES → Action Required |
|----------|--------------------------|
| Needs `localStorage` or `sessionStorage`? | ❌ Impossible — Must use Redis via server |
| Needs external API call from client? | ⚠️ Proxy through server endpoint |
| Needs >500MB storage? | ⚠️ Implement pagination or use external DB |
| Needs WebSockets or streaming? | ⚠️ Use Devvit Realtime (max 100 msg/sec) |
| Needs file system writes? | ⚠️ Use `media.upload()` for images |
| Needs long-running background process? | ⚠️ Use Scheduler (cron jobs) |
| Needs native Node modules (fs, sharp, ffmpeg)? | ❌ Impossible — Use external service |
| Request takes >30 seconds? | ⚠️ Break into smaller operations |
| Payload >4MB? | ⚠️ Chunk or compress data |

### Phase 2: PLAN — Write Approach, Get Approval

```markdown
## Feature: Add Difficulty Selector

### Constraints Verified
- ✅ Uses Redis hash (within 500MB limit)
- ✅ No external APIs needed
- ✅ UI fits mobile viewport

### Approach (3-5 bullets)
1. Add `DifficultySelector.svelte` component with 4 options
2. Store selected difficulty in `game:{postId}:config` hash
3. Modify `generatePuzzle()` to accept difficulty parameter
4. Update splash screen to show current difficulty

### Files to Modify
- `src/client/components/DifficultySelector.svelte` (new)
- `src/server/routes/game.ts` (add endpoint)
- `src/shared/generator.ts` (add difficulty param)
```

### Phase 3: BUILD — TDD in Small Chunks

- Write test before implementation
- Implement the smallest piece that works
- Keep functions ≤30 lines
- Commit frequently
- One logical change per commit

### Phase 4: TEST — Local Verification

```bash
bun run type-check  # TypeScript compilation
```

### Phase 5: PLAYTEST — Test on Reddit (MANDATORY)

```bash
bun run dev
# Opens: https://www.reddit.com/r/YourTestSub?playtest=your-app
```

#### Playtest Checklist

| Platform | How to Test | What to Check |
|----------|-------------|---------------|
| Desktop Web | Browser at full width | Layout, hover states, keyboard |
| Mobile Web | Browser at 375px OR phone | Touch targets, no horizontal scroll |
| Reddit iOS App | TestFlight or production | Native feel, gestures work |
| Reddit Android App | Play Store or APK | Same as iOS |

For each platform, verify:

- [ ] App loads without errors
- [ ] All interactive elements respond
- [ ] Touch targets are ≥44px
- [ ] No horizontal scrolling
- [ ] Dark mode renders correctly
- [ ] Light mode renders correctly
- [ ] Text is readable (≥16px base)
- [ ] Loads in <3 seconds
- [ ] No console errors
- [ ] Error states display properly
- [ ] Empty states display properly

#### Common Playtest Failures

| Symptom | Likely Cause |
|---------|--------------|
| "Cannot read property of undefined" | `context.userId` or `context.postId` is undefined |
| Infinite loading | Server endpoint returning wrong format |
| Works locally, fails on Reddit | Using `localStorage` or client-side fetch |
| Layout broken on mobile | Fixed widths instead of responsive |
| Buttons not responding | Touch targets too small or overlapping |

### Phase 6: SHIP — Changelog and Commit

```bash
bun run type-check
git add .
git commit -m "feat(game): add difficulty selector"
```

### Definition of Done

- [ ] TypeScript compiles (`bun run type-check`)
- [ ] Works on desktop web, mobile web, iOS app, Android app
- [ ] Works in dark mode and light mode
- [ ] Loads in <3 seconds
- [ ] No console errors
- [ ] CHANGELOG.md updated

---

## Troubleshooting

### "Redis calls failing"

```typescript
// Check key exists before using
const value = await redis.get('key')
if (value === null) {
  // Handle missing key
}

// Check for typos in key names
console.log('Key:', `user:${userId}:stats`) // Debug
```

### "Component not updating"

```svelte
<!-- Make sure you're using $state for reactive values -->
<script>
  // ❌ Won't update
  let count = 0

  // ✅ Will update
  let count = $state(0)
</script>
```

### "Type errors"

```bash
# Run type check to see all errors
bun run type-check

# Common fixes:
# 1. Add null checks: value?.property
# 2. Add type annotations: const x: Type = ...
# 3. Use type guards: if (typeof x === 'string')
```

### "API returns 400 Bad Request"

```typescript
// Check request format
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }, // Required!
  body: JSON.stringify(data) // Must be stringified!
})
```

### "Works locally but not on Reddit"

1. Check that you're not using `localStorage`
2. Check that all external fetches go through server
3. Check devvit.json has correct permissions
4. Check bundle size isn't too large

### Debug Commands

```bash
bun run type-check    # Check TypeScript errors
bun run build         # Production build
ls -la dist/          # Check bundle size
```

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

| What | Where |
|------|-------|
| Svelte component (reusable) | `src/client/components/` |
| Svelte component (page-level) | `src/client/views/` |
| Client utility | `src/client/lib/` |
| API endpoint | `src/server/routes/` (or `src/server/index.ts` if small) |
| Shared types/constants | `src/shared/` |
| Server utility | `src/server/lib/` |
