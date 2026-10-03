-- ==============================================================================
-- FIX: Add missing 'role' column to profiles & update handle_new_user trigger
-- Run this in Supabase Dashboard -> SQL Editor -> Click 'Run'
-- (Contains NO demo data)
-- ==============================================================================

-- 1. Add 'role' column to public.profiles if it does not exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- 2. Update handle_new_user function to safely support 'role'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(TRIM(COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      CONCAT_WS(' ', NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'last_name'),
      NEW.raw_user_meta_data->>'name'
    )), ''),
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'phone', '')), ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name  = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
        phone      = COALESCE(public.profiles.phone, EXCLUDED.phone),
        email      = COALESCE(public.profiles.email, EXCLUDED.email),
        role       = COALESCE(public.profiles.role, EXCLUDED.role),
        updated_at = now();
  RETURN NEW;
END;
$$;
