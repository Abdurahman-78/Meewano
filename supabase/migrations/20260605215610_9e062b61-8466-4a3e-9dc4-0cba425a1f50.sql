CREATE OR REPLACE FUNCTION public.properties_approval_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  -- Any monitored edit by the host sends the listing back to admin review
  -- and takes it offline until re-approved.
  NEW.approval_status := 'pending';
  NEW.is_active := false;
  NEW.pending_changes := NULL;

  RETURN NEW;
END;
$function$;