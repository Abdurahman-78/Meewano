import { useState, useEffect, useMemo } from "react";
import { TrendingUp, TrendingDown, DollarSign, Home, Calendar, Loader2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useBookings } from "@/hooks/useBookings";
import { useProperties } from "@/hooks/useProperties";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { startOfWeek, startOfMonth, startOfQuarter, startOfYear, subWeeks, subMonths, subQuarters, subYears, isAfter, format, parseISO, differenceInDays } from "date-fns";

const HostAnalytics = () => {
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("month");
  const queryClient = useQueryClient();

  const { data: bookings, isLoading: bookingsLoading } = useBookings({ hostId: user?.id });
  const { data: properties, isLoading: propertiesLoading } = useProperties({ hostId: user?.id });

  // Realtime subscription for bookings
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("host-analytics-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `host_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["bookings"] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  // Period filtering
  const { currentBookings, previousBookings } = useMemo(() => {
    if (!bookings) return { currentBookings: [], previousBookings: [] };
    const now = new Date();
    let currentStart: Date;
    let previousStart: Date;

    switch (timeRange) {
      case "week":
        currentStart = startOfWeek(now, { weekStartsOn: 1 });
        previousStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        break;
      case "month":
        currentStart = startOfMonth(now);
        previousStart = startOfMonth(subMonths(now, 1));
        break;
      case "quarter":
        currentStart = startOfQuarter(now);
        previousStart = startOfQuarter(subQuarters(now, 1));
        break;
      case "year":
        currentStart = startOfYear(now);
        previousStart = startOfYear(subYears(now, 1));
        break;
      default:
        currentStart = startOfMonth(now);
        previousStart = startOfMonth(subMonths(now, 1));
    }

    return {
      currentBookings: bookings.filter(b => isAfter(parseISO(b.created_at), currentStart)),
      previousBookings: bookings.filter(b => {
        const d = parseISO(b.created_at);
        return isAfter(d, previousStart) && !isAfter(d, currentStart);
      }),
    };
  }, [bookings, timeRange]);

  // Stats
  const completedCurrent = currentBookings.filter(b => b.status === "confirmed" || b.status === "completed");
  const completedPrevious = previousBookings.filter(b => b.status === "confirmed" || b.status === "completed");

  const totalRevenue = completedCurrent.reduce((sum, b) => sum + b.total_price, 0);
  const prevRevenue = completedPrevious.reduce((sum, b) => sum + b.total_price, 0);
  const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

  const totalBookingsCount = currentBookings.length;
  const prevBookingsCount = previousBookings.length;
  const bookingsChange = prevBookingsCount > 0 ? ((totalBookingsCount - prevBookingsCount) / prevBookingsCount) * 100 : 0;

  // Occupancy rate: booked nights / total available nights
  const occupancyRate = useMemo(() => {
    if (!properties?.length || !completedCurrent.length) return 0;
    const totalBookedNights = completedCurrent.reduce((sum, b) => {
      return sum + Math.max(1, differenceInDays(parseISO(b.check_out), parseISO(b.check_in)));
    }, 0);
    const daysInPeriod = timeRange === "week" ? 7 : timeRange === "month" ? 30 : timeRange === "quarter" ? 90 : 365;
    const totalAvailableNights = properties.length * daysInPeriod;
    return Math.min(100, Math.round((totalBookedNights / totalAvailableNights) * 100));
  }, [completedCurrent, properties, timeRange]);

  // Monthly revenue chart (last 12 months from all bookings)
  const revenueChartData = useMemo(() => {
    if (!bookings) return [];
    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months[format(d, "MMM")] = 0;
    }
    const completed = bookings.filter(b => b.status === "confirmed" || b.status === "completed");
    completed.forEach(b => {
      const key = format(parseISO(b.created_at), "MMM");
      if (key in months) months[key] += b.total_price;
    });
    return Object.entries(months).map(([month, revenue]) => ({ month, revenue }));
  }, [bookings]);

  // Monthly bookings chart
  const bookingsChartData = useMemo(() => {
    if (!bookings) return [];
    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months[format(d, "MMM")] = 0;
    }
    bookings.forEach(b => {
      const key = format(parseISO(b.created_at), "MMM");
      if (key in months) months[key]++;
    });
    return Object.entries(months).map(([month, count]) => ({ month, bookings: count }));
  }, [bookings]);

  // Top performing listings
  const topListings = useMemo(() => {
    if (!properties || !bookings) return [];
    return properties.map(p => {
      const propBookings = bookings.filter(b => b.property_id === p.id && (b.status === "confirmed" || b.status === "completed"));
      return {
        id: p.id,
        name: p.title,
        bookings: propBookings.length,
        revenue: propBookings.reduce((sum, b) => sum + b.total_price, 0),
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
  }, [properties, bookings]);

  const ChangeIndicator = ({ value }: { value: number }) => {
    const isPositive = value >= 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const color = isPositive ? "text-green-500" : "text-destructive";
    return (
      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
        <Icon className={`h-3 w-3 ${color}`} />
        <span className={color}>{isPositive ? "+" : ""}{value.toFixed(1)}%</span> from last period
      </p>
    );
  };

  if (bookingsLoading || propertiesLoading) {
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
            <h1 className="text-4xl font-bold">Analytics & Insights</h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              Real-time performance data
              <span className="inline-flex items-center text-xs">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1" />
                Live
              </span>
            </p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
              <SelectItem value="quarter">Last 3 months</SelectItem>
              <SelectItem value="year">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatPrice(totalRevenue)}</div>
              <ChangeIndicator value={revenueChange} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalBookingsCount}</div>
              <ChangeIndicator value={bookingsChange} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Occupancy Rate</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{occupancyRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {properties?.length || 0} active properties
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Booking Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatPrice(completedCurrent.length > 0 ? totalRevenue / completedCurrent.length : 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {completedCurrent.length} completed bookings
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Revenue Trend (Last 12 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [formatPrice(value as number), "Revenue"]} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bookings Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Bookings Overview (Last 12 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bookingsChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="bookings" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Performing Listings */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Listings</CardTitle>
          </CardHeader>
          <CardContent>
            {topListings.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No booking data yet</p>
            ) : (
              <div className="space-y-4">
                {topListings.map((listing) => (
                  <div key={listing.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{listing.name}</h3>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {listing.bookings} bookings
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{formatPrice(listing.revenue)}</div>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      
    </AppLayout>
  );
};

export default HostAnalytics;
