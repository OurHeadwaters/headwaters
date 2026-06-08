---
name: Stomping-paths type quirks
description: Non-obvious type mismatches in stomping-paths that caused TS errors
---

## EpisodeDetail vs historySegment
`EpisodeDetail` in `lib/api-client-react/dist/generated/api.schemas.d.ts` is typed as
`Episode & ({ descriptionHtml, seriesSlug, positionInSeries })` — it does NOT include
`historySegment`. That field lives on `ThisDayEpisode`. Access via `(episode as any).historySegment`.

**Why:** The orval-generated type is a narrow intersection; the runtime API may include
`historySegment` but it's not reflected in the dist type.

## ZoneSummary has no `id` or `label`
`ZoneSummary` has `slug`, `name`, `subtitle`, `number`, etc. Use `z.slug` for URL params
and `z.name` for display text. No `id` or `label` fields exist.

## LibraryPage has no `fieldNotes`
`LibraryPage` = `{ items, total, limit, offset }`. The `fieldNotes` field is a runtime
extension not reflected in the schema. Cast `(libraryPage as any).fieldNotes` to access.

## SyncStatus shape: bySource vs top-level keys
`SyncStatus` has `bySource: Record<string, SourceStatus>` and `relayHealth`.
Source-specific statuses (e.g. `"fireside-freedom"`) must go through `bySource`, not
accessed directly on `syncStatus`.

## expo-file-system v19 legacy API
With `moduleResolution: "bundler"`, `expo-file-system/legacy` is NOT resolvable (not in
`exports` field). Fix missing legacy symbols:
- `documentDirectory`: cast `(FileSystem as unknown as { documentDirectory: string | null })`
- `DownloadResumable` type: use `ReturnType<typeof FileSystem.createDownloadResumable>`
- `DownloadProgressData` type: use inline `{ totalBytesWritten: number; totalBytesExpectedToWrite: number }`

## TS7030 in useEffect with conditional return
`noImplicitReturns` triggers TS7030 when a useEffect callback returns a cleanup in
one branch but nothing in another. Fix by hoisting the timeout variable and always
returning a cleanup: `let t: ReturnType<typeof setTimeout> | undefined; ... return () => { if (t) clearTimeout(t); };`
