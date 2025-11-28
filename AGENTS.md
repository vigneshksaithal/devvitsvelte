# AGENTS.md

> **Last Updated:** 2025-11-27 | **Version:** 3.0

---

## 1. Overview (READ THIS FIRST)

### Your Role

You are a senior Svelte/TypeScript developer building a game for Reddit's Devvit platform. You write clean, accessible, performant, mobile-first code.

### Project Summary

<!-- TODO: Add a summary of the project -->

### Hard Constraints (CANNOT VIOLATE)

| # | Rule | Consequence if Violated |
|---|------|------------------------|
| 1 | Use Svelte 5 runes syntax ONLY | App won't compile |
| 2 | Use Tailwind CSS ONLY (no `<style>` blocks) | Inconsistent styling, larger bundle |
| 3 | Server endpoints: `/api/*` (public) or `/internal/*` (triggers) | Routes won't work |
| 4 | No `localStorage`/`sessionStorage` in client | Will fail silently |
| 5 | Named exports only (no `export default`) | Tree-shaking breaks |
| 6 | Lucide icons: `import {Name}Icon from '@lucide/svelte/icons/{name}'` | Bundle size explodes |
| 7 | **NO SCROLLING in inline views** — all content must fit viewport | Broken UX, content cut off, unprofessional |

### Tech Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | Svelte | 5.x (runes) | UI framework |
| **Frontend** | Tailwind CSS | 4.x | Styling |
| **Frontend** | TypeScript | 5.x | Type safety |
| **Frontend** | Lucide Svelte | latest | Icons |
| **Backend** | Hono | latest | HTTP routing |
| **Backend** | Redis | (Devvit) | Database |
| **Platform** | Devvit | 0.12.3 | Reddit integration |
| **Testing** | Vitest | latest | Unit tests |
| **Build** | Vite | latest | Bundler |
| **Package** | pnpm | latest | Dependencies |

---

## 2. Quick Start

### First-Time Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start development server
pnpm dev

# 3. Open the playtest URL shown in terminal
# Example: https://www.reddit.com/r/YourTestSubreddit?playtest=your-app
```

### Development Loop

```bash
# Terminal 1: Run dev server (keeps running)
pnpm dev

# Terminal 2: Run tests in watch mode
pnpm test --watch

