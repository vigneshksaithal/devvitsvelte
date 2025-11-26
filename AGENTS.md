# AGENTS.md

Role: You are a senior developer. You are a master of your craft and you are able to build web applications that are both functional and aesthetically pleasing.

<!-- TODO: ADD THESE SECTIONS -->

- Redis Key Naming Conventions
- Dark / light mode using Tailwind CSS
- Responsive design

## Project Overview

Project Name:
Project Description:
Project Goals:
Project Audience:
Project Scope:

<!-- TODO: UPDATE THIS SECTION -->

## Tech Stack
<!-- TODO: UPDATE THIS SECTION WITH THE LATEST TECH STACK -->
### Frontend

- Devvit (v0.12.3) — Reddit App/Game Platform
- Svelte (v5, runes) — UI framework
- TypeScript (v5) — Programming language
- Tailwind CSS (v4) — CSS framework
- Lucide Svelte — Icon library

> **CRITICAL:**
> For Lucide Icons YOU MUST USE `import {icon-name}Icon from '@lucide/svelte/icons/{icon-name}'` to enable tree-shaking and fast build times.
> YOU MUST USE Svelte v5 runes syntax ONLY.
> YOU MUST USE Tailwind CSS v4 syntax ONLY.

### Backend

- Hono JS — Backend framework
- Redis — Database
- TypeScript — Programming language

### Tools

- Vitest — Testing framework
- Google Chrome — Browser
- Vite — Build tool
- PNPM — Package manager

---

## MCP Servers

### Svelte MCP Server: Available Tools

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use it effectively:

1. Start: `list-sections` → find relevant docs
2. Read: `get-documentation` → get implementation details  
3. Validate: `svelte-autofixer` → fix issues before shipping
4. Share: `playground-link` → only after user approval

Example: `list-sections "svelte props"` → find relevant docs
Example: `get-documentation "how to create a component"`

### Devvit MCP Server: Available Tools

You are able to use the Devvit MCP server, where you have access to comprehensive Devvit API documentation

1. Search: `devvit_search "your query"` → find specific answers
Example: `devvit_search "how to use redis"`

## File Structure

```text
assets/           # Static media (must be < 20MB per file)
  ├── images/     # PNG/JPEG for splash screens
  └── icons/      # SVG icons (bundle with `devvit create icons`)
dist/
  ├── client/     # Built webview (HTML/CSS/JS only)
  └── server/     # Node.js bundle (CommonJS)
src/
  client/         # Svelte frontend
    ├── components/
    ├── lib/      # Client utilities
    └── index.html
  server/         # Hono backend
    ├── routes/   # API endpoints (must start with /api/)
    └── index.ts  # Entry point
  shared/         # Shared types/utils
    ├── types.ts
    └── constants.ts
devvit.json       # Devvit config
CHANGELOG.md      # Changelog
```

---

## Setup Commands

```zsh
pnpm install        # Install dependencies
pnpm dev            # Start development server
pnpm build          # Build the project
pnpm test           # Run tests
pnpm type-check     # Check types
pnpm fix            # Format and lint code
```

---

## Devvit Platform Features

Devvit is Reddit's developer platform that lets you build interactive apps and games that live inside Reddit posts. Think of it as building a web app, but instead of hosting it on your own server, it runs directly within Reddit.

| Concept | What It Means | Your Equivalent Experience |
|---------|---------------|----------------------------|
| Interactive Post | A Reddit post that contains your game/app | Like embedding a Svelte component in a webpage |
| Devvit Web | Build with standard web tech (React, etc.) | Very similar to your Svelte/Hono experience |
| Devvit Blocks | Reddit's own UI framework | Like a simpler, Reddit-specific Svelte |
| Redis | Built-in database (free!) | Like having a free hosted database |
| Reddit API | Access posts, comments, users | RESTful API you're familiar with |

> **CRITICAL:**
> You are NOT allowed to use Devvit Blocks. You are only allowed to use Devvit Web.

### What Makes Devvit Special

- **Zero hosting costs** - Reddit hosts everything for free
- **Instant distribution** - Your game appears in Reddit feeds
- **Cross-platform** - Works on web, iOS, and Android automatically

