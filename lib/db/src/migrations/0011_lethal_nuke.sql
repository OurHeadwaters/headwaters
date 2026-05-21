-- Step 1: Remove duplicate RSVPs, keeping the earliest row (MIN id) per
-- (event_id, attendee_email) group so historic duplicates don't block index creation.
DELETE FROM "ground_event_rsvps"
WHERE id NOT IN (
  SELECT MIN(id)
  FROM "ground_event_rsvps"
  GROUP BY event_id, attendee_email
);

-- Step 2: Reconcile rsvp_count on every event so it matches the deduplicated rows.
-- Events with no remaining RSVPs are set to 0.
UPDATE "ground_events" ge
SET rsvp_count = COALESCE(counts.n, 0)
FROM (
  SELECT event_id, COUNT(*)::int AS n
  FROM "ground_event_rsvps"
  GROUP BY event_id
) counts
WHERE ge.id = counts.event_id;

-- Reset any events that now have zero RSVPs (not matched in the subquery above).
UPDATE "ground_events"
SET rsvp_count = 0
WHERE id NOT IN (SELECT DISTINCT event_id FROM "ground_event_rsvps");

-- Step 3: Enforce uniqueness going forward.
CREATE UNIQUE INDEX "ground_event_rsvps_event_id_email_udx" ON "ground_event_rsvps" USING btree ("event_id","attendee_email");
