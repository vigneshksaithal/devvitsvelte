# AI Agent Instructions

This document provides guidelines for AI agents working on this repository.

## Overview

This is a [Devvit](https://developers.reddit.com/docs/devvit) application that uses [Svelte 5](https://svelte.dev/) for the frontend and a [Hono](https://hono.dev/)-based server for the backend. The UI is styled with [Tailwind CSS v4](https://tailwindcss.com/).

The application is structured as follows:

- `src/client`: Contains the Svelte 5 frontend code.
- `src/server`: Contains the Hono backend code, which runs in the Devvit environment.
- `src/shared`: Contains code that can be shared between the client and server.

## Prerequisites & Environment Setup

- **Node**: Use Node.js 20.x LTS (Devvit CLI currently targets Node 18+, but local tooling is built and tested on 20.x).
- **Package manager**: `pnpm` ≥ 9 (lockfile is `pnpm-lock.yaml`; using npm will break workspace linking).
- **Devvit CLI**: 0.12.1 (kept in sync with `devvit` dependency). Install globally via `pnpm add -g devvit@0.12.1`.
- **Environment variables**: Create a local `.env` containing Devvit credentials (`DEVVIT_APP_ID`, `DEVVIT_APP_SECRET`, etc.). Never commit `.env`.
- **Authentication**: Run `pnpm login` once per session to refresh Devvit credentials.
- **Optional helpers**: `direnv` or similar tooling can auto-load the `.env`, but ensure secrets stay local.

## Tech Stack

- **Svelte 5**: The frontend is built with Svelte 5. Please use the new [runes](https://svelte.dev/docs/runes) for reactivity.
- **Tailwind CSS v4**: The UI is styled with Tailwind CSS v4. Please use Tailwind CSS classes directly in the markup instead of style tags.
- **Devvit**: The application is a Devvit app. The backend has access to the Devvit context, which includes `reddit` and `redis` clients.
- **Hono**: The backend server is built with Hono, a lightweight web framework.
- **TypeScript**: The entire codebase is written in TypeScript.
- **Vite**: The project uses Vite for building both the client and server.

## Devvit Web Guidelines

- **Server access**: Use `@devvit/web/server` exports (`createServer`, `context`, `getServerPort`, `redis`, etc.) when wiring backend routes so handlers run inside the Devvit runtime and have typed access to Reddit/Redis services ([docs/devvit-docs.txt:1507](docs/devvit-docs.txt:1507)).
- **Client effects**: Import UI helpers such as `showToast`, `showForm`, and `navigateTo` from `@devvit/web/client` inside Svelte components, and only call them in direct response to user actions to mirror the documented client effects flow ([docs/devvit-docs.txt:7198](docs/devvit-docs.txt:7198)).
- **Menu endpoints**: Server handlers registered under `/internal/menu/...` should respond with a `UIResponse` payload (e.g. `{ showToast: '...' }`, `{ navigateTo: '...' }`) and use the `UIResponse` type from `@devvit/web/shared`, because server code cannot invoke `@devvit/web/client` directly ([docs/devvit-docs.txt:7578](docs/devvit-docs.txt:7578)).
- **devvit.json permissions**: Request platform features via `devvit.json`—set `permissions.redis`, `permissions.http`, or `reddit.asUser` scopes instead of `Devvit.configure`, keep internal endpoints prefixed with `/internal/`, and only enable scopes the feature needs ([docs/devvit-docs.txt:3197](docs/devvit-docs.txt:3197), [docs/devvit-docs.txt:6959](docs/devvit-docs.txt:6959)).

## Repository Workflow Norms

- **Plan first**: Begin substantial tasks by writing a short pseudocode plan, then confirm it before coding; this keeps discussion transparent and aligned.
- **Comment every function**: Prepend each function with a brief description of its purpose, and mirror existing documentation style.
- **Keep diffs surgical**: Modify only the code necessary for the task, leaving unrelated sections untouched and avoiding opportunistic cleanups.
- **Favor type aliases**: When introducing new TypeScript types, prefer `type` aliases over `interface` declarations unless interoperability demands otherwise.
- **Client constraints**: Webview code must rely on PNPM-managed, browser-safe dependencies and avoid WebSockets; if realtime behavior is required, consult Devvit’s realtime services.
- **Server constraints**: Backend code runs in a serverless environment without access to `fs`, `http`, `https`, or `net`; use `fetch` for HTTP calls and the provided `redis` helpers for persistence.
- **Svelte formatting**: Inside `<script>` blocks use single quotes, omit trailing semicolons, favor arrow functions, and rely solely on Tailwind utility classes for styling.
- **Lint expectations**: Adhere to the strict lint configuration—prefer `const`, use arrow functions, avoid introducing new `console` statements, and follow the project’s accessibility and TypeScript safety rules.

## Coding Conventions

- **Functional Programming**: Please use functional programming principles where possible. Avoid mutations and side effects when you can.
- **Svelte 5 Runes**: Use Svelte 5 runes (`$state`, `$derived`, `$effect`, etc.) for all reactive state.
- **Tailwind CSS Classes**: Use Tailwind CSS utility classes for all styling. Do not use `<style>` blocks in Svelte components.
- **Immutability**: When updating state, create new objects or arrays instead of mutating existing ones.
- **Async/Await**: Use `async/await` for all asynchronous operations.
- **Naming**: Use PascalCase for Svelte components, camelCase for variables/functions, and SCREAMING_SNAKE_CASE for constants.
- **File organization**: Prefer colocating component-specific helpers in the same directory; shared logic belongs in `src/shared`.
- **Stores & context**: Create derived stores instead of manual subscriptions; avoid writable global stores unless state truly spans multiple views.
- **Data contracts**: Define shared request/response interfaces in `src/shared` and import them from both client and server to keep APIs aligned.
- **Error handling**: Surface user-facing errors with typed results instead of `throw`; log unexpected failures with context so Devvit logs remain actionable.

## Development

To run the application in development mode, use the following command:

```bash
pnpm dev
```

This will start the client and server in watch mode and run the Devvit playtest command.

### Devvit Setup

- Make sure you are authenticated with Reddit via the Devvit CLI before running any Devvit commands:

  ```bash
  pnpm login
  ```

- Development and playtesting rely on the Devvit CLI reading environment variables from a local `.env` file (for example credentials such as `DEVVIT_APP_ID` and `DEVVIT_APP_SECRET`). Keep that file out of version control.

If you need to reset the Devvit session, rerun `pnpm login`.

## Building

To build the application for production, use the following command:

```bash
pnpm build
```

This will build both the client and server.

## Linting and Formatting

This project uses [Biome](https://biomejs.dev/) for linting and formatting. To check for and fix issues, run:

```bash
pnpm fix
```

Please ensure that all code passes the Biome checks before submitting.

Additional validation scripts:

- `pnpm check`: Runs `svelte-check` against the client `tsconfig`.
- `pnpm type-check`: Executes a TypeScript project build across the repo.
- `pnpm launch`: Builds, uploads, and then publishes the package (intended for release workflows).

## Verification Checklist

Always complete these before handing changes back:

1. `pnpm fix` (required) — ensures Biome formatting/linting passes.
2. `pnpm type-check` (required) — catches TS regressions across client/server bundles.
3. `pnpm check` (when UI changes) — validates Svelte component health.
4. `pnpm build` (for releases or major refactors) — confirms both bundles still compile.
5. Document any manual Devvit playtest steps executed, including subreddit and commands used.

If a command fails because of a known limitation (e.g., missing credentials), call it out explicitly in your notes instead of skipping silently.

## API

The backend exposes a few API endpoints that the client can use. These are defined in `src/server/index.ts`. All API routes are prefixed with `/api`.

- `GET /api/init`: Initializes the application with data from the Devvit context.
- `GET /api/test`: A test endpoint.

When adding new routes:

- Update the Hono router in `src/server/index.ts`.
- Place shared request/response types in `src/shared` so both client and server can consume them.
- Import the shared types in `src/client` components or stores to keep client/server contracts aligned.
- Validate new routes with manual requests via `devvit playtest` or simple `fetch` calls, and document the request/response payloads tested.

The Devvit handler expects a Fetch-compatible function; ensure new middleware stays compatible.

## Devvit Context Guidance

- Treat `context.reddit` and `context.redis` as production services: avoid destructive actions in shared environments and honor API rate limits.
- Prefer idempotent operations and include subreddit/thread identifiers in logs for traceability.
- When mocking is required, create lightweight adapters in `src/shared` so server and client can share types without leaking Devvit-only objects.
- Do not assume synchronous availability of Devvit data; guard against missing fields and surface fallback UI states.

## Deployment

To deploy the application to Devvit, use the following command:

```bash
pnpm deploy
```

This will build the application and upload it to Devvit.

## Common Pitfalls

- Tailwind v4 runs via the Vite plugin; every utility must be present in your markup (no `@apply`). Unrecognized classes will be purged.
- The client `vite build --watch` used in `pnpm dev` does not hot-reload markup; rely on Devvit playtest refreshes to validate UI changes.
- Forgetting `pnpm login` causes `devvit playtest` and deployment commands to fail with opaque auth errors.
- Devvit APIs require subreddit whitelisting; keep `devvit.json` updated when testing new environments.
- Avoid mixing npm and pnpm commands—the postinstall hook expects npm, but local workflows should stay on pnpm to respect the lockfile.

## Testing

There is no dedicated automated test suite yet. Validate changes by:

- Running `pnpm dev` and using the Devvit playtest environment.
- Exercising new API endpoints with manual requests or lightweight scripts.

If you introduce testing utilities or fixtures, keep them in `src/shared` when they are usable in both client and server contexts.
