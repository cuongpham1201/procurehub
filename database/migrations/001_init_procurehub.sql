create table if not exists suppliers (
  id text primary key,
  company_name text not null,
  tax_code text,
  contact_name text,
  email text,
  phone text,
  password text,
  profile_completed boolean default false,
  status text,
  address text,
  province text,
  website text,
  business_description text,
  categories jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  raw_data jsonb not null default '{}'::jsonb
);

create index if not exists idx_suppliers_status on suppliers(status);
create index if not exists idx_suppliers_tax_code on suppliers(tax_code);
create index if not exists idx_suppliers_email on suppliers(email);

create table if not exists tenders (
  id text primary key,
  code text unique,
  title text not null,
  category text,
  status text,
  deadline date,
  estimated_value numeric,
  description text,
  delivery_location text,
  delivery_time text,
  payment_terms text,
  document_requirements jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  raw_data jsonb not null default '{}'::jsonb
);

create index if not exists idx_tenders_code on tenders(code);
create index if not exists idx_tenders_status on tenders(status);
create index if not exists idx_tenders_category on tenders(category);
create index if not exists idx_tenders_deadline on tenders(deadline);

create table if not exists tender_items (
  id text primary key,
  tender_id text not null references tenders(id) on delete cascade,
  material_id text,
  material_code text,
  item_name text not null,
  specification text,
  quantity numeric,
  unit text,
  note text,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  raw_data jsonb not null default '{}'::jsonb
);

create index if not exists idx_tender_items_tender_id on tender_items(tender_id);

create table if not exists bids (
  id text primary key,
  bid_code text,
  tender_id text references tenders(id) on delete set null,
  tender_code text,
  tender_title text,
  supplier_id text references suppliers(id) on delete set null,
  supplier_name text,
  supplier_email text,
  supplier_phone text,
  status text,
  submitted_at timestamptz,
  total_amount numeric,
  delivery_time text,
  payment_terms text,
  warranty_policy text,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  raw_data jsonb not null default '{}'::jsonb
);

create index if not exists idx_bids_bid_code on bids(bid_code);
create index if not exists idx_bids_status on bids(status);
create index if not exists idx_bids_tender_id on bids(tender_id);
create index if not exists idx_bids_supplier_id on bids(supplier_id);
create index if not exists idx_bids_submitted_at on bids(submitted_at);

create table if not exists bid_items (
  id text primary key,
  bid_id text not null references bids(id) on delete cascade,
  tender_item_id text,
  item_name text not null,
  specification text,
  quantity numeric,
  unit text,
  unit_price numeric,
  amount numeric,
  brand text,
  origin text,
  delivery_time text,
  note text,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  raw_data jsonb not null default '{}'::jsonb
);

create index if not exists idx_bid_items_bid_id on bid_items(bid_id);
create index if not exists idx_bid_items_tender_item_id on bid_items(tender_item_id);

create table if not exists procurement_groups (
  id text primary key,
  code text,
  name text not null,
  description text,
  status text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  raw_data jsonb not null default '{}'::jsonb
);

create index if not exists idx_procurement_groups_status on procurement_groups(status);
create index if not exists idx_procurement_groups_code on procurement_groups(code);

create table if not exists material_items (
  id text primary key,
  category_id text references procurement_groups(id) on delete set null,
  category_name text,
  material_code text,
  material_name text not null,
  specification text,
  unit text,
  description text,
  status text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  raw_data jsonb not null default '{}'::jsonb
);

create index if not exists idx_material_items_category_id on material_items(category_id);
create index if not exists idx_material_items_material_code on material_items(material_code);
create index if not exists idx_material_items_status on material_items(status);

create table if not exists internal_users (
  id text primary key,
  full_name text not null,
  email text,
  password text,
  role text,
  department text,
  status text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  raw_data jsonb not null default '{}'::jsonb
);

create index if not exists idx_internal_users_email on internal_users(email);
create index if not exists idx_internal_users_role on internal_users(role);
create index if not exists idx_internal_users_status on internal_users(status);

create table if not exists audit_events (
  id text primary key,
  type text,
  title text not null,
  description text,
  entity_type text,
  entity_id text,
  entity_code text,
  actor_name text,
  actor_role text,
  created_at timestamptz default now(),
  raw_data jsonb not null default '{}'::jsonb
);

create index if not exists idx_audit_events_type on audit_events(type);
create index if not exists idx_audit_events_entity on audit_events(entity_type, entity_id);
create index if not exists idx_audit_events_created_at on audit_events(created_at desc);
