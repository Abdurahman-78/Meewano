-- Attach handle_new_user trigger to auth.users (was missing, so profiles weren't auto-created)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Attach admin role auto-assignment trigger
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_assign_admin_role();

-- Backfill missing profiles for existing auth users
INSERT INTO public.profiles (id, email, full_name, phone)
SELECT
  u.id,
  u.email,
  NULLIF(TRIM(COALESCE(
    u.raw_user_meta_data->>'full_name',
    CONCAT_WS(' ', u.raw_user_meta_data->>'first_name', u.raw_user_meta_data->>'last_name'),
    u.raw_user_meta_data->>'name'
  )), ''),
  NULLIF(TRIM(COALESCE(u.raw_user_meta_data->>'phone', '')), '')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Also fill empty profile rows (id exists but email/name blank) from auth metadata
UPDATE public.profiles p
SET
  email = COALESCE(NULLIF(p.email, ''), u.email),
  full_name = COALESCE(NULLIF(p.full_name, ''), NULLIF(TRIM(COALESCE(
    u.raw_user_meta_data->>'full_name',
    CONCAT_WS(' ', u.raw_user_meta_data->>'first_name', u.raw_user_meta_data->>'last_name'),
    u.raw_user_meta_data->>'name'
  )), '')),
  phone = COALESCE(NULLIF(p.phone, ''), NULLIF(TRIM(COALESCE(u.raw_user_meta_data->>'phone', '')), ''))
FROM auth.users u
WHERE p.id = u.id
  AND (p.email IS NULL OR p.full_name IS NULL);