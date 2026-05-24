import { useState, useEffect } from "react";
import { BarChart3, Home, Calendar, DollarSign, Plus, TrendingUp, Loader2, Eye, Edit, Trash2, ShieldCheck, Clock, XCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createNotification } from "@/hooks/useNotifications";
import { useMyHostVerification } from "@/hooks/useHostVerification";

interface Property {
  id: string;
  title: string;
  location: string;
  price_per_night: number;
  is_active: boolean;
  images: string[];
  approval_status?: string;
  rejection_reason?: string | null;
  pending_changes?: any;
}

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

const HostDashboard = () => {
  const { formatPrice } = useCurrency();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: verification, isLoading: vLoading } = useMyHostVerification();

  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const isVerified = verification?.status === "approved";

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      fetchData();
    }
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      // Fetch host's properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from("properties")
        .select("*")
        .eq("host_id", user.id);

      if (propertiesError) throw propertiesError;
      setProperties(propertiesData || []);

      // Fetch bookings for host's properties
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select(`
          *,
          property:properties(title)
        `)
        .eq("host_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (bookingsError) throw bookingsError;
      setBookings((bookingsData || []) as Booking[]);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return;

    try {
      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", propertyId)
        .eq("host_id", user?.id);

      if (error) throw error;
      toast.success("Property deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to delete property");
    }
  };

  const handleBookingAction = async (booking: Booking, action: "confirmed" | "rejected") => {
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

      toast.success(`Booking ${action === "confirmed" ? "approved" : "rejected"}`);
      fetchData();
    } catch (error: any) {
      toast.error(`Failed to ${action} booking`);
    }
  };

  const totalRevenue = bookings
    .filter(b => b.status === "confirmed" || b.status === "completed")
    .reduce((sum, b) => sum + b.total_price, 0);

  const stats = [
    { title: "Total Properties", value: properties.length.toString(), icon: Home, color: "text-blue-600" },
    { title: "Total Bookings", value: bookings.length.toString(), icon: Calendar, color: "text-green-600" },
    { title: "Total Revenue", value: totalRevenue, icon: DollarSign, color: "text-primary", isPrice: true },
    { title: "Pending Requests", value: bookings.filter(b => b.status === "pending").length.toString(), icon: BarChart3, color: "text-purple-600" },
  ];

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      
      <main className="container mx-auto px-4 py-8">
        {/* Verification banner */}
        {!vLoading && !isVerified && (
          <Alert className={`mb-6 ${verification?.status === "rejected" ? "border-destructive/40 bg-destructive/5" : "border-yellow-500/40 bg-yellow-500/5"}`}>
            {verification?.status === "rejected" ? <XCircle className="h-4 w-4 text-destructive" /> : <ShieldCheck className="h-4 w-4 text-yellow-600" />}
            <AlertTitle>
              {verification?.status === "rejected" ? "Verification rejected" :
               verification?.status === "pending" && verification?.submitted_at ? "Verification pending review" :
               "Verify your account to start hosting"}
            </AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-4 flex-wrap">
              <span>
                {verification?.status === "rejected" ? (verification.rejection_reason || "Please resubmit your documents.") :
                 verification?.status === "pending" && verification?.submitted_at ? "We'll notify you once approved (usually within 24 hours)." :
                 "Upload your ID, selfie, and ownership documents to start listing properties."}
              </span>
              <Button size="sm" onClick={() => navigate("/host/verification")}>
                {verification?.submitted_at ? "View status" : "Verify now"}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Host Dashboard</h1>
            <p className="text-muted-foreground">Manage your properties and bookings</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/host/analytics")}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/host/pricing")}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Pricing Tools
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-6"
              disabled={!isVerified}
              onClick={() => isVerified ? navigate("/host/add-listing") : toast.error("Complete verification first")}
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Property
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold">{stat.isPrice ? formatPrice(stat.value as number) : stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full bg-accent ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Bookings */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Booking Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No bookings yet</p>
              ) : (
                <div className="space-y-4">
                  {bookings.slice(0, 5).map((booking) => (
                    <div 
                      key={booking.id} 
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                    >
                      <div>
                        <p className="font-semibold">{booking.property?.title || "Property"}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.check_in} → {booking.check_out}
                        </p>
                        <p className="text-sm text-muted-foreground">{booking.guests} guests</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatPrice(booking.total_price)}</p>
                        <p className="text-sm capitalize text-muted-foreground mb-2">{booking.status}</p>
                        {booking.status === "pending" && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleBookingAction(booking, "confirmed")}
                            >
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleBookingAction(booking, "rejected")}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Properties */}
          <Card>
            <CardHeader>
              <CardTitle>My Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {properties.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No properties yet</p>
              ) : (
                properties.slice(0, 5).map((property) => {
                  const s = property.approval_status;
                  const badge = s === "approved" ? { label: "Live", icon: CheckCircle2, cls: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30" }
                    : s === "rejected" ? { label: "Rejected", icon: XCircle, cls: "bg-destructive/10 text-destructive border-destructive/30" }
                    : s === "changes_pending" ? { label: "Edits pending", icon: RefreshCw, cls: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30" }
                    : { label: "Pending review", icon: Clock, cls: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30" };
                  const Icon = badge.icon;
                  return (
                    <div
                      key={property.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm truncate">{property.title}</p>
                          <Badge variant="outline" className={`text-[10px] ${badge.cls}`}>
                            <Icon className="h-3 w-3 mr-1" />{badge.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{property.location}</p>
                        <p className="text-xs text-primary font-semibold">{formatPrice(property.price_per_night)}/night</p>
                        {s === "rejected" && property.rejection_reason && (
                          <p className="text-[11px] text-destructive mt-1">Reason: {property.rejection_reason}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => navigate(`/property/${property.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => navigate(`/host/edit-listing/${property.id}`)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDeleteProperty(property.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
              <Button
                variant="outline"
                className="w-full justify-start h-12 mt-4"
                disabled={!isVerified}
                onClick={() => isVerified ? navigate("/host/add-listing") : toast.error("Complete verification first")}
              >
                <Plus className="h-5 w-5 mr-3" />
                Add New Property
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </AppLayout>
  );
};

export default HostDashboard;