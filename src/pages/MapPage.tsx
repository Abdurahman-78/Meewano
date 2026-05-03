import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProperties } from "@/hooks/useProperties";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useCurrency } from "@/contexts/CurrencyContext";
import { MapPin, Loader2, Home } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { createPricePillIcon } from "@/lib/mapMarkers";

// Fix default marker icon issue with webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Price pill marker is provided by createPricePillIcon from
// @/lib/mapMarkers. Visual styling lives in src/index.css.

// City coordinates for Kurdistan Region
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

  return {
    lat: hashOffset(`${seed}:lat`),
    lng: hashOffset(`${seed}:lng`),
  };
};

// Recenter map when city filter changes
const MapUpdater = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1 });
  }, [center, zoom, map]);
  return null;
};

const MapPage = () => {
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();

  const { data: properties, isLoading } = useProperties();
  const { data: settings } = useSiteSettings();

  const locations = (settings?.locations as string[]) || ["Ranya", "Haji Omran", "Erbil", "Sulaymaniyah", "Duhok"];
  const cities = ["all", ...locations];

  const filteredProperties = useMemo(() => {
    if (!properties) return [];
    if (selectedCity === "all") return properties;
    return properties.filter(
      (p) =>
        p.city.toLowerCase().includes(selectedCity.toLowerCase()) ||
        p.location.toLowerCase().includes(selectedCity.toLowerCase())
    );
  }, [properties, selectedCity]);

  // Determine map center & zoom based on selected city
  const { center, zoom } = useMemo(() => {
    if (selectedCity !== "all") {
      const coords = cityCoordinates[selectedCity];
      if (coords) return { center: [coords.lat, coords.lng] as [number, number], zoom: 12 };
    }
    // Default: center of Kurdistan Region
    return { center: [36.2, 44.5] as [number, number], zoom: 8 };
  }, [selectedCity]);

  // Refs for syncing the highlighted sidebar card into view when a marker is hovered.
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const markerRefs = useRef<Record<string, L.Marker | null>>({});
  const listRef = useRef<HTMLDivElement | null>(null);
  // Track where the hover originated so we only auto-scroll for marker hovers
  // (scrolling on card hover would fight the user's own pointer).
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

  return (
    <AppLayout>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Explore Properties on Map</h1>
          <p className="text-muted-foreground">Find properties across Kurdistan Region</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Section */}
            <div className="lg:col-span-2">
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="w-full h-[600px]">
                    <MapContainer
                      center={center}
                      zoom={zoom}
                      className="w-full h-full z-0"
                      scrollWheelZoom={true}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <MapUpdater center={center} zoom={zoom} />

                      {filteredProperties.map((property) => {
                        const lat = property.latitude || cityCoordinates[property.city]?.lat;
                        const lng = property.longitude || cityCoordinates[property.city]?.lng;
                        if (!lat || !lng) return null;

                        // Add a stable small offset if using city coords (so markers don't overlap)
                        // without jumping to new positions on hover/state updates.
                        const cityOffset = getStableMarkerOffset(property.id);
                        const offsetLat = property.latitude ? 0 : cityOffset.lat;
                        const offsetLng = property.longitude ? 0 : cityOffset.lng;

                        return (
                          <Marker
                            key={property.id}
                            position={[lat + offsetLat, lng + offsetLng]}
                            ref={(marker) => {
                              markerRefs.current[property.id] = marker;
                            }}
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

            {/* Sidebar - Property List */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Properties ({filteredProperties.length})</h3>
                    <Select value={selectedCity} onValueChange={setSelectedCity}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border border-border z-[1000]">
                        {cities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city === "all" ? "All Cities" : city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div ref={listRef} className="space-y-3 max-h-[500px] overflow-y-auto">
                    {filteredProperties.length === 0 ? (
                      <div className="text-center py-8">
                        <Home className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">No properties found</p>
                      </div>
                    ) : (
                      filteredProperties.map((property) => {
                        const isActive = hoveredPropertyId === property.id;
                        return (
                          <div
                            key={property.id}
                            ref={(el) => {
                              cardRefs.current[property.id] = el;
                            }}
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
                              hover:-translate-y-0.5
                              ${
                                isActive
                                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 ring-1 ring-primary/30 -translate-y-0.5"
                                  : "border-border hover:border-primary/60 hover:shadow-md hover:bg-accent/30"
                              }`}
                          >
                            <div className="flex gap-3">
                              <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
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
