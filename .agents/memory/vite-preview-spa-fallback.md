---
name: Vite preview SPA routing
description: vite preview returns 404 for client-side routes; must add middleware to serve index.html as fallback
---

## Rule
All `kind: web` artifacts that use `vite preview` as their production serve command must include the `spa-preview-fallback` plugin in `vite.config.ts`. Without it, any client-side route (e.g. `/crypto-castle`, `/zones/zone-0`) that has no matching file in `dist/public` returns 404. Replit's deployment health checker treats non-200 as failure, fires SIGTERM, and restarts the whole deployment — eventually the deployment gives up and the site goes fully offline (000).

## Fix
Add to the `plugins` array in `vite.config.ts`:

```ts
{
  name: "spa-preview-fallback",
  configurePreviewServer(server) {
    server.middlewares.use((req, _res, next) => {
      const url = req.url ?? "/";
      // Rewrite non-file paths to "/" so Vite serves index.html
      if (!url.includes(".") && url !== "/") {
        req.url = "/";
      }
      next();
    });
  },
},
```

**Why:** `vite preview` serves static files from `dist/public` but has no history-API fallback. The dev server has this; preview does not. Any new client-side route that gets health-checked (e.g. when a new page is added) will immediately break the production deployment if this plugin is absent.

**How to apply:**
- Already added to `artifacts/stomping-paths/vite.config.ts`.
- Check `artifacts/headwaters`, `artifacts/codetry`, `artifacts/privacy-guide` if they get client-side routing health checks added in future.
- The `!url.includes(".")` check passes real assets (*.js, *.css, *.png) through normally; only path-only URLs get rewritten.