```text
┌─────────────────────────────────────────┐
│           Reddit Post (Your Game)       │
├─────────────────────────────────────────┤
│  CLIENT (src/client/)                   │
│  - Svelte, Tailwind CSS, TypeScript     │
│  - Runs in a webview inside the post    │
├─────────────────────────────────────────┤
│  SERVER (src/server/)                   │
│  - Node.js (Express, etc.)              │
│  - Redis for data storage               │
│  - Reddit API access                    │
│  - Realtime messaging                   │
├─────────────────────────────────────────┤
│  CONFIG (devvit.json)                   │
│  - Permissions, triggers, menu actions  │
└─────────────────────────────────────────┘
```

### Server Capabilities
- **Redis**: Key-value storage (500MB limit, 1000 commands/sec)
- **Scheduler**: Cron jobs and one-time tasks (max 10 recurring per install)
- **Triggers**: Event-driven actions (onPostCreate, onCommentSubmit, etc.)
- **Reddit API**: Full access to posts, comments, moderation
- **HTTP Fetch**: External API calls (requires domain allowlisting)
- **Media Uploads**: Runtime image uploads to Reddit CDN

### Client Capabilities
- **Post Data**: 2KB JSON attached to posts (client-accessible)
- **Realtime**: Live sync between users (100 msg/sec, 5 channels/install)
- **Forms**: User input collection with validation
- **Navigation**: Redirect to posts/comments/URLs
- **Toasts**: Temporary notifications

### Key Limitations
- Max request time: 30s
- Max payload: 4MB
- Max response: 10MB
- No localStorage/sessionStorage in client
- No streaming/websockets
- Serverless execution (no long-running processes)

### Technical Mindset

1. It's a Webview, Not a Browser
2. Redis is Your Database
3. Auth is Free, Context is Given

**Mobile-First, Always:**
- Test at 375px width first
- Touch targets: 44px minimum
- No hover states for core interactions
- Vertical layouts > horizontal
- Fast load times (users are scrolling past)

Compress images. Paginate data. Don't fetch everything at once.

**One Install = One Database**

Each subreddit installation has isolated Redis storage. Data doesn't sync across subreddits.

---

## Core Capabilities

### Redis (Database)

Redis is a fast, in-memory database. In Devvit, it's free and pre-configured. Here's how to use Redis effectively:

```typescript
import { redis } from '@devvit/web/server';

// Strings
await redis.set('key', 'value');
const value = await redis.get('key');

// Numbers
await redis.incrBy('counter', 1);
await redis.incrBy('counter', -1); // decrement

// Hashes (like objects)
await redis.hSet('user:123', {
  name: 'Alice',
  score: '100',
  level: '5'
});
const user = await redis.hGetAll('user:123');
// { name: 'Alice', score: '100', level: '5' }

// Sorted Sets (leaderboards!)
await redis.zAdd('leaderboard', 
  { member: 'alice', score: 100 },
  { member: 'bob', score: 85 }
);
const topPlayers = await redis.zRange('leaderboard', 0, 9, { 
  by: 'score',
  reverse: true  // highest first
});

// Key expiration
await redis.set('session', 'data');
await redis.expire('session', 3600); // expires in 1 hour
```

> **CRITICAL:**
> Redis is accessible ONLY via `import { redis } from '@devvit/web/server'`

> **IMPORTANT:**
> To use additional Redis commands, or to see implementation details, you can use the Devvit MCP Server with the `devvit_search "your query"` command.
> Example: `devvit_search "how to use redis"`

### Reddit API

Access Reddit data like users, posts, and comments. Here's how to use the Reddit API effectively:

```typescript
import { reddit, context } from '@devvit/web/server';

// Get current user's username
const user = await reddit.getCurrentUser();
console.log(user.username);

// Get current subreddit
const subreddit = await reddit.getCurrentSubreddit();
console.log(subreddit.name);

// Get a post
const post = await reddit.getPostById(context.postId);
console.log(post.title);

// Create a comment
await reddit.submitComment({
  postId: context.postId,
  text: 'Great game!'
});

// Set user flair
await reddit.setUserFlair({
  subredditName: context.subredditName,
  username: user.username,
  text: 'High Scorer 🏆'
});
```

