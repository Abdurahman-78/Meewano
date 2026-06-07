
-- 1) Blocked identities table
CREATE TABLE IF NOT EXISTS public.blocked_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  phone text,
  reason text,
  blocked_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS blocked_identities_email_uniq
  ON public.blocked_identities (email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS blocked_identities_phone_uniq
  ON public.blocked_identities (phone) WHERE phone IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.blocked_identities TO authenticated;
GRANT ALL ON public.blocked_identities TO service_role;

ALTER TABLE public.blocked_identities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage blocked identities" ON public.blocked_identities;
CREATE POLICY "Admins manage blocked identities"
  ON public.blocked_identities
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- 2) Signup guard: block banned email/phone at sign-up time
CREATE OR REPLACE FUNCTION public.block_signup_if_banned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.email <> '' AND EXISTS (
    SELECT 1 FROM public.blocked_identities WHERE email = lower(NEW.email)
  ) THEN
    RAISE EXCEPTION 'This email is not allowed to create an account.'
      USING ERRCODE = '42501';
  END IF;
  IF NEW.phone IS NOT NULL AND NEW.phone <> '' AND EXISTS (
    SELECT 1 FROM public.blocked_identities WHERE phone = NEW.phone
  ) THEN
    RAISE EXCEPTION 'This phone number is not allowed to create an account.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS block_signup_if_banned ON auth.users;
CREATE TRIGGER block_signup_if_banned
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.block_signup_if_banned();

-- 3) Admin-only ban RPC: records identity then deletes the user
CREATE OR REPLACE FUNCTION public.admin_ban_user(_user_id uuid, _reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_phone text;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')) THEN
    RAISE EXCEPTION 'Only admins can ban users';
  END IF;

  SELECT email, phone INTO v_email, v_phone FROM auth.users WHERE id = _user_id;
  IF v_email IS NULL AND v_phone IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF v_email IS NOT NULL AND v_email <> '' AND NOT EXISTS (
    SELECT 1 FROM public.blocked_identities WHERE email = lower(v_email)
  ) THEN
    INSERT INTO public.blocked_identities (email, reason, blocked_by)
    VALUES (lower(v_email), _reason, auth.uid());
  END IF;

  IF v_phone IS NOT NULL AND v_phone <> '' AND NOT EXISTS (
    SELECT 1 FROM public.blocked_identities WHERE phone = v_phone
  ) THEN
    INSERT INTO public.blocked_identities (phone, reason, blocked_by)
    VALUES (v_phone, _reason, auth.uid());
  END IF;

  DELETE FROM auth.users WHERE id = _user_id;

  RETURN jsonb_build_object('email', v_email, 'phone', v_phone);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_ban_user(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_ban_user(uuid, text) TO authenticated;
