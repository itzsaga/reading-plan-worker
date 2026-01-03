export interface Env {
	ESV_API_KEY: string
	READING_PLAN_KV: KVNamespace
}

interface ReadingList {
	OT: string
	NT: string
}

const responseHeaders = {
	headers: { 'content-type': 'text/html;charset=UTF-8' },
}

const getOffsetDate = (mmdd: string, offset: number): string => {
	const [month, day] = mmdd.split('-').map(Number)
	// Use a non-leap year for consistent behavior
	const date = new Date(Date.UTC(2023, month - 1, day + offset))
	const m = String(date.getUTCMonth() + 1).padStart(2, '0')
	const d = String(date.getUTCDate()).padStart(2, '0')
	return `${m}-${d}`
}

const getPreviousDate = (mmdd: string): string => getOffsetDate(mmdd, -1)

const getNextDate = (mmdd: string): string => getOffsetDate(mmdd, 1)

export async function handleRequest(
	request: Request,
	env: Env,
	ctx: ExecutionContext,
): Promise<Response> {
	const { searchParams } = new URL(request.url)

	const centralTimeDate = new Date().toLocaleString('en-US', {
		timeZone: 'America/Chicago',
	})
	const dateObj = new Date(centralTimeDate)
	const month = String(dateObj.getMonth() + 1).padStart(2, '0')
	const day = String(dateObj.getDate()).padStart(2, '0')
	const date = searchParams.get('date') ?? `${month}-${day}`

	const kvValue: ReadingList | null = await env.READING_PLAN_KV.get(
		date,
		'json',
	)

	if (kvValue) {
		const passages = await getPassages(kvValue, env, ctx)

		return new Response(
			generateHTML({
				firstPassage: passages[0],
				secondPassage: passages[1],
				date,
				previousDate: getPreviousDate(date),
				nextDate: getNextDate(date),
			}),
			{ ...responseHeaders },
		)
	}

	return new Response('Date not found in list', { status: 404 })
}

const getPassages = async (
	passages: ReadingList,
	env: Env,
	ctx: ExecutionContext,
) => {
	const passage1 = passages.OT.replace(' ', '+')
	const passage2 = passages.NT.replace(' ', '+')
	const responses = await Promise.all([
		getPassageHTML(passage1, env, ctx),
		getPassageHTML(passage2, env, ctx),
	])
	const jsons = await Promise.all([responses[0].json(), responses[1].json()])
	// @ts-expect-error untyped json response
	return [jsons[0].passages[0], jsons[1].passages[0]]
}

const getPassageHTML = async (
	passage: string,
	env: Env,
	ctx: ExecutionContext,
) => {
	const URI = `https://api.esv.org/v3/passage/html/?q=${passage}&include-audio-link=false&include-short-copyright=false&include-footnotes=false`
	const cache = caches.default
	let response = await cache.match(URI)

	if (!response) {
		response = await fetch(URI, {
			headers: {
				Authorization: `Token ${env.ESV_API_KEY}`,
			},
		})

		response = new Response(response.body, response)

		response.headers.append('Cache-Control', 's-max-age=3600')

		ctx.waitUntil(cache.put(URI, response.clone()))
	}
	return response
}

const generateHTML = ({
	firstPassage,
	secondPassage,
	date,
	previousDate,
	nextDate,
}: {
	firstPassage: string
	secondPassage: string
	date: string
	previousDate: string
	nextDate: string
}) => {
	// date is MM-DD format, use current year for display
	const currentYear = new Date().getFullYear()
	const today = new Date(`${currentYear}-${date}T12:00:00`)
	const dateString = today.toLocaleDateString(undefined, {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
	})

	return `
    <!DOCTYPE html>
    <html lang='en'>
      <head>
        <meta charset='UTF-8'>
        <meta name='viewport'
          content='width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0'>
        <meta http-equiv='X-UA-Compatible' content='ie=edge'>
        <meta name='description' content='Daily Bible readings from The Axis Church in Nashville, TN.'>
        <title>Readings for ${dateString}</title>
        <style>
          body {
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
            margin: 30px auto;
            max-width: 750px;
            padding: 0 30px;
          }
          .nav-row {
            display: flex;
            justify-content: space-between;
            margin: 20px 0;
          }
          .nav-link {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-decoration: none;
            color: #333;
            padding: 10px;
          }
          .nav-link:hover {
            color: #000;
          }
          .nav-arrow {
            font-size: 2rem;
          }
          .nav-text {
            font-size: 0.85rem;
            margin-top: 4px;
          }
        </style>
      </head>
      <body>
        <h1 style='text-align:center;'>Readings for ${dateString}</h1>
        <div style='text-align:center'>
          <p>Lord, open my eyes that I might <strong>see</strong>,<br/>
          open my ears that I might <strong>hear</strong>,<br/>
          open my mind that I might <strong>know</strong>,<br/>
          and open my heart that I might <strong>experience</strong> You and be made aware of all that I need to know.<br/>
          I am not enough. I need you to guide me.</p>
          Help me.<br/>
          Speak to me.<br/>
          Be near me.<br/>
          Amen.
        </div>
        ${firstPassage}
        ${secondPassage}
        <div class="nav-row">
          <a href="?date=${previousDate}" class="nav-link">
            <span class="nav-arrow">←</span>
            <span class="nav-text">Previous day</span>
          </a>
          <a href="?date=${nextDate}" class="nav-link">
            <span class="nav-arrow">→</span>
            <span class="nav-text">Next day</span>
          </a>
        </div>
        <div style='text-align:center'>
          <p>Copyright</p>
          <p>Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), copyright © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved. The ESV text may not be quoted in any publication made available to the public by a Creative Commons license. The ESV may not be translated into any other language.</p>
          <p>Users may not copy or download more than 500 verses of the ESV Bible or more than one half of any book of the ESV Bible.</p>
        </div>
      </body>
    </html>
  `
}
