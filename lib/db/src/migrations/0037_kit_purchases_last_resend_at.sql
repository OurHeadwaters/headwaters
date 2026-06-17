-- Add last_resend_at to kit_purchases so the API can record when a buyer
-- last requested an access link via POST /api/kits/:slug/resend-access.
-- The My Kits page reads this value and shows a "Last sent: <relative time>"
-- label below the Re-send button to prevent repeated presses.

ALTER TABLE kit_purchases
  ADD COLUMN IF NOT EXISTS last_resend_at TIMESTAMPTZ;
