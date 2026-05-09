-- ============================================================
-- Seed User Roles
-- Jalankan setelah membuat user di Supabase Auth
-- ============================================================

-- Assign role to existing users
-- Ganti <USER_ID> dengan ID user dari Supabase Auth

-- Example: Assign 'owner' role to first admin
-- INSERT INTO user_roles (user_id, role) VALUES 
--   ('<USER_ID>', 'owner')
-- ON CONFLICT (user_id) DO UPDATE SET role = 'owner';

-- Example: Assign 'admin' role
-- INSERT INTO user_roles (user_id, role) VALUES 
--   ('<USER_ID>', 'admin')
-- ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Example: Assign 'kasir' role
-- INSERT INTO user_roles (user_id, role) VALUES 
--   ('<USER_ID>', 'kasir')
-- ON CONFLICT (user_id) DO UPDATE SET role = 'kasir';

-- Query untuk melihat semua users dan roles:
-- SELECT 
--   u.id,
--   u.email,
--   ur.role,
--   ur.created_at
-- FROM auth.users u
-- LEFT JOIN user_roles ur ON u.id = ur.user_id;

-- Query untuk update role user:
-- UPDATE user_roles 
-- SET role = 'admin' 
-- WHERE user_id = '<USER_ID>';
