import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import HostLayout from "@/components/HostLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FileSpreadsheet,
  FileText,
  Search,
  RotateCcw,
  Eye,
  Check,
  X,
  RefreshCw,
  Loader2,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format, differenceInCalendarDays, parseISO } from "date-fns";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ReservationItem {
  id: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  arrivingIn: string; // e.g. "19 Days"
  checkIn: string; // e.g. "Saturday, 10/10/2026"
  checkOut: string; // e.g. "Saturday, 17/10/2026"
  nights: number;
  payout: string; // e.g. "360,000 IQD"
  payoutRaw: number;
  status: "paid" | "refund_requested" | "pending_review" | "cancelled_refunded" | "confirmed";
  statusLabel: string;
  category: "upcoming" | "pending" | "cancelled" | "refund_requests";
  propertyTitle: string;
  refundReason?: string;
  refundRequestId?: string;
  isDimmed?: boolean;
}

type FilterTab = "all" | "upcoming" | "pending" | "cancelled" | "refund_requests";

const HostReservations = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReservation, setSelectedReservation] = useState<ReservationItem | null>(null);
  const [refundModalItem, setRefundModalItem] = useState<ReservationItem | null>(null);
  const [hostRefundNote, setHostRefundNote] = useState("");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Determine host's first name, defaulting to "Ahmad"
  const hostName = useMemo(() => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.trim().split(" ")[0];
    }
    if (user?.user_metadata?.name) {
      return user.user_metadata.name.trim().split(" ")[0];
    }
    if (user?.email) {
      const emailPrefix = user.email.split("@")[0];
      return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    }
    return "Ahmad";
  }, [user]);

  // Fetch real data from Supabase
  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      // 1. Fetch bookings where host_id is user.id
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select(`
          id, property_id, guest_id, host_id, check_in, check_out, total_price, status,
          currency, guests, is_paid, refund_status, refund_amount, cancellation_reason,
          created_at,
          properties:properties(id, title, location)
        `)
        .eq("host_id", user.id)
        .order("check_in", { ascending: true });

      if (bookingsError) {
        console.warn("Error querying bookings:", bookingsError.message);
      }

      // 2. Fetch any refund requests for this host
      const { data: refundData } = await supabase
        .from("refund_requests")
        .select("*")
        .eq("host_id", user.id);

      const refundMap = new Map((refundData || []).map((r) => [r.booking_id, r]));

      // 3. Fetch guest profiles
      const guestIds = Array.from(
        new Set((bookingsData || []).map((b: any) => b.guest_id).filter(Boolean))
      );
      let guestMap = new Map<string, any>();
      if (guestIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, email, phone")
          .in("id", guestIds);
        guestMap = new Map((profilesData || []).map((p) => [p.id, p]));
      }

      // 4. Map database rows to UI structure
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const mapped: ReservationItem[] = (bookingsData || []).map((b: any) => {
        const guest = guestMap.get(b.guest_id);
        const refundReq = refundMap.get(b.id);

        let inDate: Date;
        let outDate: Date;
        try {
          inDate = parseISO(b.check_in);
          outDate = parseISO(b.check_out);
        } catch {
          inDate = new Date(b.check_in);
          outDate = new Date(b.check_out);
        }

        const formattedCheckIn = !isNaN(inDate.getTime())
          ? format(inDate, "EEEE, dd/MM/yyyy")
          : b.check_in;
        const formattedCheckOut = !isNaN(outDate.getTime())
          ? format(outDate, "EEEE, dd/MM/yyyy")
          : b.check_out;

        const diffDays = !isNaN(inDate.getTime())
          ? differenceInCalendarDays(inDate, now)
          : 0;
        const arrivingIn =
          diffDays > 0 ? `${diffDays} Days` : diffDays === 0 ? "Today" : "Completed";

        const nights = !isNaN(outDate.getTime()) && !isNaN(inDate.getTime())
          ? Math.max(1, differenceInCalendarDays(outDate, inDate))
          : 1;

        const payoutFormatted = `${Number(b.total_price || 0).toLocaleString()} ${b.currency || "IQD"}`;

        // Status & Category logic
        let status: ReservationItem["status"] = "paid";
        let statusLabel = "Paid";
        let category: ReservationItem["category"] = "upcoming";
        let isDimmed = false;

        const isRefund =
          b.refund_status === "requested" ||
          (refundReq && refundReq.status === "pending_host") ||
          b.status === "refund_requested";

        if (isRefund) {
          status = "refund_requested";
          statusLabel = "Cancelled - Refund Request";
          category = "refund_requests";
        } else if (b.status === "pending" || b.status === "pending_review") {
          status = "pending_review";
          statusLabel = "Pending Review";
          category = "pending";
        } else if (
          b.status === "cancelled" ||
          b.status === "cancelled_refunded" ||
          b.refund_status === "approved"
        ) {
          status = "cancelled_refunded";
          statusLabel = "Cancelled - Refunded";
          category = "cancelled";
          isDimmed = true;
        } else {
          status = "paid";
          statusLabel = "Paid";
          category = "upcoming";
        }

        return {
          id: b.id,
          guestName: guest?.full_name || "Guest",
          guestEmail: guest?.email,
          guestPhone: guest?.phone,
          arrivingIn,
          checkIn: formattedCheckIn,
          checkOut: formattedCheckOut,
          nights,
          payout: payoutFormatted,
          payoutRaw: Number(b.total_price || 0),
          status,
          statusLabel,
          category,
          propertyTitle: b.properties?.title || "Property Stay",
          refundReason:
            refundReq?.details || refundReq?.reason || b.cancellation_reason || undefined,
          refundRequestId: refundReq?.id,
          isDimmed,
        };
      });

      setReservations(mapped);
    } catch (err: any) {
      console.error("Error loading reservations:", err);
      toast.error("Failed to fetch reservations from Supabase");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Counts
  const counts = useMemo(() => {
    const upcoming = reservations.filter((r) => r.category === "upcoming").length;
    const pending = reservations.filter((r) => r.category === "pending").length;
    const cancelled = reservations.filter(
      (r) => r.category === "cancelled" || r.status === "cancelled_refunded"
    ).length;
    const refundRequests = reservations.filter((r) => r.category === "refund_requests").length;
    const all = reservations.length;
    return { all, upcoming, pending, cancelled, refundRequests };
  }, [reservations]);

  // Filtered reservations
  const filteredReservations = useMemo(() => {
    return reservations.filter((res) => {
      let matchesTab = true;
      if (activeTab === "upcoming") {
        matchesTab = res.category === "upcoming";
      } else if (activeTab === "pending") {
        matchesTab = res.category === "pending";
      } else if (activeTab === "cancelled") {
        matchesTab = res.category === "cancelled" || res.status === "cancelled_refunded";
      } else if (activeTab === "refund_requests") {
        matchesTab = res.category === "refund_requests";
      }

      const matchesSearch =
        !searchQuery.trim() ||
        res.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.statusLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [reservations, activeTab, searchQuery]);

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    try {
      const exportData = filteredReservations.map((r, index) => ({
        "No.": index + 1,
        Guest: r.guestName,
        "Arriving in": r.arrivingIn,
        "Check-in": r.checkIn,
        "Check-out": r.checkOut,
        "Number of Nights": r.nights,
        "Pay out": r.payout,
        "Booking Status": r.statusLabel,
        Property: r.propertyTitle,
        "Guest Email": r.guestEmail || "N/A",
        "Guest Phone": r.guestPhone || "N/A",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);

      worksheet["!cols"] = [
        { wch: 6 },
        { wch: 20 },
        { wch: 14 },
        { wch: 24 },
        { wch: 24 },
        { wch: 16 },
        { wch: 18 },
        { wch: 28 },
        { wch: 32 },
        { wch: 28 },
        { wch: 18 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Reservations");

      XLSX.writeFile(
        workbook,
        `Meewano_Reservations_${activeTab}_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      toast.success("Excel report exported successfully");
    } catch (err) {
      console.error("Excel export error:", err);
      toast.error("Failed to export Excel file");
    }
  };

  // Export to PDF
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(30, 41, 59);
      doc.text("MEEWANO HOST RESERVATIONS", 40, 45);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Host: ${hostName} | Generated: ${new Date().toLocaleDateString()}`, 40, 65);
      doc.text(`Active Filter: ${activeTab.toUpperCase()} | Total Records: ${filteredReservations.length}`, 40, 80);

      const tableHeaders = [
        ["Guest", "Arriving in", "Check-in", "Check-out", "Nights", "Pay out", "Booking Status", "Property"],
      ];

      const tableRows = filteredReservations.map((r) => [
        r.guestName,
        r.arrivingIn,
        r.checkIn,
        r.checkOut,
        r.nights.toString(),
        r.payout,
        r.statusLabel,
        r.propertyTitle,
      ]);

      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 95,
        theme: "grid",
        headStyles: {
          fillColor: [180, 59, 143],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 10,
        },
        styles: {
          fontSize: 9,
          cellPadding: 5,
          valign: "middle",
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
      });

      doc.save(`Meewano_Reservations_${activeTab}_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("PDF report exported successfully");
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Failed to export PDF file");
    }
  };

  // Database Actions (100% Real Supabase Updates)
  const handleApproveBooking = async (id: string) => {
    setActionInProgress(id);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "confirmed", is_paid: true })
        .eq("id", id)
        .eq("host_id", user?.id);

      if (error) throw error;
      toast.success("Booking confirmed and marked as Paid in database!");
      loadData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update booking status");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeclineBooking = async (id: string) => {
    setActionInProgress(id);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled", is_paid: false })
        .eq("id", id)
        .eq("host_id", user?.id);

      if (error) throw error;
      toast.error("Booking declined and marked as Cancelled.");
      loadData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to decline booking");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleApproveRefund = async (resItem: ReservationItem) => {
    setActionInProgress(resItem.id);
    try {
      // Update refund_requests table if exists
      if (resItem.refundRequestId) {
        await supabase
          .from("refund_requests")
          .update({
            status: "host_approved_refund",
            host_decision_reason: hostRefundNote || "Approved by host",
          })
          .eq("id", resItem.refundRequestId);
      }

      // Update bookings table
      const { error } = await supabase
        .from("bookings")
        .update({
          status: "cancelled_refunded",
          refund_status: "approved",
          is_paid: false,
        })
        .eq("id", resItem.id);

      if (error) throw error;

      toast.success("Refund approved in database for guest!");
      setRefundModalItem(null);
      setHostRefundNote("");
      loadData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to process refund approval");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeclineRefund = async (resItem: ReservationItem) => {
    setActionInProgress(resItem.id);
    try {
      if (resItem.refundRequestId) {
        await supabase
          .from("refund_requests")
          .update({
            status: "host_rejected",
            host_decision_reason: hostRefundNote || "Declined by host",
          })
          .eq("id", resItem.refundRequestId);
      }

      const { error } = await supabase
        .from("bookings")
        .update({
          refund_status: "rejected",
        })
        .eq("id", resItem.id);

      if (error) throw error;

      toast.info("Refund request rejected and escalated to Meewano support.");
      setRefundModalItem(null);
      setHostRefundNote("");
      loadData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to decline refund");
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <HostLayout>
      {/* Reduced outer padding: using tight px-2 sm:px-4 md:px-5 and max-w-[100%] */}
      <div className="w-full px-2 sm:px-4 md:px-5 py-5 max-w-[100%] mx-auto">
        {/* 1. Header Greeting & Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-5">
          <div>
            <span className="text-xs sm:text-sm font-semibold tracking-wide text-primary">
              Hello {hostName}!
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mt-0.5">
              Your Reservations
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Live guest reservations, real-time booking approvals, and refund resolutions.
            </p>
          </div>

          {/* Action & Export Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="h-8 px-3 rounded-lg border-emerald-600/30 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/30 font-medium text-xs gap-1.5 shadow-xs"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              <span>Export Excel</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              className="h-8 px-3 rounded-lg border-primary/30 hover:bg-primary/10 hover:text-primary font-medium text-xs gap-1.5 shadow-xs"
            >
              <FileText className="h-3.5 w-3.5 text-primary" />
              <span>Export PDF</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
              title="Refresh from database"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* 2. Filter Navigation Buttons & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 pb-2 border-b border-border/80">
          {/* Filter Pills with exact counts */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === "all"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                  : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              All {counts.all > 0 && `(${counts.all})`}
            </button>

            <button
              onClick={() => setActiveTab("upcoming")}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === "upcoming"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                  : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              Upcoming ({counts.upcoming})
            </button>

            <button
              onClick={() => setActiveTab("pending")}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === "pending"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                  : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              Pending Approval ({counts.pending})
            </button>

            <button
              onClick={() => setActiveTab("cancelled")}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === "cancelled"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                  : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              Cancelled ({counts.cancelled})
            </button>

            <button
              onClick={() => setActiveTab("refund_requests")}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === "refund_requests"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
              }`}
            >
              Refund Requests ({counts.refundRequests})
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[200px] sm:max-w-xs">
            <Search className="h-3 w-3 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search guest or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs rounded-full bg-background border-border/80"
            />
          </div>
        </div>

        {/* 4. Reservations Table (Full-width with tighter px-2.5 sm:px-3 cell padding) */}
        <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-muted/30">
                  <th className="py-2.5 px-2.5 sm:px-3.5 font-bold text-xs uppercase tracking-wider text-[#b43b8f] dark:text-pink-400 whitespace-nowrap">
                    Guest
                  </th>
                  <th className="py-2.5 px-2.5 sm:px-3.5 font-bold text-xs uppercase tracking-wider text-[#b43b8f] dark:text-pink-400 whitespace-nowrap">
                    Arriving in
                  </th>
                  <th className="py-2.5 px-2.5 sm:px-3.5 font-bold text-xs uppercase tracking-wider text-[#b43b8f] dark:text-pink-400 whitespace-nowrap">
                    Check-in
                  </th>
                  <th className="py-2.5 px-2.5 sm:px-3.5 font-bold text-xs uppercase tracking-wider text-[#b43b8f] dark:text-pink-400 whitespace-nowrap">
                    Check-out
                  </th>
                  <th className="py-2.5 px-2.5 sm:px-3.5 font-bold text-xs uppercase tracking-wider text-[#b43b8f] dark:text-pink-400 text-center whitespace-nowrap">
                    Number of Nights
                  </th>
                  <th className="py-2.5 px-2.5 sm:px-3.5 font-bold text-xs uppercase tracking-wider text-[#b43b8f] dark:text-pink-400 whitespace-nowrap">
                    Pay out
                  </th>
                  <th className="py-2.5 px-2.5 sm:px-3.5 font-bold text-xs uppercase tracking-wider text-[#b43b8f] dark:text-pink-400 whitespace-nowrap">
                    Booking Status
                  </th>
                  <th className="py-2.5 px-2.5 sm:px-3.5 font-bold text-xs uppercase tracking-wider text-muted-foreground text-right whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="text-xs text-muted-foreground">
                          Loading reservations from Supabase...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : filteredReservations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground text-xs sm:text-sm">
                      {reservations.length === 0
                        ? "No reservations found"
                        : "No reservations found for the selected filter."}
                    </td>
                  </tr>
                ) : (
                  filteredReservations.map((item) => {
                    const isMuted = item.isDimmed;

                    // Color scheme for booking status cell matching image
                    let statusCellClass =
                      "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold";
                    if (item.status === "refund_requested") {
                      statusCellClass =
                        "bg-[#ffedd5] text-[#c2410c] dark:bg-amber-950/50 dark:text-amber-300 font-semibold";
                    } else if (item.status === "pending_review") {
                      statusCellClass =
                        "bg-[#ffedd5] text-[#c2410c] dark:bg-orange-950/50 dark:text-orange-300 font-semibold";
                    } else if (item.status === "cancelled_refunded") {
                      statusCellClass =
                        "bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400 font-medium";
                    }

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-muted/40 transition-colors ${
                          isMuted ? "opacity-60 text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {/* Guest */}
                        <td className="py-2.5 px-2.5 sm:px-3.5 font-semibold whitespace-nowrap">
                          <span>{item.guestName}</span>
                        </td>

                        {/* Arriving in */}
                        <td className="py-2.5 px-2.5 sm:px-3.5 whitespace-nowrap font-medium">
                          {item.arrivingIn}
                        </td>

                        {/* Check-in */}
                        <td className="py-2.5 px-2.5 sm:px-3.5 whitespace-nowrap">
                          {item.checkIn}
                        </td>

                        {/* Check-out */}
                        <td className="py-2.5 px-2.5 sm:px-3.5 whitespace-nowrap">
                          {item.checkOut}
                        </td>

                        {/* Number of Nights */}
                        <td className="py-2.5 px-2.5 sm:px-3.5 text-center whitespace-nowrap font-mono">
                          {item.nights}
                        </td>

                        {/* Pay out */}
                        <td className="py-2.5 px-2.5 sm:px-3.5 whitespace-nowrap font-semibold">
                          {item.payout}
                        </td>

                        {/* Booking Status Cell */}
                        <td className="py-2.5 px-2.5 sm:px-3.5 whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs ${statusCellClass}`}>
                            {item.statusLabel}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-2.5 sm:px-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {/* For Pending Approval */}
                            {item.status === "pending_review" && (
                              <>
                                <Button
                                  size="sm"
                                  disabled={actionInProgress === item.id}
                                  onClick={() => handleApproveBooking(item.id)}
                                  className="h-7 px-2.5 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                                  title="Approve booking"
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={actionInProgress === item.id}
                                  onClick={() => handleDeclineBooking(item.id)}
                                  className="h-7 px-2 rounded-md text-xs text-destructive hover:bg-destructive/10"
                                  title="Decline booking"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </>
                            )}

                            {/* For Refund Requests */}
                            {item.status === "refund_requested" && (
                              <Button
                                size="sm"
                                disabled={actionInProgress === item.id}
                                onClick={() => setRefundModalItem(item)}
                                className="h-7 px-2.5 rounded-md text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white"
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Review Refund
                              </Button>
                            )}

                            {/* View Details */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedReservation(item)}
                              className="h-7 w-7 p-0 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                              title="View reservation details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={!!selectedReservation} onOpenChange={() => setSelectedReservation(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reservation Details</DialogTitle>
            <DialogDescription>
              Overview for stay by {selectedReservation?.guestName}
            </DialogDescription>
          </DialogHeader>

          {selectedReservation && (
            <div className="space-y-4 py-2 text-sm">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Property:</span>
                  <span className="font-semibold text-xs text-foreground text-right">
                    {selectedReservation.propertyTitle}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Guest:</span>
                  <span className="font-medium text-foreground">{selectedReservation.guestName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Email:</span>
                  <span className="text-muted-foreground text-xs">{selectedReservation.guestEmail || "N/A"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Phone:</span>
                  <span className="text-muted-foreground text-xs">{selectedReservation.guestPhone || "N/A"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded-lg border border-border/70">
                  <span className="text-muted-foreground block mb-0.5">Check-in</span>
                  <span className="font-semibold text-foreground">{selectedReservation.checkIn}</span>
                </div>
                <div className="p-2.5 rounded-lg border border-border/70">
                  <span className="text-muted-foreground block mb-0.5">Check-out</span>
                  <span className="font-semibold text-foreground">{selectedReservation.checkOut}</span>
                </div>
                <div className="p-2.5 rounded-lg border border-border/70">
                  <span className="text-muted-foreground block mb-0.5">Duration</span>
                  <span className="font-semibold text-foreground">{selectedReservation.nights} Nights</span>
                </div>
                <div className="p-2.5 rounded-lg border border-border/70">
                  <span className="text-muted-foreground block mb-0.5">Host Payout</span>
                  <span className="font-bold text-foreground text-primary">{selectedReservation.payout}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                <span className="text-xs text-muted-foreground">Booking Status:</span>
                <span className="font-semibold text-xs">{selectedReservation.statusLabel}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSelectedReservation(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 7. Refund Request Management Dialog */}
      <Dialog open={!!refundModalItem} onOpenChange={() => setRefundModalItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <RotateCcw className="h-5 w-5" />
              Review Refund Request
            </DialogTitle>
            <DialogDescription>
              Guest {refundModalItem?.guestName} requested a cancellation refund for{" "}
              {refundModalItem?.propertyTitle}.
            </DialogDescription>
          </DialogHeader>

          {refundModalItem && (
            <div className="space-y-4 py-2 text-sm">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200">
                <p className="font-semibold mb-1">Reason given by guest:</p>
                <p className="leading-relaxed">
                  {refundModalItem.refundReason || "Cancellation requested prior to check-in."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded-lg border">
                  <span className="text-muted-foreground block">Stay Dates</span>
                  <span className="font-semibold">
                    {refundModalItem.checkIn} - {refundModalItem.checkOut}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg border">
                  <span className="text-muted-foreground block">Eligible Payout</span>
                  <span className="font-bold text-primary">{refundModalItem.payout}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  Host Decision Note (saved to Supabase):
                </label>
                <Textarea
                  placeholder="Leave a message for guest or Meewano support..."
                  value={hostRefundNote}
                  onChange={(e) => setHostRefundNote(e.target.value)}
                  className="text-xs min-h-[70px]"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={actionInProgress !== null}
              className="text-destructive hover:bg-destructive/10"
              onClick={() => refundModalItem && handleDeclineRefund(refundModalItem)}
            >
              Decline Refund
            </Button>
            <Button
              size="sm"
              disabled={actionInProgress !== null}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              onClick={() => refundModalItem && handleApproveRefund(refundModalItem)}
            >
              Approve 100% Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </HostLayout>
  );
};

export default HostReservations;
