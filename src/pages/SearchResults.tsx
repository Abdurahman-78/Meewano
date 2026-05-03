import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import SearchBar from "@/components/SearchBar";
import PropertyCard from "@/components/PropertyCard";
import PropertyMap from "@/components/PropertyMap";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/hooks/useTranslation";
import { useProperties, DbProperty } from "@/hooks/useProperties";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Map, List, RotateCcw, Loader2, Home } from "lucide-react";

type SortOption = "recommended" | "price-low" | "price-high" | "rating" | "recent";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const initialLocation = searchParams.get("location") || "";

  // Pending filter state (before applying)
  const [pendingPriceRange, setPendingPriceRange] = useState([0, 500]);
  const [pendingLocations, setPendingLocations] = useState<string[]>(
    initialLocation ? [initialLocation] : []
  );
  const [pendingPropertyTypes, setPendingPropertyTypes] = useState<string[]>([]);
  const [pendingRatings, setPendingRatings] = useState<number[]>([]);

  // Applied filter state
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>(
    initialLocation ? [initialLocation] : []
  );
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);

  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const [showMap, setShowMap] = useState(false);
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
  const [isMobileMapView, setIsMobileMapView] = useState(false);
  const { t } = useTranslation();

  const { data: properties, isLoading } = useProperties();
  const { data: settings } = useSiteSettings();

  // Get locations from settings
  const locations = (settings?.locations as string[]) || ["Ranya", "Haji Omran", "Erbil", "Sulaymaniyah"];
  const propertyTypes = ["House", "Villa", "Apartment", "Chalet", "Cottage", "Lodge"];
  const ratingOptions = [4.5, 4.0, 3.5, 3.0];

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
    setPriceRange(pendingPriceRange);
    setSelectedLocations(pendingLocations);
    setSelectedPropertyTypes(pendingPropertyTypes);
    setSelectedRatings(pendingRatings);
  };

  // Reset filters
  const resetFilters = () => {
    setPendingPriceRange([0, 500]);
    setPendingLocations([]);
    setPendingPropertyTypes([]);
    setPendingRatings([]);
    setPriceRange([0, 500]);
    setSelectedLocations([]);
    setSelectedPropertyTypes([]);
    setSelectedRatings([]);
  };

  // Check if filters have pending changes
  const hasChanges = 
    JSON.stringify(pendingPriceRange) !== JSON.stringify(priceRange) ||
    JSON.stringify(pendingLocations) !== JSON.stringify(selectedLocations) ||
    JSON.stringify(pendingPropertyTypes) !== JSON.stringify(selectedPropertyTypes) ||
    JSON.stringify(pendingRatings) !== JSON.stringify(selectedRatings);

  // Filter and sort properties
  const filteredAndSortedProperties = useMemo(() => {
    if (!properties) return [];
    
    let filtered = [...properties];

    // Apply price filter
    filtered = filtered.filter(p => p.price_per_night >= priceRange[0] && p.price_per_night <= priceRange[1]);

    // Apply location filter
    if (selectedLocations.length > 0) {
      filtered = filtered.filter(p => 
        selectedLocations.some(loc => 
          p.city.toLowerCase().includes(loc.toLowerCase()) ||
          p.location.toLowerCase().includes(loc.toLowerCase())
        )
      );
    }

    // Apply rating filter (minimum rating)
    if (selectedRatings.length > 0) {
      const minRating = Math.min(...selectedRatings);
      filtered = filtered.filter(p => (p.rating || 0) >= minRating);
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
  }, [properties, sortBy, priceRange, selectedLocations, selectedPropertyTypes, selectedRatings]);

  // Convert DbProperty to map format
  const mapProperties = filteredAndSortedProperties.map(p => ({
    id: p.id,
    name: p.title,
    location: p.location,
    price: p.price_per_night,
    image: p.images?.[0] || "/placeholder.svg",
    latitude: p.latitude || 0,
    longitude: p.longitude || 0,
  }));

  return (
    <AppLayout>
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <SearchBar />
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

                {/* Price Range */}
                <div>
                  <Label className="text-sm font-semibold mb-3 block">{t("priceRange")}</Label>
                  <Slider
                    value={pendingPriceRange}
                    onValueChange={setPendingPriceRange}
                    min={0}
                    max={500}
                    step={10}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>${pendingPriceRange[0]}</span>
                    <span>${pendingPriceRange[1]}</span>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <Label className="text-sm font-semibold mb-3 block">{t("location")}</Label>
                  <div className="space-y-2">
                    {locations.map((location) => (
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
                </div>

                {/* Property Type */}
                <div>
                  <Label className="text-sm font-semibold mb-3 block">{t("propertyType")}</Label>
                  <div className="space-y-2">
                    {propertyTypes.map((type) => (
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
                </div>

                {/* Rating */}
                <div>
                  <Label className="text-sm font-semibold mb-3 block">{t("rating")}</Label>
                  <div className="space-y-2">
                    {ratingOptions.map((rating) => (
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
                </div>

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
                  {/* Mobile Map/List Toggle */}
                  <div className="flex lg:hidden gap-2">
                    <Button
                      variant={!isMobileMapView ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsMobileMapView(false)}
                    >
                      <List className="w-4 h-4 mr-2" />
                      List
                    </Button>
                    <Button
                      variant={isMobileMapView ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsMobileMapView(true)}
                    >
                      <Map className="w-4 h-4 mr-2" />
                      Map
                    </Button>
                  </div>

                  {/* Desktop Map Toggle */}
                  <Button
                    variant={showMap ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowMap(!showMap)}
                    className="hidden lg:flex"
                  >
                    <Map className="w-4 h-4 mr-2" />
                    {showMap ? "Hide Map" : "Show Map"}
                  </Button>

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
              <>
                {/* Desktop: Side by side or List only */}
                <div className={`hidden lg:grid gap-6 ${showMap ? "grid-cols-2" : "grid-cols-1"}`}>
                  {/* Property List */}
                  <div className={`grid ${showMap ? "grid-cols-1" : "grid-cols-2 xl:grid-cols-3"} gap-6`}>
                    {filteredAndSortedProperties.map((property) => (
                      <div 
                        key={property.id}
                        onMouseEnter={() => setHoveredPropertyId(property.id)}
                        onMouseLeave={() => setHoveredPropertyId(null)}
                        className={`transition-all ${hoveredPropertyId === property.id ? "scale-105" : ""}`}
                      >
                        <PropertyCard
                          id={property.id}
                          image={property.images?.[0] || "/placeholder.svg"}
                          name={property.title}
                          location={property.location}
                          bedrooms={property.bedrooms}
                          bathrooms={property.bathrooms}
                          price={property.price_per_night}
                          rating={property.rating || 0}
                          reviews={property.review_count}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Map Panel */}
                  {showMap && (
                    <div className="sticky top-24 h-fit">
                      <PropertyMap 
                        properties={mapProperties} 
                        onPropertyHover={(id) => setHoveredPropertyId(id)}
                        hoveredPropertyId={hoveredPropertyId}
                      />
                    </div>
                  )}
                </div>

                {/* Mobile: Toggle between List and Map */}
                <div className="lg:hidden">
                  {!isMobileMapView ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        />
                      ))}
                    </div>
                  ) : (
                    <PropertyMap 
                      properties={mapProperties} 
                      onPropertyHover={(id) => setHoveredPropertyId(id)}
                      hoveredPropertyId={hoveredPropertyId}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      
    </AppLayout>
  );
};

export default SearchResults;
