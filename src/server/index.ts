// import {
// 	context,
// 	createServer,
// 	getServerPort,
// 	reddit,
// 	redis
// } from '@devvit/web/server'
// import type {
// 	InitResponse
// } from '../shared/types/api'
// import { createPost } from './core/post'

import { context, reddit, redis } from '@devvit/web/server'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { createPost } from './core/post'

const app = new Hono()

app.get('/api/init', async (c) => {
	const { postId } = context

	if (!postId) {
		console.error('API Init Error: postId not found in devvit context')
		return c.json(
			{
				status: 'error',
				message: 'postId is required but missing from context'
			},
			400
		)
	}

	try {
		const [count, username] = await Promise.all([
			redis.get('count'),
			reddit.getCurrentUsername()
		])

		return c.json({
			type: 'init',
			postId: postId,
			count: count ? parseInt(count, 10) : 0,
			username: username ?? 'anonymous'
		})
	} catch (error) {
		console.error(`API Init Error for post ${postId}:`, error)
		let errorMessage = 'Unknown error during initialization'
		if (error instanceof Error) {
			errorMessage = `Initialization failed: ${error.message}`
		}
		return c.json({ status: 'error', message: errorMessage }, 400)
	}
})

// router.get<
// 	{ postId: string },
// 	InitResponse | { status: string; message: string }
// >('/api/init', async (_req, res): Promise<void> => {
// 	const { postId } = context

// 	if (!postId) {
// 		console.error('API Init Error: postId not found in devvit context')
// 		res.status(400).json({
// 			status: 'error',
// 			message: 'postId is required but missing from context'
// 		})
// 		return
// 	}

// 	try {
// 		const [count, username] = await Promise.all([
// 			redis.get('count'),
// 			reddit.getCurrentUsername()
// 		])

// 		res.json({
// 			type: 'init',
// 			postId: postId,
// 			count: count ? parseInt(count, 10) : 0,
// 			username: username ?? 'anonymous'
// 		})
// 	} catch (error) {
// 		console.error(`API Init Error for post ${postId}:`, error)
// 		let errorMessage = 'Unknown error during initialization'
// 		if (error instanceof Error) {
// 			errorMessage = `Initialization failed: ${error.message}`
// 		}
// 		res.status(400).json({ status: 'error', message: errorMessage })
// 	}
// })

// router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
// 	try {
// 		const post = await createPost()

// 		res.json({
// 			status: 'success',
// 			message: `Post created in subreddit ${context.subredditName} with id ${post.id}`
// 		})
// 	} catch (error) {
// 		console.error(`Error creating post: ${error}`)
// 		res.status(400).json({
// 			status: 'error',
// 			message: 'Failed to create post'
// 		})
// 	}
// })

app.post('/internal/on-app-install', async (c) => {
	try {
		const post = await createPost()

		return c.json({
			navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`
		})
	} catch (error) {
		console.error(`Error creating post: ${error}`)
		return c.json({
			status: 'error',
			message: 'Failed to create post'
		}, 400)
	}
})

app.post('/internal/menu/post-create', async (c) => {
	try {
		const post = await createPost()

		return c.json({
			navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`
		})
	} catch (error) {
		console.error(`Error creating post: ${error}`)
		return c.json({
			status: 'error',
			message: 'Failed to create post'
		}, 400)
	}
})

serve(app)
