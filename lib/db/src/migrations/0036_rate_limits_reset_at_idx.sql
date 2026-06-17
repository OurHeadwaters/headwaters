-- Index on reset_at so the periodic prune DELETE and the expiry CASE check
-- in the UPSERT stay fast as the table grows during traffic spikes.
CREATE INDEX IF NOT EXISTS rate_limits_reset_at_idx ON rate_limits (reset_at);
