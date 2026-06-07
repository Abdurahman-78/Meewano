import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Star, Calendar, Shield, MessageCircle, Loader2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import PropertyCard from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface HostData {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
  created_at: string;
}

interface Property {
  id: string;
  title: string;
  location: string;
  price_per_night: number;
  rating: number | null;
  review_count: number | null;
  images: string[];
  bedrooms: number | null;
  bathrooms: number | null;
}

const HostProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [host, setHost] = useState<HostData | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchHostData();
    }
  }, [id]);

  const fetchHostData = async () => {
    try {
      // Fetch host profile
      const { data: hostData, error: hostError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (hostError) throw hostError;
      setHost(hostData);

      // Fetch host's properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from("properties")
        .select("*")
        .eq("host_id", id)
        .eq("is_active", true);

      if (propertiesError) throw propertiesError;
      setProperties(propertiesData || []);
    } catch (error) {
      console.error("Error fetching host data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "H";
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const getMemberSince = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!host) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Host not found</h1>
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Host Info Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6 text-center">
                <Avatar className="h-32 w-32 mx-auto mb-4">
                  <AvatarImage src={host.avatar_url || undefined} />
                  <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                    {getInitials(host.full_name)}
                  </AvatarFallback>
                </Avatar>
                
                <h1 className="text-2xl font-bold mb-2">{host.full_name || "Host"}</h1>
                
                {host.is_verified && (
                  <Badge className="mb-4" variant="secondary">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified Host
                  </Badge>
                )}

                <div className="space-y-3 text-sm text-muted-foreground mb-6">
                  <div className="flex items-center justify-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Member since {getMemberSince(host.created_at)}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <span>{properties.length} listings</span>
                  </div>
                </div>

                {host.bio && (
                  <div className="text-left mb-6">
                    <h3 className="font-semibold mb-2">About</h3>
                    <p className="text-sm text-muted-foreground">{host.bio}</p>
                  </div>
                )}

                {user && user.id !== host.id && (
                  <Link to={`/messages?to=${host.id}`}>
                    <Button className="w-full">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contact Host
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Properties */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6">
              {host.full_name ? `${host.full_name}'s Listings` : "Listings"}
            </h2>
            
            {properties.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No active listings yet
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {properties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    id={property.id}
                    image={property.images?.[0] || "/placeholder.svg"}
                    name={property.title}
                    location={property.location}
                    price={property.price_per_night}
                    rating={property.rating || 0}
                    reviews={property.review_count || 0}
                    bedrooms={property.bedrooms || 1}
                    bathrooms={property.bathrooms || 1}
                    beds={property.bedrooms || 1}
                    approvalStatus={(property as any).approval_status}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

    </AppLayout>
  );
};

export default HostProfile;