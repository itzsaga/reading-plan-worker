# The Axis Church Reading Plan Worker

[![Deploy](https://github.com/itzsaga/reading-plan-worker/actions/workflows/publish-worker.yml/badge.svg)](https://github.com/itzsaga/reading-plan-worker/actions/workflows/publish-worker.yml) [![Better Uptime Badge](https://betteruptime.com/status-badges/v1/monitor/cfcx.svg)](https://setha.betteruptime.com/)

While attempting to keep up with the daily reading I frequently found myself without the reading cards. Even though I can download them digitally, being a developer I wanted to try out something different. This worker is the results.

## Features

- The reading info is uploaded using the [wrangler cli kv:bulk](https://developers.cloudflare.com/workers/cli-wrangler/commands#kvbulk) functionality.
  - Already uploaded files can be found in the [/kv_files/uploaded/](./kv_files/uploaded/) directory.
- Defaults to reading from the KV store todays date values.
- Accepts a query parameter to load readings from other days e.g. `?date=2021-09-01`.
- Queries the text from the [ESV API](https://api.esv.org/) and cahces the response to ensure rate limits are note exceeded and response times stay super fast.

## TODO

- Add forward and back buttons to each page for easier navigation if playing catch up or wanting to read ahead.
- Wire up CICD to automatically bulk upload new files from a `/kv_files/to_upload` directory then move then to `/kv_files/uploaded` on merge to `main` to facilitate anyone writing those files and opening a PR to get them added.
- Tests.
