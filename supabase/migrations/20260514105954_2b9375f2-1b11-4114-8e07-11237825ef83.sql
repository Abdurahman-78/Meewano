
-- 1. host_verifications table
CREATE TABLE public.host_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  id_document_url TEXT,
  selfie_url TEXT,
  ownership_document_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  rejection_reason TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.host_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts manage own verification"
  ON public.host_verifications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all verifications"
  ON public.host_verifications FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE TRIGGER host_verifications_updated_at
  BEFORE UPDATE ON public.host_verifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. properties: approval columns
ALTER TABLE public.properties
  ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending','approved','rejected','changes_pending')),
  ADD COLUMN rejection_reason TEXT,
  ADD COLUMN pending_changes JSONB,
  ADD COLUMN reviewed_by UUID,
  ADD COLUMN reviewed_at TIMESTAMPTZ;

-- Auto-approve all existing properties so the live site doesn't break
UPDATE public.properties SET approval_status = 'approved', reviewed_at = now();

-- 3. property_reviews log
CREATE TABLE public.property_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  reviewer_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('approved','rejected','changes_approved','changes_rejected')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.property_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage property reviews"
  ON public.property_reviews FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "Hosts view reviews on their properties"
  ON public.property_reviews FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.host_id = auth.uid()));

-- 4. Trigger: on host insert/edit, queue pending review
CREATE OR REPLACE FUNCTION public.properties_approval_guard()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_admin BOOLEAN;
  changed BOOLEAN := false;
BEGIN
  is_admin := has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator');

  IF TG_OP = 'INSERT' THEN
    IF NOT is_admin THEN
      NEW.approval_status := 'pending';
      NEW.is_active := false;
      NEW.is_featured := false;
      NEW.pending_changes := NULL;
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE
  IF is_admin THEN
    RETURN NEW;
  END IF;

  -- Detect changes to monitored fields
  IF NEW.title IS DISTINCT FROM OLD.title
     OR NEW.description IS DISTINCT FROM OLD.description
     OR NEW.location IS DISTINCT FROM OLD.location
     OR NEW.city IS DISTINCT FROM OLD.city
     OR NEW.price_per_night IS DISTINCT FROM OLD.price_per_night
     OR NEW.bedrooms IS DISTINCT FROM OLD.bedrooms
     OR NEW.bathrooms IS DISTINCT FROM OLD.bathrooms
     OR NEW.max_guests IS DISTINCT FROM OLD.max_guests
     OR NEW.images IS DISTINCT FROM OLD.images
     OR NEW.amenities IS DISTINCT FROM OLD.amenities
     OR NEW.latitude IS DISTINCT FROM OLD.latitude
     OR NEW.longitude IS DISTINCT FROM OLD.longitude
  THEN
    changed := true;
  END IF;

  IF NOT changed THEN
    -- Allow non-monitored field updates (e.g. blocked_dates, rating)
    RETURN NEW;
  END IF;

  -- If property is currently approved & live: buffer changes, keep live row intact
  IF OLD.approval_status = 'approved' THEN
    NEW.pending_changes := jsonb_build_object(
      'title', NEW.title,
      'description', NEW.description,
      'location', NEW.location,
      'city', NEW.city,
      'price_per_night', NEW.price_per_night,
      'bedrooms', NEW.bedrooms,
      'bathrooms', NEW.bathrooms,
      'max_guests', NEW.max_guests,
      'images', NEW.images,
      'amenities', NEW.amenities,
      'latitude', NEW.latitude,
      'longitude', NEW.longitude
    );
    -- Revert monitored fields to OLD so live listing keeps the approved version
    NEW.title := OLD.title;
    NEW.description := OLD.description;
    NEW.location := OLD.location;
    NEW.city := OLD.city;
    NEW.price_per_night := OLD.price_per_night;
    NEW.bedrooms := OLD.bedrooms;
    NEW.bathrooms := OLD.bathrooms;
    NEW.max_guests := OLD.max_guests;
    NEW.images := OLD.images;
    NEW.amenities := OLD.amenities;
    NEW.latitude := OLD.latitude;
    NEW.longitude := OLD.longitude;
    NEW.approval_status := 'changes_pending';
  ELSE
    -- Pending/rejected listings: edits go through as-is and stay pending
    NEW.approval_status := 'pending';
    NEW.is_active := false;
    NEW.pending_changes := NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER properties_approval_guard_trigger
  BEFORE INSERT OR UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.properties_approval_guard();

-- 5. Storage bucket for host verification documents (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('host-documents', 'host-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Hosts upload own verification docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'host-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Hosts read own verification docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'host-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Hosts update own verification docs"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'host-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Hosts delete own verification docs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'host-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins read all host docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'host-documents'
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'))
  );
