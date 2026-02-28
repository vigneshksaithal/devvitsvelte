---
name: add-api-route
description: Add a new Hono API route to the server. Use when the user wants to add a new endpoint, handler, or server-side route.
---

# Add API Route

## When to use this skill
Use when adding a new `/api/*` (client-callable) or `/internal/*` (devvit trigger/menu) endpoint to `src/server/index.ts` or a new file in `src/server/routes/`.

## Route placement rules
- Small routes (1-2 handlers): add directly to `src/server/index.ts`
- Larger feature routes: create `src/server/routes/{feature-name}.ts` and import into `src/server/index.ts`
- Public client routes: `/api/kebab-case`
- Devvit menu items: `/internal/menu/action-name`
- Devvit triggers: `/internal/on-event-name`

## Required pattern

```typescript
import { Hono } from 'hono'
import type { Context } from 'hono'
import { context, redis, reddit } from '@devvit/web/server'

const HTTP_STATUS_BAD_REQUEST = 400
const HTTP_STATUS_NOT_FOUND = 404
const HTTP_STATUS_INTERNAL_ERROR = 500

const myHandler = async (c: Context): Promise<Response> => {
  try {
    // Guard required context
    const { userId } = context
    if (!userId) {
      return c.json({ status: 'error', message: 'Not authenticated' }, HTTP_STATUS_BAD_REQUEST)
    }

    const result = await doThing()
    return c.json({ status: 'success', data: result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return c.json({ status: 'error', message }, HTTP_STATUS_INTERNAL_ERROR)
  }
}

app.get('/api/my-route', myHandler)
```

## Response shapes (always use these)
- Success: `{ status: 'success', data: { ... } }`
- Error: `{ status: 'error', message: 'Human-readable string' }`
- Menu navigation: `{ navigateTo: 'https://reddit.com/...' }`

## Checklist before finishing
- [ ] Handler is an arrow function with explicit return type
- [ ] try/catch with `instanceof Error` narrowing
- [ ] HTTP status uses named constant, not magic number
- [ ] Route path is kebab-case
- [ ] Named export only (no `export default`)
- [ ] `context.userId` / `context.postId` guarded before use
