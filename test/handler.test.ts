import {
	describe,
	it,
	expect,
	vi,
	beforeAll,
	beforeEach,
	afterEach,
} from 'vitest'
import { env, fetchMock } from 'cloudflare:test'
import { handleRequest, Env } from '../src/handler'

// Create a mock execution context
const createMockCtx = (): ExecutionContext => ({
	waitUntil: vi.fn(),
	passThroughOnException: vi.fn(),
})

describe('handleRequest', () => {
	describe('404 on missing KV entry', () => {
		it('returns 404 when date is not found in KV', async () => {
			const request = new Request('https://reading.example.com/?date=99-99')
			const ctx = createMockCtx()

			const response = await handleRequest(request, env as Env, ctx)

			expect(response.status).toBe(404)
			expect(await response.text()).toBe('Date not found in list')
		})

		it('returns 404 for valid format but missing date', async () => {
			const request = new Request('https://reading.example.com/?date=06-31')
			const ctx = createMockCtx()

			const response = await handleRequest(request, env as Env, ctx)

			expect(response.status).toBe(404)
		})

		it('returns 404 when KV is empty for the date', async () => {
			const request = new Request('https://reading.example.com/?date=02-30')
			const ctx = createMockCtx()

			const response = await handleRequest(request, env as Env, ctx)

			expect(response.status).toBe(404)
		})
	})

	describe('successful requests', () => {
		beforeAll(() => {
			fetchMock.activate()
			fetchMock.disableNetConnect()
		})

		beforeEach(async () => {
			// Seed the KV with test data
			await env.READING_PLAN_KV.put(
				'01-01',
				JSON.stringify({ OT: 'Genesis 1-2', NT: 'Matthew 1' }),
			)
		})

		afterEach(() => {
			fetchMock.assertNoPendingInterceptors()
		})

		it('returns 200 with HTML for valid date in KV', async () => {
			fetchMock
				.get('https://api.esv.org')
				.intercept({ path: /.*/, method: 'GET' })
				.reply(200, {
					passages: ['<div>Mocked passage content</div>'],
				})
				.times(2)

			const request = new Request('https://reading.example.com/?date=01-01')
			const ctx = createMockCtx()

			const response = await handleRequest(request, env as Env, ctx)

			expect(response.status).toBe(200)
			expect(response.headers.get('content-type')).toBe(
				'text/html;charset=UTF-8',
			)

			const html = await response.text()
			expect(html).toContain('<!DOCTYPE html>')
			expect(html).toContain('Mocked passage content')
		})

		it('returns HTML with correct content-type header', async () => {
			fetchMock
				.get('https://api.esv.org')
				.intercept({ path: /.*/, method: 'GET' })
				.reply(200, { passages: ['<div>Test</div>'] })
				.times(2)

			const request = new Request('https://reading.example.com/?date=01-01')
			const ctx = createMockCtx()

			const response = await handleRequest(request, env as Env, ctx)

			expect(response.headers.get('content-type')).toBe(
				'text/html;charset=UTF-8',
			)
		})
	})
})
