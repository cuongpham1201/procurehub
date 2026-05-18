-- Migration 009: Dynamic role permissions table
-- Allows admin to manage role permissions via UI instead of hardcoded values

CREATE TABLE IF NOT EXISTS role_permissions (
  role        TEXT NOT NULL,
  permission  TEXT NOT NULL,
  PRIMARY KEY (role, permission)
);

-- Seed with current defaults from lib/auth/rbac.ts
INSERT INTO role_permissions (role, permission) VALUES
  ('Admin', 'admin:full'),
  ('Admin', 'tenders:read'),
  ('Admin', 'tenders:write'),
  ('Admin', 'tenders:publish'),
  ('Admin', 'tenders:delete'),
  ('Admin', 'suppliers:read'),
  ('Admin', 'suppliers:write'),
  ('Admin', 'suppliers:approve'),
  ('Admin', 'bids:read'),
  ('Admin', 'bids:evaluate'),
  ('Admin', 'users:manage'),
  ('Admin', 'reports:read'),

  ('Trưởng phòng vật tư', 'tenders:read'),
  ('Trưởng phòng vật tư', 'tenders:write'),
  ('Trưởng phòng vật tư', 'tenders:publish'),
  ('Trưởng phòng vật tư', 'suppliers:read'),
  ('Trưởng phòng vật tư', 'suppliers:write'),
  ('Trưởng phòng vật tư', 'suppliers:approve'),
  ('Trưởng phòng vật tư', 'bids:read'),
  ('Trưởng phòng vật tư', 'bids:evaluate'),
  ('Trưởng phòng vật tư', 'reports:read'),

  ('Kế hoạch vật tư', 'tenders:read'),
  ('Kế hoạch vật tư', 'tenders:write'),
  ('Kế hoạch vật tư', 'suppliers:read'),
  ('Kế hoạch vật tư', 'bids:read'),
  ('Kế hoạch vật tư', 'reports:read'),

  ('Ban giám đốc', 'tenders:read'),
  ('Ban giám đốc', 'tenders:publish'),
  ('Ban giám đốc', 'suppliers:read'),
  ('Ban giám đốc', 'suppliers:approve'),
  ('Ban giám đốc', 'bids:read'),
  ('Ban giám đốc', 'bids:evaluate'),
  ('Ban giám đốc', 'reports:read'),

  ('Chỉ xem', 'tenders:read'),
  ('Chỉ xem', 'suppliers:read'),
  ('Chỉ xem', 'bids:read'),
  ('Chỉ xem', 'reports:read')

ON CONFLICT (role, permission) DO NOTHING;
