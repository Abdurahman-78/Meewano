import { useState, useEffect, useMemo } from "react";
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
  min,
  max,
  getDay,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  Calendar as CalendarIcon,
  Sparkles,
  ShieldAlert,
  Percent,
  DollarSign,
  Info,
  X,
  Brush,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "sonner";

export default function HostCalendar() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectionStart, setSelectionStart] = useState<Date | null>(null);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());

  // Form states
  const [basePrice, setBasePrice] = useState("");
  const [weekendPrice, setWeekendPrice] = useState("");
  const [weeklyDiscount, setWeeklyDiscount] = useState("");
  const [monthlyDiscount, setMonthlyDiscount] = useState("");
  const [cleaningFee, setCleaningFee] = useState("");
  const [cleaningPolicy, setCleaningPolicy] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const { data: propsData, error: propsError } = await supabase
        .from("properties")
        .select("*")
        .eq("host_id", user.id);

      if (propsError) throw propsError;

      setProperties(propsData || []);
      if (propsData && propsData.length > 0) {
        setSelectedPropertyId(propsData[0].id);
      }

      const { data: booksData, error: booksError } = await supabase
        .from("bookings")
        .select(`
          *,
          property:properties(title)
        `)
        .eq("host_id", user.id)
        .in("status", ["confirmed", "pending"]);

      if (booksError) throw booksError;

      setBookings(booksData || []);
    } catch (error: any) {
      toast.error("Failed to load calendar data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      fetchData();
    }
  }, [user, authLoading, navigate, fetchData]);

  const selectedProperty = useMemo(
    () => properties.find((p) => p.id === selectedPropertyId),
    [properties, selectedPropertyId]
  );

  useEffect(() => {
    if (selectedProperty) {
      setBasePrice(selectedProperty.price_per_night?.toString() || "");
      setWeekendPrice(selectedProperty.weekend_price?.toString() || "");
      setWeeklyDiscount(selectedProperty.weekly_discount_pct?.toString() || "");
      setMonthlyDiscount(selectedProperty.monthly_discount_pct?.toString() || "");
      setCleaningFee((selectedProperty as any).cleaning_fee?.toString() || "");
      setCleaningPolicy((selectedProperty as any).cleaning_policy || "");

      const pending = selectedProperty.pending_changes || {};
      setMinPrice(pending.min_price?.toString() || "");
      setMaxPrice(pending.max_price?.toString() || "");
    }
  }, [selectedProperty]);

  useEffect(() => {
    if (selectedProperty && selectedDates.size > 0) {
      const blockedArr = selectedProperty.blocked_dates || [];
      // If ALL selected dates are blocked, show as blocked, else unblocked
      let allBlocked = true;
      selectedDates.forEach((d) => {
        if (!blockedArr.includes(d)) allBlocked = false;
      });
      setIsBlocked(allBlocked);
    }
  }, [selectedProperty, selectedDates]);

  const getDaysGrid = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    let startOffset = start.getDay() === 0 ? 6 : start.getDay() - 1;
    const prefix = Array.from({ length: startOffset }).fill(null);
    return [...prefix, ...days];
  };

  const gridDays = getDaysGrid();
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleDateClick = (date: Date) => {
    if (selectionStart) {
      const range = eachDayOfInterval({
        start: min([selectionStart, date]),
        end: max([selectionStart, date]),
      });
      const newSet = new Set<string>();
      range.forEach((d) => newSet.add(format(d, "yyyy-MM-dd")));
      setSelectedDates(newSet);
      setSelectionStart(null);
    } else {
      setSelectionStart(date);
      setSelectedDates(new Set([format(date, "yyyy-MM-dd")]));
    }
  };

  const handleClearSelection = () => {
    setSelectedDates(new Set());
    setSelectionStart(null);
  };

  const handleSave = async () => {
    if (!selectedProperty) return;
    setSaving(true);
    try {
      const price = parseFloat(basePrice) || 0;
      const parsedWeekendPrice = weekendPrice ? parseFloat(weekendPrice) : null;
      const parsedWeekly = weeklyDiscount ? parseFloat(weeklyDiscount) : null;
      const parsedMonthly = monthlyDiscount ? parseFloat(monthlyDiscount) : null;
      const parsedCleaningFee = cleaningFee ? parseFloat(cleaningFee) : null;

      let newBlocked = [...(selectedProperty.blocked_dates || [])];

      if (selectedDates.size > 0) {
        selectedDates.forEach((dateStr) => {
          if (isBlocked && !newBlocked.includes(dateStr)) {
            newBlocked.push(dateStr);
          } else if (!isBlocked) {
            newBlocked = newBlocked.filter((d) => d !== dateStr);
          }
        });
      }

      const pendingChanges = {
        ...(selectedProperty.pending_changes || {}),
        min_price: minPrice ? parseFloat(minPrice) : null,
        max_price: maxPrice ? parseFloat(maxPrice) : null,
      };

      const { error } = await supabase
        .from("properties")
        .update({
          price_per_night: price,
          weekend_price: parsedWeekendPrice,
          weekly_discount_pct: parsedWeekly,
          monthly_discount_pct: parsedMonthly,
          cleaning_fee: parsedCleaningFee,
          cleaning_policy: cleaningPolicy.trim() || null,
          blocked_dates: newBlocked,
          pending_changes: pendingChanges,
        })
        .eq("id", selectedProperty.id);

      if (error) throw error;

      toast.success("Pricing, cleaning policy & availability updated successfully");

      setProperties((prev) =>
        prev.map((p) =>
          p.id === selectedProperty.id
            ? {
                ...p,
                price_per_night: price,
                weekend_price: parsedWeekendPrice,
                weekly_discount_pct: parsedWeekly,
                monthly_discount_pct: parsedMonthly,
                cleaning_fee: parsedCleaningFee,
                cleaning_policy: cleaningPolicy.trim() || null,
                blocked_dates: newBlocked,
                pending_changes: pendingChanges,
              }
            : p
        )
      );

      // Clear selection after save
      setSelectedDates(new Set());
      setSelectionStart(null);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

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

  // Helper to determine day price (Friday = 5, Saturday = 6)
  const getDayPrice = (date: Date) => {
    if (!selectedProperty) return 0;
    const dayOfWeek = getDay(date);
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
    if (isWeekend && selectedProperty.weekend_price) {
      return selectedProperty.weekend_price;
    }
    return selectedProperty.price_per_night || 0;
  };

  return (
    <HostLayout>
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Main Calendar Area */}
        <div className="flex-1 flex flex-col bg-muted/20 border-r overflow-y-auto">
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    {format(currentMonth, "MMMM yyyy")}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Manage nightly pricing, weekend rates, and date availability.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={prevMonth}
                    aria-label="Previous Month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(startOfMonth(new Date()))}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={nextMonth}
                    aria-label="Next Month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-4 pb-3 border-b">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-primary/10 border border-primary/40" />
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
                  <div className="w-3 h-3 rounded bg-primary text-primary-foreground" />
                  <span>Confirmed Booking</span>
                </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border shadow-sm">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <div
                    key={day}
                    className="bg-card py-2.5 text-center text-xs md:text-sm font-semibold text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}

                {gridDays.map((date, i) => {
                  if (!date)
                    return (
                      <div
                        key={`empty-${i}`}
                        className="bg-card/40 min-h-[110px] md:min-h-[135px]"
                      />
                    );

                  const dateObj = date as Date;
                  const dateStr = format(dateObj, "yyyy-MM-dd");
                  const isBlockedDay =
                    selectedProperty?.blocked_dates?.includes(dateStr);
                  const isSelected = selectedDates.has(dateStr);
                  const isStartSelected =
                    selectionStart && isSameDay(selectionStart, dateObj);
                  const dayBookings = getBookingsForDate(dateObj);
                  const isBooked = dayBookings.length > 0;
                  const isPast = dateObj < startOfDay(new Date());
                  const dayOfWeek = getDay(dateObj);
                  const isWeekendDay = dayOfWeek === 5 || dayOfWeek === 6;
                  const priceToShow = getDayPrice(dateObj);

                  return (
                    <div
                      key={dateStr}
                      onClick={() => handleDateClick(dateObj)}
                      className={`bg-card min-h-[110px] md:min-h-[135px] p-2 flex flex-col cursor-pointer transition-colors relative select-none
                        ${
                          isSelected
                            ? "ring-2 ring-primary ring-inset z-10 bg-primary/10"
                            : "hover:bg-accent/40"
                        }
                        ${isStartSelected ? "bg-primary/15" : ""}
                        ${
                          isBlockedDay || isPast
                            ? "opacity-50 bg-muted/60"
                            : isWeekendDay && selectedProperty?.weekend_price
                            ? "bg-amber-50/40 dark:bg-amber-950/10"
                            : ""
                        }
                      `}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span
                          className={`text-xs md:text-sm font-medium h-6 w-6 rounded-full flex items-center justify-center ${
                            isSameDay(dateObj, new Date())
                              ? "bg-primary text-primary-foreground font-bold shadow-sm"
                              : "text-foreground"
                          }`}
                        >
                          {format(dateObj, "d")}
                        </span>

                        {isBlockedDay && !isPast && (
                          <span className="text-[10px] uppercase font-bold text-destructive bg-destructive/10 px-1 py-0.5 rounded">
                            Blocked
                          </span>
                        )}
                      </div>

                      {!isBooked && selectedProperty && (
                        <div className="mt-auto pt-1">
                          <div className="text-xs md:text-sm font-semibold text-foreground/90 leading-tight">
                            {formatPrice(priceToShow)}
                          </div>
                          {isWeekendDay && selectedProperty.weekend_price && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium block">
                              Weekend
                            </span>
                          )}
                        </div>
                      )}

                      {dayBookings.map((b) => {
                        const isStart =
                          isSameDay(parseISO(b.check_in), dateObj) ||
                          dateStr ===
                            format(startOfMonth(currentMonth), "yyyy-MM-dd");
                        if (isStart) {
                          return (
                            <div
                              key={b.id}
                              className="absolute left-1 right-1 top-1/2 -translate-y-1/2 z-20"
                            >
                              <div className="bg-primary text-primary-foreground text-[11px] font-medium px-2 py-1 rounded shadow-md whitespace-nowrap overflow-hidden text-ellipsis">
                                {b.guests} guests • {formatPrice(b.total_price)}
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
                Tip: Click any single date to select it, or click two dates to select an entire range for bulk blocking or availability updates.
              </p>
            </div>
          )}
        </div>

        {/* Right Sidebar - Pricing, Discounts & Cleaning Policy */}
        <div className="w-full lg:w-[380px] xl:w-[420px] bg-card flex flex-col overflow-y-auto border-t lg:border-t-0 lg:border-l">
          <div className="p-5 border-b bg-muted/30">
            <h2 className="font-semibold text-base mb-3">Listing Selection</h2>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                Select Property
              </Label>
              <Select
                value={selectedPropertyId}
                onValueChange={setSelectedPropertyId}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select a property" />
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
          </div>

          <div className="p-5 flex-1 space-y-6">
            {/* Selected Dates Actions */}
            {selectedDates.size > 0 ? (
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">
                      {selectedDates.size} {selectedDates.size === 1 ? "Date" : "Dates"} Selected
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Apply availability changes
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={handleClearSelection}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Clear
                  </Button>
                </div>

                <div className="flex items-center justify-between bg-card p-3 rounded-lg border">
                  <div>
                    <Label
                      htmlFor="block-date"
                      className="cursor-pointer font-medium text-sm block"
                    >
                      Block Selected Dates
                    </Label>
                    <span className="text-[11px] text-muted-foreground">
                      Prevent guests from booking these days
                    </span>
                  </div>
                  <Switch
                    id="block-date"
                    checked={isBlocked}
                    onCheckedChange={setIsBlocked}
                  />
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-lg border border-dashed text-center text-xs text-muted-foreground bg-muted/20">
                Click dates on the calendar to block or unblock availability.
              </div>
            )}

            {/* Nightly Rates */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-base">Nightly Rates</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Base Price per Night (IQD) *
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="e.g. 150000"
                      className="h-11 text-base font-semibold pr-14"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                      IQD
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Standard rate for Sunday – Thursday.
                  </p>
                </div>

                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Weekend Price per Night (IQD)
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="Optional (e.g. 180000)"
                      className="h-11 text-base pr-14"
                      value={weekendPrice}
                      onChange={(e) => setWeekendPrice(e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                      IQD
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Applied automatically to Friday & Saturday nights.
                  </p>
                </div>
              </div>
            </div>

            {/* Long-Stay Discounts */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-primary" />
                <div>
                  <h3 className="font-semibold text-base">Stay Discounts</h3>
                  <p className="text-xs text-muted-foreground">
                    Attract extended and weekly bookings.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Weekly Discount (7+ nights)
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="e.g. 10"
                      min="0"
                      max="100"
                      className="pr-8 text-right font-medium"
                      value={weeklyDiscount}
                      onChange={(e) => setWeeklyDiscount(e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Monthly Discount (28+ nights)
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="e.g. 20"
                      min="0"
                      max="100"
                      className="pr-8 text-right font-medium"
                      value={monthlyDiscount}
                      onChange={(e) => setMonthlyDiscount(e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cleaning Policy & Fee */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Brush className="h-4 w-4 text-primary" />
                <div>
                  <h3 className="font-semibold text-base">Cleaning Policy & Fee</h3>
                  <p className="text-xs text-muted-foreground">
                    Set your cleaning fee and guest turnover guidelines.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Cleaning Fee (IQD)
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="Optional (e.g. 25000)"
                      className="pr-14 font-medium"
                      value={cleaningFee}
                      onChange={(e) => setCleaningFee(e.target.value)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                      IQD
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    One-time fee added to each reservation.
                  </p>
                </div>

                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Cleaning Policy & Instructions
                  </Label>
                  <Textarea
                    placeholder="e.g. Professional sanitization between every stay. Guests are requested to take out trash and leave used towels in the basket."
                    className="min-h-[90px] text-xs resize-y"
                    value={cleaningPolicy}
                    onChange={(e) => setCleaningPolicy(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Price Limits / Guardrails */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-base">Price Guardrails</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Min Price (IQD)
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="e.g. 100000"
                      className="pr-12 text-xs"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                      IQD
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Max Price (IQD)
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="e.g. 500000"
                      className="pr-12 text-xs"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                      IQD
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <Button
              className="w-full h-12 text-base font-semibold shadow-md mt-6"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </HostLayout>
  );
}
