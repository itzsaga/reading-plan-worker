import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'
import { env, fetchMock } from 'cloudflare:test'
import { getPassages, Env, ReadingList } from '../src/handler'

// Create a mock execution context
const createMockCtx = (): ExecutionContext => ({
	waitUntil: vi.fn(),
	passThroughOnException: vi.fn(),
})

describe('getPassages (ESV API response parsing)', () => {
	beforeAll(() => {
		fetchMock.activate()
		fetchMock.disableNetConnect()
	})

	afterEach(() => {
		fetchMock.assertNoPendingInterceptors()
	})

	it('extracts passages from ESV API response', async () => {
		const mockOTPassage = '<div class="passage">Genesis 1-2 content</div>'
		const mockNTPassage = '<div class="passage">Matthew 1 content</div>'

		fetchMock
			.get('https://api.esv.org')
			.intercept({
				path: /Genesis/,
				method: 'GET',
			})
			.reply(200, { passages: [mockOTPassage] })

		fetchMock
			.get('https://api.esv.org')
			.intercept({
				path: /Matthew/,
				method: 'GET',
			})
			.reply(200, { passages: [mockNTPassage] })

		const passages: ReadingList = { OT: 'Genesis 1-2', NT: 'Matthew 1' }
		const ctx = createMockCtx()

		const result = await getPassages(passages, env as Env, ctx)

		expect(result).toHaveLength(2)
		expect(result[0]).toBe(mockOTPassage)
		expect(result[1]).toBe(mockNTPassage)
	})

	it('handles passages with spaces in names (converted to +)', async () => {
		fetchMock
			.get('https://api.esv.org')
			.intercept({
				path: /1\+Samuel/,
				method: 'GET',
			})
			.reply(200, { passages: ['<div>1 Samuel</div>'] })

		fetchMock
			.get('https://api.esv.org')
			.intercept({
				path: /1\+Corinthians/,
				method: 'GET',
			})
			.reply(200, { passages: ['<div>1 Corinthians</div>'] })

		const passages: ReadingList = {
			OT: '1 Samuel 1-2',
			NT: '1 Corinthians 1',
		}
		const ctx = createMockCtx()

		const result = await getPassages(passages, env as Env, ctx)

		// If we get here without error, the paths matched correctly
		expect(result).toHaveLength(2)
	})

	it('calls ESV API with correct URL parameters', async () => {
		fetchMock
			.get('https://api.esv.org')
			.intercept({
				path: (path) =>
					path.includes('include-audio-link=false') &&
					path.includes('include-short-copyright=false') &&
					path.includes('include-footnotes=false'),
				method: 'GET',
			})
			.reply(200, { passages: ['<div>Test</div>'] })
			.times(2)

		const passages: ReadingList = { OT: 'Genesis 1', NT: 'Matthew 1' }
		const ctx = createMockCtx()

		await getPassages(passages, env as Env, ctx)
		// Test passes if the interceptor matched
	})

	it('fetches both OT and NT passages', async () => {
		fetchMock
			.get('https://api.esv.org')
			.intercept({ path: /Genesis/, method: 'GET' })
			.reply(200, { passages: ['<div>OT</div>'] })

		fetchMock
			.get('https://api.esv.org')
			.intercept({ path: /Matthew/, method: 'GET' })
			.reply(200, { passages: ['<div>NT</div>'] })

		const passages: ReadingList = { OT: 'Genesis 1', NT: 'Matthew 1' }
		const ctx = createMockCtx()

		const result = await getPassages(passages, env as Env, ctx)

		expect(result[0]).toBe('<div>OT</div>')
		expect(result[1]).toBe('<div>NT</div>')
	})

	it('uses waitUntil for cache population', async () => {
		fetchMock
			.get('https://api.esv.org')
			.intercept({ path: /.*/, method: 'GET' })
			.reply(200, { passages: ['<div>Test</div>'] })
			.times(2)

		const passages: ReadingList = { OT: 'Genesis 1', NT: 'Matthew 1' }
		const ctx = createMockCtx()

		await getPassages(passages, env as Env, ctx)

		expect(ctx.waitUntil).toHaveBeenCalled()
	})
})