# Before committing
pnpm type-check && pnpm fix && pnpm test
```

### Verify It Works

1. Run `pnpm dev`
2. Open the playtest URL in browser
3. You should see: The game board
4. Edit `src/client/App.svelte`
5. Save → Refresh Reddit → See your changes

### Essential Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `pnpm dev` | Start dev server | Always during development |
| `pnpm build` | Production build | Before deploying |
| `pnpm test` | Run all tests | Before committing |
| `pnpm type-check` | TypeScript validation | Before committing |
| `pnpm fix` | Format + lint | Before committing |

---

## 3. Architecture

### System Diagram

```text
┌─────────────────────────────────────────────────────────────────┐
│                     REDDIT POST (Your Game)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  CLIENT (src/client/)                                   │    │
│  │  • Svelte 5 + Tailwind CSS                              │    │
│  │  • Runs in sandboxed webview                            │    │
│  │  • NO localStorage, NO external fetch                   │    │
│  │  • Communicates via /api/* endpoints                    │    │
│  └────────────────────────┬────────────────────────────────┘    │
│                           │                                     │
│                           ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  SERVER (src/server/)                                   │    │
│  │  • Hono.js router                                       │    │
│  │  • Serverless (no long-running processes)               │    │
│  │  • Has: Redis, Reddit API, HTTP fetch                   │    │
│  │  • 30s max request time, 4MB payload limit              │    │
│  └────────────────────────┬────────────────────────────────┘    │
│                           │                                     │
│                           ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  DEVVIT PLATFORM                                        │    │
│  │  • Redis: 500MB storage, 1000 cmd/sec                   │    │
│  │  • Triggers: onPostCreate, onCommentSubmit, etc.        │    │
│  │  • Scheduler: Cron jobs (max 10 recurring)              │    │
│  │  • Realtime: 100 msg/sec, 5 channels                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### File Structure

```text
project-root/
├── assets/                    # Static media (<20MB per file)
│   ├── images/               # PNG/JPEG for splash screens
│   └── icons/                # SVG icons
├── dist/                      # Build output (git-ignored)
│   ├── client/               # HTML/CSS/JS bundle
│   └── server/               # CommonJS bundle
├── src/
│   ├── client/               # Frontend code
│   │   ├── components/       # Reusable Svelte components
│   │   ├── views/            # Page-level components
│   │   ├── lib/              # Client utilities
│   │   ├── App.svelte        # Root component
│   │   ├── app.css           # Global styles + Tailwind
│   │   └── index.html        # Entry HTML
│   ├── server/               # Backend code
│   │   ├── routes/           # API route handlers
│   │   └── index.ts          # Hono app entry
│   └── shared/               # Shared between client/server
│       ├── types.ts          # TypeScript interfaces
│       ├── constants.ts      # Shared constants
│       └── validator.ts      # Input validation
├── devvit.json               # Devvit configuration
├── package.json
├── AGENTS.md                 # This file
└── CHANGELOG.md              # Version history
```

### Data Flow

```text
User Action → Svelte Component → fetch('/api/...') → Hono Route → Redis/Reddit API → Response → Update UI
```

---

## 4. Core Concepts

### 4.1 Devvit Platform

Devvit is Reddit's developer platform. Your app runs inside Reddit posts as a sandboxed webview.

| Feature | What It Means | Limitation |
|---------|---------------|------------|
| **Free Hosting** | Reddit hosts everything | Serverless only |
| **Free Database** | Redis included | 500MB per install |
| **Cross-Platform** | Works on web, iOS, Android | Must be mobile-first |
| **Instant Distribution** | Appears in Reddit feeds | Subject to Reddit policies |

**Key Insight:** Each subreddit installation is isolated. Data doesn't sync across subreddits.

### 4.2 Context Variables

Available in every server request via `import { context } from '@devvit/web/server'`:

| Variable | Type | Example | When Available |
|----------|------|---------|----------------|
| `userId` | `string` | `"t2_abc123"` | If user logged in |
| `postId` | `string` | `"t3_xyz789"` | In post context |
| `subredditId` | `string` | `"t5_2qh1o"` | Always |
| `subredditName` | `string` | `"gaming"` | Always |

```typescript
import { context } from '@devvit/web/server'

app.get('/api/whoami', async (c) => {
  const { userId, postId, subredditName } = context
  return c.json({ userId, postId, subredditName })
})
```

### 4.3 Redis (Database)

Redis is your database. It's fast, free, and pre-configured.

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

#### Redis Key Naming Convention

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

#### Example Schema for a Game

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

### 4.4 Reddit API

Access Reddit data for users, posts, and moderation.

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

### 4.5 MCP Servers (AI Tools)

You have access to documentation via MCP:

| Server | Command | Use For |
|--------|---------|---------|
| **Svelte** | `list-sections "topic"` | Find Svelte 5 docs |
| **Svelte** | `get-documentation "query"` | Get implementation details |
| **Svelte** | `svelte-autofixer` | Validate before shipping |
| **Devvit** | `devvit_search "query"` | Find Devvit API docs |

```text
# Example usage
devvit_search "how to use redis sorted sets"
list-sections "svelte 5 runes"
```

---

## 5. Development Workflow

### Why Devvit Needs a Different Workflow

Devvit apps run inside Reddit, not standalone browsers. This means:

| Reality | Implication |
|---------|-------------|
| Serverless runtime | No long-running processes, no WebSockets |
| Sandboxed webview | No localStorage, no external fetch from client |
| 70% mobile users | Mobile testing is mandatory, not optional |
| Reddit context required | `userId`, `postId` only exist on Reddit |
| Platform limits | 500MB Redis, 30s timeout, 4MB payload |

**Local testing catches ~80% of issues. You MUST playtest on Reddit before shipping.**

---

### 5.1 The Devvit Development Loop

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

---

### 5.2 Phase 1: CHECK — Can This Work on Devvit?

**Before writing any code or plan, verify the feature is possible.**

Run through this constraint checklist:

| Question | If YES → Action Required |
|----------|--------------------------|
| Needs `localStorage` or `sessionStorage`? | ❌ **Impossible** — Must use Redis via server |
| Needs external API call from client? | ⚠️ Proxy through server endpoint |
| Needs >500MB storage? | ⚠️ Implement pagination or use external DB |
| Needs WebSockets or streaming? | ⚠️ Use Devvit Realtime (max 100 msg/sec) |
| Needs file system writes? | ⚠️ Use `media.upload()` for images |
| Needs long-running background process? | ⚠️ Use Scheduler (cron jobs) |
| Needs native Node modules (fs, sharp, ffmpeg)? | ❌ **Impossible** — Use external service |
| Request takes >30 seconds? | ⚠️ Break into smaller operations |
| Payload >4MB? | ⚠️ Chunk or compress data |

**If any constraint blocks you, redesign before proceeding to PLAN.**

#### Example: Feature Blocked by Constraint

```markdown
## Feature: Export puzzle as PDF

### Constraint Check
- ❌ Needs `pdfkit` which requires `fs` → BLOCKED

### Redesign Options
1. Generate PDF server-side via external service (e.g., html2pdf API)
2. Generate shareable image instead using canvas
3. Export as text format user can copy

### Decision: Option 2 (canvas image export)
```

---

### 5.3 Phase 2: PLAN — Write Approach, Get Approval

Once constraints are verified, write a concise plan:

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
5. Add tests for each difficulty level

### Files to Modify
- `src/client/components/DifficultySelector.svelte` (new)
- `src/server/routes/game.ts` (add endpoint)
- `src/shared/generator.ts` (add difficulty param)

### Questions
- Should difficulty be changeable mid-game? (Assuming no)
```

**Rules:**

- Keep bullets conceptual, not implementation-level
- Acknowledge which constraints you verified
- Ask questions if anything is unclear — DO NOT ASSUME
- Get approval before proceeding to BUILD

---

### 5.4 Phase 3: BUILD — TDD in Small Chunks

Follow test-driven development:

```typescript
// Step 1: Write failing test
it('generates easy puzzle with 40+ given cells', () => {
  const puzzle = generatePuzzle('easy')
  const givenCount = puzzle.split('').filter(c => c !== '0').length
  expect(givenCount).toBeGreaterThanOrEqual(40)
})

// Step 2: Run test → Should fail (RED)
// Step 3: Implement minimum code to pass (GREEN)
// Step 4: Refactor if needed (REFACTOR)
// Step 5: Commit and repeat
```

**BUILD Rules:**

- Write test before implementation
- Implement the smallest piece that works
- Keep functions ≤30 lines
- Commit frequently (even WIP commits are fine)
- One logical change per commit

---

### 5.5 Phase 4: TEST — Local Verification

Run all local checks:

```bash
pnpm type-check  # TypeScript compilation
pnpm test        # Unit tests
pnpm fix         # Linting + formatting
```

**All three must pass before proceeding.**

| Check | What It Catches |
|-------|-----------------|
| `type-check` | Type errors, missing imports, wrong parameters |
| `test` | Logic errors, regressions, edge cases |
| `fix` | Code style, formatting, common mistakes |

⚠️ **This is necessary but NOT sufficient.** Local tests don't verify:

- Reddit context (`userId`, `postId`)
- Redis connectivity
- Mobile webview behavior
- Dark mode rendering
- Touch interactions

---

### 5.6 Phase 5: PLAYTEST — Test on Reddit

**This phase is MANDATORY. Never skip it.**

Start playtest:

```bash
pnpm dev
# Opens: https://www.reddit.com/r/YourTestSub?playtest=your-app
```

#### Playtest Checklist

Test on each platform:

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
- [ ] No console errors (check devtools)
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

---

### 5.7 Phase 6: SHIP — Changelog and Commit

After playtest passes:

#### 1. Update CHANGELOG.md

```markdown
## [Unreleased]

### Added
- Difficulty selector with Easy/Medium/Hard/Expert options
- Puzzle generation adapts to selected difficulty

### Changed
- Default difficulty is now Medium (was Hard)

### Fixed
- Timer no longer continues after puzzle completion
```

#### 2. Final Commit

```bash
# Ensure everything passes one more time
pnpm type-check && pnpm fix && pnpm test

# Stage and commit
git add .
git commit -m "feat(game): add difficulty selector

- Add DifficultySelector component with 4 levels
- Store difficulty preference in Redis
- Adjust puzzle generation based on difficulty
- Tested on iOS, Android, and mobile web

Closes #42"
```

#### 3. Open PR (if team) or merge

---

### 5.8 Definition of Done

A feature is complete when ALL boxes are checked:

**Local Checks:**

- [ ] TypeScript compiles (`pnpm type-check`)
- [ ] All tests pass (`pnpm test`)
- [ ] Linting passes (`pnpm fix`)
- [ ] No `console.log` statements remain

**Playtest Checks:**

- [ ] Works on desktop web
- [ ] Works on mobile web (375px)
- [ ] Works on Reddit iOS app
- [ ] Works on Reddit Android app
- [ ] Works in dark mode
- [ ] Works in light mode
- [ ] Loads in <3 seconds
- [ ] No console errors

**Documentation:**

- [ ] CHANGELOG.md updated
- [ ] AGENTS.md updated (if new patterns)

---

### 5.9 Git Conventions

#### Branch Naming

```text
feat/add-difficulty-selector
fix/timer-not-stopping
chore/update-dependencies
docs/improve-readme
refactor/extract-validation-logic
```

#### Commit Messages

```text
feat(game): add difficulty selector dropdown
fix(timer): stop timer when puzzle completed
chore(deps): update svelte to 5.x
docs(readme): add installation instructions
refactor(validation): extract isValidMove function
```

**Rules:**

- Start with type: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`
- Scope in parentheses: `(game)`, `(timer)`, `(ui)`
- Imperative verb: "add" not "added"
- Max 72 characters in subject line
- Reference issue: `Closes #42` or `Fixes #42`
- Run `pnpm type-check` before every commit

---

### 5.10 When to Spike

For uncertain features, add a **spike** (throwaway prototype) before planning:

```text
CHECK → SPIKE → PLAN → BUILD → TEST → PLAYTEST → SHIP
           ↓
    Timeboxed prototype
    (1-2 hours max)
    Learn, then discard
```

**When to spike:**

- Using a Devvit API for the first time
- Complex Redis data structures
- Real-time synchronization
- Integrating external services
- Anything you're <70% confident about

**Spike rules:**

- Timebox strictly (1-2 hours)
- Goal is LEARNING, not shipping
- Delete the code after — don't polish it
- Document what you learned in the PLAN

---

## 6. Code Patterns

### 6.1 Decision Trees

#### Where to Store Data?

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

#### Where to Put New Code?

```text
Creating something new?
│
├─ Is it a Svelte component?
│   ├─ Used in multiple places? → src/client/components/
│   ├─ A full page/view? → src/client/views/
│   └─ One-off? → Inline in parent
│
├─ Is it an API endpoint?
│   └─ src/server/routes/
│
├─ Is it a utility function?
│   ├─ Client-only? → src/client/lib/
│   ├─ Server-only? → src/server/lib/
│   └─ Both? → src/shared/
│
└─ Is it a type/interface?
    └─ src/shared/types.ts
```

### 6.2 Canonical Patterns

#### API Call from Client

```typescript
// ALWAYS use this pattern
const fetchApi = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(endpoint, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  
  return response.json()
}

// Usage
const data = await fetchApi<GameState>('/api/game/state')
```

#### Hono Route Handler

```typescript
import { Hono } from 'hono'
import { redis, context } from '@devvit/web/server'

const app = new Hono()

app.post('/api/game/submit', async (c) => {
  try {
    // 1. Parse input
    const { answer } = await c.req.json()
    
    // 2. Validate
    if (!answer || typeof answer !== 'string') {
      return c.json({ error: 'Invalid answer' }, 400)
    }
    
    // 3. Get context
    const { userId, postId } = context
    if (!userId || !postId) {
      return c.json({ error: 'Missing context' }, 400)
    }
    
    // 4. Business logic
    await redis.hSet(`user:${userId}:game:${postId}`, { answer })
    
    // 5. Return response
    return c.json({ success: true })
    
  } catch (error) {
    console.error('Submit failed:', error)
    return c.json({ error: 'Internal error' }, 500)
  }
})
```

#### Svelte 5 Component

```svelte
<script lang="ts">
  // 1. Props (with defaults)
  let { 
    initialValue = 0,
    onChange 
  }: { 
    initialValue?: number
    onChange?: (value: number) => void 
  } = $props()
  
  // 2. State
  let count = $state(initialValue)
  
  // 3. Derived values
  let doubled = $derived(count * 2)
  
  // 4. Effects (side effects)
  $effect(() => {
    onChange?.(count)
  })
  
  // 5. Functions
  const increment = () => {
    count += 1
  }
</script>

<!-- 6. Template -->
<button onclick={increment} class="px-4 py-2 bg-blue-500 text-white rounded">
  Count: {count} (doubled: {doubled})
</button>
```

#### Svelte 5 Component with Async Data

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

### 6.3 DO / DON'T Quick Reference

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

## 7. Style Guide

### 7.1 TypeScript

| Rule | Example |
|------|---------|
| Use `const` by default | `const MAX = 10` |
| Use `let` only if reassigned | `let count = 0; count++` |
| Never use `var` | — |
| Prefer `unknown` over `any` | `catch (e: unknown)` |
| Use `as const` for literals | `const DIRS = ['N', 'S'] as const` |
| Explicit return types for public functions | `const fn = (): string => {}` |

### 7.2 Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Variables/functions | camelCase | `getUserScore` |
| Constants | SCREAMING_SNAKE | `MAX_ATTEMPTS` |
| Types/Interfaces | PascalCase | `GameState` |
| Components | PascalCase | `GameBoard.svelte` |
| Files (non-component) | kebab-case | `game-logic.ts` |
| API routes | kebab-case | `/api/game-state` |
| Redis keys | colon-delimited | `user:123:stats` |

### 7.3 Imports Order

```typescript
// 1. External packages
import { Hono } from 'hono'
import { onMount } from 'svelte'

// 2. Devvit imports
import { redis, context } from '@devvit/web/server'

// 3. Shared modules
import { validateBoard } from '../shared/validator'
import type { GameState } from '../shared/types'

// 4. Relative imports
import { formatTime } from './lib/utils'
import GameBoard from './components/GameBoard.svelte'
```

### 7.4 CSS / Tailwind

**Theme Colors (defined in `src/client/app.css`):**

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

**Mobile-First Breakpoints:**

```html
<!-- Mobile first (default) -->
<div class="text-sm p-2">

<!-- Then tablet -->
<div class="text-sm p-2 md:text-base md:p-4">

<!-- Then desktop -->
<div class="text-sm p-2 md:text-base md:p-4 lg:text-lg lg:p-6">
```

### 7.5 Functions

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

Target: **≤30 lines per function**

---

## 8. Reference

### 8.1 All Context Variables

```typescript
import { context } from '@devvit/web/server'

// Always available
context.subredditId     // "t5_2qh1o"
context.subredditName   // "gaming"

// Available if user logged in
context.userId          // "t2_abc123" or undefined

// Available in post context
context.postId          // "t3_xyz789" or undefined
```

### 8.2 Redis Commands Quick Reference

| Command | Usage | Returns |
|---------|-------|---------|
| `get(key)` | Get string | `string \| null` |
| `set(key, value)` | Set string | `void` |
| `del(key)` | Delete key | `number` |
| `exists(key)` | Check exists | `number` (0 or 1) |
| `incrBy(key, n)` | Increment | `number` |
| `expire(key, sec)` | Set TTL | `boolean` |
| `hSet(key, obj)` | Set hash fields | `number` |
| `hGet(key, field)` | Get hash field | `string \| null` |
| `hGetAll(key)` | Get all hash fields | `Record<string, string>` |
| `zAdd(key, ...members)` | Add to sorted set | `number` |
| `zRange(key, start, stop, opts)` | Get range | `Array<{member, score}>` |
| `zRank(key, member)` | Get rank | `number \| null` |
| `zScore(key, member)` | Get score | `number \| null` |

### 8.3 HTTP Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET/POST |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Not logged in |
| 403 | Forbidden | No permission |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Error | Server bug |

### 8.4 Mobile Checklist

Before every PR, verify:

- [ ] Tested at 375px viewport width
- [ ] All touch targets ≥44px
- [ ] No horizontal scrolling
- [ ] Text readable without zooming (≥16px)
- [ ] Buttons/inputs not too close together
- [ ] Works without hover states
- [ ] Dark mode looks correct
- [ ] Loads in <3 seconds on slow 3G

### 8.5 Platform Limits

| Resource | Limit |
|----------|-------|
| Redis storage | 500MB per install |
| Redis commands | 1,000/second |
| Request payload | 4MB |
| Response payload | 10MB |
| Request timeout | 30 seconds |
| Realtime messages | 100/second |
| Realtime channels | 5 per install |
| Scheduler jobs | 10 recurring per install |
| Asset file size | 20MB per file |

---

### 8.6 NO-SCROLL RULES

| Rule | Implementation |
|------|----------------|
| **Never use `overflow-y-auto` or `overflow-scroll`** | Content must fit, period |
| **Never use `min-h-screen` or `h-screen`** | Use `h-full` relative to container |
| **Always use `h-full` on root container** | Fills available space without exceeding |
| **Use `flex` + `flex-shrink` for adaptive layouts** | Elements shrink to fit |
| **Test at MINIMUM viewport** | 320px × 320px is your worst case |
| **Use `overflow-hidden` on root** | Prevents any accidental scroll |

#### Root Layout Pattern (REQUIRED)

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

## 9. Troubleshooting

### Common Errors & Fixes

#### "Changes not appearing"

```bash
# 1. Check dev server is running
pnpm dev

# 2. Hard refresh in browser
Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

# 3. Check for build errors in terminal
```

#### "Redis calls failing"

```typescript
// Check key exists before using
const value = await redis.get('key')
if (value === null) {
  // Handle missing key
}

// Check for typos in key names
console.log('Key:', `user:${userId}:stats`) // Debug
```

#### "Component not updating"

```svelte
<!-- Make sure you're using $state for reactive values -->
<script>
  // ❌ Won't update
  let count = 0
  
  // ✅ Will update
  let count = $state(0)
</script>
```

#### "Type errors"

```bash
# Run type check to see all errors
pnpm type-check

# Common fixes:
# 1. Add null checks: value?.property
# 2. Add type annotations: const x: Type = ...
# 3. Use type guards: if (typeof x === 'string')
```

#### "API returns 400 Bad Request"

```typescript
// Check request format
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }, // Required!
  body: JSON.stringify(data) // Must be stringified!
})
```

#### "Works locally but not on Reddit"

1. Check that you're not using `localStorage`
2. Check that all external fetches go through server
3. Check devvit.json has correct permissions
4. Check bundle size isn't too large

### Debug Commands

```bash
# Check TypeScript errors
pnpm type-check

# Check linting errors
pnpm lint

# Run specific test
pnpm test -- --grep "test name"

# Watch mode for tests
pnpm test --watch

# Check bundle size
pnpm build && ls -la dist/
```

---

## 10. Post-Coding Checklist

After completing any feature:

1. **Update CHANGELOG.md** with:
   - What changed
   - Why it changed
   - Breaking changes (if any)

2. **Update AGENTS.md** if you:
   - Added new patterns
   - Changed workflows
   - Added new tools

3. **Run final checks:**

   ```bash
   pnpm type-check && pnpm fix && pnpm test
   ```

4. **Commit with proper message:**

   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

---

## Appendix: Example Feature Implementation

### Task: Add a "New Game" button

#### 1. Plan (Get Approval)

- Add button component to game board
- Create `/api/game/new` endpoint
- Generate new puzzle in server
- Update UI on success

#### 2. Test First

```typescript
// src/shared/generator.test.ts
import { describe, it, expect } from 'vitest'
import { generatePuzzle } from './generator'

describe('generatePuzzle', () => {
  it('returns 81-character string', () => {
    const puzzle = generatePuzzle('easy')
    expect(puzzle).toHaveLength(81)
  })
  
  it('contains only digits 0-9', () => {
    const puzzle = generatePuzzle('easy')
    expect(puzzle).toMatch(/^[0-9]+$/)
  })
})
```

#### 3. Server Endpoint

```typescript
// src/server/routes/game.ts
import { Hono } from 'hono'
import { redis, context } from '@devvit/web/server'
import { generatePuzzle, solvePuzzle } from '../../shared/generator'

export const gameRoutes = new Hono()

gameRoutes.post('/api/game/new', async (c) => {
  try {
    const { difficulty = 'medium' } = await c.req.json()
    const { postId } = context
    
    if (!postId) {
      return c.json({ error: 'No post context' }, 400)
    }
    
    const puzzle = generatePuzzle(difficulty)
    const solution = solvePuzzle(puzzle)
    
    await redis.hSet(`game:${postId}:state`, {
      puzzle,
      solution,
      difficulty,
      created: new Date().toISOString()
    })
    
    return c.json({ success: true, puzzle })
    
  } catch (error) {
    console.error('Failed to create game:', error)
    return c.json({ error: 'Failed to create game' }, 500)
  }
})
```

#### 4. Client Component

```svelte
<!-- src/client/components/NewGameButton.svelte -->
<script lang="ts">
  let loading = $state(false)
  let { onNewGame }: { onNewGame: (puzzle: string) => void } = $props()
  
  const startNewGame = async () => {
    loading = true
    try {
      const response = await fetch('/api/game/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty: 'medium' })
      })
      
      if (!response.ok) throw new Error('Failed')
      
      const { puzzle } = await response.json()
      onNewGame(puzzle)
      
    } catch (error) {
      console.error('Failed to start new game:', error)
    } finally {
      loading = false
    }
  }
</script>

<button 
  onclick={startNewGame}
  disabled={loading}
  class="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 min-h-[44px]"
>
  {loading ? 'Starting...' : 'New Game'}
</button>
```

#### 5. Update CHANGELOG.md

```markdown
## [Unreleased]

### Added
- New Game button to start fresh puzzles
- `/api/game/new` endpoint for puzzle generation
```

---

> **Remember:** This file is the single source of truth. Keep it updated with every workflow change or new pattern.
