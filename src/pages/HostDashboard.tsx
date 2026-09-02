import { useState, useEffect, useCallback } from "react";
import { BarChart3, Home, Calendar, DollarSign, Plus, Loader2, Edit, Trash2, ShieldCheck, Clock, XCircle, RefreshCw, CheckCircle2, Sparkles, MapPin, BedDouble, Bath, Users, Info } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import HostLayout from "@/components/HostLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePreLaunch, PreLaunchPropertyItem } from "@/contexts/PreLaunchContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createNotification } from "@/hooks/useNotifications";
import { useMyHostVerification } from "@/hooks/useHostVerification";
import HostPayoutCard from "@/components/HostPayoutCard";

interface Property {
  id: string;
  title: string;
  location: string;
  city?: string;
  price_per_night: number;
  is_active: boolean;
  images: string[];
  bedrooms?: number;
  bathrooms?: number;
  max_guests?: number;
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
  const {
    mode,
    properties: preLaunchProperties,
    openAddPropertyModal,
    openEditPropertyModal,
    deleteProperty: deletePreLaunchProperty,
  } = usePreLaunch();

  const isPreLaunch = mode === "pre-launch";

  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const isVerified = verification?.status === "approved";

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    try {
      // Fetch host's properties from Supabase
      const { data: propertiesData, error: propertiesError } = await supabase
        .from("properties")
        .select("*")
        .eq("host_id", user.id);

      if (propertiesError) {
        console.warn("Could not query properties table:", propertiesError.message);
      }
      setProperties(propertiesData || []);

      if (!isPreLaunch) {
        // Fetch bookings for host's properties in live mode
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
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [user, isPreLaunch]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      fetchData();
    }
  }, [user, authLoading, navigate, fetchData]);

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm("Are you sure you want to delete this property listing?")) return;

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

  if (authLoading || loading) {
    return (
      <HostLayout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </HostLayout>
    );
  }

  // PRE-LAUNCH HOST VIEW (Simplified Dashboard: ONLY Properties with Add, Edit, Delete)
  if (isPreLaunch) {
    // Only display actual properties from Supabase that belong to the host
    const displayProperties = properties.map(p => ({
      ...p,
      isPrelaunch: false,
      raw: null,
    }));

    return (
      <HostLayout>
        <main className="container mx-auto px-4 py-8 space-y-6 max-w-6xl">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2 border-b border-border">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/25">
                  <Sparkles className="h-3.5 w-3.5" />
                  Pre-Launch Host Hub
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Properties</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Manage your registered spaces for Meewano. You can add new properties, edit details, or remove listings.
              </p>
            </div>
            
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-11 rounded-full px-6 font-semibold shadow-md flex items-center gap-2"
              onClick={() => navigate("/host/add-listing")}
            >
              <Plus className="h-4 w-4" />
              + Add Property
            </Button>
          </div>

          {/* Pricing Verification Notice */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 md:p-5 flex items-start gap-3.5">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground text-sm sm:text-base">
                Property Pricing & Launch Setup
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                After Meewano is launched, our team will verify and finalize the official pricing of your properties with you. No payment methods, calendar setup, or guest bookings are required during the pre-launch phase.
              </p>
            </div>
          </div>

          {/* Properties Grid */}
          {displayProperties.length === 0 ? (
            <div className="text-center py-20 bg-accent/20 rounded-2xl border border-dashed border-border/70 p-6">
              <div className="mx-auto w-16 h-16 bg-background rounded-full flex items-center justify-center shadow-sm border mb-4">
                <Home className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">No properties registered yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
                Pre-register your villa, apartment, or chalet today. It will be showcased in the pre-launch preview and ready for launch day.
              </p>
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-11 rounded-full px-7 font-semibold"
                onClick={() => navigate("/host/add-listing")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Property
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayProperties.map((property) => {
                return (
                  <div
                    key={property.id}
                    className="group flex flex-col bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300"
                  >
                    <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                      {property.images && property.images[0] ? (
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-accent/50 text-muted-foreground">
                          No image
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <Badge variant="outline" className="backdrop-blur-md bg-background/90 shadow-sm border border-primary/30 text-primary text-xs font-semibold">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Pre-Launch Stay
                        </Badge>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="font-medium truncate">{property.location}{property.city ? `, ${property.city}` : ""}</span>
                      </div>

                      <h3 className="font-bold text-lg line-clamp-1 mb-2">
                        {property.title}
                      </h3>

                      {/* Rooms / Specs */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                        {property.bedrooms !== undefined && (
                          <span className="flex items-center gap-1">
                            <BedDouble className="h-3.5 w-3.5" />
                            {property.bedrooms} Bed
                          </span>
                        )}
                        {property.bathrooms !== undefined && (
                          <span className="flex items-center gap-1">
                            <Bath className="h-3.5 w-3.5" />
                            {property.bathrooms} Bath
                          </span>
                        )}
                        {property.max_guests !== undefined && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {property.max_guests} Guests
                          </span>
                        )}
                      </div>

                      {/* Price Note */}
                      <div className="mt-auto pt-3 border-t border-border">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs text-muted-foreground block">Estimated Nightly</span>
                            <span className="font-bold text-base text-foreground">
                              {formatPrice(property.price_per_night)}
                            </span>
                          </div>
                          
                          {/* Actions: Edit & Delete */}
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 px-3 rounded-xl gap-1.5 text-xs font-semibold hover:border-primary hover:text-primary"
                              onClick={() => navigate(`/host/edit-listing/${property.id}`)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                              Edit
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 px-2.5 rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteProperty(property.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        <p className="text-[11px] text-muted-foreground/80 mt-2 italic">
                          After Meewano is launched, we verify to set price of properties.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </HostLayout>
    );
  }

  // LIVE MODE HOST DASHBOARD
  return (
    <HostLayout>
      <main className="container mx-auto px-4 py-8 space-y-6 max-w-6xl">
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

        {/* Continue your listing prompt — shown after verification when no property yet */}
        {!vLoading && isVerified && properties.length === 0 && (
          <Alert className="mb-6 border-primary/40 bg-primary/5">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <AlertTitle>You're verified — let's finish your first listing</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-4 flex-wrap">
              <span>
                We've pre-filled the details you shared when you signed up. Just add photos, a title, and a price to go live.
              </span>
              <Button size="sm" onClick={() => navigate("/host/add-listing")}>
                Continue your listing
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-semibold mb-1">Your listings</h1>
            <p className="text-muted-foreground text-sm">Manage your properties, pricing, and availability</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="h-10 rounded-full px-5"
              onClick={() => navigate("/host/analytics")}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Insights
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 rounded-full px-5 font-semibold"
              disabled={!isVerified}
              onClick={() => isVerified ? navigate("/host/add-listing") : toast.error("Complete verification first")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create listing
            </Button>
          </div>
        </div>

        {/* Properties Grid */}
        {properties.length === 0 ? (
          <div className="text-center py-24 bg-accent/20 rounded-2xl border border-dashed border-border/60">
             <div className="mx-auto w-16 h-16 bg-background rounded-full flex items-center justify-center shadow-sm border mb-4">
               <Home className="h-6 w-6 text-muted-foreground" />
             </div>
             <h3 className="text-xl font-semibold mb-2">No active listings</h3>
             <p className="text-muted-foreground mb-6">Create your first listing to start hosting guests.</p>
             <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 rounded-full px-6 font-semibold"
                disabled={!isVerified}
                onClick={() => isVerified ? navigate("/host/add-listing") : toast.error("Complete verification first")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create listing
              </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {properties.map((property) => {
              const s = property.approval_status;
              const badge = s === "approved" ? { label: "Live", icon: CheckCircle2, cls: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30" }
                : s === "rejected" ? { label: "Rejected", icon: XCircle, cls: "bg-destructive/10 text-destructive border-destructive/30" }
                : s === "changes_pending" ? { label: "Edits pending", icon: RefreshCw, cls: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30" }
                : { label: "Pending review", icon: Clock, cls: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30" };
              const Icon = badge.icon;
              return (
                <div key={property.id} className="group flex flex-col bg-card rounded-2xl border overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="relative aspect-[4/3] bg-muted overflow-hidden cursor-pointer" onClick={() => navigate(`/property/${property.id}`)}>
                    {property.images && property.images[0] ? (
                      <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-accent/50 text-muted-foreground">No image</div>
                    )}
                    <div className="absolute top-3 left-3">
                       <Badge variant="outline" className={`backdrop-blur-md bg-background/80 shadow-sm border ${badge.cls}`}>
                         <Icon className="h-3 w-3 mr-1.5" />{badge.label}
                       </Badge>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-semibold text-lg line-clamp-1 mb-1 cursor-pointer" onClick={() => navigate(`/property/${property.id}`)}>{property.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-1 flex-1">{property.location}</p>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="font-semibold">
                        {formatPrice(property.price_per_night)} <span className="text-sm font-normal text-muted-foreground">/ night</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-accent" onClick={() => navigate(`/host/edit-listing/${property.id}`)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDeleteProperty(property.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {s === "rejected" && property.rejection_reason && (
                      <p className="text-xs text-destructive mt-3 bg-destructive/10 p-2 rounded">Reason: {property.rejection_reason}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Recent Booking Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">No pending requests</p>
              ) : (
                <div className="space-y-4">
                  {bookings.slice(0, 5).map((booking) => (
                    <div 
                      key={booking.id} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-accent/30 transition-colors"
                    >
                      <div className="mb-3 sm:mb-0">
                        <p className="font-semibold">{booking.property?.title || "Property"}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {booking.check_in} → {booking.check_out}
                        </p>
                        <p className="text-sm text-muted-foreground">{booking.guests} guests</p>
                      </div>
                      <div className="sm:text-right flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start">
                        <p className="font-semibold">{formatPrice(booking.total_price)}</p>
                        {booking.status === "pending" ? (
                          <div className="flex gap-2 mt-2">
                            <Button 
                              size="sm" 
                              className="h-8 rounded-full px-4 text-xs bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
                              onClick={() => handleBookingAction(booking, "confirmed")}
                            >
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-8 rounded-full px-4 text-xs"
                              onClick={() => handleBookingAction(booking, "rejected")}
                            >
                              Decline
                            </Button>
                          </div>
                        ) : (
                          <Badge variant="outline" className="mt-1 capitalize">{booking.status}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="space-y-6">
            <HostPayoutCard />
          </div>
        </div>

      </main>
    </HostLayout>
  );
};

export default HostDashboard;
