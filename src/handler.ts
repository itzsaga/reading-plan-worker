declare let ESV_API_KEY: string
declare let READING_PLAN_KV: KVNamespace

interface ReadingList {
  OT: string
  NT: string
}

const responseHeaders = {
  headers: { 'content-type': 'text/html;charset=UTF-8' },
}

export async function handleRequest(event: FetchEvent): Promise<Response> {
  const { searchParams } = new URL(event.request.url);

  const centralTimeDate = new Date().toLocaleString('en-US', {
    timeZone: 'America/Chicago',
  })
  const dateObj = new Date(centralTimeDate)
  const date = searchParams.get('date') ?? dateObj.toISOString().split('T')[0]

  const kvValue: ReadingList | null = await READING_PLAN_KV.get(date, 'json')

  if (kvValue) {
    const passages = await getPassages(kvValue, event)

    return new Response(
      generateHTML({
        firstPassage: passages[0],
        secondPassage: passages[1],
        date,
      }),
      { ...responseHeaders },
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
  // @ts-expect-error untyped json response
  return [jsons[0].passages[0], jsons[1].passages[0]]
}

const getPassageHTML = async (passage: string, event: FetchEvent) => {
  const URI = `https://api.esv.org/v3/passage/html/?q=${passage}&include-audio-link=false&include-short-copyright=false&include-footnotes=false`
  const cache = caches.default
  let response = await cache.match(URI)

  if (!response) {
    response = await fetch(URI, {
      headers: {
        Authorization: `Token ${ESV_API_KEY}`,
      },
    })

    response = new Response(response.body, response)

    response.headers.append('Cache-Control', 's-max-age=3600')

    event.waitUntil(cache.put(URI, response.clone()))
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
        <div style='text-align:center'>
          <p>Copyright</p>
          <p>Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), copyright © 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved. The ESV text may not be quoted in any publication made available to the public by a Creative Commons license. The ESV may not be translated into any other language.</p>
          <p>Users may not copy or download more than 500 verses of the ESV Bible or more than one half of any book of the ESV Bible.</p>
        </div>
      </body>
    </html>
  `
}
