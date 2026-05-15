-- Add password_hash and last_login_at to both tables
-- Safe to run multiple times (IF NOT EXISTS / DO NOTHING pattern)

alter table internal_users
  add column if not exists password_hash text,
  add column if not exists last_login_at timestamptz;

alter table suppliers
  add column if not exists password_hash text,
  add column if not exists last_login_at timestamptz;
