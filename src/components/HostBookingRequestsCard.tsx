import { useEffect, useState, useCallback } from "react";
import { Loader2, CheckCircle2, Clock, Calendar, Users, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createNotification } from "@/hooks/useNotifications";

interface Booking {
  id: string;
  check_in: string;
  check_out: string;
  total_price: number;
  status: string;
  guests: number;
  guest_id: string;
  property: {
    title: string;
  } | null;
}

export const HostBookingRequestsCard = () => {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          property:properties(title)
        `)
        .eq("host_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setBookings((data || []) as Booking[]);
    } catch (err: any) {
      console.error("Error fetching host booking requests:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleBookingAction = async (booking: Booking, action: "confirmed" | "rejected") => {
    setProcessingId(booking.id);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: action })
        .eq("id", booking.id)
        .eq("host_id", user?.id);

      if (error) throw error;

      await createNotification({
        user_id: booking.guest_id,
        title: action === "confirmed" ? "Booking approved 🎉" : "Booking declined",
        message:
          action === "confirmed"
            ? `Your stay at "${booking.property?.title || "the property"}" was approved. Complete payment to confirm.`
            : `Your booking request for "${booking.property?.title || "the property"}" was declined.`,
        type: "booking",
        link: action === "confirmed" ? `/payment?bookingId=${booking.id}` : "/guest/bookings",
      });

      toast.success(`Booking ${action === "confirmed" ? "approved" : "declined"}`);
      fetchBookings();
    } catch (error: any) {
      toast.error(`Failed to ${action} booking`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Recent Booking Requests
        </CardTitle>
        <CardDescription>
          Review and approve or decline reservation requests from guests.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : bookings.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">No pending requests</p>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-accent/30 transition-colors"
              >
                <div className="mb-3 sm:mb-0">
                  <p className="font-semibold">{booking.property?.title || "Property"}</p>
                  <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {booking.check_in} → {booking.check_out}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Users className="h-3.5 w-3.5" />
                    {booking.guests} {booking.guests === 1 ? "guest" : "guests"}
                  </p>
                </div>
                <div className="sm:text-right flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
                  <p className="font-bold text-base">{formatPrice(booking.total_price)}</p>
                  {booking.status === "pending" ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={processingId === booking.id}
                        className="h-8 rounded-full px-4 text-xs bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
                        onClick={() => handleBookingAction(booking, "confirmed")}
                      >
                        {processingId === booking.id ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : null}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={processingId === booking.id}
                        className="h-8 rounded-full px-4 text-xs"
                        onClick={() => handleBookingAction(booking, "rejected")}
                      >
                        Decline
                      </Button>
                    </div>
                  ) : (
                    <Badge variant="outline" className="capitalize text-xs font-semibold">
                      {booking.status}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HostBookingRequestsCard;
