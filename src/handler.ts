import { readingList2021 } from './2021List'
declare var ESV_API_KEY: string
declare var READING_PLAN_KV: KVNamespace

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

const generateHTML = (firstPassage: string, secondPassage: string) => {
  const today = new Date()
  const dateString = today.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `<!DOCTYPE html>
  <head>
    <style type='text/css'>
      body {
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
        padding: 0 30px
      }
    </style>
  </head>
  <body>
    <h1 style="text-align:center;">Readings for ${dateString}</h1>
    ${firstPassage}
    ${secondPassage}
  </body>`
}

export async function handleRequest(event: FetchEvent): Promise<Response> {
  // If a date is present in the date search param
  const { searchParams } = new URL(event.request.url)
  const date = searchParams.get('date')
  if (date && Object.keys(readingList2021).includes(date)) {
    const passages = await getPassages(date, event)
    return new Response(generateHTML(passages[0], passages[1]), {
      headers: { 'content-type': 'text/html;charset=UTF-8' },
    })
  }

  // If a date is present in query but not in list
  if (date && !Object.keys(readingList2021).includes(date)) {
    return new Response('Date not found in list', { status: 404 })
  }

  // Fallback to current date
  const dateObj = new Date()
  const dateString = dateObj.toISOString().split('T')[0]
  if (Object.keys(readingList2021).includes(dateString)) {
    const passages = await getPassages(dateString, event)
    return new Response(generateHTML(passages[0], passages[1]), {
      headers: { 'content-type': 'text/html;charset=UTF-8' },
    })
  }

  // Final fallback if date isn't in object
  return new Response('Date not found in list', { status: 404 })
}

const getPassages = async (date: string, event: FetchEvent) => {
  const passages = readingList2021[date]
  const passage1 = passages.OT.replace(' ', '+')
  const passage2 = passages.NT.replace(' ', '+')
  const responses = await Promise.all([
    getPassageHTML(passage1, event),
    getPassageHTML(passage2, event),
  ])
  const jsons = await Promise.all([responses[0].json(), responses[1].json()])
  return [jsons[0].passages[0], jsons[1].passages[0]]
}
