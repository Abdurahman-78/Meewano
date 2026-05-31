
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS newsletter_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;

CREATE TABLE IF NOT EXISTS public.newsletters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  preview_text text,
  content text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  sent_at timestamptz,
  sent_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletters TO authenticated;
GRANT ALL ON public.newsletters TO service_role;

ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage newsletters"
  ON public.newsletters
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER newsletters_updated_at
  BEFORE UPDATE ON public.newsletters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
