import { useEffect, useState } from "react";
import {
  Calendar as CalendarIcon,
  MapPin,
  User,
  Loader2,
  MessageSquare,
  Check,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { createNotification } from "@/hooks/useNotifications";
import { toast } from "sonner";

interface BookingRow {
  id: string;
  property_id: string;
  guest_id: string;
  check_in: string;
  check_out: string;
  total_price: number;
  status: string;
  guests: number;
  guest_message: string | null;
  created_at: string;
  properties?: { title: string; location: string; images: string[] } | null;
  guest?: { full_name: string | null; email: string | null; avatar_url: string | null } | null;
}

const statusColor: Record<string, string> = {
  confirmed: "bg-green-500",
  pending: "bg-yellow-500",
  cancelled: "bg-red-500",
  rejected: "bg-red-500",
  completed: "bg-muted-foreground",
};

const HostBookings = () => {
  const { formatPrice } = useCurrency();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [tab, setTab] = useState("pending");
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/host/bookings");
      return;
    }
    if (user) load();
  }, [user, authLoading, navigate]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`host-bookings-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `host_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const load = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `id, property_id, guest_id, check_in, check_out, total_price, status,
          guests, guest_message, created_at,
          properties:properties(title, location, images)`,
        )
        .eq("host_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch guest profiles
      const guestIds = Array.from(new Set((data || []).map((b: any) => b.guest_id)));
      let guestMap = new Map<string, any>();
      if (guestIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, email, avatar_url")
          .in("id", guestIds);
        guestMap = new Map((profs || []).map((p) => [p.id, p]));
      }
      setBookings((data || []).map((b: any) => ({ ...b, guest: guestMap.get(b.guest_id) || null })));
    } catch (e) {
      console.error(e);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const act = async (b: BookingRow, action: "confirmed" | "rejected") => {
    if (!user) return;
    setActing(b.id);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: action })
        .eq("id", b.id)
        .eq("host_id", user.id);
      if (error) throw error;

      await createNotification({
        user_id: b.guest_id,
        title: action === "confirmed" ? "Booking approved 🎉" : "Booking declined",
        message:
          action === "confirmed"
            ? `Your stay at "${b.properties?.title || "the property"}" was approved. Complete payment to confirm.`
            : `Your booking request for "${b.properties?.title || "the property"}" was declined.`,
        type: "booking",
        link: action === "confirmed" ? `/payment?bookingId=${b.id}` : "/guest/bookings",
      });

      // Send booking-approved email to the guest with invoice, welcome message, and booking details
      if (action === "confirmed") {
        try {
          // Fetch guest profile
          const { data: guestProf } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", b.guest_id)
            .maybeSingle();

          // Fetch host profile name
          const { data: hostProf } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .maybeSingle();

          // Fetch property details (price, welcome_message, cleaning_policy)
          const { data: propData } = await supabase
            .from("properties")
            .select("price_per_night, welcome_message, cleaning_policy")
            .eq("id", b.property_id)
            .maybeSingle();

          const guestEmail = guestProf?.email;
          if (guestEmail) {
            const nights = Math.max(
              1,
              Math.ceil((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / (1000 * 60 * 60 * 24)),
            );
            const pricePerNight = (propData as any)?.price_per_night || 0;
            const subtotal = pricePerNight * nights;
            const cleaningFee = 50;
            const tax = Math.round(subtotal * 0.05);
            const totalCalc = b.total_price || subtotal + cleaningFee + tax;

            await supabase.functions.invoke("send-booking-approved", {
              body: {
                email: guestEmail,
                booking: {
                  guestName: guestProf?.full_name || "Guest",
                  confirmationNumber: `MW-${b.id.slice(0, 8).toUpperCase()}`,
                  propertyName: b.properties?.title || "Property",
                  propertyLocation: b.properties?.location || "",
                  hostName: hostProf?.full_name || "Your host",
                  checkIn: b.check_in,
                  checkOut: b.check_out,
                  guests: b.guests,
                  nights,
                  pricePerNight,
                  subtotal,
                  cleaningFee,
                  tax,
                  total: totalCalc,
                  currency: "IQD",
                  paymentMethod: "Credit/Debit Card",
                  welcomeMessage: (propData as any)?.welcome_message || "",
                  cleaningPolicy: (propData as any)?.cleaning_policy || "",
                },
              },
            });
          }
        } catch (emailErr) {
          console.warn("booking approved email setup failed (non-fatal):", emailErr);
        }
      }

      // Send booking-rejected email to the guest
      if (action === "rejected") {
        try {
          const { data: guestProf } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", b.guest_id)
            .maybeSingle();
          const { data: hostProf } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .maybeSingle();
          const guestEmail = guestProf?.email;
          if (guestEmail) {
            const nights = Math.max(
              1,
              Math.ceil((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / (1000 * 60 * 60 * 24)),
            );
            await supabase.functions.invoke("send-booking-rejected", {
              body: {
                email: guestEmail,
                booking: {
                  guestName: guestProf?.full_name || "Guest",
                  hostName: hostProf?.full_name || "Your host",
                  confirmationNumber: `MW-${b.id.slice(0, 8).toUpperCase()}`,
                  propertyName: b.properties?.title || "Property",
                  propertyLocation: b.properties?.location || "",
                  checkIn: b.check_in,
                  checkOut: b.check_out,
                  guests: b.guests,
                  nights,
                  reason: "",
                },
              },
            });
          }
        } catch (emailErr) {
          console.warn("booking rejected email setup failed (non-fatal):", emailErr);
        }
      }

      toast.success(`Booking ${action === "confirmed" ? "approved" : "rejected"}`);
      load();
    } catch (e: any) {
      toast.error(e.message || "Action failed");
    } finally {
      setActing(null);
    }
  };

  const messageGuest = async (b: BookingRow) => {
    if (!user) return;
    // open Messages page with conversation pre-selected
    navigate(`/messages?to=${b.guest_id}`);
  };

  const today = new Date();
  const filtered = bookings.filter((b) => {
    if (tab === "pending") return b.status === "pending";
    if (tab === "upcoming") return b.status === "confirmed" && new Date(b.check_out) >= today;
    if (tab === "past") return new Date(b.check_out) < today || b.status === "completed";
    if (tab === "cancelled") return b.status === "cancelled" || b.status === "rejected";
    return true;
  });

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const counts = {
    pending: bookings.filter((b) => b.status === "pending").length,
    upcoming: bookings.filter((b) => b.status === "confirmed" && new Date(b.check_out) >= today).length,
    past: bookings.filter((b) => new Date(b.check_out) < today || b.status === "completed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled" || b.status === "rejected").length,
  };

  return (
    <AppLayout>
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Property Bookings</h1>
            <p className="text-muted-foreground">Approve, reject and manage guest stays</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/host">
              <Filter className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="pending" className="relative">
              Pending
              {counts.pending > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground text-[10px] rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                  {counts.pending}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming ({counts.upcoming})</TabsTrigger>
            <TabsTrigger value="past">Past ({counts.past})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({counts.cancelled})</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-0">
            {filtered.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No bookings in this category.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((b) => (
                  <Card key={b.id} className="overflow-hidden">
                    {b.properties?.images?.[0] && (
                      <img src={b.properties.images[0]} alt={b.properties.title} className="w-full h-32 object-cover" />
                    )}
                    <CardHeader>
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-lg">{b.properties?.title || "Property"}</CardTitle>
                        <Badge
                          className={`${statusColor[b.status] || "bg-gray-500"} ${b.status === "pending" ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
                          onClick={() => {
                            if (b.status === "pending") {
                              setExpandedBooking(expandedBooking === b.id ? null : b.id);
                            }
                          }}
                        >
                          {b.status}
                          {b.status === "pending" &&
                            (expandedBooking === b.id ? (
                              <ChevronUp className="h-3 w-3 ml-1 inline" />
                            ) : (
                              <ChevronDown className="h-3 w-3 ml-1 inline" />
                            ))}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {b.properties?.location || "—"}
                      </div>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          {b.guest?.avatar_url && <AvatarImage src={b.guest.avatar_url} />}
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                            {(b.guest?.full_name || b.guest?.email || "G").substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-sm">
                          <p className="font-medium leading-tight">{b.guest?.full_name || "Guest"}</p>
                          <p className="text-xs text-muted-foreground">
                            {b.guests} guest{b.guests > 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {b.check_in} → {b.check_out}
                      </div>
                      <div className="flex items-center text-sm font-semibold">
                        <span className="text-xs font-bold text-muted-foreground mr-2 bg-accent rounded px-1.5 py-0.5">
                          IQD
                        </span>
                        {formatPrice(b.total_price)}
                      </div>
                      {b.guest_message && (
                        <div className="rounded-md bg-muted/50 p-3 text-xs">
                          <p className="font-medium mb-1">Guest message</p>
                          <p className="text-muted-foreground line-clamp-3">{b.guest_message}</p>
                        </div>
                      )}
                      {/* Expanded details for pending bookings */}
                      {expandedBooking === b.id && (
                        <div className="rounded-lg border border-border bg-accent/30 p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                          <h4 className="text-sm font-semibold flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-primary" />
                            Booking Details
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-muted-foreground">Booking ID</p>
                              <p className="font-mono font-medium break-all">{b.id.slice(0, 8).toUpperCase()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Requested</p>
                              <p className="font-medium">
                                {new Date(b.created_at).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Check-in</p>
                              <p className="font-medium">
                                {new Date(b.check_in).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Check-out</p>
                              <p className="font-medium">
                                {new Date(b.check_out).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Guests</p>
                              <p className="font-medium">
                                {b.guests} guest{b.guests > 1 ? "s" : ""}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Total</p>
                              <p className="font-medium text-primary">{formatPrice(b.total_price)}</p>
                            </div>
                          </div>
                          {b.guest_message && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Guest message</p>
                              <p className="text-sm bg-card rounded-md p-2 border">{b.guest_message}</p>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t">
                            <User className="h-3 w-3" />
                            <span>{b.guest?.full_name || b.guest?.email || "Guest"}</span>
                            {b.guest?.email && <span className="text-muted-foreground">· {b.guest.email}</span>}
                          </div>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button asChild variant="outline" size="sm" className="flex-1 min-w-[100px]">
                          <Link to={`/property/${b.property_id}`}>View Property</Link>
                        </Button>
                        <Button variant="outline" size="icon" title="Message guest" onClick={() => messageGuest(b)}>
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        {b.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              className="flex-1 min-w-[90px]"
                              disabled={acting === b.id}
                              onClick={() => act(b, "confirmed")}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="flex-1 min-w-[90px]"
                                  disabled={acting === b.id}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reject this booking?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    The guest will be notified. This cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Keep pending</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => act(b, "rejected")}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Reject booking
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </AppLayout>
  );
};

export default HostBookings;
