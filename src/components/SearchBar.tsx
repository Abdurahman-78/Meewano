import { Calendar as CalendarIcon, MapPin, Search, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

const KURDISTAN_DESTINATIONS = [
  "Erbil",
  "Sulaymaniyah",
  "Dohuk",
  "Halabja",
  "Zakho",
  "Ranya",
  "Haji Omran",
  "Shaqlawa",
  "Rawanduz",
  "Koya",
  "Chamchamal",
  "Penjwin",
  "Soran",
  "Akre",
  "Amedi",
];

const SearchBar = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [destination, setDestination] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [rooms, setRooms] = useState("");
  const [showDestinations, setShowDestinations] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRooms, setShowRooms] = useState(false);

  const filteredDestinations = KURDISTAN_DESTINATIONS.filter((dest) =>
    dest.toLowerCase().startsWith(destination.toLowerCase())
  );

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

  return (
    <div className="w-full bg-card shadow-lg rounded-2xl md:rounded-full border border-border p-3 md:p-2">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-1 md:gap-2 items-center">
        <Popover open={showDestinations} onOpenChange={(open) => {
          if (!open) setShowDestinations(false);
        }}>
          <PopoverTrigger asChild>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-accent transition-colors">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={t("enterDestination")}
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  setShowDestinations(true);
                }}
                onFocus={() => setShowDestinations(true)}
                onClick={(e) => {
                  e.preventDefault();
                  setShowDestinations(true);
                }}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
              />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <div className="max-h-[300px] overflow-y-auto">
              {filteredDestinations.length > 0 ? (
                filteredDestinations.map((dest) => (
                  <button
                    key={dest}
                    onClick={() => {
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
          </PopoverContent>
        </Popover>

        <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
          <PopoverTrigger asChild>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-accent transition-colors cursor-pointer">
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
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={handleDateSelect}
              numberOfMonths={2}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <Popover open={showRooms} onOpenChange={setShowRooms}>
          <PopoverTrigger asChild>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-accent transition-colors cursor-pointer">
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
          <PopoverContent className="w-[200px] p-0" align="start">
            <div className="flex flex-col">
              {["1", "2", "3", "4", "5+"].map((room) => (
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
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Button
          onClick={handleSearch}
          className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8"
        >
          <Search className="h-5 w-5 mr-2" />
          {t("search")}
        </Button>
      </div>
    </div>
  );
};

export default SearchBar;
