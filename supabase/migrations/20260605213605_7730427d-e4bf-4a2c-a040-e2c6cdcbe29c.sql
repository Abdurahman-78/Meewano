DROP POLICY IF EXISTS "Anyone can view active or pending properties" ON public.properties;
CREATE POLICY "Anyone can view approved active properties"
ON public.properties FOR SELECT
USING (is_active = true AND approval_status = 'approved');