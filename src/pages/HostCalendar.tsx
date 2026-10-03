import { useState, useEffect, useMemo, useCallback } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  parseISO,
  isWithinInterval,
  startOfDay,
  getDay,
  differenceInDays,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar as CalendarIcon,
  DollarSign,
  Percent,
  Info,
  X,
  Clock,
  ShieldCheck,
  Check,
  Edit,
  Plus,
  Trash2,
  User,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import HostLayout from "@/components/HostLayout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "sonner";

type TabType = "pricing" | "discounts" | "availability" | "cancellations";

interface CustomDiscountDate {
  id: string;
  from: string;
  to: string;
  percentage: number;
}

const CHECK_IN_TIMES = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00",
  "22:00", "23:00", "00:00"
];

const CHECK_OUT_TIMES = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
  "14:00", "15:00", "16:00", "17:00", "18:00"
];

const NOTICE_OPTIONS = [
  "Same Day", "1 Day", "2 Days", "3 Days", "4 Days", "5 Days", "7 Days", "14 Days", "30 Days"
];

const PREPARATION_OPTIONS = [
  "0 Night", "1 Night", "2 Night", "3 Night"
];

const DAYS_OF_WEEK = [
  "None", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

const CALENDAR_AVAILABILITY_OPTIONS = [
  "3 Months", "6 Months", "9 Months", "12 Months"
];

const CANCELLATION_POLICIES = [
  {
    id: "free",
    name: "Free Cancellations",
    desc: "The guest can cancel at anytime before check-in and will receive full refund.",
    bullets: ["Full refund anytime before check-in", "Immediate refund processing"],
    recommended: false,
  },
  {
    id: "extra_flexible",
    name: "Extra Flexible",
    desc: "Full refund up to 3 days before check-in. 50% refund up to 24 hours before check-in. No refund within 12 hours of check in.",
    bullets: [
      "Full refund up to 3 days before check-in",
      "50% refund up to 24 hours before check-in",
      "No refund within 12 hours of check-in",
    ],
    recommended: false,
  },
  {
    id: "flexible",
    name: "Flexible",
    desc: "Full refund up to 7 days before check-in. 50% refund up to 24 hours before check-in. No refund within 24 hours of check in.",
    bullets: [
      "Full refund up to 7 days before check-in",
      "50% refund up to 24 hours before check-in",
      "No refund within 24 hours of check in",
    ],
    recommended: true,
  },
  {
    id: "moderate",
    name: "Moderate",
    desc: "Full refund up to 30 days before check-in. 50% refund up to 7 days before check-in. No refund within 7 days of check in.",
    bullets: [
      "Full refund up to 30 days before check-in",
      "50% refund up to 7 days before check-in",
      "No refund within 7 days of check in",
    ],
    recommended: false,
  },
  {
    id: "strict",
    name: "Strict",
    desc: "Full refund up to 60 days before check-in. 50% refund up to 30 days before check-in. No refund within 30 days before check-in.",
    bullets: [
      "Full refund up to 60 days before check-in",
      "50% refund up to 30 days before check-in",
      "No refund within 30 days before check-in",
    ],
    recommended: false,
  },
];

export default function HostCalendar() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryPropertyId = searchParams.get("propertyId");
  const { formatPrice } = useCurrency();

  // Calendar dates
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active right sidebar tab
  const [activeTab, setActiveTab] = useState<TabType>("pricing");

  // Booking detail breakdown popover state
  const [selectedBookingForBreakdown, setSelectedBookingForBreakdown] = useState<any | null>(null);

  // Tab 1: Pricing states
  const [basePrice, setBasePrice] = useState<string>("50000");
  const [weekendPct, setWeekendPct] = useState<number>(40);
  const [weekendPrice, setWeekendPrice] = useState<string>("70000");
  const [cleaningFeeType, setCleaningFeeType] = useState<"included" | "separate">("included");
  const [cleaningFee, setCleaningFee] = useState<string>("10000");

  // Tab 2: Discounts states
  const [firstBookingsActive, setFirstBookingsActive] = useState<boolean>(true);
  const [firstBookingsPct, setFirstBookingsPct] = useState<number>(10);
  const [lastMinuteActive, setLastMinuteActive] = useState<boolean>(false);
  const [lastMinutePct, setLastMinutePct] = useState<number>(15);
  const [threeNightsActive, setThreeNightsActive] = useState<boolean>(false);
  const [threeNightsPct, setThreeNightsPct] = useState<number>(5);
  const [sevenNightsActive, setSevenNightsActive] = useState<boolean>(true);
  const [sevenNightsPct, setSevenNightsPct] = useState<number>(10);
  const [fourteenNightsActive, setFourteenNightsActive] = useState<boolean>(false);
  const [fourteenNightsPct, setFourteenNightsPct] = useState<number>(15);
  const [customDatesActive, setCustomDatesActive] = useState<boolean>(false);
  const [customDates, setCustomDates] = useState<CustomDiscountDate[]>([
    { id: "1", from: "2028-01-01", to: "2028-01-05", percentage: 25 },
  ]);

  // Tab 3: Availability states
  const [checkInTime, setCheckInTime] = useState<string>("14:00");
  const [checkOutTime, setCheckOutTime] = useState<string>("11:00");
  const [minNights, setMinNights] = useState<number>(1);
  const [maxNights, setMaxNights] = useState<number>(365);
  const [bookingNotice, setBookingNotice] = useState<string>("2 Days");
  const [preparationTime, setPreparationTime] = useState<string>("0 Night");
  const [restrictCheckInDay, setRestrictCheckInDay] = useState<string>("Friday");
  const [restrictCheckOutDay, setRestrictCheckOutDay] = useState<string>("Friday");
  const [calendarAvailability, setCalendarAvailability] = useState<string>("12 Months");

  // Tab 4: Cancellations states
  const [selectedCancellationPolicy, setSelectedCancellationPolicy] = useState<string>("flexible");
  const [isCancellationEditing, setIsCancellationEditing] = useState<boolean>(false);

  // Blocked dates selection on calendar
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [selectionStart, setSelectionStart] = useState<Date | null>(null);

  // Fetch host properties and bookings
  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const { data: propsData, error: propsError } = await supabase
        .from("properties")
        .select("*")
        .eq("host_id", user.id);

      if (propsError) throw propsError;
      const combined = propsData || [];
      setProperties(combined);

      let targetId = queryPropertyId || "";
      if (!targetId && combined.length > 0) {
        targetId = combined[0].id;
      }
      setSelectedPropertyId(targetId);

      const { data: booksData, error: booksError } = await supabase
        .from("bookings")
        .select(`
          *,
          property:properties(title)
        `)
        .eq("host_id", user.id);

      if (booksError) {
        console.warn("Could not query bookings:", booksError.message);
      }
      setBookings(booksData || []);
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user, queryPropertyId]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      fetchData();
    }
  }, [user, authLoading, navigate, fetchData]);

  const selectedProperty = useMemo(() => {
    return properties.find((p) => p.id === selectedPropertyId) || null;
  }, [properties, selectedPropertyId]);

  // Sync state when selected property changes
  useEffect(() => {
    if (!selectedProperty) return;

    const base = selectedProperty.price_per_night || 50000;
    setBasePrice(String(base));

    const meta = selectedProperty.pending_changes || {};
    const weekendPercentage = selectedProperty.weekend_pct ?? meta.weekend_pct ?? 40;
    setWeekendPct(weekendPercentage);

    const calcWeekend =
      selectedProperty.weekend_price ||
      Math.round(base * (1 + weekendPercentage / 100));
    setWeekendPrice(String(calcWeekend));

    if (selectedProperty.cleaning_fee) {
      setCleaningFeeType("separate");
      setCleaningFee(String(selectedProperty.cleaning_fee));
    } else {
      setCleaningFeeType((selectedProperty.cleaning_policy as any) || meta.cleaning_type || "included");
      setCleaningFee(String(meta.cleaning_fee || 10000));
    }

    // Discounts
    const disc = (selectedProperty.discounts as any) || meta.discounts || {};
    setFirstBookingsActive(
      selectedProperty.first_bookings_discount_pct !== null && selectedProperty.first_bookings_discount_pct !== undefined
        ? true
        : !!disc.first_bookings_active
    );
    setFirstBookingsPct(selectedProperty.first_bookings_discount_pct ?? disc.first_bookings_pct ?? 10);
    setLastMinuteActive(
      selectedProperty.last_minute_discount_pct !== null && selectedProperty.last_minute_discount_pct !== undefined
        ? true
        : !!disc.last_minute_active
    );
    setLastMinutePct(selectedProperty.last_minute_discount_pct ?? disc.last_minute_pct ?? 15);
    setThreeNightsActive(
      selectedProperty.three_nights_discount_pct !== null && selectedProperty.three_nights_discount_pct !== undefined
        ? true
        : !!disc.three_nights_active
    );
    setThreeNightsPct(selectedProperty.three_nights_discount_pct ?? disc.three_nights_pct ?? 5);
    setSevenNightsActive(
      selectedProperty.weekly_discount_pct !== null && selectedProperty.weekly_discount_pct !== undefined
        ? true
        : (disc.seven_nights_active ?? true)
    );
    setSevenNightsPct(selectedProperty.weekly_discount_pct ?? disc.seven_nights_pct ?? 10);
    setFourteenNightsActive(
      selectedProperty.monthly_discount_pct !== null && selectedProperty.monthly_discount_pct !== undefined
        ? true
        : !!disc.fourteen_nights_active
    );
    setFourteenNightsPct(selectedProperty.monthly_discount_pct ?? disc.fourteen_nights_pct ?? 15);
    setCustomDatesActive(
      !!disc.custom_dates_active ||
      (Array.isArray(selectedProperty.custom_discounts) && selectedProperty.custom_discounts.length > 0)
    );
    if (Array.isArray(selectedProperty.custom_discounts) && selectedProperty.custom_discounts.length > 0) {
      setCustomDates(selectedProperty.custom_discounts as any);
    } else if (Array.isArray(disc.custom_dates)) {
      setCustomDates(disc.custom_dates);
    }

    // Availability
    setCheckInTime(selectedProperty.check_in_time || "14:00");
    setCheckOutTime(selectedProperty.check_out_time || "11:00");
    setMinNights(selectedProperty.minimum_nights || 1);
    setMaxNights(selectedProperty.maximum_nights ?? meta.availability?.max_nights ?? 365);
    setBookingNotice(selectedProperty.booking_notice || meta.availability?.booking_notice || "2 Days");
    setPreparationTime(selectedProperty.preparation_time || meta.availability?.preparation_time || "0 Night");
    setRestrictCheckInDay(selectedProperty.restrict_checkin || meta.availability?.restrict_checkin || "Friday");
    setRestrictCheckOutDay(selectedProperty.restrict_checkout || meta.availability?.restrict_checkout || "Friday");
    setCalendarAvailability(selectedProperty.calendar_availability || meta.availability?.calendar_availability || "12 Months");

    // Cancellation policy
    const policy = selectedProperty.cancellation_policy || "flexible";
    setSelectedCancellationPolicy(policy);
  }, [selectedProperty]);

  // Recalculate weekend price on basePrice or weekendPct change
  const handleWeekendPctChange = (newPct: number) => {
    const clamped = Math.max(0, Math.min(200, newPct));
    setWeekendPct(clamped);
    const base = Number(basePrice) || 0;
    const computed = Math.round(base * (1 + clamped / 100));
    setWeekendPrice(String(computed));
  };

  // Save changes to Supabase
  const savePropertySettings = async (updates: any, message: string) => {
    if (!selectedProperty) return;
    try {
      const mergedPending = {
        ...(selectedProperty.pending_changes || {}),
        ...(updates.pending_changes || {}),
      };

      const payload = {
        ...updates,
        pending_changes: mergedPending,
      };

      let { error } = await supabase
        .from("properties")
        .update(payload)
        .eq("id", selectedProperty.id)
        .eq("host_id", user?.id);

      // If a schema error occurs because a column doesn't exist yet, gracefully fall back to pending_changes
      if (error && (error.message?.includes("column") || error.code === "PGRST204" || error.code === "42703")) {
        console.warn("Column not found in Supabase schema cache yet, saving to pending_changes:", error.message);
        const fallbackRes = await supabase
          .from("properties")
          .update({ pending_changes: mergedPending })
          .eq("id", selectedProperty.id)
          .eq("host_id", user?.id);
        error = fallbackRes.error;
      }

      if (error) throw error;

      setProperties((prev) =>
        prev.map((p) =>
          p.id === selectedProperty.id
            ? { ...p, ...payload }
            : p
        )
      );

      toast.success(message);
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    }
  };

  // Calendar calculations
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const firstDayOfWeek = getDay(monthStart);
  const prefixDaysCount = (firstDayOfWeek + 6) % 7; // Monday = 0
  const prefixDays = Array.from({ length: prefixDaysCount }).map(() => null);
  const gridDays = [...prefixDays, ...daysInMonth];

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Determine pricing for a date
  const getDayPrice = (date: Date) => {
    const dayOfWeek = getDay(date);
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Friday & Saturday
    if (isWeekend) {
      return Number(weekendPrice) || Number(basePrice) || 0;
    }
    return Number(basePrice) || 0;
  };

  // Bookings on a date
  const getBookingsForDate = (date: Date) => {
    return bookings.filter(
      (b) =>
        b.property_id === selectedPropertyId &&
        isWithinInterval(date, {
          start: parseISO(b.check_in),
          end: parseISO(b.check_out),
        })
    );
  };

  // Handle clicking on a calendar date
  const handleDateClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const existing = new Set(selectedDates);

    if (!selectionStart) {
      setSelectionStart(date);
      if (existing.has(dateStr)) {
        existing.delete(dateStr);
      } else {
        existing.add(dateStr);
      }
      setSelectedDates(existing);
    } else {
      const start = selectionStart < date ? selectionStart : date;
      const end = selectionStart < date ? date : selectionStart;
      const range = eachDayOfInterval({ start, end });
      range.forEach((d) => existing.add(format(d, "yyyy-MM-dd")));
      setSelectedDates(existing);
      setSelectionStart(null);
    }
  };

  // Toggle blocked status for selected dates
  const handleToggleBlockDates = async () => {
    if (!selectedProperty || selectedDates.size === 0) return;
    const currentBlocked = new Set(selectedProperty.blocked_dates || []);
    const datesArr = Array.from(selectedDates);
    const shouldBlock = !datesArr.every((d) => currentBlocked.has(d));

    datesArr.forEach((d) => {
      if (shouldBlock) currentBlocked.add(d);
      else currentBlocked.delete(d);
    });

    const newBlockedList = Array.from(currentBlocked);
    await savePropertySettings(
      { blocked_dates: newBlockedList },
      shouldBlock ? "Selected dates blocked" : "Selected dates unblocked"
    );
    setSelectedDates(new Set());
    setSelectionStart(null);
  };

  // Render stepper component helper
  const renderStepper = (
    valueDisplay: string | number,
    onDec: () => void,
    onInc: () => void,
    onSave: () => void,
    saveDisabled?: boolean
  ) => (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onDec}
        className="w-10 h-10 border border-foreground/30 rounded-lg flex items-center justify-center font-bold text-lg hover:bg-accent cursor-pointer transition-colors shrink-0 bg-background"
      >
        -
      </button>
      <div className="flex-1 h-10 border border-foreground/30 rounded-lg flex items-center justify-center font-bold text-sm bg-background px-3 text-center truncate">
        {valueDisplay}
      </div>
      <button
        type="button"
        onClick={onInc}
        className="w-10 h-10 border border-foreground/30 rounded-lg flex items-center justify-center font-bold text-lg hover:bg-accent cursor-pointer transition-colors shrink-0 bg-background"
      >
        +
      </button>
      <Button
        type="button"
        disabled={saveDisabled}
        onClick={onSave}
        className="bg-[#f43f5e] hover:bg-[#e11d48] text-white h-10 px-4 font-semibold rounded-lg shadow-xs shrink-0"
      >
        Save
      </Button>
    </div>
  );

  return (
    <HostLayout>
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* ===================== Main Calendar Area ===================== */}
        <div className="flex-1 flex flex-col bg-muted/20 border-r overflow-y-auto">
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="p-4 md:p-6 max-w-7xl mx-auto w-full">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    {format(currentMonth, "MMMM yyyy")}
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Manage nightly pricing, weekend rates, and date availability.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={prevMonth}
                    aria-label="Previous Month"
                    className="h-9 w-9"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 font-medium"
                    onClick={() => setCurrentMonth(startOfMonth(new Date()))}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={nextMonth}
                    aria-label="Next Month"
                    className="h-9 w-9"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Legend matching image */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-4 pb-3 border-b">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-card border border-border" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/40" />
                  <span>Weekend Rate (Fri/Sat)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-muted/80 border border-border opacity-70" />
                  <span>Blocked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-[#f43f5e] text-white" />
                  <span>Confirmed Booking</span>
                </div>

                {selectedDates.size > 0 && (
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      {selectedDates.size} dates selected
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={handleToggleBlockDates}
                    >
                      Block / Unblock
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs px-2"
                      onClick={() => {
                        setSelectedDates(new Set());
                        setSelectionStart(null);
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>

              {/* Grid */}
              <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border shadow-xs">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <div
                    key={day}
                    className="bg-card py-2.5 text-center text-xs md:text-sm font-semibold text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}

                {gridDays.map((date, i) => {
                  if (!date) {
                    return (
                      <div
                        key={`empty-${i}`}
                        className="bg-card/40 min-h-[105px] md:min-h-[125px]"
                      />
                    );
                  }

                  const dateObj = date as Date;
                  const dateStr = format(dateObj, "yyyy-MM-dd");
                  const isBlockedDay = selectedProperty?.blocked_dates?.includes(dateStr);
                  const isSelected = selectedDates.has(dateStr);
                  const dayBookings = getBookingsForDate(dateObj);
                  const isBooked = dayBookings.length > 0;
                  const dayOfWeek = getDay(dateObj);
                  const isWeekendDay = dayOfWeek === 5 || dayOfWeek === 6;
                  const priceToShow = getDayPrice(dateObj);

                  return (
                    <div
                      key={dateStr}
                      onClick={() => handleDateClick(dateObj)}
                      className={`bg-card min-h-[105px] md:min-h-[125px] p-2 flex flex-col cursor-pointer transition-colors relative select-none
                        ${isSelected ? "ring-2 ring-primary ring-inset z-10 bg-primary/10" : "hover:bg-accent/40"}
                        ${isBlockedDay ? "opacity-60 bg-muted/60" : ""}
                        ${isWeekendDay ? "bg-amber-50/20 dark:bg-amber-950/10" : ""}
                      `}
                    >
                      {/* Day number & blocked badge */}
                      <div className="flex justify-between items-start mb-1">
                        <span
                          className={`text-xs md:text-sm font-medium h-6 w-6 rounded-full flex items-center justify-center ${
                            isSameDay(dateObj, new Date())
                              ? "bg-primary text-primary-foreground font-bold shadow-xs"
                              : "text-foreground"
                          }`}
                        >
                          {format(dateObj, "d")}
                        </span>

                        {isBlockedDay && (
                          <span className="text-[10px] uppercase font-bold text-destructive bg-destructive/10 px-1 py-0.5 rounded">
                            BLOCKED
                          </span>
                        )}
                      </div>

                      {/* Price display */}
                      {!isBooked && selectedProperty && (
                        <div className="mt-auto pt-1">
                          <div className="text-xs md:text-sm font-semibold text-foreground/90 leading-tight">
                            {formatPrice(priceToShow)}
                          </div>
                          {isWeekendDay && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium block">
                              Weekend
                            </span>
                          )}
                        </div>
                      )}

                      {/* Confirmed Booking Bar matching image (Clickable to reveal price breakdown) */}
                      {dayBookings.map((b) => {
                        const isStart =
                          isSameDay(parseISO(b.check_in), dateObj) ||
                          dateStr === format(startOfMonth(currentMonth), "yyyy-MM-dd");

                        const nights = differenceInDays(
                          parseISO(b.check_out),
                          parseISO(b.check_in)
                        ) || 1;

                        if (isStart) {
                          const guestName =
                            b.guest_name || b.guest?.full_name || "Confirmed Guest";
                          return (
                            <div
                              key={b.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBookingForBreakdown(b);
                              }}
                              className="absolute left-1 right-1 top-1/2 -translate-y-1/2 z-20 cursor-pointer group"
                              title="Click to view booking price breakdown"
                            >
                              <div className="bg-[#f43f5e] hover:bg-[#e11d48] text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg shadow-sm whitespace-nowrap overflow-hidden text-ellipsis flex items-center justify-between gap-1 transition-all group-hover:scale-[1.02]">
                                <span className="truncate">
                                  {guestName} - {nights} nights - {formatPrice(b.total_price)}
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground mt-4 text-center">
                Tip: Click any single date to select it, or click two dates to select an entire range for bulk blocking or availability updates. Click any booking bar to view its price breakdown.
              </p>
            </div>
          )}
        </div>

        {/* ===================== Right Sidebar ===================== */}
        <div className="w-full lg:w-[380px] xl:w-[420px] bg-card flex flex-col overflow-y-auto border-t lg:border-t-0 lg:border-l">
          {/* Property Selector & 2x2 Tabs Grid */}
          <div className="p-5 border-b bg-muted/30 space-y-4">
            <div>
              <Select
                value={selectedPropertyId}
                onValueChange={setSelectedPropertyId}
              >
                <SelectTrigger className="bg-background h-11 font-semibold text-sm border-foreground/30">
                  <SelectValue placeholder="Select Property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2x2 Tab Grid matching Image 1, 2, 3, 4 */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={activeTab === "pricing" ? "default" : "outline"}
                className={`h-11 font-semibold text-sm transition-all ${
                  activeTab === "pricing"
                    ? "border-2 border-[#f43f5e] bg-background text-[#f43f5e] hover:bg-accent shadow-xs"
                    : "border-foreground/30 text-foreground bg-background hover:bg-accent"
                }`}
                onClick={() => setActiveTab("pricing")}
              >
                Pricing
              </Button>

              <Button
                type="button"
                variant={activeTab === "discounts" ? "default" : "outline"}
                className={`h-11 font-semibold text-sm transition-all ${
                  activeTab === "discounts"
                    ? "border-2 border-[#f43f5e] bg-background text-[#f43f5e] hover:bg-accent shadow-xs"
                    : "border-foreground/30 text-foreground bg-background hover:bg-accent"
                }`}
                onClick={() => setActiveTab("discounts")}
              >
                Discounts
              </Button>

              <Button
                type="button"
                variant={activeTab === "availability" ? "default" : "outline"}
                className={`h-11 font-semibold text-sm transition-all ${
                  activeTab === "availability"
                    ? "border-2 border-[#f43f5e] bg-background text-[#f43f5e] hover:bg-accent shadow-xs"
                    : "border-foreground/30 text-foreground bg-background hover:bg-accent"
                }`}
                onClick={() => setActiveTab("availability")}
              >
                Availability
              </Button>

              <Button
                type="button"
                variant={activeTab === "cancellations" ? "default" : "outline"}
                className={`h-11 font-semibold text-sm transition-all ${
                  activeTab === "cancellations"
                    ? "border-2 border-[#f43f5e] bg-background text-[#f43f5e] hover:bg-accent shadow-xs"
                    : "border-foreground/30 text-foreground bg-background hover:bg-accent"
                }`}
                onClick={() => setActiveTab("cancellations")}
              >
                Cancellations
              </Button>
            </div>
          </div>

          {/* ===================== TAB 1: PRICING (Image 1) ===================== */}
          {activeTab === "pricing" && (
            <div className="p-5 flex-1 space-y-7">
              {/* Base Price Per Night */}
              <div className="space-y-2">
                <Label className="text-base font-semibold text-foreground block">
                  Base Price Per Night
                </Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      value={basePrice}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBasePrice(val);
                        const b = Number(val) || 0;
                        const w = Math.round(b * (1 + weekendPct / 100));
                        setWeekendPrice(String(w));
                      }}
                      className="h-11 text-base font-bold border-foreground/30 pr-14 bg-background"
                      placeholder="50000"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-xs text-foreground/70">
                      IQD
                    </span>
                  </div>
                  <Button
                    type="button"
                    onClick={() =>
                      savePropertySettings(
                        { price_per_night: Number(basePrice) || 0 },
                        "Base price saved"
                      )
                    }
                    className="bg-[#f43f5e] hover:bg-[#e11d48] text-white h-11 px-4 font-semibold rounded-lg shadow-xs"
                  >
                    Save
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Amount you receive (after 3% meewano fee):{" "}
                  <span className="font-semibold text-foreground">
                    {formatPrice(Math.round(Number(basePrice || 0) * 0.97))}
                  </span>
                </p>
              </div>

              {/* Weekend (Fri-Sat) Price Change */}
              <div className="space-y-2 pt-2 border-t">
                <Label className="text-base font-semibold text-foreground block">
                  Weekend (Fri-Sat) Price Change
                </Label>

                {renderStepper(
                  `+${weekendPct}%`,
                  () => handleWeekendPctChange(weekendPct - 5),
                  () => handleWeekendPctChange(weekendPct + 5),
                  () =>
                    savePropertySettings(
                      {
                        weekend_price: Number(weekendPrice) || 0,
                        pending_changes: { weekend_pct: weekendPct },
                      },
                      "Weekend price saved"
                    )
                )}

                <div className="relative mt-2">
                  <Input
                    type="number"
                    value={weekendPrice}
                    onChange={(e) => setWeekendPrice(e.target.value)}
                    className="h-11 text-base font-bold border-foreground/30 pr-14 bg-background"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-xs text-foreground/70">
                    IQD
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">
                  Amount you receive (after 3% meewano fee):{" "}
                  <span className="font-semibold text-foreground">
                    {formatPrice(Math.round(Number(weekendPrice || 0) * 0.97))}
                  </span>
                </p>
              </div>

              {/* Cleaning Fees */}
              <div className="space-y-3 pt-2 border-t">
                <Label className="text-base font-semibold text-foreground block">
                  Cleaning Fees
                </Label>

                {/* Option 1: Included */}
                <label className="flex items-start gap-3 p-3 rounded-xl border border-border/80 cursor-pointer hover:bg-accent/40 transition-colors">
                  <input
                    type="radio"
                    name="cleaning_type"
                    checked={cleaningFeeType === "included"}
                    onChange={() => {
                      setCleaningFeeType("included");
                      savePropertySettings(
                        {
                          cleaning_fee: null,
                          pending_changes: { cleaning_type: "included" },
                        },
                        "Cleaning fee set as included in base price"
                      );
                    }}
                    className="mt-1 h-4 w-4 text-[#f43f5e] accent-[#f43f5e] cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-sm text-foreground block">
                      Included in the base price{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        (Recommended)
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground block mt-0.5">
                      Cleaning fees will not be shown as additional cost to the guests
                    </span>
                  </div>
                </label>

                {/* Option 2: Charge Separate */}
                <label className="flex items-start gap-3 p-3 rounded-xl border border-border/80 cursor-pointer hover:bg-accent/40 transition-colors">
                  <input
                    type="radio"
                    name="cleaning_type"
                    checked={cleaningFeeType === "separate"}
                    onChange={() => setCleaningFeeType("separate")}
                    className="mt-1 h-4 w-4 text-[#f43f5e] accent-[#f43f5e] cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="font-semibold text-sm text-foreground block">
                      Charge Separate Cleaning Fees
                    </span>
                  </div>
                </label>

                {cleaningFeeType === "separate" && (
                  <div className="pl-7 space-y-2 pt-1">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Input
                          type="number"
                          value={cleaningFee}
                          onChange={(e) => setCleaningFee(e.target.value)}
                          className="h-11 text-base font-bold border-foreground/30 pr-14 bg-background"
                          placeholder="10000"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-xs text-foreground/70">
                          IQD
                        </span>
                      </div>
                      <Button
                        type="button"
                        onClick={() =>
                          savePropertySettings(
                            {
                              cleaning_fee: Number(cleaningFee) || 0,
                              pending_changes: {
                                cleaning_type: "separate",
                                cleaning_fee: Number(cleaningFee) || 0,
                              },
                            },
                            "Separate cleaning fee saved"
                          )
                        }
                        className="bg-[#f43f5e] hover:bg-[#e11d48] text-white h-11 px-4 font-semibold rounded-lg shadow-xs"
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===================== TAB 2: DISCOUNTS (Image 2) ===================== */}
          {activeTab === "discounts" && (
            <div className="p-5 flex-1 space-y-6">
              {/* Header Notice matching Image 2 */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-start gap-2.5">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">
                    One Type of Discount will be Applied to Each Booking
                  </span>
                  <p className="mt-1">
                    Meewano evaluates reservation qualifying for multiple promotions during the same dates, and applies only the single most advantageous or highest-priority option. Discounts compete rather than stack up.
                  </p>
                </div>
              </div>

              {/* 1. Your First Bookings */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={firstBookingsActive}
                    onChange={(e) => setFirstBookingsActive(e.target.checked)}
                    className="h-4 w-4 rounded accent-[#f43f5e]"
                  />
                  <span className="font-semibold text-sm text-foreground">
                    Your First Bookings
                  </span>
                </label>
                <p className="text-xs text-muted-foreground pl-6">
                  Your first three booking will receive the discount
                </p>
                {firstBookingsActive && (
                  <div className="pl-6 pt-1">
                    {renderStepper(
                      `-${firstBookingsPct}%`,
                      () => setFirstBookingsPct(Math.max(1, firstBookingsPct - 1)),
                      () => setFirstBookingsPct(Math.min(90, firstBookingsPct + 1)),
                      () =>
                        savePropertySettings(
                          {
                            first_bookings_discount_pct: firstBookingsActive ? firstBookingsPct : null,
                            pending_changes: {
                              discounts: {
                                first_bookings_active: firstBookingsActive,
                                first_bookings_pct: firstBookingsPct,
                              },
                            },
                          },
                          "First bookings discount saved"
                        )
                    )}
                  </div>
                )}
              </div>

              {/* 2. Last Minute Discount */}
              <div className="space-y-2 pt-2 border-t">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lastMinuteActive}
                    onChange={(e) => setLastMinuteActive(e.target.checked)}
                    className="h-4 w-4 rounded accent-[#f43f5e]"
                  />
                  <span className="font-semibold text-sm text-foreground">
                    Last Minute Discount
                  </span>
                </label>
                <p className="text-xs text-muted-foreground pl-6">
                  Stays booked 3 nights before check-in
                </p>
                {lastMinuteActive && (
                  <div className="pl-6 pt-1">
                    {renderStepper(
                      `-${lastMinutePct}%`,
                      () => setLastMinutePct(Math.max(1, lastMinutePct - 1)),
                      () => setLastMinutePct(Math.min(90, lastMinutePct + 1)),
                      () =>
                        savePropertySettings(
                          {
                            last_minute_discount_pct: lastMinuteActive ? lastMinutePct : null,
                            pending_changes: {
                              discounts: {
                                last_minute_active: lastMinuteActive,
                                last_minute_pct: lastMinutePct,
                              },
                            },
                          },
                          "Last minute discount saved"
                        )
                    )}
                  </div>
                )}
              </div>

              {/* 3. Multiple Nights Discount */}
              <div className="space-y-4 pt-2 border-t">
                <Label className="text-sm font-bold text-foreground uppercase tracking-wider block">
                  Multiple Nights Discount
                </Label>

                {/* 3 Nights or more */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={threeNightsActive}
                      onChange={(e) => setThreeNightsActive(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#f43f5e]"
                    />
                    <span className="font-medium text-sm">3 Nights or more</span>
                  </label>
                  {threeNightsActive && (
                    <div className="pl-6 pt-1">
                      {renderStepper(
                        `-${threeNightsPct}%`,
                        () => setThreeNightsPct(Math.max(1, threeNightsPct - 1)),
                        () => setThreeNightsPct(Math.min(90, threeNightsPct + 1)),
                        () =>
                          savePropertySettings(
                            {
                              three_nights_discount_pct: threeNightsActive ? threeNightsPct : null,
                              pending_changes: {
                                discounts: {
                                  three_nights_active: threeNightsActive,
                                  three_nights_pct: threeNightsPct,
                                },
                              },
                            },
                            "3-night discount saved"
                          )
                      )}
                    </div>
                  )}
                </div>

                {/* 7 Nights or more */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sevenNightsActive}
                      onChange={(e) => setSevenNightsActive(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#f43f5e]"
                    />
                    <span className="font-medium text-sm">7 Nights or more</span>
                  </label>
                  {sevenNightsActive && (
                    <div className="pl-6 pt-1">
                      {renderStepper(
                        `-${sevenNightsPct}%`,
                        () => setSevenNightsPct(Math.max(1, sevenNightsPct - 1)),
                        () => setSevenNightsPct(Math.min(90, sevenNightsPct + 1)),
                        () =>
                          savePropertySettings(
                            {
                              weekly_discount_pct: sevenNightsActive ? sevenNightsPct : null,
                              pending_changes: {
                                discounts: {
                                  seven_nights_active: sevenNightsActive,
                                  seven_nights_pct: sevenNightsPct,
                                },
                              },
                            },
                            "7-night discount saved"
                          )
                      )}
                    </div>
                  )}
                </div>

                {/* 14 Nights or more */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fourteenNightsActive}
                      onChange={(e) => setFourteenNightsActive(e.target.checked)}
                      className="h-4 w-4 rounded accent-[#f43f5e]"
                    />
                    <span className="font-medium text-sm">14 Nights or more</span>
                  </label>
                  {fourteenNightsActive && (
                    <div className="pl-6 pt-1">
                      {renderStepper(
                        `-${fourteenNightsPct}%`,
                        () => setFourteenNightsPct(Math.max(1, fourteenNightsPct - 1)),
                        () => setFourteenNightsPct(Math.min(90, fourteenNightsPct + 1)),
                        () =>
                          savePropertySettings(
                            {
                              monthly_discount_pct: fourteenNightsActive ? fourteenNightsPct : null,
                              pending_changes: {
                                discounts: {
                                  fourteen_nights_active: fourteenNightsActive,
                                  fourteen_nights_pct: fourteenNightsPct,
                                },
                              },
                            },
                            "14-night discount saved"
                          )
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Custom Dates */}
              <div className="space-y-4 pt-2 border-t">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customDatesActive}
                    onChange={(e) => setCustomDatesActive(e.target.checked)}
                    className="h-4 w-4 rounded accent-[#f43f5e]"
                  />
                  <span className="font-semibold text-sm">Custom Dates</span>
                </label>

                {customDatesActive && (
                  <div className="pl-6 space-y-4">
                    {customDates.map((item, idx) => (
                      <div key={item.id} className="p-3 rounded-lg border bg-muted/20 space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="font-semibold block mb-1">From</span>
                            <Input
                              type="date"
                              value={item.from}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCustomDates((prev) =>
                                  prev.map((c) => (c.id === item.id ? { ...c, from: val } : c))
                                );
                              }}
                              className="h-9 text-xs"
                            />
                          </div>
                          <div>
                            <span className="font-semibold block mb-1">To</span>
                            <Input
                              type="date"
                              value={item.to}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCustomDates((prev) =>
                                  prev.map((c) => (c.id === item.id ? { ...c, to: val } : c))
                                );
                              }}
                              className="h-9 text-xs"
                            />
                          </div>
                        </div>

                        {renderStepper(
                          `-${item.percentage}%`,
                          () => {
                            setCustomDates((prev) =>
                              prev.map((c) =>
                                c.id === item.id
                                  ? { ...c, percentage: Math.max(1, c.percentage - 1) }
                                  : c
                              )
                            );
                          },
                          () => {
                            setCustomDates((prev) =>
                              prev.map((c) =>
                                c.id === item.id
                                  ? { ...c, percentage: Math.min(90, c.percentage + 1) }
                                  : c
                              )
                            );
                          },
                          () =>
                            savePropertySettings(
                              {
                                pending_changes: {
                                  discounts: {
                                    custom_dates_active: true,
                                    custom_dates: customDates,
                                  },
                                },
                              },
                              "Custom date discount saved"
                            )
                        )}
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCustomDates((prev) => [
                          ...prev,
                          {
                            id: String(Date.now()),
                            from: "2028-02-01",
                            to: "2028-02-05",
                            percentage: 20,
                          },
                        ])
                      }
                      className="text-xs font-semibold gap-1.5 w-full border-dashed"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add More Custom Dates
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===================== TAB 3: AVAILABILITY (Image 3) ===================== */}
          {activeTab === "availability" && (
            <div className="p-5 flex-1 space-y-5">
              {/* Check-in Time */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-foreground block">
                  Check-in Time
                </Label>
                <p className="text-xs text-muted-foreground">
                  When guest is required to arrive at the property
                </p>
                {renderStepper(
                  checkInTime,
                  () => {
                    const idx = CHECK_IN_TIMES.indexOf(checkInTime);
                    if (idx > 0) setCheckInTime(CHECK_IN_TIMES[idx - 1]);
                  },
                  () => {
                    const idx = CHECK_IN_TIMES.indexOf(checkInTime);
                    if (idx < CHECK_IN_TIMES.length - 1) setCheckInTime(CHECK_IN_TIMES[idx + 1]);
                  },
                  () =>
                    savePropertySettings(
                      { check_in_time: checkInTime },
                      `Check-in time saved: ${checkInTime}`
                    )
                )}
              </div>

              {/* Check-out Time */}
              <div className="space-y-1.5 pt-2 border-t">
                <Label className="text-sm font-semibold text-foreground block">
                  Check-out Time
                </Label>
                <p className="text-xs text-muted-foreground">
                  When guest is required to leave the property
                </p>
                {renderStepper(
                  checkOutTime,
                  () => {
                    const idx = CHECK_OUT_TIMES.indexOf(checkOutTime);
                    if (idx > 0) setCheckOutTime(CHECK_OUT_TIMES[idx - 1]);
                  },
                  () => {
                    const idx = CHECK_OUT_TIMES.indexOf(checkOutTime);
                    if (idx < CHECK_OUT_TIMES.length - 1) setCheckOutTime(CHECK_OUT_TIMES[idx + 1]);
                  },
                  () =>
                    savePropertySettings(
                      { check_out_time: checkOutTime },
                      `Check-out time saved: ${checkOutTime}`
                    )
                )}
              </div>

              {/* Minimum Nights */}
              <div className="space-y-1.5 pt-2 border-t">
                <Label className="text-sm font-semibold text-foreground block">
                  Minimum Nights
                </Label>
                <p className="text-xs text-muted-foreground">
                  The minimum night a guest is allowed to book
                </p>
                {renderStepper(
                  minNights,
                  () => setMinNights(Math.max(1, minNights - 1)),
                  () => setMinNights(Math.min(maxNights, minNights + 1)),
                  () =>
                    savePropertySettings(
                      { minimum_nights: minNights },
                      `Minimum nights saved: ${minNights}`
                    )
                )}
              </div>

              {/* Maximum Nights */}
              <div className="space-y-1.5 pt-2 border-t">
                <Label className="text-sm font-semibold text-foreground block">
                  Maximum Nights
                </Label>
                <p className="text-xs text-muted-foreground">
                  The maximum night a guest is allowed to book
                </p>
                {renderStepper(
                  maxNights,
                  () => setMaxNights(Math.max(minNights, maxNights - 1)),
                  () => setMaxNights(Math.min(365, maxNights + 1)),
                  () =>
                    savePropertySettings(
                      {
                        maximum_nights: maxNights,
                        pending_changes: { availability: { max_nights: maxNights } },
                      },
                      `Maximum nights saved: ${maxNights}`
                    )
                )}
              </div>

              {/* Booking Notice */}
              <div className="space-y-1.5 pt-2 border-t">
                <Label className="text-sm font-semibold text-foreground block">
                  Booking Notice
                </Label>
                <p className="text-xs text-muted-foreground">
                  How many days notice do you need from guest booking and arriving at your property?
                </p>
                {renderStepper(
                  bookingNotice,
                  () => {
                    const idx = NOTICE_OPTIONS.indexOf(bookingNotice);
                    if (idx > 0) setBookingNotice(NOTICE_OPTIONS[idx - 1]);
                  },
                  () => {
                    const idx = NOTICE_OPTIONS.indexOf(bookingNotice);
                    if (idx < NOTICE_OPTIONS.length - 1) setBookingNotice(NOTICE_OPTIONS[idx + 1]);
                  },
                  () =>
                    savePropertySettings(
                      {
                        booking_notice: bookingNotice,
                        pending_changes: { availability: { booking_notice: bookingNotice } },
                      },
                      `Booking notice saved: ${bookingNotice}`
                    )
                )}
              </div>

              {/* Preparation Time with Tooltip Note */}
              <div className="space-y-1.5 pt-2 border-t">
                <div className="flex items-center gap-1.5">
                  <Label className="text-sm font-semibold text-foreground">
                    Preparation Time
                  </Label>
                  <span title="If you choose 0 nights, you have the time between check-in and checkout to prepare. If 1 night, the night before and after is automatically blocked." className="cursor-help text-muted-foreground">
                    <Info className="h-3.5 w-3.5" />
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  How many nights do you need to block-out before and after each booking to prepare your property?
                </p>
                {renderStepper(
                  preparationTime,
                  () => {
                    const idx = PREPARATION_OPTIONS.indexOf(preparationTime);
                    if (idx > 0) setPreparationTime(PREPARATION_OPTIONS[idx - 1]);
                  },
                  () => {
                    const idx = PREPARATION_OPTIONS.indexOf(preparationTime);
                    if (idx < PREPARATION_OPTIONS.length - 1)
                      setPreparationTime(PREPARATION_OPTIONS[idx + 1]);
                  },
                  () =>
                    savePropertySettings(
                      {
                        preparation_time: preparationTime,
                        pending_changes: { availability: { preparation_time: preparationTime } },
                      },
                      `Preparation time saved: ${preparationTime}`
                    )
                )}
              </div>

              {/* Restrict Check-In Day */}
              <div className="space-y-1.5 pt-2 border-t">
                <Label className="text-sm font-semibold text-foreground block">
                  Restrict Check-In Day
                </Label>
                <p className="text-xs text-muted-foreground">
                  Guest will not be able to book your property if their stay starts from this day
                </p>
                {renderStepper(
                  restrictCheckInDay,
                  () => {
                    const idx = DAYS_OF_WEEK.indexOf(restrictCheckInDay);
                    if (idx > 0) setRestrictCheckInDay(DAYS_OF_WEEK[idx - 1]);
                  },
                  () => {
                    const idx = DAYS_OF_WEEK.indexOf(restrictCheckInDay);
                    if (idx < DAYS_OF_WEEK.length - 1)
                      setRestrictCheckInDay(DAYS_OF_WEEK[idx + 1]);
                  },
                  () =>
                    savePropertySettings(
                      {
                        restrict_checkin: restrictCheckInDay,
                        pending_changes: {
                          availability: { restrict_checkin: restrictCheckInDay },
                        },
                      },
                      `Restrict check-in day saved: ${restrictCheckInDay}`
                    )
                )}
              </div>

              {/* Restrict Check-Out Day */}
              <div className="space-y-1.5 pt-2 border-t">
                <Label className="text-sm font-semibold text-foreground block">
                  Restrict Check-Out Day
                </Label>
                <p className="text-xs text-muted-foreground">
                  Guest will not be able to book your property if their stay ends on this day
                </p>
                {renderStepper(
                  restrictCheckOutDay,
                  () => {
                    const idx = DAYS_OF_WEEK.indexOf(restrictCheckOutDay);
                    if (idx > 0) setRestrictCheckOutDay(DAYS_OF_WEEK[idx - 1]);
                  },
                  () => {
                    const idx = DAYS_OF_WEEK.indexOf(restrictCheckOutDay);
                    if (idx < DAYS_OF_WEEK.length - 1)
                      setRestrictCheckOutDay(DAYS_OF_WEEK[idx + 1]);
                  },
                  () =>
                    savePropertySettings(
                      {
                        restrict_checkout: restrictCheckOutDay,
                        pending_changes: {
                          availability: { restrict_checkout: restrictCheckOutDay },
                        },
                      },
                      `Restrict check-out day saved: ${restrictCheckOutDay}`
                    )
                )}
              </div>

              {/* Calendar Availability */}
              <div className="space-y-1.5 pt-2 border-t">
                <Label className="text-sm font-semibold text-foreground block">
                  Calendar Availability
                </Label>
                <p className="text-xs text-muted-foreground">
                  How far in advance can guest book your property? The selected period will be shown to guests.
                </p>
                {renderStepper(
                  calendarAvailability,
                  () => {
                    const idx = CALENDAR_AVAILABILITY_OPTIONS.indexOf(calendarAvailability);
                    if (idx > 0)
                      setCalendarAvailability(CALENDAR_AVAILABILITY_OPTIONS[idx - 1]);
                  },
                  () => {
                    const idx = CALENDAR_AVAILABILITY_OPTIONS.indexOf(calendarAvailability);
                    if (idx < CALENDAR_AVAILABILITY_OPTIONS.length - 1)
                      setCalendarAvailability(CALENDAR_AVAILABILITY_OPTIONS[idx + 1]);
                  },
                  () =>
                    savePropertySettings(
                      {
                        calendar_availability: calendarAvailability,
                        pending_changes: {
                          availability: { calendar_availability: calendarAvailability },
                        },
                      },
                      `Calendar availability saved: ${calendarAvailability}`
                    )
                )}
              </div>
            </div>
          )}

          {/* ===================== TAB 4: CANCELLATIONS (Image 4) ===================== */}
          {activeTab === "cancellations" && (
            <div className="p-5 flex-1 space-y-6">
              {/* If not in editing mode, show Selected Policy Summary state matching right of Image 4 */}
              {!isCancellationEditing ? (
                <div className="space-y-5">
                  <div>
                    <span className="text-xs text-muted-foreground font-medium block">
                      Selected Cancellation Policy for your property
                    </span>
                    {(() => {
                      const policy =
                        CANCELLATION_POLICIES.find(
                          (p) => p.id === selectedCancellationPolicy
                        ) || CANCELLATION_POLICIES[2];
                      return (
                        <div className="mt-3 space-y-4">
                          <h2 className="text-2xl font-bold text-foreground">
                            {policy.name}
                          </h2>
                          <ul className="space-y-2 text-xs text-muted-foreground">
                            {policy.bullets.map((b, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-primary font-bold">•</span>
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>

                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setIsCancellationEditing(true)}
                            className="h-10 px-6 font-semibold rounded-lg bg-stone-700 hover:bg-stone-800 text-white mt-4"
                          >
                            Edit
                          </Button>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                /* Edit / Selection Mode matching left of Image 4 */
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Please select the cancellation policy for your property. The Policy will apply to all bookings.
                  </p>

                  <div className="space-y-3">
                    {CANCELLATION_POLICIES.map((p) => {
                      const isSelected = selectedCancellationPolicy === p.id;
                      return (
                        <label
                          key={p.id}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                            isSelected
                              ? "border-[#f43f5e] bg-[#f43f5e]/5"
                              : "border-border hover:bg-accent/30"
                          }`}
                        >
                          <input
                            type="radio"
                            name="cancellation_policy"
                            value={p.id}
                            checked={isSelected}
                            onChange={() => setSelectedCancellationPolicy(p.id)}
                            className="mt-1 h-4 w-4 text-[#f43f5e] accent-[#f43f5e] cursor-pointer"
                          />
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-sm text-foreground">
                                {p.name}
                              </span>
                              {p.recommended && (
                                <span className="text-[11px] font-normal text-muted-foreground">
                                  (Recommended)
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {p.desc}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <p className="text-[11px] text-muted-foreground italic leading-relaxed pt-2">
                    Note: If you voluntarily cancel a booking the guest will be refunded. If a guest experiences exceptional circumstances (Emergency, sickness, death, war...), the guest can request a refund for your review and decision.
                  </p>

                  <Button
                    type="button"
                    onClick={async () => {
                      await savePropertySettings(
                        { cancellation_policy: selectedCancellationPolicy },
                        "Cancellation policy updated"
                      );
                      setIsCancellationEditing(false);
                    }}
                    className="w-full bg-[#f43f5e] hover:bg-[#e11d48] text-white h-11 font-semibold rounded-xl shadow-xs"
                  >
                    Save
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===================== Booking Price Breakdown Reveal Popover (Image 1) ===================== */}
      {selectedBookingForBreakdown && (
        <Dialog
          open={!!selectedBookingForBreakdown}
          onOpenChange={(open) => {
            if (!open) setSelectedBookingForBreakdown(null);
          }}
        >
          <DialogContent className="max-w-md p-6 bg-card border shadow-xl rounded-2xl">
            {(() => {
              const b = selectedBookingForBreakdown;
              const guestName =
                b.guest_name || b.guest?.full_name || "Sarah Ahmed";
              const checkIn = parseISO(b.check_in);
              const checkOut = parseISO(b.check_out);
              const nights = differenceInDays(checkOut, checkIn) || 1;

              // Calculate weekday and weekend breakdown
              let weekdays = 0;
              let weekends = 0;
              try {
                const intervalDays = eachDayOfInterval({
                  start: checkIn,
                  end: checkOut,
                }).slice(0, -1); // exclude checkout date
                intervalDays.forEach((d) => {
                  const day = getDay(d);
                  if (day === 5 || day === 6) weekends++;
                  else weekdays++;
                });
              } catch {
                weekdays = Math.max(0, nights - 2);
                weekends = Math.min(2, nights);
              }

              const weekdayRate = Number(basePrice) || 50000;
              const weekendRate = Number(weekendPrice) || Math.round(weekdayRate * 1.4);

              const weekdayTotal = weekdays * weekdayRate;
              const weekendTotal = weekends * weekendRate;
              const subtotal = weekdayTotal + weekendTotal;

              // Discount calculation
              const discountRate = nights >= 7 ? 0.1 : 0;
              const discountAmount = Math.round(subtotal * discountRate);
              const guestPaid = b.total_price || subtotal - discountAmount;
              const netPayout = Math.round(guestPaid * 0.97);

              return (
                <div className="space-y-4">
                  <div className="border-b pb-3 flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        Booking by {guestName}
                      </h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 font-medium">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {format(checkIn, "d MMM")} – {format(checkOut, "d MMM yyyy")} ({nights} Nights)
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-2.5 text-sm">
                    <li className="flex items-center justify-between text-muted-foreground">
                      <span>
                        • {weekdays} Weekdays × {formatPrice(weekdayRate)}
                      </span>
                      <span className="font-semibold text-foreground">
                        = {formatPrice(weekdayTotal)}
                      </span>
                    </li>

                    <li className="flex items-center justify-between text-muted-foreground">
                      <span>
                        • {weekends} Weekends × {formatPrice(weekendRate)}
                      </span>
                      <span className="font-semibold text-foreground">
                        = {formatPrice(weekendTotal)}
                      </span>
                    </li>

                    {discountAmount > 0 && (
                      <li className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                        <span>• 7+ Day Discount (10%):</span>
                        <span className="font-semibold">-{formatPrice(discountAmount)}</span>
                      </li>
                    )}

                    <li className="flex items-center justify-between pt-2 border-t text-base font-bold text-foreground">
                      <span className="flex items-center gap-1.5">
                        🤝 Your Net Payout:
                      </span>
                      <span className="text-primary">{formatPrice(netPayout)}</span>
                    </li>

                    <li className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        🔎 Guest Paid (All-Inclusive):
                      </span>
                      <span className="font-semibold text-foreground">
                        {formatPrice(guestPaid)}
                      </span>
                    </li>

                    <li className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                      <span className="flex items-center gap-1.5">
                        🛡️ Status:
                      </span>
                      <span className="capitalize font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                        {b.status === "confirmed" ? "Pending Check-In" : b.status}
                      </span>
                    </li>
                  </ul>

                  <Button
                    type="button"
                    onClick={() => setSelectedBookingForBreakdown(null)}
                    className="w-full mt-4 font-semibold rounded-xl"
                  >
                    Close
                  </Button>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      )}
    </HostLayout>
  );
}
