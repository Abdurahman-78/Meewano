import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Download, TrendingUp, DollarSign, CreditCard, Banknote, RefreshCw } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { Booking } from "@/hooks/useBookings";
import { useState } from "react";
import { startOfWeek, startOfMonth, startOfQuarter, startOfYear, isAfter, format, parseISO } from "date-fns";

interface AdminFinanceReportsProps {
  bookings: Booking[];
  commissionRate: number;
}

const AdminFinanceReports = ({ bookings, commissionRate }: AdminFinanceReportsProps) => {
  const [period, setPeriod] = useState("month");
  const { formatPrice } = useCurrency();

  // Filter bookings by period
  const filteredBookings = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case "week":
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        break;
      case "month":
        startDate = startOfMonth(now);
        break;
      case "quarter":
        startDate = startOfQuarter(now);
        break;
      case "year":
        startDate = startOfYear(now);
        break;
      default:
        startDate = startOfMonth(now);
    }
    return bookings.filter(b => isAfter(parseISO(b.created_at), startDate));
  }, [bookings, period]);

  // Calculate statistics from filtered bookings
  const completedBookings = filteredBookings.filter(b => b.status === "confirmed" || b.status === "completed");
  const totalRevenue = completedBookings.reduce((sum, b) => sum + b.total_price, 0);
  const totalCommission = totalRevenue * (commissionRate / 100);
  const cashPayments = completedBookings.filter(b => (b as any).payment_method === "cash");
  const cardPayments = completedBookings.filter(b => (b as any).payment_method !== "cash");

  // Payment method breakdown
  const paymentMethodData = [
    { name: "Card/Online", value: cardPayments.reduce((sum, b) => sum + b.total_price, 0), color: "#3b82f6" },
    { name: "Cash", value: cashPayments.reduce((sum, b) => sum + b.total_price, 0), color: "#22c55e" },
  ];

  // Real monthly revenue data from all bookings (last 12 months)
  const monthlyData = useMemo(() => {
    const months: Record<string, { revenue: number; bookings: number }> = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = format(d, "MMM yyyy");
      months[key] = { revenue: 0, bookings: 0 };
    }

    const completed = bookings.filter(b => b.status === "confirmed" || b.status === "completed");
    completed.forEach(b => {
      const key = format(parseISO(b.created_at), "MMM yyyy");
      if (months[key]) {
        months[key].revenue += b.total_price;
        months[key].bookings += 1;
      }
    });

    return Object.entries(months).map(([month, data]) => ({
      month: month.split(" ")[0],
      revenue: data.revenue,
      bookings: data.bookings,
    }));
  }, [bookings]);

  // Booking status breakdown from filtered data
  const statusData = [
    { status: "Confirmed", count: filteredBookings.filter(b => b.status === "confirmed").length, color: "#22c55e" },
    { status: "Pending", count: filteredBookings.filter(b => b.status === "pending").length, color: "#f59e0b" },
    { status: "Completed", count: filteredBookings.filter(b => b.status === "completed").length, color: "#3b82f6" },
    { status: "Cancelled", count: filteredBookings.filter(b => b.status === "cancelled").length, color: "#ef4444" },
    { status: "Rejected", count: filteredBookings.filter(b => b.status === "rejected").length, color: "#6b7280" },
  ];

  const handleExportCSV = () => {
    const headers = ["Booking ID", "Property", "Check-in", "Check-out", "Amount", "Status", "Payment Method", "Created"];
    const rows = filteredBookings.map(b => [
      b.id,
      b.properties?.title || "N/A",
      b.check_in,
      b.check_out,
      b.total_price,
      b.status,
      (b as any).payment_method || "card",
      b.created_at
    ]);
    
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financial-report-${period}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Finance & Reports</h2>
          <p className="text-muted-foreground">
            Real-time revenue, commissions, and payment analytics
            <span className="inline-flex items-center ml-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1" />
              Live
            </span>
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatPrice(totalRevenue)}</p>
                <p className="text-xs text-muted-foreground mt-1">{completedBookings.length} paid bookings</p>
              </div>
              <div className="p-3 rounded-full bg-accent text-primary">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Platform Commission ({commissionRate}%)</p>
                <p className="text-2xl font-bold">{formatPrice(totalCommission)}</p>
              </div>
              <div className="p-3 rounded-full bg-accent text-primary">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Card Payments</p>
                <p className="text-2xl font-bold">{formatPrice(paymentMethodData[0].value)}</p>
                <p className="text-xs text-muted-foreground mt-1">{cardPayments.length} transactions</p>
              </div>
              <div className="p-3 rounded-full bg-accent text-primary">
                <CreditCard className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cash Payments</p>
                <p className="text-2xl font-bold">{formatPrice(paymentMethodData[1].value)}</p>
                <p className="text-xs text-muted-foreground mt-1">{cashPayments.length} transactions</p>
              </div>
              <div className="p-3 rounded-full bg-accent text-primary">
                <Banknote className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue (Last 12 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, "Revenue"]} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Method Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethodData.filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatPrice(value as number)} />
              </PieChart>
            </ResponsiveContainer>
            {paymentMethodData.every(d => d.value === 0) && (
              <p className="text-center text-muted-foreground text-sm">No payment data for this period</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Booking Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))">
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions ({filteredBookings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking ID</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No transactions for this period
                  </TableCell>
                </TableRow>
              ) : (
                filteredBookings.slice(0, 20).map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-xs">{booking.id.slice(0, 8)}...</TableCell>
                    <TableCell>{booking.properties?.title || "N/A"}</TableCell>
                    <TableCell>{booking.check_in}</TableCell>
                    <TableCell>{formatPrice(booking.total_price)}</TableCell>
                    <TableCell className="text-green-600">
                      {formatPrice(booking.total_price * (commissionRate / 100))}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {(booking as any).payment_method === "cash" ? "Cash" : "Card"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          booking.status === "confirmed" || booking.status === "completed" 
                            ? "default" 
                            : booking.status === "pending" 
                              ? "secondary" 
                              : "destructive"
                        }
                      >
                        {booking.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFinanceReports;
