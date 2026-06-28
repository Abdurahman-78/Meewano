import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { createPricePillIcon } from "@/lib/mapMarkers";
import { useMemo } from "react";

interface PropertyLocationMapProps {
  lat: number;
  lng: number;
  title: string;
  location: string;
  price?: string;
  image?: string;
}

const PropertyLocationMap = ({ lat, lng, title, location, price, image }: PropertyLocationMapProps) => {
  const icon = useMemo(
    () =>
      createPricePillIcon({
        price: price || "",
        title,
        subtitle: "per night",
        ariaLabel: `${title}${price ? `, ${price} per night` : ""}`,
      }),
    [price, title]
  );

  return (
    <div className="w-full h-[280px] md:h-[400px] relative rounded-2xl overflow-hidden">
      <div className="absolute top-4 right-4 z-[400] bg-background/95 backdrop-blur px-3 py-1.5 rounded-full shadow-md text-sm font-medium border">
        {location}
      </div>
      <MapContainer
        center={[lat, lng]}
        zoom={14}
        scrollWheelZoom={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={icon}>
          <Popup>
            <div className="w-48">
              {image && (
                <img src={image} alt={title} className="w-full h-28 object-cover rounded-t" />
              )}
              <div className="p-2">
                <h4 className="font-semibold text-sm line-clamp-1">{title}</h4>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{location}</p>
                {price && <p className="text-sm font-bold mt-1">{price}/night</p>}
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default PropertyLocationMap;
