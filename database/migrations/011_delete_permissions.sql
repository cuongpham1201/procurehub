-- Migration 011: Add suppliers:delete permission to Admin role

INSERT INTO role_permissions (role, permission) VALUES
  ('Admin', 'suppliers:delete')
ON CONFLICT (role, permission) DO NOTHING;
