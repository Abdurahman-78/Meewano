import { useState, useEffect, useMemo } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, isWithinInterval, startOfDay, min, max } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import HostLayout from "@/components/HostLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [weeklyDiscount, setWeeklyDiscount] = useState("");
  const [monthlyDiscount, setMonthlyDiscount] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [saving, setSaving] = useState(false);

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
    try {
      const { data: propsData, error: propsError } = await supabase
        .from("properties")
        .select("*")
        .eq("host_id", user!.id);
      
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
        .eq("host_id", user!.id)
        .in("status", ["confirmed", "pending"]);
      
      if (booksError) throw booksError;
      
      setBookings(booksData || []);
    } catch (error: any) {
      toast.error("Failed to load data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const selectedProperty = useMemo(() => properties.find(p => p.id === selectedPropertyId), [properties, selectedPropertyId]);

  useEffect(() => {
    if (selectedProperty) {
      setBasePrice(selectedProperty.price_per_night?.toString() || "");
      setWeeklyDiscount(selectedProperty.weekly_discount_pct?.toString() || "5");
      setMonthlyDiscount(selectedProperty.monthly_discount_pct?.toString() || "10");
      
      const pending = selectedProperty.pending_changes || {};
      setMinPrice(pending.min_price?.toString() || Math.max(10, (selectedProperty.price_per_night || 0) * 0.7).toFixed(0));
      setMaxPrice(pending.max_price?.toString() || ((selectedProperty.price_per_night || 0) * 1.5).toFixed(0));
    }
  }, [selectedProperty]);

  useEffect(() => {
    if (selectedProperty && selectedDates.size > 0) {
      const blockedArr = selectedProperty.blocked_dates || [];
      // If ALL selected dates are blocked, show as blocked, else unblocked
      let allBlocked = true;
      selectedDates.forEach(d => {
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
      const range = eachDayOfInterval({ start: min([selectionStart, date]), end: max([selectionStart, date]) });
      const newSet = new Set<string>();
      range.forEach(d => newSet.add(format(d, 'yyyy-MM-dd')));
      setSelectedDates(newSet);
      setSelectionStart(null);
    } else {
      setSelectionStart(date);
      setSelectedDates(new Set([format(date, 'yyyy-MM-dd')]));
    }
  };

  const handleSave = async () => {
    if (!selectedProperty) return;
    setSaving(true);
    try {
      const price = parseFloat(basePrice);
      
      let newBlocked = [...(selectedProperty.blocked_dates || [])];
      
      if (selectedDates.size > 0) {
        selectedDates.forEach(dateStr => {
          if (isBlocked && !newBlocked.includes(dateStr)) {
            newBlocked.push(dateStr);
          } else if (!isBlocked) {
            newBlocked = newBlocked.filter(d => d !== dateStr);
          }
        });
      }

      const pendingChanges = { 
        ...(selectedProperty.pending_changes || {}), 
        min_price: parseFloat(minPrice),
        max_price: parseFloat(maxPrice)
      };

      const { error } = await supabase
        .from("properties")
        .update({
          price_per_night: price,
          blocked_dates: newBlocked,
          weekly_discount_pct: parseFloat(weeklyDiscount) || null,
          monthly_discount_pct: parseFloat(monthlyDiscount) || null,
          pending_changes: pendingChanges
        })
        .eq("id", selectedProperty.id);

      if (error) throw error;
      
      toast.success("Settings updated");
      setProperties(prev => prev.map(p => p.id === selectedProperty.id ? { 
        ...p, 
        price_per_night: price, 
        blocked_dates: newBlocked,
        weekly_discount_pct: parseFloat(weeklyDiscount) || null,
        monthly_discount_pct: parseFloat(monthlyDiscount) || null,
        pending_changes: pendingChanges
      } : p));
      
      // Clear selection after save
      setSelectedDates(new Set());
      setSelectionStart(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const getBookingsForDate = (date: Date) => {
    return bookings.filter(b => b.property_id === selectedPropertyId && isWithinInterval(date, { start: parseISO(b.check_in), end: parseISO(b.check_out) }));
  };

  return (
    <HostLayout>
      <div className="flex-1 flex overflow-hidden">
        {/* Main Calendar Area */}
        <div className="flex-1 flex flex-col bg-accent/20 border-r overflow-y-auto">
          {loading ? (
             <div className="flex-1 flex items-center justify-center">
               <Loader2 className="h-8 w-8 animate-spin" />
             </div>
          ) : (
            <div className="p-8 max-w-7xl mx-auto w-full">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">{format(currentMonth, "MMMM yyyy")}</h1>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentMonth(startOfMonth(new Date()))}>Today</Button>
                  <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                  <div key={day} className="bg-card py-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
                
                {gridDays.map((date, i) => {
                  if (!date) return <div key={`empty-${i}`} className="bg-card min-h-[140px]" />;
                  
                  const dateStr = format(date as Date, "yyyy-MM-dd");
                  const isBlockedDay = selectedProperty?.blocked_dates?.includes(dateStr);
                  const isSelected = selectedDates.has(dateStr);
                  const isStartSelected = selectionStart && isSameDay(selectionStart, date as Date);
                  const dayBookings = getBookingsForDate(date as Date);
                  const isBooked = dayBookings.length > 0;
                  const isPast = (date as Date) < startOfDay(new Date());

                  return (
                    <div 
                      key={dateStr}
                      onClick={() => handleDateClick(date as Date)}
                      className={`bg-card min-h-[140px] p-2 flex flex-col cursor-pointer transition-colors relative select-none
                        ${isSelected ? 'ring-2 ring-primary ring-inset z-10 bg-primary/5' : 'hover:bg-accent/50'}
                        ${isStartSelected ? 'bg-primary/10' : ''}
                        ${(isBlockedDay || isPast) ? 'opacity-50 bg-muted/50' : ''}
                      `}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-sm font-medium ${isSameDay(date as Date, new Date()) ? 'bg-primary text-primary-foreground h-6 w-6 rounded-full flex items-center justify-center' : ''}`}>
                          {format(date as Date, "d")}
                        </span>
                      </div>
                      
                      {!isBooked && selectedProperty && (
                        <div className="mt-auto text-sm font-medium text-muted-foreground">
                          {formatPrice(selectedProperty.price_per_night)}
                        </div>
                      )}

                      {dayBookings.map((b, idx) => {
                         const isStart = isSameDay(parseISO(b.check_in), date as Date) || dateStr === format(startOfMonth(currentMonth), "yyyy-MM-dd");
                         if (isStart) {
                           return (
                             <div key={b.id} className="absolute left-2 right-[-8px] top-1/2 -translate-y-1/2 z-20">
                               <div className="bg-primary text-primary-foreground text-xs font-medium px-2 py-1.5 rounded shadow-sm whitespace-nowrap overflow-hidden text-ellipsis">
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
              <p className="text-sm text-muted-foreground mt-4 text-center">Click a date to select it, or click two dates to select a range.</p>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-[340px] bg-card flex flex-col overflow-y-auto border-l">
          <div className="p-6 border-b bg-accent/10">
            <h2 className="font-semibold text-lg mb-4">Pricing & Availability</h2>
            
            <div className="space-y-4">
              <div>
                <Label>Select Property</Label>
                <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                  <SelectTrigger className="mt-1 bg-background">
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="p-6 flex-1 space-y-8">
            {selectedDates.size > 0 ? (
              <div className="space-y-4 pb-6 border-b">
                <h3 className="font-medium text-sm text-muted-foreground">
                  {selectedDates.size} {selectedDates.size === 1 ? 'date' : 'dates'} selected
                </h3>
                <div className="flex items-center justify-between bg-accent/20 p-3 rounded-lg border">
                  <Label htmlFor="block-date" className="cursor-pointer font-semibold">Block Selected Dates</Label>
                  <Switch 
                    id="block-date" 
                    checked={isBlocked} 
                    onCheckedChange={setIsBlocked} 
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 pb-6 border-b text-center text-muted-foreground">
                <p className="text-sm">Select dates on the calendar to change their availability.</p>
              </div>
            )}
            
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Base Price</h3>
                <div>
                  <Label className="text-muted-foreground font-normal mb-2 block">Default Nightly Rate</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                    <Input 
                      type="number" 
                      className="pl-8 h-12 text-lg font-bold" 
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-lg">Price Limits</h3>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-muted-foreground font-normal mb-1 block">Minimum nightly price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input 
                        type="number" 
                        className="pl-7 bg-accent/10" 
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-muted-foreground font-normal mb-1 block">Maximum nightly price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input 
                        type="number" 
                        className="pl-7 bg-accent/10" 
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex flex-col mb-2">
                  <h3 className="font-semibold text-lg">Discounts</h3>
                  <p className="text-xs text-muted-foreground mt-1">Adjust pricing to attract longer stays.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">Weekly</h4>
                      <p className="text-[10px] text-muted-foreground">7+ nights</p>
                    </div>
                    <div className="w-24 relative">
                      <Input 
                        type="number" 
                        className="pr-7 text-right bg-accent/10" 
                        value={weeklyDiscount}
                        onChange={(e) => setWeeklyDiscount(e.target.value)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">Monthly</h4>
                      <p className="text-[10px] text-muted-foreground">28+ nights</p>
                    </div>
                    <div className="w-24 relative">
                      <Input 
                        type="number" 
                        className="pr-7 text-right bg-accent/10" 
                        value={monthlyDiscount}
                        onChange={(e) => setMonthlyDiscount(e.target.value)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              className="w-full h-12 text-base font-semibold mt-4" 
              onClick={handleSave} 
              disabled={saving}
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Check className="h-5 w-5 mr-2" />}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </HostLayout>
  );
}
