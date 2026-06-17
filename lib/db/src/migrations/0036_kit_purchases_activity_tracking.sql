-- Add activity-tracking columns to kit_purchases for expiry-reminder emails.
--
-- last_verified_at      — stamped each time a buyer's HMAC token is successfully
--                         verified via GET /api/kits/:slug/access.  Used by the
--                         expiry-reminder job to find sessions about to expire.
--
-- expiry_reminder_sent_at — stamped after a reminder email is dispatched so the
--                           job skips already-reminded rows within the same session
--                           cycle.

ALTER TABLE kit_purchases
  ADD COLUMN IF NOT EXISTS last_verified_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expiry_reminder_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS kit_purchases_last_verified_at_idx
  ON kit_purchases (last_verified_at);
