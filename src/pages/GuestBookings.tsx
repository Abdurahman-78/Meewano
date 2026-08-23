import { useEffect, useState } from "react";
import { Calendar, MapPin, X, Loader2, MessageSquare, FileText, Info } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { createNotification } from "@/hooks/useNotifications";
import ReviewDialog from "@/components/ReviewDialog";
import { CancellationSummaryDialog } from "@/components/CancellationSummaryDialog";
import {
  getCancelledStatusInfo,
  type BookingWithRefundInfo,
  type RefundRequestRecord,
} from "@/lib/cancellationStatus";
import { toast } from "sonner";

interface BookingRow {
  id: string;
  property_id: string;
  host_id: string;
  check_in: string;
  check_out: string;
  total_price: number;
  status: string;
  refund_status?: string | null;
  refund_amount?: number | null;
  cancellation_reason?: string | null;
  cancellation_category?: string | null;
  cancelled_at?: string | null;
  created_at?: string;
  properties?: {
    id?: string;
    title: string;
    location: string;
    images: string[];
    cancellation_policy?: string | null;
  } | null;
  has_review?: boolean;
}

const statusColor: Record<string, string> = {
  confirmed: "bg-emerald-600 hover:bg-emerald-600 text-white",
  pending: "bg-amber-500 hover:bg-amber-500 text-white",
  cancelled: "bg-red-500 hover:bg-red-500 text-white",
  rejected: "bg-zinc-500 hover:bg-zinc-500 text-white",
  completed: "bg-blue-600 hover:bg-blue-600 text-white",
  "Cancelled - Refund in Progress": "bg-amber-600 hover:bg-amber-600 text-white",
  "Cancelled - Refund Paid to Customer Account": "bg-emerald-600 hover:bg-emerald-600 text-white",
  "Cancelled - Not qualified for a Refund": "bg-zinc-600 hover:bg-zinc-600 text-white",
};

