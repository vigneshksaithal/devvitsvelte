# AI Agent Instructions

This document provides guidelines for AI agents working on this repository.

## Overview

This is a [Devvit](https://developers.reddit.com/docs/devvit) application that uses [Svelte 5](https://svelte.dev/) for the frontend and a [Hono](https://hono.dev/)-based server for the backend. The UI is styled with [Tailwind CSS v4](https://tailwindcss.com/).

The application is structured as follows:

- `src/client`: Contains the Svelte 5 frontend code.
- `src/server`: Contains the Hono backend code, which runs in the Devvit environment.
- `src/shared`: Contains code that can be shared between the client and server.

## Tech Stack

- **Svelte 5**: The frontend is built with Svelte 5. Please use the new [runes](https://svelte.dev/docs/runes) for reactivity.
- **Tailwind CSS v4**: The UI is styled with Tailwind CSS v4. Please use Tailwind CSS classes directly in the markup instead of style tags.
- **Devvit**: The application is a Devvit app. The backend has access to the Devvit context, which includes `reddit` and `redis` clients.
- **Hono**: The backend server is built with Hono, a lightweight web framework.
- **TypeScript**: The entire codebase is written in TypeScript.
- **Vite**: The project uses Vite for building both the client and server.

## Coding Conventions

- **Functional Programming**: Please use functional programming principles where possible. Avoid mutations and side effects when you can.
- **Svelte 5 Runes**: Use Svelte 5 runes (`$state`, `$derived`, `$effect`, etc.) for all reactive state.
- **Tailwind CSS Classes**: Use Tailwind CSS utility classes for all styling. Do not use `<style>` blocks in Svelte components.
- **Immutability**: When updating state, create new objects or arrays instead of mutating existing ones.
- **Async/Await**: Use `async/await` for all asynchronous operations.

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

## API

The backend exposes a few API endpoints that the client can use. These are defined in `src/server/index.ts`. All API routes are prefixed with `/api`.

- `GET /api/init`: Initializes the application with data from the Devvit context.
- `GET /api/test`: A test endpoint.

When adding new routes:

- Update the Hono router in `src/server/index.ts`.
- Place shared request/response types in `src/shared` so both client and server can consume them.
- Import the shared types in `src/client` components or stores to keep client/server contracts aligned.

The Devvit handler expects a Fetch-compatible function; ensure new middleware stays compatible.

## Deployment

To deploy the application to Devvit, use the following command:

```bash
pnpm deploy
```

This will build the application and upload it to Devvit.

## Testing

There is no dedicated automated test suite yet. Validate changes by:

- Running `pnpm dev` and using the Devvit playtest environment.
- Exercising new API endpoints with manual requests or lightweight scripts.

If you introduce testing utilities or fixtures, keep them in `src/shared` when they are usable in both client and server contexts.
