
CREATE TABLE public.refund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL,
  host_id uuid NOT NULL,
  property_id uuid NOT NULL,
  reason text NOT NULL,
  details text NOT NULL,
  evidence_urls text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending_host',
  host_decision_reason text,
  admin_decision text,
  admin_refund_pct numeric,
  refund_amount numeric,
  total_price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.refund_requests TO authenticated;
GRANT ALL ON public.refund_requests TO service_role;

ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guests view own refund requests"
  ON public.refund_requests FOR SELECT TO authenticated
  USING (guest_id = auth.uid());

CREATE POLICY "Hosts view refund requests for their properties"
  ON public.refund_requests FOR SELECT TO authenticated
  USING (host_id = auth.uid());

CREATE POLICY "Admins view all refund requests"
  ON public.refund_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Guests create own refund requests"
  ON public.refund_requests FOR INSERT TO authenticated
  WITH CHECK (guest_id = auth.uid());

CREATE TRIGGER refund_requests_updated_at
  BEFORE UPDATE ON public.refund_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX refund_requests_host_status_idx ON public.refund_requests (host_id, status);
CREATE INDEX refund_requests_status_idx ON public.refund_requests (status);
CREATE INDEX refund_requests_booking_idx ON public.refund_requests (booking_id);
