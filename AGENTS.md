# AGENTS.md

## Project Overview

<!-- TODO: UPDATE THIS SECTION -->

## Tech Stack
<!-- TODO: UPDATE THIS SECTION WITH THE LATEST TECH STACK -->
### Frontend

- Devvit (v0.12.3) — Reddit App Platform
- Svelte (v5, runes) — UI framework
- TypeScript (v5) — Programming language
- Tailwind CSS (v4) — CSS framework
- Lucide Svelte — Icon library

> **IMPORTANT NOTE:**
> For Lucide Icons use `import {icon-name}Icon from '@lucide/svelte/icons/{icon-name}'` to enable tree-shaking and fast build times
> Use Svelte v5 runes syntax ONLY
> Use Tailwind CSS v4 syntax ONLY

### Backend

- Hono JS — Backend framework
- Redis — Database
- TypeScript — Programming language

> **IMPORTANT NOTE:**
> Redis is accessible via `import { redis } from '@devvit/web/server'`

### Tools

- Vitest — Testing framework
- Google Chrome — Browser
- Vite — Build tool
- PNPM — Package manager

---

## Devvit Platform Features

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

## App Specific Rules

- You are supposed to write code for dark and light mode
- You are supposed to write code for both desktop and mobile

## MCP Servers

### Svelte MCP Server: Available Tools

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use it effectively

1. Start: `list-sections` → find relevant docs
2. Read: `get-documentation` → get implementation details  
3. Validate: `svelte-autofixer` → fix issues before shipping
4. Share: `playground-link` → only after user approval

### Devvit MCP Server: Available Tools

You are able to use the Devvit MCP server, where you have access to comprehensive Devvit API documentation

1. Search: `devvit_search "your query"` → find specific answers

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

## Guiding Principles

### Before Writing Code

1. Analyze codebase patterns
2. Consider edge cases and errors
3. Apply all rules strictly
4. Validate accessibility

- Follow DRY (Don't Repeat Yourself) principles
- Keep code simple and intention-revealing 
- Keep functions small (SHOULD target <= 20–30 lines) and single-purpose
- Make code review a first-class practice. Optimize for readability, small CLs, and respectful, actionable feedback
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

> **IMPORTANT:**
> DO NOT use style blocks in Svelte components unless absolutely necessary
> Use Tailwind CSS classes and existing design tokens

### Server

- Server handlers: Small, pure functions registered on shared `Hono` instance
- Validate external input using `src/shared/validator.ts` before mutating state
- Serverless Node.js: all Node globals except `fs`, `http`, `https`, and `net` are available
- Use `fetch` instead of `http`/`https`
- File system is read-only; you cannot write files
- Do not install libraries requiring restricted modules
- Websockets and HTTP streaming are not supported
- Redis is accessible via `import { redis } from '@devvit/web/server'`


> **IMPORTANT:**
> Server endpoints for API must start with `/api/`
> Internal endpoints (triggers/scheduler) must start with `/internal/`
> All triggers/scheduler receive POST requests with JSON

### Shared

- Shared utilities must be framework-agnostic and deterministic; no side-effects. They must be testable from both client and server
- Colocate Vitest test files next to the module under test (e.g. `generator.test.ts`, `validator.test.ts`). Use lightweight fakes over live services

### Devvit

Refer to "devvit app" (`/src/devvit`) and "client" (`/src/client`)

> **IMPORTANT:**
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

## Git Workflows

- Use conventional commit prefixes (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, etc.), limiting the subject to 72 characters. Add context in the body for non-trivial changes
- Branches: `feat/`, `fix/`, `chore/`, `docs/`
- Use rebase as the default merge method; avoid force-pushing to `main`
- Commit messages:
  - Start with an imperative verb
  - Always type-check before committing
  - Example: `feat(auth): add token validation`

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

## Tasks to Do After Coding

- Update the CHANGELOG.md file with a detailed summary of changes made
- Update the AGENTS.md file with any new workflow or major tool