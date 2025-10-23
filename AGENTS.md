# AGENTS.md

## Project Overview

<!-- ! Update this  -->

--------

**Begin with a concise checklist (3-7 bullets) of the sub-tasks you will perform before making substantial changes. This ensures a well-structured, multi-step workflow.**

## Tech Stack

### Frontend

- [Devvit](https://developers.reddit.com/docs/) (v0.12.1): Reddit App Platform
- [Svelte](https://svelte.dev/) (v5, runes): UI library
- [TypeScript](https://www.typescriptlang.org/): Programming language
- [Tailwind CSS](https://tailwindcss.com/) (v4): CSS framework

### Backend

- [Hono JS](https://hono.dev/): Backend framework
- [Redis](https://redis.io/): Database
- [TypeScript](https://www.typescriptlang.org/): Programming language

### Testing

- [Vitest](https://vitest.dev/): Testing framework
- [Google Chrome](https://www.google.com/chrome/): Browser

### Tools

- [Vite](https://vite.dev/): Build tool
- [pnpm](https://pnpm.io/): Package manager
- [Biome JS](https://biomejs.dev): Linter and formatter
- [Ultracite](https://www.ultracite.ai): Linter and formatter

> **IMPORTANT NOTE:**
>
> - Use Svelte v5 runes syntax ONLY.
> - Use Tailwind CSS v4 syntax ONLY.
> - Devvit documentation is available at `/docs/devvit-docs.txt`.

---

## File Structure

```text
assets/           // Public assets (images, sprites, audio, fonts)
docs/             // Project and Devvit documentation
dist/             // Build output
src/
  client/         // Svelte frontend. Use `fetch(/my/api/endpoint)` for server access and persistence via APIs written in /src/server.
    components/   // Reusable Svelte components
    index.html    // Entry point
  server/         // External API service (Hono). Serverless backend (Node.js). Access Redis and persist data here.
  shared/         // Shared code/assets for Devvit app, client, server, and webview. Good for shared types.
devvit.json       // Devvit config file
```

---

## Guiding Principles

- **Clarity & Reuse:** Components and pages must be modular and reusable—factor out repeated UI into components.
- **Consistency:** UI must use a unified design system: colors, typography, spacing, and components should be consistent.
- **Simplicity:** Prefer small, focused components; avoid complexity in both styling and logic.
- **Demo-Oriented:** Structure supports fast prototyping and demos—including streaming, multi-turn conversations, tool integrations.
- **Visual Quality:** Follow high visual quality standards (spacing, padding, hover states, etc. per OSS guidelines).

---

## Setup Commands

```zsh
pnpm install        # Install dependencies
pnpm dev            # Start the dev server
pnpm build          # Build the project
pnpm test           # Run tests
pnpm type-check     # Check types
pnpm fix            # Format and lint code
```

---

## Code Style

### General

- Use strict TypeScript and ES modules.
- Omit semicolons unless necessary.
- Favor functional programming patterns and arrow functions.
- Sort imports by: package, shared modules, then relative paths.
- Prefer named exports for tree-shaking; avoid default exports.

### Svelte

- Component filenames in PascalCase.
- Export props via `$props()` rune and keep markup declarative.
- Use Tailwind utility classes and design tokens.
- Create in `src/client/components` before duplicating markup.

### Server

- Handlers should be pure, small functions registered on shared `Hono` instance.
- Validate external input using `src/shared/validator.ts` before state mutation.
- This is a serverless Node.js environment: all Node globals except `fs`, `http`, `https`, and `net` available.
- Prefer `fetch` over `http`/`https`.
- No file writes (read-only FS); don't install libraries that require such access.
- No WebSockets or HTTP streaming support.
- Use `import { redis } from '@devvit/web/server'` for Redis access.

### Shared

- Keep utilities framework-agnostic and deterministic (side-effect free).
- Colocate Vitest files as `*.test.ts` next to their modules (e.g., `streak.test.ts`). Use lightweight fakes, not live services.

### Devvit

- The "devvit app" refers to `/src/devvit`; the "client" to `/src/client`.
- **Important:** This is a serverless runtime (like AWS Lambda); do not use SQLite or stateful in-memory processes. For real-time, check docs via `devvit_search`.

---

## Development Workflow

### 1. Explore → Plan → Code → Commit

- Read code before coding.
- Plan thoughtfully.
- Ask questions if unclear—don't assume.
- Break tasks into steps.
- Get user approval for plans before coding.
- Review, approve, code, verify, and commit.

### 2. Test-First Workflow (TDD)

- Write failing tests first.
- Implement until passing.
- Avoid overfitting.

### 3. Start Development

- Launch dev server with `pnpm dev`.
- Make required client/server/shared changes.
- Run tests: `pnpm test`.
- Check types: `pnpm type-check`.
- Format/lint: `pnpm fix`.

---

## Git Workflows

- Use conventional commit prefixes (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, etc.), ≤72-character subjects, and include context as needed.
- Branches: `feat/`, `fix/`, `chore/`, `docs/`
- Rebase as default merge method.
- No force-pushes to main.
- Commit messages start with imperative verbs.
- Example: `feat(auth): add token validation`
- Always type-check before committing.

## Repository Etiquette

- Make commits small and descriptive.
- Update AGENTS.md with any new workflow or major tool.
- Never commit secrets or local settings.
- After updates, write detailed changelog entries in CHANGELOG.md.

> **REMEMBER:** This file is the authoritative source for all workflows, tools, and conventions. Keep it current with all changes.

---

**After each major action (such as a code edit or tool invocation), validate the result in 1-2 lines and either proceed or self-correct if expectations are not met.**

## Ultracite Configuration

### Project Context

Ultracite enforces strict type safety, accessibility standards, and code quality for JavaScript/TypeScript projects, using Biome’s formatter/linter.

### Key Principles

- Zero config
- Subsecond speed
- Maximum type safety
- AI-friendly code generation

### Before Coding

1. Review existing code patterns.
2. Consider edge/error cases.
3. Strictly follow rules below.
4. Validate accessibility requirements.

### Rules

#### Accessibility (a11y)

- Do not use `accessKey` on HTML elements.
- Never set `aria-hidden="true"` on focusable elements.
- Don't add ARIA roles/states to unsupported elements.
- Never use `<marquee>` or `<blink>`.
- Only apply `scope` to `<th>` elements.
- Avoid non-interactive ARIA roles on interactive elements and vice versa.
- Label elements must have text and be linked to an input.
- No `tabIndex` except on appropriate elements and never positive integers.
- Avoid "image", "picture" or "photo" in img alt attributes.
- No redundant explicit ARIA roles.
- Static elements with click handlers need valid role attributes.
- SVGs must have a `title`.
- Alt text must be meaningful for screen readers.
- Anchor content must be screen reader accessible and navigable.
- All required ARIA state/attributes must be valid and present.
- Button elements require `type` attributes.
- Interactive roles: ensure focusable.
- Heading elements require visible content (not hidden).
- Root `<html>` tag must have a `lang` attribute.
- Iframes must include a `title`.
- Link mouse/keyboard events for accessibility.
- Media elements must include caption tracks.
- Prefer semantics over roles.
- Use valid ARIA roles/state/values exclusively.
- Validate `autocomplete` on inputs and `lang` codes.

#### Code Complexity and Quality

- No consecutive spaces in regexes.
- Avoid `arguments` object, misleading types, or commas in code.
- Do not exceed complexity thresholds, deep describes, or unnecessary code constructs.
- Use `for...of` over `Array.forEach` where suitable.
- Avoid static-only classes, misused `this`/`super`, or redundant code elements.
- No unnecessary escapes, fragments, or labels.
- Use deterministic, deterministic utilities.
- Prefer concise and modern idioms (optional chaining, object spread, arrow functions, etc.).

#### Correctness and Safety

- Prevent self-assignment, unreachable code, incorrect flow, unused elements, and improper use of async or generators.
- No hardcoded secrets. Avoid import cycles, duplicate entities, void operators, and direct console/debugger access.

#### TypeScript Best Practices

- No enums, namespaces, const enum, implicit any, non-null assertions.
- Prefer `as const`, explicit member values, and co-location of types.
- Avoid unsafe class/interface merging and misuse of overloads.

#### Style and Consistency

- Avoid global `eval`, nested ternaries, and function parameter reassignment.
- Follow naming, brace, and lexical conventions.
- Use `const` for single-assignment; avoid yoda expressions.
- Prefer template literals, `for-of` loops, and node prefixes (`node:`).
- No duplicate, shadowed, or redeclared identifiers.

#### Testing Best Practices

- Do not use `export` or `module.exports` in test files.
- Never use disabled or focused ("only") tests.
- Place assertions (`expect`) inside `it()` calls.

### Common Tasks

- `npx ultracite init` — Initialize Ultracite.
- `npx ultracite fix` — Auto-format/fix code.
- `npx ultracite check` — Static analysis only.

### Example: Error Handling

```typescript
// ✅ Good: Comprehensive error handling
try {
  const result = await fetchData();
  return { success: true, data: result };
} catch (error) {
  console.error('API call failed:', error);
  return { success: false, error: error.message };
}

// ❌ Bad: Swallowing errors
try {
  return await fetchData();
} catch (e) {
  console.log(e);
}
```
