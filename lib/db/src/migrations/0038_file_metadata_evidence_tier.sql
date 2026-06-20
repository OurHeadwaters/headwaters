-- Add evidence_tier to file_metadata so Resource Library entries can be
-- tagged with an evidence quality level (0 = Foundational … 4 = Not Yet Reliable).
-- Editors set the tier via the admin file-metadata UI; visitors see a
-- colour-coded badge on resource cards in the public Resources page.

ALTER TABLE file_metadata
  ADD COLUMN IF NOT EXISTS evidence_tier INTEGER;
