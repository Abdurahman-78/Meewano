
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(TRIM(COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      CONCAT_WS(' ', NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'last_name'),
      NEW.raw_user_meta_data->>'name'
    )), '')
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
        email = COALESCE(public.profiles.email, EXCLUDED.email);
  RETURN NEW;
END;
$$;

-- Backfill existing profiles missing full_name
UPDATE public.profiles p
SET full_name = NULLIF(TRIM(COALESCE(
  u.raw_user_meta_data->>'full_name',
  CONCAT_WS(' ', u.raw_user_meta_data->>'first_name', u.raw_user_meta_data->>'last_name'),
  u.raw_user_meta_data->>'name'
)), '')
FROM auth.users u
WHERE u.id = p.id
  AND (p.full_name IS NULL OR p.full_name = '');
