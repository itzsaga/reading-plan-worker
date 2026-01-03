// Entry point for the Cloudflare Worker that serves daily Bible readings.
// Exports a module worker that handles fetch requests.
import { handleRequest, Env } from './handler'

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext,
	): Promise<Response> {
		return handleRequest(request, env, ctx)
	},
}
