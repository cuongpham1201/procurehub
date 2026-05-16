-- Phase 2: Award items + bid revision tracking
-- Safe to run multiple times (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
-- No existing data is modified or deleted.

-- 1. Bid revision tracking (for "Cần bổ sung" → supplier resubmits flow)
alter table bids
  add column if not exists revision_no   integer not null default 0,
  add column if not exists parent_bid_id text    references bids(id) on delete set null;

create index if not exists idx_bids_parent_bid_id on bids(parent_bid_id);

-- 2. Bid items: snapshot columns (captured at submission time from tender_items)
--    and per-line award status
alter table bid_items
  add column if not exists item_code             text,
  add column if not exists specification_snapshot text,
  add column if not exists quantity_snapshot     numeric,
  add column if not exists unit_snapshot         text,
  add column if not exists item_status           text not null default 'pending';

-- 3. Award items table — one row per tender_item per tender (upsert on conflict)
create table if not exists award_items (
  id              text        primary key,
  tender_id       text        not null references tenders(id)      on delete cascade,
  tender_item_id  text        not null references tender_items(id)  on delete cascade,
  bid_id          text        not null references bids(id)          on delete cascade,
  bid_item_id     text,
  supplier_id     text,
  supplier_name   text,
  unit_price      numeric     not null default 0,
  quantity        numeric     not null default 0,
  amount          numeric     not null default 0,
  note            text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint uq_award_tender_item unique (tender_item_id)
);

create index if not exists idx_award_items_tender_id on award_items(tender_id);
create index if not exists idx_award_items_bid_id    on award_items(bid_id);
