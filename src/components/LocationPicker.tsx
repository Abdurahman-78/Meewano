import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Search, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Fix default marker icons (Vite doesn't bundle leaflet's default assets correctly)
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationPickerProps {
  value?: { lat: number; lng: number } | null;
  onChange: (coords: { lat: number; lng: number }) => void;
  defaultCenter?: { lat: number; lng: number };
  height?: string;
}

const DEFAULT_CENTER = { lat: 36.1911, lng: 44.0093 }; // Erbil, Kurdistan

const ClickHandler = ({ onPick }: { onPick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const Recenter = ({ position }: { position: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(position, Math.max(map.getZoom(), 13));
  }, [position[0], position[1]]);
  return null;
};

const LocationPicker = ({ value, onChange, defaultCenter, height = "400px" }: LocationPickerProps) => {
  const initial = value || defaultCenter || DEFAULT_CENTER;
  const [pos, setPos] = useState<[number, number]>([initial.lat, initial.lng]);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const dragRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (value) setPos([value.lat, value.lng]);
  }, [value?.lat, value?.lng]);

  const handlePick = (lat: number, lng: number) => {
    setPos([lat, lng]);
    onChange({ lat, lng });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });
      const data = await res.json();
      if (data && data[0]) {
        handlePick(parseFloat(data[0].lat), parseFloat(data[0].lon));
      } else {
        toast.error("Location not found");
      }
    } catch {
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => handlePick(p.coords.latitude, p.coords.longitude),
      () => toast.error("Could not get your location")
    );
  };

  const center = useMemo<[number, number]>(() => pos, [pos]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search address or place (e.g., Erbil Citadel)"
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary" disabled={searching}>
            {searching ? "Searching..." : "Search"}
          </Button>
        </form>
        <Button type="button" variant="outline" onClick={useMyLocation}>
          <Crosshair className="h-4 w-4 mr-2" />
          My location
        </Button>
      </div>

      <div
        className="rounded-lg overflow-hidden border border-border"
        style={{ height }}
      >
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
          />
          <Recenter position={pos} />
          <ClickHandler onPick={handlePick} />
          <Marker
            position={pos}
            icon={markerIcon}
            draggable
            eventHandlers={{
              dragend: () => {
                const m = dragRef.current;
                if (m) {
                  const ll = m.getLatLng();
                  handlePick(ll.lat, ll.lng);
                }
              },
            }}
            ref={(r) => {
              dragRef.current = r;
            }}
          />
        </MapContainer>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4 text-primary" />
        <span>
          Selected: <span className="font-mono text-foreground">{pos[0].toFixed(6)}, {pos[1].toFixed(6)}</span>
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Click anywhere on the map, drag the pin, search an address, or use your current location.
      </p>
    </div>
  );
};

export default LocationPicker;
