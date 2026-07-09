---
name: Shared workspace constants convention
description: Where cross-artifact constant/type data should live to avoid drift between artifacts
---

When the same constant data or type (e.g. a taxonomy, cluster list, enum) is needed by more than one artifact (e.g. api-server and a frontend), define it once in a `lib/<name>` workspace package (`@workspace/<name>`) rather than duplicating the array/type in each artifact.

**Why:** Duplicated definitions (even partial ones, like a subset type + matching logic) silently drift when one copy is updated and the other isn't — e.g. a cluster's `filterTags` changing in the API but not in the frontend's matcher.

**How to apply:**
- Follow the existing `lib/*` package convention (see `lib/tsp-constants`, `lib/topic-clusters`): `package.json` with `"exports": { ".": "./src/index.ts" }`, no build step needed since consumers import the TS source directly via workspace protocol.
- Add `"@workspace/<name>": "workspace:*"` to each consuming artifact's `package.json` and run `pnpm install`.
- If a frontend only needs a subset of fields, use `Pick<SharedType, ...>` locally instead of re-declaring an ad hoc type.
- Runtime endpoints (e.g. `/api/topic-clusters`) that expose this data over HTTP for a frontend to fetch are fine to keep — the fix is for the *type/logic* to come from the shared package, not necessarily eliminating the network fetch.
