---
name: devvit-constraints-check
description: Verify a planned feature is compatible with Devvit platform constraints before implementation. Use at the start of any new feature to catch blockers early.
---

# Devvit Constraints Check

## When to use this skill
Run this check before implementing any new feature. Devvit's sandboxed webview and serverless runtime have hard limits that can make features impossible or require significant rework if discovered late.

## Constraint checklist

### Client (sandboxed webview)
| Question | If YES |
|---|---|
| Uses `localStorage` or `sessionStorage`? | ❌ Impossible — use Redis via server endpoint |
| Direct `fetch()` to external URL? | ⚠️ Must proxy through `/api/*` server endpoint |
| Uses `<style>` blocks in Svelte? | ❌ Use Tailwind classes only |
| Content requires scrolling? | ❌ Must fit viewport — redesign layout |
| Viewport smaller than 320×320px? | ❌ Must work at 320×320 minimum |
| Uses Svelte 4 syntax (`$:`, `export let`)? | ❌ Use Svelte 5 runes only |

### Server (serverless)
| Question | If YES |
|---|---|
| Uses `setInterval` or long polling? | ❌ Use Devvit Scheduler for recurring tasks |
| Writes to filesystem (`fs.writeFile`)? | ❌ Use Redis or `media.upload()` |
| Uses native Node modules (sharp, ffmpeg)? | ❌ Use external service (Cloudinary etc.) |
| Request takes >30 seconds? | ⚠️ Break into smaller operations |
| Payload >4MB? | ⚠️ Chunk or compress data |
| Needs WebSockets? | ⚠️ Use Devvit Realtime (max 100 msg/sec) |

### Redis
| Question | If YES |
|---|---|
| Storing >500MB? | ⚠️ Implement pagination or external DB |
| >1,000 Redis commands/sec? | ⚠️ Batch with `mGet`, `hGetAll` |
| Single payload >4MB? | ⚠️ Split across multiple keys |

### Context availability
| Variable | Available when |
|---|---|
| `context.userId` | User is logged in (may be undefined) |
| `context.postId` | Inside a post (may be undefined) |
| `context.subredditId` | Always available |
| `context.subredditName` | Always available |

## Output format
After running through the checklist, summarize:

```markdown
## Constraints Verified for: [Feature Name]

### Blockers (must resolve before building)
- (none) OR list each ❌ item

### Warnings (need workaround)
- (none) OR list each ⚠️ item with proposed solution

### Clear to build
- ✅ All constraints satisfied
```

## If a blocker is found
Stop and explain the constraint to the user before writing any code. Propose an alternative approach that works within the platform limits.
