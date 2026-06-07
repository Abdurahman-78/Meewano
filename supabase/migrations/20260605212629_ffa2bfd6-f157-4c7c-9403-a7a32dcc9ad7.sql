DROP POLICY IF EXISTS "Anyone can view active properties" ON public.properties;

CREATE POLICY "Anyone can view active or pending properties"
ON public.properties
FOR SELECT
USING (is_active = true OR approval_status IN ('pending', 'changes_pending'));