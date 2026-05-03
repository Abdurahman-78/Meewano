// Amenities can be stored either as plain strings (legacy) or as
// { name, icon } objects (new — icon is an uploaded image URL).
// These helpers normalize both shapes so the rest of the app can rely on one format.

export type AmenityItem = { name: string; icon?: string };

export function normalizeAmenities(raw: any): AmenityItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((a) => {
      if (typeof a === "string") return { name: a, icon: undefined };
      if (a && typeof a === "object" && typeof a.name === "string") {
        return { name: a.name, icon: typeof a.icon === "string" ? a.icon : undefined };
      }
      return null;
    })
    .filter(Boolean) as AmenityItem[];
}

export const DEFAULT_AMENITIES: AmenityItem[] = [
  "WiFi", "Free Parking", "Pool", "Kitchen", "TV", "Air Conditioning",
  "Heating", "Washer", "Dryer", "Hot Tub", "Gym", "Garden",
].map((name) => ({ name }));
