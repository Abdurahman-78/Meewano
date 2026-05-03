import { useState, useEffect, useMemo } from "react";
import { Calendar, User, MessageSquare, Heart, MapPin, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useFavorites } from "@/hooks/useFavorites";
import { useProperties } from "@/hooks/useProperties";
import { createNotification } from "@/hooks/useNotifications";
import ReviewDialog from "@/components/ReviewDialog";
import { Badge } from "@/components/ui/badge";

interface Booking {
  id: string;
  property_id: string;
  host_id: string;
  check_in: string;
  check_out: string;
  total_price: number;
  status: string;
  guests: number;
  has_review?: boolean;
  property?: {
    title: string;
    location: string;
    images: string[];
  };
}

interface Profile {
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

const GuestDashboard = () => {
  const { formatPrice } = useCurrency();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { favorites } = useFavorites(user?.id || null);
  const { data: allProperties } = useProperties();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profile, setProfile] = useState<Profile>({ full_name: null, email: null, phone: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reviewing, setReviewing] = useState<Booking | null>(null);
  const [unreadMsgs, setUnreadMsgs] = useState(0);

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
      // Fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select(`
          *,
          property:properties(title, location, images)
        `)
        .eq("guest_id", user.id)
        .order("check_in", { ascending: false });

      if (bookingsError) throw bookingsError;

      // Fetch which bookings already have reviews
      const ids = (bookingsData || []).map((b: any) => b.id);
      let reviewed = new Set<string>();
      if (ids.length) {
        const { data: revs } = await supabase
          .from("reviews").select("booking_id").in("booking_id", ids);
        reviewed = new Set((revs || []).map((r) => r.booking_id));
      }
      setBookings((bookingsData || []).map((b: any) => ({ ...b, has_review: reviewed.has(b.id) })));

      // Unread message count
      const { count: msgCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false);
      setUnreadMsgs(msgCount || 0);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, email, phone")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (profileData) {
        setProfile(profileData);
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (booking: Booking) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", booking.id)
        .eq("guest_id", user?.id);

      if (error) throw error;
      if (booking.host_id) {
        await createNotification({
          user_id: booking.host_id,
          title: "Booking cancelled",
          message: `A guest cancelled their booking for "${booking.property?.title || "your property"}".`,
          type: "booking",
          link: "/host/bookings",
        });
      }
      toast.success("Booking cancelled successfully");
      fetchData();
    } catch (error: any) {
      toast.error("Failed to cancel booking");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const upcomingBookings = bookings.filter(
    (b) => new Date(b.check_in) >= new Date() && b.status !== "cancelled"
  );
  const pastBookings = bookings.filter(
    (b) => new Date(b.check_out) < new Date() || b.status === "cancelled"
  );

  const favoriteProperties = useMemo(() => 
    allProperties?.filter(p => favorites.includes(p.id)) || [],
    [allProperties, favorites]
  );

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
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Dashboard</h1>
          <p className="text-muted-foreground">Manage your bookings and profile</p>
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="bookings">
              <Calendar className="h-4 w-4 mr-2" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="saved">
              <Heart className="h-4 w-4 mr-2" />
              Saved
            </TabsTrigger>
            <TabsTrigger value="messages" className="relative">
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages
              {unreadMsgs > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                  {unreadMsgs > 9 ? "9+" : unreadMsgs}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Upcoming Stays</h2>
              {upcomingBookings.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No upcoming bookings. <Link to="/" className="text-primary hover:underline">Browse properties</Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {upcomingBookings.map((booking) => (
                    <Card key={booking.id}>
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold mb-2">
                          {booking.property?.title || "Property"}
                        </h3>
                        <div className="flex items-center gap-1 text-muted-foreground mb-4">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">{booking.property?.location || "Location"}</span>
                        </div>
                        <div className="space-y-2 text-sm mb-4">
                          <p><strong>Check-in:</strong> {booking.check_in}</p>
                          <p><strong>Check-out:</strong> {booking.check_out}</p>
                          <p><strong>Status:</strong> <span className="capitalize">{booking.status}</span></p>
                          <p className="text-lg font-bold text-primary">{formatPrice(booking.total_price)}</p>
                        </div>
                        <div className="flex gap-2">
                          <Link to={`/property/${booking.property_id}`} className="flex-1">
                            <Button variant="outline" className="w-full">View Details</Button>
                          </Link>
                          {booking.status === "pending" && (
                            <Button 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => handleCancelBooking(booking)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Past Stays</h2>
              {pastBookings.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No past bookings yet.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pastBookings.map((booking) => (
                    <Card key={booking.id}>
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold mb-2">
                          {booking.property?.title || "Property"}
                        </h3>
                        <div className="flex items-center gap-1 text-muted-foreground mb-4">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">{booking.property?.location || "Location"}</span>
                        </div>
                        <div className="space-y-2 text-sm mb-4">
                          <p><strong>Check-in:</strong> {booking.check_in}</p>
                          <p><strong>Check-out:</strong> {booking.check_out}</p>
                          <p><strong>Status:</strong> <span className="capitalize">{booking.status}</span></p>
                          <p className="text-lg font-bold">{formatPrice(booking.total_price)}</p>
                        </div>
                        {booking.status !== "cancelled" && booking.status !== "rejected" && !booking.has_review && (
                          <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => setReviewing(booking)}>
                            Leave Review
                          </Button>
                        )}
                        {booking.has_review && (
                          <Badge variant="secondary">Reviewed</Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Saved Tab */}
          <TabsContent value="saved">
            <h2 className="text-2xl font-bold mb-4">Saved Listings</h2>
            {favoriteProperties.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No saved properties yet. <Link to="/" className="text-primary hover:underline">Browse properties</Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {favoriteProperties.map((property) => (
                  <Card key={property.id}>
                    <CardContent className="p-0">
                      <img src={property.images?.[0] || "/placeholder.svg"} alt={property.title} className="w-full h-48 object-cover rounded-t-xl" />
                      <div className="p-6">
                        <h3 className="text-lg font-bold mb-2">{property.title}</h3>
                        <div className="flex items-center gap-1 text-muted-foreground mb-3">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">{property.location}</span>
                        </div>
                        <p className="text-primary font-bold mb-4">{formatPrice(property.price_per_night)}/night</p>
                        <Link to={`/property/${property.id}`}>
                          <Button className="w-full bg-primary hover:bg-primary/90">View Property</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Messages</CardTitle>
              </CardHeader>
              <CardContent className="py-8 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  {unreadMsgs > 0
                    ? `You have ${unreadMsgs} unread message${unreadMsgs === 1 ? "" : "s"}.`
                    : "Your conversations live in the messages center."}
                </p>
                <Link to="/messages">
                  <Button className="bg-primary hover:bg-primary/90">Open Messages</Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Full Name</label>
                    <Input
                      type="text"
                      placeholder="John Doe"
                      value={profile.full_name || ""}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Email</label>
                    <Input
                      type="email"
                      value={profile.email || user?.email || ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Phone</label>
                    <Input
                      type="tel"
                      placeholder="+964 123 456 789"
                      value={profile.phone || ""}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 h-12" disabled={saving}>
                    {saving ? "Saving..." : "Update Profile"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {reviewing && (
        <ReviewDialog
          open={!!reviewing}
          onOpenChange={(o) => !o && setReviewing(null)}
          bookingId={reviewing.id}
          propertyId={reviewing.property_id}
          hostId={reviewing.host_id}
          propertyTitle={reviewing.property?.title || "Property"}
          onSuccess={fetchData}
        />
      )}
    </AppLayout>
  );
};

export default GuestDashboard;