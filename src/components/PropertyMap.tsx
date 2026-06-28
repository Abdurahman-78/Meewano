import { useState } from "react";
import { MapPin, Locate } from "lucide-react";
import { useNavigate } from "react-router-dom";
import kurdistanMap from "@/assets/kurdistan-map.png";
import { useCurrency } from "@/contexts/CurrencyContext";

interface MapProperty {
  id: string;
  name: string;
  location: string;
  price: number;
  image: string;
  latitude?: number;
  longitude?: number;
}

interface PropertyMapProps {
  properties: MapProperty[];
  onPropertyHover?: (propertyId: string | null) => void;
  hoveredPropertyId?: string | null;
}

const compactPrice = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 100_000 ? 0 : 1)}K`;
  return `${Math.round(n)}`;
};

const PropertyMap = ({ properties, onPropertyHover, hoveredPropertyId }: PropertyMapProps) => {
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const navigate = useNavigate();
  const { convertPrice, currency } = useCurrency();

  // Distribute markers evenly across the map
  const getMarkerPosition = (index: number, total: number) => {
    const cols = Math.ceil(Math.sqrt(total));
    const rows = Math.ceil(total / cols);
    const col = index % cols;
    const row = Math.floor(index / cols);
    const xSpacing = 70 / (cols + 1);
    const ySpacing = 70 / (rows + 1);
    const x = 15 + (col + 1) * xSpacing;
    const y = 15 + (row + 1) * ySpacing;
    const randomX = ((index * 7) % 10 - 5) * 0.5;
    const randomY = ((index * 11) % 10 - 5) * 0.5;
    return {
      x: Math.max(10, Math.min(90, x + randomX)),
      y: Math.max(10, Math.min(90, y + randomY)),
    };
  };

  if (properties.length === 0) {
    return (
      <div className="relative w-full h-[640px] rounded-2xl overflow-hidden border border-border bg-muted flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No properties to display on map</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[640px] rounded-2xl overflow-hidden border border-border shadow-2xl bg-card">
      {/* Map background */}
      <img
        src={kurdistanMap}
        alt="Kurdistan Region Map"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Subtle dotted overlay for premium feel */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.18] mix-blend-multiply"
        style={{
          backgroundImage:
            "radial-gradient(hsl(var(--foreground)) 0.6px, transparent 0.6px)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* Header overlay (count + region) */}
      <div className="absolute top-4 left-4 z-20">
        <div className="bg-card/95 backdrop-blur-md border border-border shadow-lg rounded-xl px-4 py-2.5">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-foreground tabular-nums">
              {properties.length}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {properties.length === 1 ? "property" : "properties"} on map
            </span>
          </div>
        </div>
      </div>

      {/* Legend overlay */}
      <div className="absolute bottom-4 left-4 z-20">
        <div className="bg-card/95 backdrop-blur-md border border-border shadow-lg rounded-xl px-3 py-2 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-primary/20" />
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              Selected
            </span>
          </div>
          <div className="w-px h-3 bg-border" />
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-card border border-border" />
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              Available
            </span>
          </div>
        </div>
      </div>

      {/* Locate control */}
      <div className="absolute top-4 right-4 z-20">
        <button
          type="button"
          className="h-10 w-10 inline-flex items-center justify-center bg-card/95 backdrop-blur-md border border-border shadow-lg rounded-xl text-foreground hover:bg-accent transition-colors"
          aria-label="Recenter map"
        >
          <Locate className="h-4 w-4" />
        </button>
      </div>

      {/* Markers */}
      {properties.map((property, index) => {
        const { x, y } = getMarkerPosition(index, properties.length);
        const isHovered = hoveredMarker === property.id || hoveredPropertyId === property.id;
        const iqd = convertPrice(property.price);
        const label = `${compactPrice(iqd)} ${currency}`;

        return (
          <div
            key={property.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%`, zIndex: isHovered ? 50 : 10 }}
            onMouseEnter={() => {
              setHoveredMarker(property.id);
              onPropertyHover?.(property.id);
            }}
            onMouseLeave={() => {
              setHoveredMarker(null);
              onPropertyHover?.(null);
            }}
            onClick={() => navigate(`/property/${property.id}`)}
          >
            <div
              className={`relative cursor-pointer transition-all duration-200 ${
                isHovered ? "scale-110" : "scale-100"
              }`}
            >
              {/* Price pill */}
              <div
                className={`relative flex items-center gap-1 px-3 py-1.5 rounded-full whitespace-nowrap border-2 border-card shadow-lg transition-colors ${
                  isHovered
                    ? "bg-primary text-primary-foreground shadow-primary/30"
                    : "bg-card text-foreground hover:bg-accent"
                }`}
              >
                <MapPin className={`w-3 h-3 ${isHovered ? "fill-primary-foreground" : "fill-primary text-primary"}`} />
                <span className="text-xs font-bold tabular-nums">{label}</span>
              </div>
              {/* Tail */}
              <span
                className={`absolute left-1/2 -translate-x-1/2 -bottom-1 w-2.5 h-2.5 rotate-45 border-r-2 border-b-2 border-card ${
                  isHovered ? "bg-primary" : "bg-card"
                }`}
              />

              {/* Hover popup card */}
              {isHovered && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-52 bg-card rounded-xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in duration-200">
                  <img
                    src={property.image}
                    alt={property.name}
                    className="w-full h-28 object-cover"
                  />
                  <div className="p-3">
                    <h4 className="font-semibold text-sm text-foreground line-clamp-1">
                      {property.name}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {property.location}
                    </p>
                    <p className="text-sm font-bold text-primary mt-2 tabular-nums">
                      {iqd.toLocaleString()} {currency}
                      <span className="text-[10px] font-medium text-muted-foreground ml-1">
                        /night
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Attribution */}
      <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-card/70 backdrop-blur border border-border text-[9px] text-muted-foreground rounded uppercase tracking-tight">
        Kurdistan Region
      </div>
    </div>
  );
};

export default PropertyMap;
