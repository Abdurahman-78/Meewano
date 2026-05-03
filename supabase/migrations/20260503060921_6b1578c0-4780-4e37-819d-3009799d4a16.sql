
-- ============================================================================
-- BLOG SYSTEM
-- ============================================================================

CREATE TABLE public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_ar TEXT,
  name_ku TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  author_id UUID NOT NULL,
  category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  title_en TEXT NOT NULL,
  title_ar TEXT,
  title_ku TEXT,
  excerpt_en TEXT,
  excerpt_ar TEXT,
  excerpt_ku TEXT,
  content_en TEXT NOT NULL,
  content_ar TEXT,
  content_ku TEXT,
  cover_image TEXT,
  meta_title TEXT,
  meta_description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  published_at TIMESTAMPTZ,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.blog_post_tags (
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  tag_id  UUID NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

CREATE INDEX idx_blog_posts_status_published ON public.blog_posts(status, published_at DESC);
CREATE INDEX idx_blog_posts_category ON public.blog_posts(category_id);

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view blog categories" ON public.blog_categories FOR SELECT USING (true);
CREATE POLICY "Admins manage blog categories" ON public.blog_categories FOR ALL USING (has_role(auth.uid(),'admin'));

CREATE POLICY "Anyone can view blog tags" ON public.blog_tags FOR SELECT USING (true);
CREATE POLICY "Admins manage blog tags" ON public.blog_tags FOR ALL USING (has_role(auth.uid(),'admin'));

CREATE POLICY "Anyone can view published posts" ON public.blog_posts FOR SELECT USING (status = 'published' OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage blog posts" ON public.blog_posts FOR ALL USING (has_role(auth.uid(),'admin'));

CREATE POLICY "Anyone can view post tags" ON public.blog_post_tags FOR SELECT USING (true);
CREATE POLICY "Admins manage post tags" ON public.blog_post_tags FOR ALL USING (has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_blog_posts_updated
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- CONVERSION TRACKING
-- ============================================================================

CREATE TABLE public.conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('property_view','booking_started','booking_completed','search')),
  user_id UUID,
  property_id UUID,
  booking_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversion_events_type_date ON public.conversion_events(event_type, created_at DESC);
CREATE INDEX idx_conversion_events_property ON public.conversion_events(property_id);

ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record conversion events" ON public.conversion_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view conversion events" ON public.conversion_events FOR SELECT USING (has_role(auth.uid(),'admin'));

-- ============================================================================
-- ADMIN ACTIVITY LOG
-- ============================================================================

CREATE TABLE public.admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_activity_date ON public.admin_activity_log(created_at DESC);
CREATE INDEX idx_admin_activity_admin ON public.admin_activity_log(admin_id);

ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view activity log" ON public.admin_activity_log FOR SELECT USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Authenticated users can insert activity" ON public.admin_activity_log FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- PHONE VERIFICATION (WhatsApp OTP)
-- ============================================================================

CREATE TABLE public.phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_phone_verifications_user ON public.phone_verifications(user_id, created_at DESC);

ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own verifications" ON public.phone_verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage verifications" ON public.phone_verifications FOR ALL USING (has_role(auth.uid(),'admin'));

-- Add phone_verified flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false;

-- ============================================================================
-- BACKUP RUNS
-- ============================================================================

CREATE TABLE public.backup_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed')),
  file_path TEXT,
  file_size_bytes BIGINT,
  tables_included TEXT[] DEFAULT '{}',
  row_count INTEGER,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.backup_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view backup runs" ON public.backup_runs FOR SELECT USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Service role manages backup runs" ON public.backup_runs FOR ALL USING (has_role(auth.uid(),'admin'));

-- Storage bucket for backups (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('backups','backups', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins read backups" ON storage.objects FOR SELECT
  USING (bucket_id = 'backups' AND has_role(auth.uid(),'admin'));
