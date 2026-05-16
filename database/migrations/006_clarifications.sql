-- Clarification workflow: admin yêu cầu làm rõ → supplier phản hồi
-- Lưu history/timeline đầy đủ trong PostgreSQL

CREATE TABLE IF NOT EXISTS bid_clarifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  bid_id TEXT NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
  tender_id TEXT NOT NULL,
  -- Request side (admin)
  requested_by TEXT NOT NULL,
  requested_by_name TEXT NOT NULL,
  request_note TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Response side (supplier)
  responded_by TEXT,
  responded_by_name TEXT,
  response_note TEXT,
  responded_at TIMESTAMPTZ,
  -- Status
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'responded'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bid_clarifications_bid_id
  ON bid_clarifications(bid_id);

CREATE INDEX IF NOT EXISTS idx_bid_clarifications_tender_id
  ON bid_clarifications(tender_id);
