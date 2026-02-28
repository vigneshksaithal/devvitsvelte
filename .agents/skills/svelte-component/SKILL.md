---
name: add-svelte-component
description: Create a new Svelte 5 component for the client. Use when adding UI components, views, or interactive elements.
---

# Add Svelte Component

## When to use this skill
Use when creating any new `.svelte` file in `src/client/`.

## File placement
- Reusable UI component → `src/client/components/ComponentName.svelte`
- Page/view component → `src/client/views/ViewName.svelte`
- PascalCase filenames always

## Svelte 5 runes — required syntax

```svelte
<script lang="ts">
  import { onMount } from 'svelte'

  // State: $state() only — never plain let for reactive values
  let count = $state(0)
  let data = $state<MyType | null>(null)
  let loading = $state(true)
  let error = $state<string | null>(null)

  // Derived: $derived() for computed values
  let doubled = $derived(count * 2)

  // Effects: $effect() for side effects
  $effect(() => {
    console.log('count changed:', count)
  })

  // Async data fetch pattern
  onMount(async () => {
    try {
      const res = await fetch('/api/my-endpoint')
      if (!res.ok) throw new Error('Failed to load')
      data = await res.json()
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error'
    } finally {
      loading = false
    }
  })
</script>

{#if loading}
  <div class="animate-pulse text-center">Loading...</div>
{:else if error}
  <div class="text-red-500 text-center">{error}</div>
{:else if data}
  <!-- render data -->
{/if}
```

## Layout rules (no scrolling — CRITICAL)

```svelte
<!-- Root component layout — always use this structure -->
<div class="h-full w-full overflow-hidden flex flex-col">
  <header class="flex-none"><!-- fixed height header --></header>
  <main class="flex-1 min-h-0 flex flex-col items-center justify-center">
    <!-- content -->
  </main>
  <footer class="flex-none"><!-- controls --></footer>
</div>
```

| ❌ Never use | ✅ Use instead |
|---|---|
| `overflow-y-auto` | `overflow-hidden` |
| `min-h-screen` / `h-screen` | `h-full` |
| `<style>` blocks | Tailwind classes only |
| `localStorage` | `fetch('/api/...')` |
| `fetch('https://...')` | Server proxy endpoint |

## Checklist before finishing
- [ ] Uses `$state()`, `$derived()`, `$effect()` — no Svelte 4 syntax
- [ ] No `<style>` blocks — Tailwind only
- [ ] No `localStorage` / `sessionStorage`
- [ ] No direct external `fetch()` — all through `/api/*`
- [ ] Root container uses `h-full overflow-hidden`
- [ ] Mobile-first classes (`text-sm md:text-base`)
- [ ] Minimum 320×320px viewport tested
- [ ] Default export for `.svelte` file is fine (only exception to named-exports rule)
