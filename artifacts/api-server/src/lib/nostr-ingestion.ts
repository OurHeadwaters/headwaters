/**
 * Nostr ingestion service — pulls kind-1 notes for Bobbie Parr's npub using
 * nostr-tools SimplePool, upserts new ones into curated_items, and runs
 * the auto-classifier on each new record.
 *
 * Runs once at server startup and then every 24 hours.
 */

import WebSocket from "ws";
import { useWebSocketImplementation } from "nostr-tools/relay";
import { SimplePool } from "nostr-tools/pool";
import type { Event as NostrEvent } from "nostr-tools/core";
import { db, curatedItemsTable } from "@workspace/db";
import { classifyText } from "./field-note-classifier";
import { logger } from "./logger";

// Inject ws package as the WebSocket implementation for Node.js
useWebSocketImplementation(WebSocket as unknown as typeof globalThis.WebSocket);

const NPUB_HEX =
  "404004ddcabcf2e60680417bf4b66bb5df7784f8cdbe8fcb001cb1156fae3e5d";

const RELAYS = ["wss://relay.damus.io", "wss://nos.lol"];

const DAILY_MS = 24 * 60 * 60 * 1000;

/**
 * Upsert a deduplicated set of events into the DB.
 * Returns the count of newly inserted rows.
 */
async function ingestEvents(events: NostrEvent[]): Promise<number> {
  const seen = new Map<string, NostrEvent>();
  for (const ev of events) {
    if (!seen.has(ev.id)) seen.set(ev.id, ev);
  }

  let inserted = 0;

  for (const ev of seen.values()) {
    if (!ev.content?.trim()) continue;

    try {
      const tags = classifyText(ev.content);
      const createdAt = new Date(ev.created_at * 1000);

      const result = await db
        .insert(curatedItemsTable)
        .values({
          sourceType: "nostr",
          externalId: ev.id,
          rawContent: ev.content,
          tags,
          published: true,
          createdAt,
        })
        .onConflictDoNothing()
        .returning({ id: curatedItemsTable.id });

      if (result.length > 0) inserted++;
    } catch (err) {
      logger.warn({ err, eventId: ev.id }, "nostr: failed to upsert event");
    }
  }

  return inserted;
}

async function runIngestion(): Promise<void> {
  logger.info("nostr: starting ingestion run");

  const pool = new SimplePool();

  try {
    const events = await pool.querySync(
      RELAYS,
      { kinds: [1], authors: [NPUB_HEX], limit: 5000 },
      { maxWait: 30_000 },
    );

    logger.info(
      { relay: RELAYS.join(", "), count: events.length },
      "nostr: events fetched",
    );

    const inserted = await ingestEvents(events);
    logger.info(
      { inserted, total: events.length },
      "nostr: ingestion run complete",
    );
  } catch (err) {
    logger.warn({ err }, "nostr: ingestion run failed (non-fatal)");
  } finally {
    pool.close(RELAYS);
  }
}

let scheduled = false;

export function startNostrIngestion(): void {
  if (scheduled) return;
  scheduled = true;

  runIngestion().catch((err) =>
    logger.warn({ err }, "nostr: startup ingestion failed"),
  );

  setInterval(() => {
    runIngestion().catch((err) =>
      logger.warn({ err }, "nostr: scheduled ingestion failed"),
    );
  }, DAILY_MS);
}
