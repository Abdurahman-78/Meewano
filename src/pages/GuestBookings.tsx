import { useEffect, useState } from "react";
import { Calendar, MapPin, X, Loader2, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { createNotification } from "@/hooks/useNotifications";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import ReviewDialog from "@/components/ReviewDialog";

interface BookingRow {
  id: string;
  property_id: string;
  host_id: string;
  check_in: string;
  check_out: string;
  total_price: number;
  status: string;
  properties?: { title: string; location: string; images: string[] } | null;
  has_review?: boolean;
}

const statusColor: Record<string, string> = {
  confirmed: "bg-green-500",
  pending: "bg-yellow-500",
  cancelled: "bg-red-500",
  rejected: "bg-red-500",
  completed: "bg-muted-foreground",
};

const GuestBookings = () => {
  const { formatPrice } = useCurrency();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<BookingRow | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/guest/bookings");
      return;
    }
    if (user) load();
  }, [user, authLoading, navigate]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`id, property_id, host_id, check_in, check_out, total_price, status,
          properties:properties(title, location, images)`)
        .eq("guest_id", user.id)
        .order("check_in", { ascending: false });
      if (error) throw error;

      const ids = (data || []).map((b: any) => b.id);
      let reviewed = new Set<string>();
      if (ids.length) {
        const { data: revs } = await supabase
          .from("reviews")
          .select("booking_id")
          .in("booking_id", ids);
        reviewed = new Set((revs || []).map((r) => r.booking_id));
      }
      setBookings((data || []).map((b: any) => ({ ...b, has_review: reviewed.has(b.id) })));
    } catch (e: any) {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const cancel = async (b: BookingRow) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", b.id)
        .eq("guest_id", user.id);
      if (error) throw error;
      await createNotification({
        user_id: b.host_id,
        title: "Booking cancelled",
        message: `A guest cancelled their booking for "${b.properties?.title || "your property"}".`,
        type: "booking",
        link: "/host/bookings",
      });
      toast.success("Booking cancelled");
      load();
    } catch {
      toast.error("Failed to cancel booking");
    }
  };

  const today = new Date();
  const upcoming = bookings.filter(
    (b) => new Date(b.check_out) >= today && b.status !== "cancelled" && b.status !== "rejected"
  );
  const past = bookings.filter(
    (b) => new Date(b.check_out) < today || b.status === "cancelled" || b.status === "rejected"
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

  const renderCard = (b: BookingRow, isPast: boolean) => (
    <Card key={b.id}>
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg">{b.properties?.title || "Property"}</CardTitle>
          <Badge className={statusColor[b.status] || "bg-gray-500"}>{b.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mr-2" />
          {b.properties?.location || "—"}
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 mr-2" />
          {b.check_in} → {b.check_out}
        </div>
        <div className="flex items-center text-sm font-semibold">
          <span className="text-xs font-bold text-muted-foreground mr-2 bg-accent rounded px-1.5 py-0.5">IQD</span>
          {formatPrice(b.total_price)}
        </div>
        <div className="flex flex-wrap gap-2 pt-4">
          <Button asChild variant="outline" className="flex-1 min-w-[120px]">
            <Link to={`/property/${b.property_id}`}>View Property</Link>
          </Button>
          <Button asChild variant="outline" size="icon" title="Message host">
            <Link to="/messages"><MessageSquare className="h-4 w-4" /></Link>
          </Button>
          {!isPast && (b.status === "pending" || b.status === "confirmed") && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex-1 min-w-[120px]">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. Refund depends on the{" "}
                    <Link to="/cancellation" className="text-primary underline">cancellation policy</Link>.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => cancel(b)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Cancel Booking
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {isPast && b.status !== "cancelled" && b.status !== "rejected" && !b.has_review && (
            <Button className="flex-1 min-w-[120px]" onClick={() => setReviewing(b)}>
              Leave Review
            </Button>
          )}
          {isPast && b.has_review && (
            <Badge variant="secondary" className="self-center">Reviewed</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AppLayout>
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">My Bookings</h1>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Upcoming Stays</h2>
          {upcoming.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              No upcoming bookings. <Link to="/search" className="text-primary hover:underline">Browse properties</Link>
            </CardContent></Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">{upcoming.map((b) => renderCard(b, false))}</div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Past Stays</h2>
          {past.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              No past bookings yet.
            </CardContent></Card>
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
    </AppLayout>
  );
};

export default GuestBookings;
