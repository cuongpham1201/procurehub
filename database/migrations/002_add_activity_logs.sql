create table if not exists activity_logs (
  id text primary key,
  entity_type text not null,
  entity_id text not null,
  entity_name text,
  action text not null,
  actor_id text,
  actor_type text,
  actor_name text,
  actor_email text,
  description text not null,
  metadata jsonb,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_activity_logs_entity on activity_logs(entity_type, entity_id);
create index if not exists idx_activity_logs_action on activity_logs(action);
create index if not exists idx_activity_logs_actor_email on activity_logs(actor_email);
create index if not exists idx_activity_logs_created_at on activity_logs(created_at desc);
