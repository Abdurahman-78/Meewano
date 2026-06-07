DROP TRIGGER IF EXISTS properties_approval_guard_trigger ON public.properties;
CREATE TRIGGER properties_approval_guard_trigger
BEFORE INSERT OR UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.properties_approval_guard();

-- Reset any currently-live properties owned by hosts that never went through approval
UPDATE public.properties
SET approval_status = 'pending', is_active = false
WHERE approval_status IS DISTINCT FROM 'approved'
  AND is_active = true;