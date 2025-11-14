import {
  context,
  createServer,
  getServerPort,
  reddit,
  redis
} from '@devvit/web/server'
import { serve } from '@hono/node-server'
import type { Context } from 'hono'
import { Hono } from 'hono'

import { createPost } from './post'

const HTTP_STATUS_BAD_REQUEST = 400

const app = new Hono()

const initializeApp = async (c: Context) => {
  const { postId } = context

  if (!postId) {
    return c.json(
      {
        status: 'error',
        message: 'postId is required but missing from context'
      },
      HTTP_STATUS_BAD_REQUEST
    )
  }

  try {
    const [count, username] = await Promise.all([
      redis.get('count'),
      reddit.getCurrentUsername()
    ])

    return c.json({
      type: 'init',
      postId,
      count: count ? Number.parseInt(count, 10) : 0,
      username: username ?? 'anonymous'
    })
  } catch (error) {
    const errorMessage = error instanceof Error
      ? `Initialization failed: ${error.message}`
      : 'Unknown error during initialization'
    return c.json({ status: 'error', message: errorMessage }, HTTP_STATUS_BAD_REQUEST)
  }
}

const createPostHandler = async (c: Context) => {
  try {
    const post = await createPost()

    return c.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`
    })
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : 'Failed to create post'
    return c.json(
      {
        status: 'error',
        message: errorMessage
      },
      HTTP_STATUS_BAD_REQUEST
    )
  }
}

app.get('/api/init', initializeApp)
app.post('/internal/on-app-install', createPostHandler)
app.post('/internal/menu/post-create', createPostHandler)

// Start the Devvit-wrapped server so context (reddit, redis, etc.) is available
serve({ fetch: app.fetch, port: getServerPort(), createServer })