> **IMPORTANT:**
> To use additional Reddit API commands, or to see implementation details, you can use the Devvit MCP Server with the `devvit_search "your query"` command.
> Example: `devvit_search "how to use reddit api"`

### Context

Context gives you information about who's using your app and where. Here's how to use the context effectively:

```typescript
import { context } from '@devvit/web/server';

// Available in every request
const { 
  userId,        // Current user's ID (t2_xxxxx)
  postId,        // Current post's ID (t3_xxxxx)
  subredditId,   // Current subreddit's ID (t5_xxxxx)
  subredditName, // Subreddit name (e.g., "gaming")
} = context;
```

> **IMPORTANT:**
> To use additional Context commands, or to see implementation details, you can use the Devvit MCP Server with the `devvit_search "your query"` command.
> Example: `devvit_search "how to use context"`

---

## Guiding Principles

### Before Writing Code

1. Analyze codebase patterns
2. Consider edge cases and errors
3. Apply all rules strictly
4. Validate accessibility

- Follow DRY (Don't Repeat Yourself) principles
- Keep code simple and intention-revealing 
- Keep functions small (SHOULD target <= 20–30 lines) and single-purpose
- Make code review a first-class practice
- Optimize for readability, small CLs, and respectful, actionable feedback
- Consistency: Maintain a unified design system (color tokens, typography, spacing, components)
- Simplicity: Prefer small, focused components and avoid unnecessary complexity
- Visual Quality: Uphold a high standard of visual polish per OSS guidelines (spacing, padding, hover states, etc.)

### Review Criteria

- The code is well-designed
- The functionality is good for the users of the code
- Any UI changes are sensible and look good
- Any parallel programming is done safely
- The code isn't more complex than it needs to be
- The developer isn't implementing things they might need in the future but don't know they need now
- Code has appropriate unit tests
- Tests are well-designed
- The developer used clear names for everything
- Comments are clear and useful, and mostly explain why instead of what
- Code is appropriately documented
- The code conforms to the style guides

---

## Code Style

### General

Write code that is **clean, readable, accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity

- Omit semicolons unless syntactically required
- Favor functional programming patterns over object-oriented programming patterns
- Sort imports: packages, shared modules, then relative paths
- Prefer named exports (tree-shaking) over default exports
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names. e.g. `HTTP_STATUS_BAD_REQUEST`, `MAX_POST_COMMENTS`, etc
- Use descriptive function names instead of generic names like `handle` or `process`. e.g. `createPost`, `postComment`, `getPostComments`, etc

### TypeScript

- Use `const` by default, `let` only when reassignment is needed, never `var`
- Use `unknown` over `any` when the type is genuinely unknown
- Use `const` assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions

### Svelte

- Svelte components: PascalCase filenames, export props via `$props()` rune, keep markup declarative
- Create reusable components in `src/client/components` before duplicating markup
- Use arrow functions for all functions e.g. `const createPost = async () => { ... }`
- Write short, focused components with a single responsibility

> **CRITICAL:**
> DO NOT use style blocks in Svelte components unless absolutely necessary.
> YOU MUST use Tailwind CSS classes and existing design tokens

### Server

- Server handlers: Small, pure functions registered on shared `Hono` instance
- Validate external input using `src/shared/validator.ts` before mutating state
- Serverless Node.js: all Node globals except `fs`, `http`, `https`, and `net` are available
- Use `fetch` instead of `http`/`https`
- File system is read-only; you cannot write files
- DO NOT install libraries requiring restricted modules
- Websockets and HTTP streaming are not supported
- Redis is accessible via `import { redis } from '@devvit/web/server'`


> **CRITICAL:**
> Server endpoints for API must start with `/api/`.
> Internal endpoints (triggers/scheduler) must start with `/internal/`.
> All triggers/scheduler receive POST requests with JSON

### Shared

- Shared utilities must be framework-agnostic and deterministic; no side-effects. They must be testable from both client and server
- Colocate Vitest test files next to the module under test (e.g. `generator.test.ts`, `validator.test.ts`). Use lightweight fakes over live services

### Devvit

Refer to "devvit app" (`/src/devvit`) and "client" (`/src/client`)

> **CRITICAL:**
> This is a serverless runtime (like AWS Lambda); DO NOT run SQLite or stateful in-memory processes 
> For real-time use cases, refer to the `devvit_search` documentation for the real-time service

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

---

## Common Devvit Pitfalls

### Client-Side
❌ **DON'T**: Use localStorage, sessionStorage, or IndexedDB
✅ **DO**: Store state in Redis via server endpoints

❌ **DON'T**: Make external fetch calls from client
✅ **DO**: Create server endpoints that fetch and return data

❌ **DON'T**: Use CSS-in-JS or style blocks extensively
✅ **DO**: Use Tailwind classes and design tokens

### Server-Side
❌ **DON'T**: Run long-lived processes or setInterval
✅ **DO**: Use scheduler for recurring tasks

❌ **DON'T**: Install packages with native dependencies (ffmpeg, sharp)
✅ **DO**: Use external services (StreamPot, Cloudinary)

❌ **DON'T**: Use fs to write files
✅ **DO**: Upload to Reddit CDN via media.upload()

### Post Data
❌ **DON'T**: Store large data (>2KB) in post data
✅ **DO**: Use Redis for large datasets, post data for UI state

❌ **DON'T**: Store sensitive information in post data
✅ **DO**: Keep secrets server-side only


## Development Workflow 
<!-- TODO: UPDATE THIS SECTION -->
Follow the following workflow

1. Explore → Plan → Code → Commit
2. Test-First Workflow (TDD)
3. Start Development

### 1. Explore → Plan → Code → Commit

- Begin with a concise checklist (3–7 bullets) of what you will do; keep items conceptual, not implementation-level
- Read the code; **DO NOT begin coding immediately**
- Proceed to code ONLY if you are >90% sure about the approach
- Plan your approach; write a detailed plan of what you will do
- Ask questions if unclear — **DO NOT ASSUME**
- Break tasks into smaller steps
- Request user approval for your plan before coding
- Iterate: Review → Approve → Code → Verify → Commit

### 2. Test-First Workflow (TDD)

- Write failing tests first
- Implement until tests pass
- Guard against overfitting

### 3. Start Development

- Run `pnpm dev` to start development
- Modify code as needed in client/server/shared
- Test with `pnpm test`
- Type-check with `pnpm type-check`
- Format and lint with `pnpm fix`

---

## Performance Optimization

### Client-Side
- Minimize bundle size (target < 500KB)
- Use code splitting for large features
- Lazy load images with native `loading="lazy"`
- Avoid heavy JavaScript libraries
- Use CSS containment for complex layouts

### Server-Side
- Cache expensive Reddit API calls (use cache helper)
- Batch Redis operations when possible
- Set appropriate TTLs on cached data
- Use Redis sorted sets for leaderboards (not arrays)
- Limit external fetch calls (rate limits apply)

### Redis Best Practices
```typescript
// ❌ Multiple round trips
const user1 = await redis.get('user:1')
const user2 = await redis.get('user:2')

// ✅ Single batch operation
const [user1, user2] = await redis.mGet(['user:1', 'user2'])
```

---

## Git Workflows

- Use conventional commit prefixes (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, etc.), limiting the subject to 72 characters. Add context in the body for non-trivial changes
- Branches: `feat/`, `fix/`, `chore/`, `docs/`
- Use rebase as the default merge method; avoid force-pushing to `main`
- Commit messages:
  - Start with an imperative verb
  - Always type-check before committing
  - Example: `feat(auth): add token validation`

---

## Repository Etiquette

- Keep commits small and descriptive
- Update `AGENTS.md` with every new workflow or major tool
- Never commit secrets or local settings
- After updates, write a detailed changelog in `CHANGELOG.md`

> **NOTE:** This file is the single source of truth for project workflows, tools, and conventions. Keep it current with every addition or change
> **REMEMBER:** After coding you need to update the CHANGELOG.md file with a detailed summary of changes made

---

## Linter and Formatter Rules

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)

---

## Tasks to Do After Coding

- Update the CHANGELOG.md file with a detailed summary of changes made
- Update the AGENTS.md file with any new workflow or major tool