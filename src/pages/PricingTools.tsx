import { useState, useEffect, useMemo } from "react";
import { DollarSign, TrendingUp, Calendar, Percent, Loader2, Check } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useProperties } from "@/hooks/useProperties";
import { useBookings } from "@/hooks/useBookings";
import { useUpdateProperty } from "@/hooks/useProperties";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, parseISO } from "date-fns";

const PricingTools = () => {
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: myProperties, isLoading: propsLoading } = useProperties({ hostId: user?.id });
  const { data: myBookings, isLoading: bookingsLoading } = useBookings({ hostId: user?.id });
  const { data: allProperties } = useProperties();
  const updateProperty = useUpdateProperty();

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [basePrice, setBasePrice] = useState("");
  const [saving, setSaving] = useState(false);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("pricing-tools-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `host_id=eq.${user.id}` },
        () => { queryClient.invalidateQueries({ queryKey: ["bookings"] }); })
      .on("postgres_changes", { event: "*", schema: "public", table: "properties", filter: `host_id=eq.${user.id}` },
        () => { queryClient.invalidateQueries({ queryKey: ["properties"] }); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  // Set initial selected property
  useEffect(() => {
    if (myProperties?.length && !selectedPropertyId) {
      setSelectedPropertyId(myProperties[0].id);
      setBasePrice(String(myProperties[0].price_per_night));
    }
  }, [myProperties, selectedPropertyId]);

  // Update base price when property changes
  useEffect(() => {
    if (selectedPropertyId && myProperties) {
      const prop = myProperties.find(p => p.id === selectedPropertyId);
      if (prop) setBasePrice(String(prop.price_per_night));
    }
  }, [selectedPropertyId, myProperties]);

  const selectedProperty = myProperties?.find(p => p.id === selectedPropertyId);

  // Market insights from all properties
  const marketInsights = useMemo(() => {
    if (!allProperties?.length) return null;
    const prices = allProperties.map(p => p.price_per_night).filter(p => p > 0);
    if (prices.length === 0) return null;

    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const sorted = [...prices].sort((a, b) => a - b);
    const peak = sorted[Math.floor(sorted.length * 0.9)] || avg;
    const offSeason = sorted[Math.floor(sorted.length * 0.1)] || avg;
    const median = sorted[Math.floor(sorted.length / 2)] || avg;

    return { avg: Math.round(avg), peak: Math.round(peak), offSeason: Math.round(offSeason), median: Math.round(median), totalListings: prices.length };
  }, [allProperties]);

  // Seasonal chart: your property's booking revenue vs market avg by month
  const seasonalData = useMemo(() => {
    if (!allProperties?.length) return [];
    const now = new Date();
    const months: { month: string; avgPrice: number; yourPrice: number }[] = [];

    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), i, 1);
      const monthLabel = format(d, "MMM");

      // Market average price
      const avgPrice = marketInsights?.avg || 0;

      // Your current price
      const yourPrice = selectedProperty?.price_per_night || parseFloat(basePrice) || 0;

      months.push({ month: monthLabel, avgPrice, yourPrice });
    }

    return months;
  }, [allProperties, marketInsights, selectedProperty, basePrice]);

  // Revenue from selected property
  const propertyRevenue = useMemo(() => {
    if (!myBookings || !selectedPropertyId) return 0;
    return myBookings
      .filter(b => b.property_id === selectedPropertyId && (b.status === "confirmed" || b.status === "completed"))
      .reduce((sum, b) => sum + b.total_price, 0);
  }, [myBookings, selectedPropertyId]);

  const propertyBookingsCount = useMemo(() => {
    if (!myBookings || !selectedPropertyId) return 0;
    return myBookings.filter(b => b.property_id === selectedPropertyId).length;
  }, [myBookings, selectedPropertyId]);

  const handleSavePrice = async () => {
    if (!selectedPropertyId || !basePrice) return;
    setSaving(true);
    try {
      await updateProperty.mutateAsync({
        id: selectedPropertyId,
        price_per_night: parseFloat(basePrice),
      });
      toast.success("Price updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update price");
    } finally {
      setSaving(false);
    }
  };

  // Price position relative to market
  const pricePosition = useMemo(() => {
    if (!marketInsights || !basePrice) return null;
    const price = parseFloat(basePrice);
    const diff = ((price - marketInsights.avg) / marketInsights.avg) * 100;
    return { diff: Math.round(diff), isAbove: diff > 0 };
  }, [marketInsights, basePrice]);

  if (propsLoading || bookingsLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Pricing Tools</h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              Optimize your pricing with real market data
              <span className="inline-flex items-center text-xs">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1" />
                Live
              </span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Base Price Settings */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Set Your Base Price</CardTitle>
              <CardDescription>
                Adjust your nightly rate based on real market insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Property selector */}
              <div>
                <Label>Select Property</Label>
                <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    {myProperties?.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProperty && (
                <>
                  {/* Stats row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-xl font-bold">{formatPrice(propertyRevenue)}</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Bookings</p>
                      <p className="text-xl font-bold">{propertyBookingsCount}</p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="basePrice">Base Nightly Rate</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <Input
                        id="basePrice"
                        type="number"
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value)}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground">per night</span>
                    </div>
                    {pricePosition && (
                      <p className="text-sm mt-2">
                        Your price is{" "}
                        <span className={pricePosition.isAbove ? "text-amber-500 font-medium" : "text-green-500 font-medium"}>
                          {Math.abs(pricePosition.diff)}% {pricePosition.isAbove ? "above" : "below"}
                        </span>{" "}
                        the market average ({formatPrice(marketInsights?.avg || 0)})
                      </p>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleSavePrice}
                    disabled={saving || parseFloat(basePrice) === selectedProperty.price_per_night}
                  >
                    {saving ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>
                    ) : parseFloat(basePrice) === selectedProperty.price_per_night ? (
                      <><Check className="h-4 w-4 mr-2" /> Price Up to Date</>
                    ) : (
                      "Save New Price"
                    )}
                  </Button>
                </>
              )}

              {!myProperties?.length && (
                <p className="text-center text-muted-foreground py-4">
                  You don't have any properties yet. Add a listing first.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Market Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Market Insights
              </CardTitle>
              <CardDescription>{marketInsights?.totalListings || 0} active listings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {marketInsights ? (
                <>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Average Nightly Rate</p>
                    <span className="text-2xl font-bold">{formatPrice(marketInsights.avg)}</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Peak Rate (90th percentile)</p>
                    <span className="text-2xl font-bold">{formatPrice(marketInsights.peak)}</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Budget Rate (10th percentile)</p>
                    <span className="text-2xl font-bold">{formatPrice(marketInsights.offSeason)}</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Median Rate</p>
                    <span className="text-2xl font-bold">{formatPrice(marketInsights.median)}</span>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">No market data available yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Seasonal Pricing Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Your Price vs Market Average
            </CardTitle>
            <CardDescription>
              See how your pricing compares with the platform average
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={seasonalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [formatPrice(value as number)]} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="avgPrice" 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeWidth={2}
                  name="Market Average"
                  strokeDasharray="5 5"
                />
                <Line 
                  type="monotone" 
                  dataKey="yourPrice" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Your Price"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </main>
      
    </AppLayout>
  );
};

export default PricingTools;
