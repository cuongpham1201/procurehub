-- Migration 008: File uploads metadata table
-- Run: psql $DATABASE_URL -f database/migrations/008_uploads.sql

CREATE TABLE IF NOT EXISTS uploads (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  entity_type      TEXT NOT NULL,   -- 'supplier' | 'bid' | 'tender' | 'clarification'
  entity_id        TEXT NOT NULL,
  uploaded_by      TEXT,
  uploaded_by_kind TEXT,            -- 'internal' | 'supplier'
  filename         TEXT NOT NULL,   -- original user-visible name
  stored_name      TEXT NOT NULL,   -- UUID-based disk filename (never guessable)
  mime_type        TEXT,
  size_bytes       BIGINT,
  purpose          TEXT,            -- 'capability_doc' | 'bid_attachment' | 'tender_spec' | 'clarification_attachment'
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uploads_entity      ON uploads(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_uploads_uploaded_by ON uploads(uploaded_by);
