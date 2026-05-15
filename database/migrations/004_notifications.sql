create table if not exists notifications (
  id           text        primary key,
  user_id      text        not null,
  user_kind    text        not null default 'internal', -- 'internal' | 'supplier'
  type         text        not null,
  title        text        not null,
  message      text        not null,
  link         text,
  is_read      boolean     not null default false,
  metadata     jsonb       not null default '{}',
  created_at   timestamptz not null default now(),
  read_at      timestamptz
);

create index if not exists idx_notifications_user
  on notifications(user_id, user_kind);

create index if not exists idx_notifications_unread
  on notifications(user_id, user_kind, is_read)
  where is_read = false;

create index if not exists idx_notifications_created
  on notifications(created_at desc);
