-- Migration 010: Supplier email verification & forced password change
-- Adds email verification flow and must_change_password flag for new registrations

ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS email_verified     BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verification_token TEXT      UNIQUE,
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill: existing suppliers are already active, mark them as verified
UPDATE suppliers
SET email_verified = TRUE, must_change_password = FALSE
WHERE email_verified = FALSE;
