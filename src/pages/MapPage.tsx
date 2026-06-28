import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useProperties } from "@/hooks/useProperties";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useCurrency } from "@/contexts/CurrencyContext";
import { MapPin, Loader2, Home, Search, SlidersHorizontal, X, BedDouble, Bath, Users } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { createPricePillIcon } from "@/lib/mapMarkers";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  Erbil: { lat: 36.191, lng: 44.009 },
  Sulaymaniyah: { lat: 35.556, lng: 45.435 },
  Duhok: { lat: 36.867, lng: 42.951 },
  Ranya: { lat: 36.253, lng: 44.884 },
  "Haji Omran": { lat: 36.757, lng: 44.823 },
  Halabja: { lat: 35.177, lng: 45.987 },
};

const getStableMarkerOffset = (seed: string) => {
  const hashOffset = (value: string) => {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
      hash = (hash * 31 + value.charCodeAt(i)) | 0;
    }
    return ((Math.abs(hash) % 1000) / 1000 - 0.5) * 0.02;
  };
  return { lat: hashOffset(`${seed}:lat`), lng: hashOffset(`${seed}:lng`) };
};

const MapUpdater = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1 });
  }, [center, zoom, map]);
  return null;
};

const BoundsTracker = ({ onChange }: { onChange: (b: L.LatLngBounds) => void }) => {
  const map = useMapEvents({
    moveend: () => onChange(map.getBounds()),
    zoomend: () => onChange(map.getBounds()),
  });
  useEffect(() => {
    onChange(map.getBounds());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};

const fmtIQD = (n: number) => n.toLocaleString("en-US");

const MapPage = () => {
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [bedrooms, setBedrooms] = useState<string>("any");
  const [bathrooms, setBathrooms] = useState<string>("any");
  const [guests, setGuests] = useState<string>("any");
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();

  const { data: properties, isLoading } = useProperties();
  const { data: settings } = useSiteSettings();

  const locations = (settings?.locations as string[]) || ["Ranya", "Haji Omran", "Erbil", "Sulaymaniyah", "Duhok"];
  const cities = ["all", ...locations];

  const activeProperties = useMemo(
    () => (properties || []).filter((p) => p.is_active),
    [properties]
  );

  const filteredProperties = useMemo(() => {
    return activeProperties.filter((p) => {
      if (selectedCity !== "all") {
        const matchCity =
          p.city.toLowerCase().includes(selectedCity.toLowerCase()) ||
          p.location.toLowerCase().includes(selectedCity.toLowerCase());
        if (!matchCity) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !p.title.toLowerCase().includes(q) &&
          !p.location.toLowerCase().includes(q) &&
          !p.city.toLowerCase().includes(q)
        )
          return false;
      }
      const min = Number(minPrice.replace(/,/g, "")) || 0;
      const max = Number(maxPrice.replace(/,/g, "")) || Infinity;
      if (p.price_per_night < min || p.price_per_night > max) return false;
      if (bedrooms !== "any" && p.bedrooms < Number(bedrooms)) return false;
      if (bathrooms !== "any" && p.bathrooms < Number(bathrooms)) return false;
      if (guests !== "any" && p.max_guests < Number(guests)) return false;
      return true;
    });
  }, [activeProperties, selectedCity, searchQuery, minPrice, maxPrice, bedrooms, bathrooms, guests]);

  const { center, zoom } = useMemo(() => {
    if (selectedCity !== "all") {
      const coords = cityCoordinates[selectedCity];
      if (coords) return { center: [coords.lat, coords.lng] as [number, number], zoom: 12 };
    }
    return { center: [36.2, 44.5] as [number, number], zoom: 8 };
  }, [selectedCity]);

  const visibleProperties = useMemo(() => {
    if (!mapBounds) return filteredProperties;
    return filteredProperties.filter((p) => {
      const lat = p.latitude || cityCoordinates[p.city]?.lat;
      const lng = p.longitude || cityCoordinates[p.city]?.lng;
      if (!lat || !lng) return false;
      const offset = getStableMarkerOffset(p.id);
      const oLat = p.latitude ? 0 : offset.lat;
      const oLng = p.longitude ? 0 : offset.lng;
      return mapBounds.contains([lat + oLat, lng + oLng]);
    });
  }, [filteredProperties, mapBounds]);

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const markerRefs = useRef<Record<string, L.Marker | null>>({});
  const listRef = useRef<HTMLDivElement | null>(null);
  const hoverSourceRef = useRef<"marker" | "card" | null>(null);

  useEffect(() => {
    if (!hoveredPropertyId || hoverSourceRef.current !== "marker") return;
    const node = cardRefs.current[hoveredPropertyId];
    const container = listRef.current;
    if (!node || !container) return;
    const nodeRect = node.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    if (nodeRect.top < containerRect.top || nodeRect.bottom > containerRect.bottom) {
      node.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [hoveredPropertyId]);

  const pricePillIcons = useMemo(() => {
    return Object.fromEntries(
      filteredProperties.map((property) => [
        property.id,
        createPricePillIcon({
          price: formatPrice(property.price_per_night),
          title: property.title,
          subtitle: "per night",
          ariaLabel: `${property.title}, ${formatPrice(property.price_per_night)} per night`,
        }),
      ])
    );
  }, [filteredProperties, formatPrice]);

  useEffect(() => {
    Object.entries(markerRefs.current).forEach(([propertyId, marker]) => {
      marker?.getElement()?.classList.toggle("is-hovered", propertyId === hoveredPropertyId);
    });
  }, [hoveredPropertyId]);

  const activeFilterCount = [
    selectedCity !== "all",
    !!minPrice,
    !!maxPrice,
    bedrooms !== "any",
    bathrooms !== "any",
    guests !== "any",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedCity("all");
    setMinPrice("");
    setMaxPrice("");
    setBedrooms("any");
    setBathrooms("any");
    setGuests("any");
  };

  const handlePriceChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    setter(raw ? Number(raw).toLocaleString("en-US") : "");
  };

  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Explore Properties on Map</h1>
          <p className="text-sm text-muted-foreground">Find properties across Kurdistan Region</p>
        </div>

        {/* Search + Filter bar */}
        <div className="mb-6 flex flex-col md:flex-row gap-3 items-stretch">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, city, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 rounded-xl"
            />
          </div>

          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className="md:w-44 h-11 rounded-xl">
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-[1000]">
              {cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city === "all" ? "All Cities" : city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-11 rounded-xl gap-2 relative">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="ml-1 h-5 min-w-5 px-1.5 rounded-full">{activeFilterCount}</Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 z-[1000] p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Filters</h4>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <X className="h-3 w-3" /> Clear all
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Price per night (IQD)</label>
                <div className="flex gap-2">
                  <Input
                    inputMode="numeric"
                    placeholder="Min"
                    value={minPrice}
                    onChange={handlePriceChange(setMinPrice)}
                    className="h-9"
                  />
                  <Input
                    inputMode="numeric"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={handlePriceChange(setMaxPrice)}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <BedDouble className="h-3 w-3" /> Beds
                  </label>
                  <Select value={bedrooms} onValueChange={setBedrooms}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[1100]">
                      <SelectItem value="any">Any</SelectItem>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}+</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Bath className="h-3 w-3" /> Baths
                  </label>
                  <Select value={bathrooms} onValueChange={setBathrooms}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[1100]">
                      <SelectItem value="any">Any</SelectItem>
                      {[1, 2, 3, 4].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}+</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" /> Guests
                  </label>
                  <Select value={guests} onValueChange={setGuests}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[1100]">
                      <SelectItem value="any">Any</SelectItem>
                      {[1, 2, 3, 4, 6, 8].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}+</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {selectedCity !== "all" && (
              <Badge variant="secondary" className="gap-1 pr-1">
                {selectedCity}
                <button onClick={() => setSelectedCity("all")} className="ml-1 hover:bg-background/50 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {(minPrice || maxPrice) && (
              <Badge variant="secondary" className="gap-1 pr-1">
                {minPrice || "0"} – {maxPrice || "∞"} IQD
                <button onClick={() => { setMinPrice(""); setMaxPrice(""); }} className="ml-1 hover:bg-background/50 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {bedrooms !== "any" && (
              <Badge variant="secondary" className="gap-1 pr-1">
                {bedrooms}+ beds
                <button onClick={() => setBedrooms("any")} className="ml-1 hover:bg-background/50 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {bathrooms !== "any" && (
              <Badge variant="secondary" className="gap-1 pr-1">
                {bathrooms}+ baths
                <button onClick={() => setBathrooms("any")} className="ml-1 hover:bg-background/50 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {guests !== "any" && (
              <Badge variant="secondary" className="gap-1 pr-1">
                {guests}+ guests
                <button onClick={() => setGuests("any")} className="ml-1 hover:bg-background/50 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="overflow-hidden rounded-2xl shadow-sm">
                <CardContent className="p-0">
                  <div className="w-full h-[60vh] lg:h-[680px] relative">
                    <div className="absolute top-4 right-4 z-[400] bg-background/95 backdrop-blur px-3 py-1.5 rounded-full shadow-md text-sm font-medium border">
                      {filteredProperties.length} {filteredProperties.length === 1 ? "property" : "properties"}
                    </div>
                    <MapContainer center={center} zoom={zoom} className="w-full h-full z-0" scrollWheelZoom={true}>
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <MapUpdater center={center} zoom={zoom} />
                      <BoundsTracker onChange={setMapBounds} />

                      {filteredProperties.map((property) => {
                        const lat = property.latitude || cityCoordinates[property.city]?.lat;
                        const lng = property.longitude || cityCoordinates[property.city]?.lng;
                        if (!lat || !lng) return null;
                        const cityOffset = getStableMarkerOffset(property.id);
                        const offsetLat = property.latitude ? 0 : cityOffset.lat;
                        const offsetLng = property.longitude ? 0 : cityOffset.lng;

                        return (
                          <Marker
                            key={property.id}
                            position={[lat + offsetLat, lng + offsetLng]}
                            ref={(marker) => { markerRefs.current[property.id] = marker; }}
                            icon={pricePillIcons[property.id]}
                            eventHandlers={{
                              mouseover: () => {
                                hoverSourceRef.current = "marker";
                                setHoveredPropertyId(property.id);
                              },
                              mouseout: () => {
                                setHoveredPropertyId(null);
                                hoverSourceRef.current = null;
                              },
                              click: () => navigate(`/property/${property.id}`),
                            }}
                          >
                            <Popup>
                              <div className="w-48">
                                <img
                                  src={property.images?.[0] || "/placeholder.svg"}
                                  alt={property.title}
                                  className="w-full h-28 object-cover rounded-t"
                                />
                                <div className="p-2">
                                  <h4 className="font-semibold text-sm line-clamp-1">{property.title}</h4>
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">{property.location}</p>
                                  <p className="text-sm font-bold mt-1">{formatPrice(property.price_per_night)}/night</p>
                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        );
                      })}
                    </MapContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-24 rounded-2xl shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Results</h3>
                    <span className="text-xs text-muted-foreground">{visibleProperties.length} in view</span>
                  </div>

                  <div ref={listRef} className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                    {visibleProperties.length === 0 ? (
                      <div className="text-center py-12">
                        <Home className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm font-medium">No properties in view</p>
                        <p className="text-xs text-muted-foreground mt-1">Zoom out or pan the map to see more</p>
                        {activeFilterCount > 0 && (
                          <Button variant="outline" size="sm" onClick={clearFilters} className="mt-3">
                            Clear filters
                          </Button>
                        )}
                      </div>
                    ) : (
                      visibleProperties.map((property) => {
                        const isActive = hoveredPropertyId === property.id;
                        return (
                          <div
                            key={property.id}
                            ref={(el) => { cardRefs.current[property.id] = el; }}
                            onClick={() => navigate(`/property/${property.id}`)}
                            onMouseEnter={() => {
                              hoverSourceRef.current = "card";
                              setHoveredPropertyId(property.id);
                            }}
                            onMouseLeave={() => {
                              setHoveredPropertyId(null);
                              hoverSourceRef.current = null;
                            }}
                            data-active={isActive}
                            className={`group relative p-3 rounded-xl border cursor-pointer overflow-hidden
                              transition-[transform,box-shadow,border-color,background-color] duration-300 ease-out
                              ${
                                isActive
                                  ? "border-primary bg-primary/5 shadow-md shadow-primary/10 ring-1 ring-primary/30"
                                  : "border-border hover:border-primary/60 hover:shadow-sm hover:bg-accent/30"
                              }`}
                          >
                            <div className="flex gap-3">
                              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                                <img
                                  src={property.images?.[0] || "/placeholder.svg"}
                                  alt={property.title}
                                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm line-clamp-1 transition-colors group-hover:text-primary">
                                  {property.title}
                                </h4>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 line-clamp-1">
                                  <MapPin className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{property.location}</span>
                                </p>
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                                  <span className="flex items-center gap-0.5"><BedDouble className="w-3 h-3" />{property.bedrooms}</span>
                                  <span className="flex items-center gap-0.5"><Bath className="w-3 h-3" />{property.bathrooms}</span>
                                  <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />{property.max_guests}</span>
                                </div>
                                <p className="text-sm font-bold text-primary mt-1">
                                  {formatPrice(property.price_per_night)}
                                  <span className="text-xs font-normal text-muted-foreground">/night</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </AppLayout>
  );
};

export default MapPage;
