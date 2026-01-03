# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Cloudflare Worker that serves daily Bible readings for The Axis Church in Nashville, TN. The worker fetches reading schedules from Cloudflare KV storage and retrieves Bible passages from the ESV API, rendering them as cached HTML at `reading.sethaalexander.com`.

## Commands

```bash
npm run dev       # Start local dev server with Wrangler
npm run publish   # Deploy to Cloudflare Workers
npm run format    # Auto-format with Prettier
npm run lint      # ESLint + Prettier check (zero warnings enforced)
```

## Architecture

**Request flow:**

1. `src/index.ts` - Entry point, registers fetch event listener
2. `src/handler.ts` - Core logic: parses date from query param (defaults to current Central Time), fetches reading from KV, retrieves passages from ESV API, renders HTML

**External dependencies:**

- **Cloudflare KV** (`READING_PLAN_KV`): Stores reading schedules keyed by ISO date (e.g., `2026-01-01` → `{OT: "Genesis 1-2", NT: "Matthew 1"}`)
- **ESV API**: Returns HTML passages; requires `ESV_API_KEY` secret

**Caching strategy:**

- ESV API responses cached via Cloudflare Cache API with 1-hour TTL
- Uses `event.waitUntil()` for async cache population

## KV Data Management

Reading plans are uploaded via Wrangler CLI:

```bash
npx wrangler kv:bulk put --binding=READING_PLAN_KV ./kv_files/uploaded/YYYY/filename.json
```

Pre-built KV files live in `/kv_files/uploaded/` organized by year.

## Code Style

- Tabs for indentation
- No semicolons
- Single quotes
- Trailing commas
- 80-char line width
