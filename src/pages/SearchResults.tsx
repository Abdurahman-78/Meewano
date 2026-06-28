import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import AppLayout from "@/components/AppLayout";
import CollapsibleSearch from "@/components/CollapsibleSearch";
import PropertyCard from "@/components/PropertyCard";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/hooks/useTranslation";
import { useProperties, DbProperty } from "@/hooks/useProperties";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useCurrency } from "@/contexts/CurrencyContext";
import { RotateCcw, Loader2, Home, ChevronDown, ChevronUp, CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

type SortOption = "recommended" | "price-low" | "price-high" | "rating" | "recent";

const fmtIQD = (n: number | ""): string => {
  if (n === "" || isNaN(n)) return "";
  return n.toLocaleString("en-US");
};

const parseIQD = (s: string): number | "" => {
  const raw = s.replace(/,/g, "");
  if (raw === "") return "";
  const n = Number(raw);
  return isNaN(n) ? "" : n;
};

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const initialLocation = searchParams.get("location") || "";
  const initialRooms = searchParams.get("rooms") || "";

  // Pending filter state (before applying)
  const [pendingMinPrice, setPendingMinPrice] = useState<number | "">("");
  const [pendingMaxPrice, setPendingMaxPrice] = useState<number | "">("");
  const [pendingLocations, setPendingLocations] = useState<string[]>(
    initialLocation ? [initialLocation] : []
  );
  const [pendingPropertyTypes, setPendingPropertyTypes] = useState<string[]>([]);
  const [pendingRatings, setPendingRatings] = useState<number[]>([]);
  const [pendingRooms, setPendingRooms] = useState<string>(initialRooms);
  const [pendingBedrooms, setPendingBedrooms] = useState<string>("");
  const [pendingDateRange, setPendingDateRange] = useState<DateRange | undefined>(undefined);

  // Applied filter state
  const [selectedMinPrice, setSelectedMinPrice] = useState<number | "">("");
  const [selectedMaxPrice, setSelectedMaxPrice] = useState<number | "">("");
  const [selectedLocations, setSelectedLocations] = useState<string[]>(
    initialLocation ? [initialLocation] : []
  );
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<string>(initialRooms);
  const [selectedBedrooms, setSelectedBedrooms] = useState<string>("");
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>(undefined);

  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Re-apply filters from URL when query string changes
  useEffect(() => {
    const loc = searchParams.get("location") || "";
    const rms = searchParams.get("rooms") || "";
    const locArr = loc ? [loc] : [];
    setPendingLocations(locArr);
    setSelectedLocations(locArr);
    setPendingRooms(rms);
    setSelectedRooms(rms);
  }, [searchParams]);

  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  
  const { t } = useTranslation();

  const { data: properties, isLoading } = useProperties();
  const { data: settings } = useSiteSettings();
  const { convertPrice } = useCurrency();

  // Derive filter options from the actual dataset
  const PROPERTY_TYPE_KEYWORDS = ["House", "Villa", "Apartment", "Chalet", "Cottage", "Lodge", "Cabin", "Studio", "Hotel", "Resort"];
  const RATING_THRESHOLDS = [4.5, 4.0, 3.5, 3.0];

  const settingsLocations = (settings?.locations as string[]) || [];

  const detectType = (p: DbProperty): string | null => {
    const hay = `${p.title} ${p.description || ""}`.toLowerCase();
    return PROPERTY_TYPE_KEYWORDS.find(k => hay.includes(k.toLowerCase())) || null;
  };

  const { availableLocations, availablePropertyTypes, availableRatings, maxBedrooms } = useMemo(() => {
    const locSet = new Set<string>();
    const typeSet = new Set<string>();
    const ratings = new Set<number>();
    let maxBeds = 0;
    (properties || []).forEach(p => {
      if (p.city) locSet.add(p.city.trim());
      const t = detectType(p);
      if (t) typeSet.add(t);
      RATING_THRESHOLDS.forEach(r => { if ((p.rating || 0) >= r) ratings.add(r); });
      if ((p.bedrooms || 0) > maxBeds) maxBeds = p.bedrooms || 0;
    });
    settingsLocations.forEach(l => locSet.add(l));
    return {
      availableLocations: Array.from(locSet).sort(),
      availablePropertyTypes: PROPERTY_TYPE_KEYWORDS.filter(t => typeSet.has(t)),
      availableRatings: RATING_THRESHOLDS.filter(r => ratings.has(r)),
      maxBedrooms: maxBeds,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties, settings]);

  const bedroomOptions = useMemo(() => {
    const opts: string[] = ["Any"];
    const cap = Math.min(maxBedrooms, 6);
    for (let i = 1; i <= cap; i++) opts.push(i === cap && maxBedrooms > cap ? `${i}+` : String(i));
    return opts;
  }, [maxBedrooms]);

  // Handle checkbox toggles
  const toggleLocation = (location: string) => {
    setPendingLocations(prev => 
      prev.includes(location) ? prev.filter(l => l !== location) : [...prev, location]
    );
  };

  const togglePropertyType = (type: string) => {
    setPendingPropertyTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleRating = (rating: number) => {
    setPendingRatings(prev => 
      prev.includes(rating) ? prev.filter(r => r !== rating) : [...prev, rating]
    );
  };

  // Apply filters
  const applyFilters = () => {
    setSelectedMinPrice(pendingMinPrice);
    setSelectedMaxPrice(pendingMaxPrice);
    setSelectedLocations(pendingLocations);
    setSelectedPropertyTypes(pendingPropertyTypes);
    setSelectedRatings(pendingRatings);
    setSelectedRooms(pendingRooms);
    setSelectedBedrooms(pendingBedrooms);
    setSelectedDateRange(pendingDateRange);
  };

  // Reset filters
  const resetFilters = () => {
    setPendingMinPrice("");
    setPendingMaxPrice("");
    setPendingLocations([]);
    setPendingPropertyTypes([]);
    setPendingRatings([]);
    setPendingRooms("");
    setPendingBedrooms("");
    setPendingDateRange(undefined);
    setSelectedMinPrice("");
    setSelectedMaxPrice("");
    setSelectedLocations([]);
    setSelectedPropertyTypes([]);
    setSelectedRatings([]);
    setSelectedRooms("");
    setSelectedBedrooms("");
    setSelectedDateRange(undefined);
  };

  // Check if filters have pending changes
  const hasChanges = 
    pendingMinPrice !== selectedMinPrice ||
    pendingMaxPrice !== selectedMaxPrice ||
    JSON.stringify(pendingLocations) !== JSON.stringify(selectedLocations) ||
    JSON.stringify(pendingPropertyTypes) !== JSON.stringify(selectedPropertyTypes) ||
    JSON.stringify(pendingRatings) !== JSON.stringify(selectedRatings) ||
    pendingRooms !== selectedRooms ||
    pendingBedrooms !== selectedBedrooms ||
    (pendingDateRange?.from?.toISOString() || "") !== (selectedDateRange?.from?.toISOString() || "") ||
    (pendingDateRange?.to?.toISOString() || "") !== (selectedDateRange?.to?.toISOString() || "");

  // Filter and sort properties
  const filteredAndSortedProperties = useMemo(() => {
    if (!properties) return [];
    
    let filtered = [...properties];

    // Apply price filter (per night in IQD)
    if (selectedMinPrice !== "" || selectedMaxPrice !== "") {
      filtered = filtered.filter(p => {
        const iqd = convertPrice(Number(p.price_per_night) || 0);
        if (selectedMinPrice !== "" && iqd < selectedMinPrice) return false;
        if (selectedMaxPrice !== "" && iqd > selectedMaxPrice) return false;
        return true;
      });
    }

    // Apply location filter
    if (selectedLocations.length > 0) {
      filtered = filtered.filter(p => 
        selectedLocations.some(loc => 
          p.city.toLowerCase().includes(loc.toLowerCase()) ||
          p.location.toLowerCase().includes(loc.toLowerCase())
        )
      );
    }

    // Property type filter (keyword match against title/description)
    if (selectedPropertyTypes.length > 0) {
      filtered = filtered.filter(p => {
        const tt = detectType(p);
        return tt ? selectedPropertyTypes.includes(tt) : false;
      });
    }

    // Apply rooms filter (min bedrooms, from SearchBar)
    if (selectedRooms) {
      const minRooms = parseInt(selectedRooms, 10);
      if (!isNaN(minRooms)) {
        filtered = filtered.filter(p => (p.bedrooms || 0) >= minRooms);
      }
    }

    // Apply bedroom filter (exact, with + cap)
    if (selectedBedrooms && selectedBedrooms !== "Any") {
      const isPlus = selectedBedrooms.endsWith("+");
      const n = parseInt(selectedBedrooms, 10);
      if (!isNaN(n)) {
        filtered = filtered.filter(p => isPlus ? (p.bedrooms || 0) >= n : (p.bedrooms || 0) === n);
      }
    }

    // Apply rating filter (minimum rating)
    if (selectedRatings.length > 0) {
      const minRating = Math.min(...selectedRatings);
      filtered = filtered.filter(p => (p.rating || 0) >= minRating);
    }

    // Apply date range filter against blocked_dates & availability window
    if (selectedDateRange?.from && selectedDateRange?.to) {
      const from = selectedDateRange.from;
      const to = selectedDateRange.to;
      const dayMs = 86400000;
      filtered = filtered.filter(p => {
        if ((p as any).available_from && new Date((p as any).available_from) > from) return false;
        if ((p as any).available_to && new Date((p as any).available_to) < to) return false;
        const blocked = (((p as any).blocked_dates as string[]) || []);
        if (blocked.length === 0) return true;
        const blockedSet = new Set(blocked.map(d => new Date(d).toDateString()));
        for (let ts = from.getTime(); ts <= to.getTime(); ts += dayMs) {
          if (blockedSet.has(new Date(ts).toDateString())) return false;
        }
        return true;
      });
    }

    // Sort
    switch (sortBy) {
      case "price-low":
        return filtered.sort((a, b) => a.price_per_night - b.price_per_night);
      case "price-high":
        return filtered.sort((a, b) => b.price_per_night - a.price_per_night);
      case "rating":
        return filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case "recent":
        return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      default:
        return filtered;
    }
  }, [properties, sortBy, selectedMinPrice, selectedMaxPrice, selectedLocations, selectedPropertyTypes, selectedRatings, selectedRooms, selectedBedrooms, selectedDateRange, convertPrice]);


  return (
    <AppLayout>
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <CollapsibleSearch />
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">{t("filters")}</h3>
                  <Button variant="ghost" size="sm" onClick={resetFilters}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                </div>

                {/* Price per night (IQD) */}
                <div>
                  <div className="mb-3">
                    <Label className="text-sm font-semibold">{t("priceRange")}</Label>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="Min"
                        value={fmtIQD(pendingMinPrice)}
                        onChange={(e) => setPendingMinPrice(parseIQD(e.target.value))}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground mt-2">to</span>
                    <div className="flex-1">
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="Max"
                        value={fmtIQD(pendingMaxPrice)}
                        onChange={(e) => setPendingMaxPrice(parseIQD(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                {/* Location (from actual properties) */}
                <div>
                  <Label className="text-sm font-semibold mb-3 block">{t("location")}</Label>
                  {availableLocations.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No locations available</p>
                  ) : (
                    <div className="space-y-2">
                      {availableLocations.map((location) => (
                        <div key={location} className="flex items-center gap-2">
                          <Checkbox
                            id={location}
                            checked={pendingLocations.includes(location)}
                            onCheckedChange={() => toggleLocation(location)}
                          />
                          <Label htmlFor={location} className="text-sm font-normal cursor-pointer">
                            {location}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Property Type (only types present in data) */}
                <div>
                  <Label className="text-sm font-semibold mb-3 block">{t("propertyType")}</Label>
                  {availablePropertyTypes.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No property types detected</p>
                  ) : (
                    <div className="space-y-2">
                      {availablePropertyTypes.map((type) => (
                        <div key={type} className="flex items-center gap-2">
                          <Checkbox
                            id={type}
                            checked={pendingPropertyTypes.includes(type)}
                            onCheckedChange={() => togglePropertyType(type)}
                          />
                          <Label htmlFor={type} className="text-sm font-normal cursor-pointer">
                            {type}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Rating (only thresholds with matching listings) */}
                <div>
                  <Label className="text-sm font-semibold mb-3 block">{t("rating")}</Label>
                  {availableRatings.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No rated properties yet</p>
                  ) : (
                    <div className="space-y-2">
                      {availableRatings.map((rating) => (
                        <div key={rating} className="flex items-center gap-2">
                          <Checkbox
                            id={`rating-${rating}`}
                            checked={pendingRatings.includes(rating)}
                            onCheckedChange={() => toggleRating(rating)}
                          />
                          <Label htmlFor={`rating-${rating}`} className="text-sm font-normal cursor-pointer">
                            {rating}+ stars
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Show more filters toggle */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => setShowMoreFilters(v => !v)}
                >
                  {showMoreFilters ? "Show less filters" : "Show more filters"}
                  {showMoreFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>

                {showMoreFilters && (
                  <div className="space-y-6 pt-2 border-t">
                    {/* Bedrooms */}
                    <div>
                      <Label className="text-sm font-semibold mb-3 block">Bedrooms</Label>
                      {bedroomOptions.length <= 1 ? (
                        <p className="text-xs text-muted-foreground">No bedroom data available</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {bedroomOptions.map((opt) => {
                            const active = (pendingBedrooms || "Any") === opt;
                            return (
                              <Button
                                key={opt}
                                type="button"
                                variant={active ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPendingBedrooms(opt === "Any" ? "" : opt)}
                                className="rounded-full px-3"
                              >
                                {opt}
                              </Button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Date range */}
                    <div>
                      <Label className="text-sm font-semibold mb-3 block">Date range</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !pendingDateRange?.from && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {pendingDateRange?.from ? (
                              pendingDateRange.to ? (
                                <>
                                  {format(pendingDateRange.from, "LLL d")} – {format(pendingDateRange.to, "LLL d, yyyy")}
                                </>
                              ) : (
                                format(pendingDateRange.from, "LLL d, yyyy")
                              )
                            ) : (
                              <span>Pick check-in & check-out</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="range"
                            selected={pendingDateRange}
                            onSelect={setPendingDateRange}
                            numberOfMonths={2}
                            disabled={{ before: new Date() }}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                          {pendingDateRange && (
                            <div className="flex justify-end p-2 border-t">
                              <Button variant="ghost" size="sm" onClick={() => setPendingDateRange(undefined)}>
                                Clear
                              </Button>
                            </div>
                          )}
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}


                {/* Apply Button */}
                <Button 
                  onClick={applyFilters} 
                  className="w-full"
                  disabled={!hasChanges}
                >
                  Apply Filters
                </Button>
              </CardContent>
            </Card>
          </aside>

          {/* Results Grid */}
          <div className="lg:col-span-3">
            <div className="mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{t("searchResults")}</h1>
                  <p className="text-muted-foreground">
                    {isLoading ? "Loading..." : `${filteredAndSortedProperties.length} ${t("propertiesFound")}`}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Sort Dropdown */}
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recommended">Recommended</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="recent">Most Recent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredAndSortedProperties.length === 0 ? (
              <div className="text-center py-20">
                <Home className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold mb-2">No Properties Found</h2>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your filters or search in a different area.
                </p>
                <Button onClick={resetFilters} variant="outline">
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAndSortedProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    id={property.id}
                    image={property.images?.[0] || "/placeholder.svg"}
                    name={property.title}
                    location={property.location}
                    bedrooms={property.bedrooms}
                    bathrooms={property.bathrooms}
                    price={property.price_per_night}
                    rating={property.rating || 0}
                    reviews={property.review_count}
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

export default SearchResults;
