import { Calendar as CalendarIcon, MapPin, Search, Users, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTranslation } from "@/hooks/useTranslation";
import { useProperties } from "@/hooks/useProperties";
import { cn } from "@/lib/utils";

const SearchBar = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: properties } = useProperties();
  const [destination, setDestination] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [rooms, setRooms] = useState("");
  const [showDestinations, setShowDestinations] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRooms, setShowRooms] = useState(false);

  // Approved & active properties
  const activeProperties = useMemo(() => {
    if (!properties) return [];
    return (properties as any[]).filter(
      (p) => p.is_active && p.approval_status === "approved"
    );
  }, [properties]);

  // Build unique list of cities that have approved, active properties
  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    activeProperties.forEach((p) => {
      if (p.city) cities.add(p.city.trim());
    });
    return Array.from(cities).sort();
  }, [activeProperties]);

  const filteredDestinations = availableCities.filter((dest) =>
    dest.toLowerCase().includes(destination.toLowerCase())
  );

  const hasMatch = destination
    ? availableCities.some((city) =>
        city.toLowerCase().includes(destination.toLowerCase())
      )
    : true;

  // Properties matching the entered destination (or all if none entered)
  const matchingProperties = useMemo(() => {
    if (!destination) return activeProperties;
    return activeProperties.filter((p) =>
      p.city?.toLowerCase().includes(destination.toLowerCase())
    );
  }, [activeProperties, destination]);

  // Bedroom options available for the matching properties
  const availableRoomOptions = useMemo(() => {
    const set = new Set<string>();
    matchingProperties.forEach((p) => {
      const b = Number(p.bedrooms);
      if (!isNaN(b) && b > 0) set.add(b >= 5 ? "5+" : String(b));
    });
    return ["1", "2", "3", "4", "5+"].filter((r) => set.has(r));
  }, [matchingProperties]);

  const datesEnabled = hasMatch && matchingProperties.length > 0;
  const roomsEnabled = datesEnabled && availableRoomOptions.length > 0;


  const handleSearch = () => {
    const params = new URLSearchParams();
    if (destination) params.set("location", destination);
    if (dateRange?.from) params.set("checkIn", format(dateRange.from, "yyyy-MM-dd"));
    if (dateRange?.to) params.set("checkOut", format(dateRange.to, "yyyy-MM-dd"));
    if (rooms) params.set("rooms", rooms);
    const qs = params.toString();
    navigate(qs ? `/search?${qs}` : "/search");
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      setShowDatePicker(false);
    }
  };

  const quickDates = [
    { label: "This Weekend", getRange: () => {
      const today = new Date();
      const sat = new Date(today);
      sat.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7));
      const sun = new Date(sat);
      sun.setDate(sat.getDate() + 1);
      return { from: sat, to: sun };
    }},
    { label: "Next Week", getRange: () => {
      const today = new Date();
      const mon = new Date(today);
      mon.setDate(today.getDate() + ((8 - today.getDay()) % 7 || 7));
      const fri = new Date(mon);
      fri.setDate(mon.getDate() + 4);
      return { from: mon, to: fri };
    }},
    { label: "Next Weekend", getRange: () => {
      const today = new Date();
      const nextSat = new Date(today);
      nextSat.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7) + 7);
      const nextSun = new Date(nextSat);
      nextSun.setDate(nextSat.getDate() + 1);
      return { from: nextSat, to: nextSun };
    }},
    { label: "1 Week", getRange: () => {
      const from = new Date();
      const to = new Date();
      to.setDate(from.getDate() + 7);
      return { from, to };
    }},
  ];

  const handleQuickDate = (getRange: () => DateRange) => {
    const range = getRange();
    setDateRange(range);
    setShowDatePicker(false);
  };

  return (
    <div className="w-full bg-card shadow-lg rounded-2xl md:rounded-full border border-border p-3 md:p-2">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-1 md:gap-2 items-center">
        <div className="relative">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-accent transition-colors">
            <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
            <Input
              placeholder={t("enterDestination")}
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                setShowDestinations(true);
              }}
              onFocus={() => setShowDestinations(true)}
              onBlur={() => setTimeout(() => setShowDestinations(false), 150)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setShowDestinations(false);
                  handleSearch();
                }
              }}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
            />
          </div>
          {showDestinations && (
            <div className="absolute z-[100] mt-2 w-[300px] bg-popover border border-border rounded-md shadow-lg max-h-[300px] overflow-y-auto">
              {filteredDestinations.length > 0 ? (
                filteredDestinations.map((dest) => (
                  <button
                    type="button"
                    key={dest}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setDestination(dest);
                      setShowDestinations(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-accent transition-colors flex items-center gap-2"
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{dest}</span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  {t("noDestinations")}
                </div>
              )}
            </div>
          )}
        </div>

        <Popover open={showDatePicker} onOpenChange={(o) => datesEnabled && setShowDatePicker(o)}>
          <PopoverTrigger asChild>
            <div
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-colors",
                datesEnabled
                  ? "hover:bg-accent cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              )}
            >
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 text-sm">
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "MMM dd")} -{" "}
                      {format(dateRange.to, "MMM dd")}
                    </>
                  ) : (
                    format(dateRange.from, "MMM dd")
                  )
                ) : (
                  <span className="text-muted-foreground">{t("selectDates")}</span>
                )}
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[720px] p-0 z-[100]" align="center" sideOffset={8}>
            <div className="pointer-events-auto">
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-3">
                <div>
                  <h3 className="text-base font-semibold">{t("selectDates")}</h3>
                  <p className="text-sm text-muted-foreground">{dateRange?.from && dateRange?.to ? `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}` : "Add dates for prices"}</p>
                </div>
                {dateRange && (
                  <button
                    type="button"
                    onClick={() => setDateRange(undefined)}
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear
                  </button>
                )}
              </div>

              {/* Quick select chips */}
              <div className="flex flex-wrap gap-2 px-6 pb-3">
                {quickDates.map((qd) => (
                  <button
                    key={qd.label}
                    type="button"
                    onClick={() => handleQuickDate(qd.getRange)}
                    className="px-3 py-1.5 text-sm rounded-full border border-border bg-secondary hover:bg-accent hover:border-primary/30 transition-colors"
                  >
                    {qd.label}
                  </button>
                ))}
              </div>

              {/* Calendar */}
              <div className="px-4 pb-4">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={handleDateSelect}
                  numberOfMonths={2}
                  disabled={{ before: new Date() }}
                  className="pointer-events-auto"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover open={showRooms} onOpenChange={(o) => roomsEnabled && setShowRooms(o)}>
          <PopoverTrigger asChild>
            <div
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-colors",
                roomsEnabled
                  ? "hover:bg-accent cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              )}
            >
              <Users className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 text-sm">
                {rooms ? (
                  <span>{rooms} {rooms === "1" ? t("room") : t("rooms_label")}</span>
                ) : (
                  <span className="text-muted-foreground">{t("selectRooms")}</span>
                )}
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0 z-[100]" align="start">
            <div className="flex flex-col">
              {availableRoomOptions.length > 0 ? (
                availableRoomOptions.map((room) => (
                  <button
                    key={room}
                    onClick={() => {
                      setRooms(room);
                      setShowRooms(false);
                    }}
                    className={cn(
                      "px-4 py-3 text-left hover:bg-accent transition-colors",
                      rooms === room && "bg-accent"
                    )}
                  >
                    {room} {room === "1" ? t("room") : t("rooms_label")}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  {t("noDestinations")}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>


        <Button
          onClick={handleSearch}
          disabled={!hasMatch}
          className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Search className="h-5 w-5 mr-2" />
          {t("search")}
        </Button>
      </div>
    </div>
  );
};

export default SearchBar;
