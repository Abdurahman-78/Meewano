
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS cleaning_policy text,
  ADD COLUMN IF NOT EXISTS welcome_message text,
  ADD COLUMN IF NOT EXISTS minimum_nights integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS check_in_time text DEFAULT '15:00',
  ADD COLUMN IF NOT EXISTS check_out_time text DEFAULT '11:00';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payout_method text,
  ADD COLUMN IF NOT EXISTS payout_details jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS welcome_email_sent_at timestamptz;
