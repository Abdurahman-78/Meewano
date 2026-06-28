// Amenities can be stored either as plain strings (legacy) or as
// { name, icon, category } objects (new). These helpers normalize both shapes.

export type AmenityItem = { name: string; icon?: string; category?: string };

export const AMENITY_CATEGORIES = [
  "Bathroom",
  "Bedroom & Laundry",
  "Entertainment",
  "Heating & Cooling",
  "Internet & Office",
  "Kitchen & Dining",
  "Outdoor",
  "Parking & Facilities",
  "Safety",
  "Other",
] as const;

export function normalizeAmenities(raw: any): AmenityItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((a) => {
      if (typeof a === "string") return { name: a };
      if (a && typeof a === "object" && typeof a.name === "string") {
        return {
          name: a.name,
          icon: typeof a.icon === "string" ? a.icon : undefined,
          category: typeof a.category === "string" ? a.category : undefined,
        };
      }
      return null;
    })
    .filter(Boolean) as AmenityItem[];
}

export const DEFAULT_AMENITIES: AmenityItem[] = [
  { name: "WiFi", category: "Internet & Office" },
  { name: "Free Parking", category: "Parking & Facilities" },
  { name: "Pool", category: "Parking & Facilities" },
  { name: "Kitchen", category: "Kitchen & Dining" },
  { name: "TV", category: "Entertainment" },
  { name: "Air Conditioning", category: "Heating & Cooling" },
  { name: "Heating", category: "Heating & Cooling" },
  { name: "Washer", category: "Bedroom & Laundry" },
  { name: "Dryer", category: "Bedroom & Laundry" },
  { name: "Hot Tub", category: "Kitchen & Dining" },
  { name: "Gym", category: "Parking & Facilities" },
  { name: "Garden", category: "Outdoor" },
];