const GuestBookings = () => {
  const { formatPrice } = useCurrency();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [refundRequests, setRefundRequests] = useState<Record<string, RefundRequestRecord>>({});
  const [selectedCancelledBooking, setSelectedCancelledBooking] = useState<BookingWithRefundInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<BookingRow | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `id, property_id, host_id, check_in, check_out, total_price, status,
           refund_status, refund_amount, cancellation_reason, cancellation_category, cancelled_at, created_at,
           properties:properties(id, title, location, images, cancellation_policy)`,
        )
        .eq("guest_id", user.id)
        .order("check_in", { ascending: false });
      if (error) throw error;

      // Fetch refund requests for exceptional claims
      const { data: rrData } = await supabase
        .from("refund_requests")
        .select("*")
        .eq("guest_id", user.id);

      const rrMap: Record<string, RefundRequestRecord> = {};
      if (rrData) {
        for (const rr of rrData) {
          rrMap[rr.booking_id] = rr;
        }
      }
      setRefundRequests(rrMap);

      const ids = (data || []).map((b: any) => b.id);
      let reviewed = new Set<string>();
      if (ids.length) {
        const { data: revs } = await supabase.from("reviews").select("booking_id").in("booking_id", ids);
        reviewed = new Set((revs || []).map((r) => r.booking_id));
      }
      setBookings((data || []).map((b: any) => ({ ...b, has_review: reviewed.has(b.id) })));
    } catch (e: any) {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/guest/bookings");
      return;
    }
    if (user) load();
  }, [user, authLoading, navigate, load]);

  const today = new Date();
  const upcoming = bookings.filter(
    (b) => new Date(b.check_out) >= today && b.status !== "cancelled" && b.status !== "rejected",
  );
  const past = bookings.filter(
    (b) => new Date(b.check_out) < today || b.status === "cancelled" || b.status === "rejected",
  );

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const renderCard = (b: BookingRow, isPast: boolean) => {
    const isCancelled = b.status === "cancelled";
    const statusInfo = isCancelled
      ? getCancelledStatusInfo(b, refundRequests[b.id])
      : null;

    return (
      <Card key={b.id} className="overflow-hidden flex flex-col justify-between">
        <div>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start gap-2">
              <CardTitle className="text-lg font-bold">{b.properties?.title || "Property"}</CardTitle>
              {isCancelled && statusInfo ? (
                <Badge className={statusInfo.badgeClass}>
                  {statusInfo.label}
                </Badge>
              ) : (
                <Badge className={statusColor[b.status] || "bg-muted-foreground"}>
                  {b.status}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-2 shrink-0" />
              <span className="truncate">{b.properties?.location || "—"}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2 shrink-0" />
              <span>{b.check_in} → {b.check_out}</span>
            </div>
            <div className="flex items-center text-sm font-semibold pt-1">
              <span className="text-xs font-bold text-muted-foreground mr-2 bg-accent rounded px-1.5 py-0.5">IQD</span>
              <span>{formatPrice(b.total_price)}</span>
            </div>

            {/* Status detail line if cancelled */}
            {isCancelled && statusInfo && (
              <div className="mt-2 text-xs rounded-md bg-muted/60 p-2.5 border border-border/50">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-primary" />
                  <span>Status: {statusInfo.label}</span>
                </div>
                <p className="text-muted-foreground mt-1 line-clamp-2">
                  {statusInfo.description}
                </p>
              </div>
            )}
          </CardContent>
        </div>

        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2 pt-3 border-t border-border/40">
            {isCancelled ? (
              <>
                <Button
                  variant="outline"
                  className="flex-1 min-w-[130px] font-medium"
                  onClick={() => setSelectedCancelledBooking(b)}
                >
                  <FileText className="h-4 w-4 mr-1.5 text-primary" />
                  View Detail
                </Button>
                <Button asChild variant="ghost" className="flex-1 min-w-[120px]">
                  <Link to={`/property/${b.property_id}`}>View Property</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline" className="flex-1 min-w-[120px]">
                  <Link to={`/property/${b.property_id}`}>View Property</Link>
                </Button>
                <Button asChild variant="outline" size="icon" title="Message host">
                  <Link to="/messages">
                    <MessageSquare className="h-4 w-4" />
                  </Link>
                </Button>
                {!isPast && (b.status === "pending" || b.status === "confirmed") && (
                  <Link to={`/cancel-booking/${b.id}`} className="flex-1 min-w-[120px]">
                    <Button variant="destructive" className="w-full">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </Link>
                )}
                {isPast && b.status !== "rejected" && !b.has_review && (
                  <Button className="flex-1 min-w-[120px]" onClick={() => setReviewing(b)}>
                    Leave Review
                  </Button>
                )}
                {isPast && b.has_review && (
                  <Badge variant="secondary" className="self-center">
                    Reviewed
                  </Badge>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <AppLayout>
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">My Bookings</h1>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Upcoming Stays</h2>
          {upcoming.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No upcoming bookings.{" "}
                <Link to="/search" className="text-primary hover:underline">
                  Browse properties
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">{upcoming.map((b) => renderCard(b, false))}</div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Past Stays</h2>
          {past.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">No past bookings yet.</CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">{past.map((b) => renderCard(b, true))}</div>
          )}
        </section>
      </main>

      {reviewing && (
        <ReviewDialog
          open={!!reviewing}
          onOpenChange={(o) => !o && setReviewing(null)}
          bookingId={reviewing.id}
          propertyId={reviewing.property_id}
          hostId={reviewing.host_id}
          propertyTitle={reviewing.properties?.title || "Property"}
          onSuccess={load}
        />
      )}

      <CancellationSummaryDialog
        open={!!selectedCancelledBooking}
        onOpenChange={(open) => !open && setSelectedCancelledBooking(null)}
        booking={selectedCancelledBooking}
        refundRequest={
          selectedCancelledBooking ? refundRequests[selectedCancelledBooking.id] : null
        }
      />
    </AppLayout>
  );
};

export default GuestBookings;
