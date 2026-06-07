
CREATE OR REPLACE FUNCTION public.recompute_property_rating(_property_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg numeric;
  v_count integer;
BEGIN
  SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0), COUNT(*)
    INTO v_avg, v_count
  FROM public.reviews
  WHERE property_id = _property_id;

  UPDATE public.properties
     SET rating = v_avg,
         review_count = v_count
   WHERE id = _property_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reviews_sync_property_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recompute_property_rating(OLD.property_id);
    RETURN OLD;
  ELSE
    PERFORM public.recompute_property_rating(NEW.property_id);
    IF TG_OP = 'UPDATE' AND NEW.property_id <> OLD.property_id THEN
      PERFORM public.recompute_property_rating(OLD.property_id);
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS reviews_sync_property_rating_trg ON public.reviews;
CREATE TRIGGER reviews_sync_property_rating_trg
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.reviews_sync_property_rating();
