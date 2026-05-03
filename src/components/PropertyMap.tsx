import { useState } from "react";
import { MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import kurdistanMap from "@/assets/kurdistan-map.png";

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

const PropertyMap = ({ properties, onPropertyHover, hoveredPropertyId }: PropertyMapProps) => {
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const navigate = useNavigate();

  // Distribute markers evenly across the map
  const getMarkerPosition = (index: number, total: number) => {
    // Create a grid-like distribution across the map
    const cols = Math.ceil(Math.sqrt(total));
    const rows = Math.ceil(total / cols);
    
    const col = index % cols;
    const row = Math.floor(index / cols);
    
    // Add some spacing from edges (15-85% range)
    const xSpacing = 70 / (cols + 1);
    const ySpacing = 70 / (rows + 1);
    
    const x = 15 + (col + 1) * xSpacing;
    const y = 15 + (row + 1) * ySpacing;
    
    // Add slight random offset for natural look (use index as seed for consistency)
    const randomX = ((index * 7) % 10 - 5) * 0.5;
    const randomY = ((index * 11) % 10 - 5) * 0.5;
    
    return { 
      x: Math.max(10, Math.min(90, x + randomX)), 
      y: Math.max(10, Math.min(90, y + randomY)) 
    };
  };

  if (properties.length === 0) {
    return (
      <div className="relative w-full h-[600px] rounded-lg overflow-hidden shadow-lg bg-muted flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No properties to display on map</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden shadow-lg">
      {/* Static Map Background */}
      <img 
        src={kurdistanMap} 
        alt="Kurdistan Region Map"
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Property Markers */}
      {properties.map((property, index) => {
        const { x, y } = getMarkerPosition(index, properties.length);
        const isHovered = hoveredMarker === property.id || hoveredPropertyId === property.id;
        
        return (
          <div
            key={property.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200"
            style={{ left: `${x}%`, top: `${y}%` }}
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
            {/* Price Marker */}
            <div
              className={`
                relative cursor-pointer transition-all duration-200
                ${isHovered ? 'scale-125 z-50' : 'scale-100 z-10'}
              `}
            >
              <div className="bg-background border-2 border-primary rounded-full px-3 py-1.5 shadow-lg hover:shadow-xl flex items-center gap-1">
                <MapPin className="w-3 h-3 text-primary fill-primary" />
                <span className="text-sm font-bold text-foreground whitespace-nowrap">
                  ${property.price}
                </span>
              </div>
              
              {/* Hover Popup */}
              {isHovered && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-card rounded-lg shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in duration-200">
                  <img 
                    src={property.image} 
                    alt={property.name}
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-3">
                    <h4 className="font-semibold text-sm text-foreground line-clamp-1">
                      {property.name}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {property.location}
                    </p>
                    <p className="text-sm font-bold text-primary mt-2">
                      ${property.price}/night
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PropertyMap;
