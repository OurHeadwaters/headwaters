---
name: TSP RSS feed source
description: Where episode content comes from; why FEED_URL must never point at our own domain
---

## Rule
`FEED_URL` in `artifacts/api-server/src/lib/rss.ts` must point to `https://www.thesurvivalpodcast.com/feed/podcast`.

It is configurable via `process.env.TSP_FEED_URL` (env var override), defaulting to that URL.

**Why:** The Stomping Paths site curates Jack Spirko's The Survival Podcast archive. TSP itself does not host a podcast feed — `thestompingpaths.com` is our Vite SPA. Pointing FEED_URL at `${getSiteUrl()}/feed/podcast` (i.e. our own domain) caused every episode request to fail in production because the SPA returns `index.html` at that path, which the XML parser rejects with "Invalid RSS feed: no channel".

**How to apply:**
- Never reconstruct FEED_URL from `getSiteUrl()`.
- If the podcast moves to a new host, set `TSP_FEED_URL` in Replit Secrets — no code change needed.
- Confirmed working URL: `https://www.thesurvivalpodcast.com/feed/podcast` (HTTP 200, text/xml, 400 episodes as of June 2026).
- `/feed/mp3` on that domain returns 404 — use `/feed/podcast`.
