declare var ESV_API_KEY: string
declare var READING_PLAN_KV: KVNamespace

interface ReadingList {
  OT: string
  NT: string
}

export async function handleRequest(event: FetchEvent): Promise<Response> {
  const centralTimeDate = new Date().toLocaleString("en-US", {
    timeZone: "America/Chicago"
  })
  const dateObj = new Date(centralTimeDate)
  const { searchParams } = new URL(event.request.url)
  const date = searchParams.get('date') || dateObj.toISOString().split('T')[0]

  const kvValue: ReadingList | null = await READING_PLAN_KV.get(date, 'json')

  if (kvValue) {
    const passages = await getPassages(kvValue, event)

    return new Response(
      generateHTML({
        firstPassage: passages[0],
        secondPassage: passages[1],
        date,
      }),
      {
        headers: { 'content-type': 'text/html;charset=UTF-8' },
      },
    )
  }

  return new Response('Date not found in list', { status: 404 })
}

const getPassages = async (passages: ReadingList, event: FetchEvent) => {
  const passage1 = passages.OT.replace(' ', '+')
  const passage2 = passages.NT.replace(' ', '+')
  const responses = await Promise.all([
    getPassageHTML(passage1, event),
    getPassageHTML(passage2, event),
  ])
  const jsons = await Promise.all([responses[0].json(), responses[1].json()])
  return [jsons[0].passages[0], jsons[1].passages[0]]
}

const getPassageHTML = async (passage: string, event: FetchEvent) => {
  const request = event.request
  const URI = `https://api.esv.org/v3/passage/html/?q=${passage}&include-audio-link=false`
  const cacheUrl = new URL(URI)
  const cacheKey = new Request(cacheUrl.toString(), request)
  const cache = caches.default
  let response = await cache.match(cacheKey)

  if (!response) {
    response = await fetch(URI, {
      headers: {
        Authorization: `Token ${ESV_API_KEY}`,
      },
    })

    response = new Response(response.body, response)

    response.headers.append('Cache-Control', 's-max-age=3600')

    event.waitUntil(cache.put(cacheKey, response.clone()))
  }
  return response
}

const generateHTML = ({
  firstPassage,
  secondPassage,
  date,
}: {
  firstPassage: string
  secondPassage: string
  date: string
}) => {
  const today = new Date(date)
  const dateString = today.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `
    <!DOCTYPE html>
    <html lang='en'>
      <head>
        <meta charset='UTF-8'>
        <meta name='viewport'
          content='width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0'>
        <meta http-equiv='X-UA-Compatible' content='ie=edge'>
        <meta name='description' content='Daily Bible readings from The Axis Church in Nashville, TN.'>
        <title>Readings for ${dateString}</title>
        <style>
          body {
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
            padding: 0 30px
          }
        </style>
      </head>
      <body>
        <h1 style='text-align:center;'>Readings for ${dateString}</h1>
        ${firstPassage}
        ${secondPassage}
      </body>
    </html>
  `
}
