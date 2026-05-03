import { useState, useEffect, useRef } from "react";
import { Upload, Loader2, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSiteSettings } from "@/hooks/useAdminData";
import LocationPicker from "@/components/LocationPicker";
import { optimizeImage } from "@/lib/imageOptimizer";
import { normalizeAmenities, DEFAULT_AMENITIES } from "@/lib/amenities";

const EditListing = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: siteSettings } = useSiteSettings();
  
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    city: "",
    price_per_night: "",
    bedrooms: "",
    bathrooms: "",
    max_guests: "",
    description: "",
    amenities: [] as string[],
    is_active: true,
  });

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Normalize siteSettings safely
  const settingsMap: Record<string, any> = Array.isArray(siteSettings)
    ? siteSettings.reduce((acc: Record<string, any>, s: any) => { acc[s.key] = s.value; return acc; }, {})
    : siteSettings && typeof siteSettings === "object"
      ? (siteSettings as Record<string, any>)
      : {};

  const getSetting = (key: string, defaultValue: any) => settingsMap[key] ?? defaultValue;

  const amenitiesList = normalizeAmenities(
    getSetting("amenities_list", DEFAULT_AMENITIES)
  );

  const locationsList = getSetting("locations_list", [
    { name: "Erbil", region: "Kurdistan" }, { name: "Sulaymaniyah", region: "Kurdistan" },
    { name: "Duhok", region: "Kurdistan" }, { name: "Zakho", region: "Kurdistan" },
    { name: "Ranya", region: "Kurdistan" }, { name: "Haji Omran", region: "Kurdistan" },
    { name: "Shaqlawa", region: "Kurdistan" }, { name: "Soran", region: "Kurdistan" },
    { name: "Halabja", region: "Kurdistan" }, { name: "Koya", region: "Kurdistan" }
  ]) as { name: string; region: string }[];

  useEffect(() => {
    if (id && user) fetchProperty();
  }, [id, user]);

  const fetchProperty = async () => {
    try {
      const { data, error } = await supabase
        .from("properties").select("*").eq("id", id).eq("host_id", user?.id).single();
      if (error) throw error;

      setFormData({
        title: data.title || "", location: data.location || "", city: data.city || "",
        price_per_night: data.price_per_night?.toString() || "",
        bedrooms: data.bedrooms?.toString() || "", bathrooms: data.bathrooms?.toString() || "",
        max_guests: data.max_guests?.toString() || "", description: data.description || "",
        amenities: data.amenities || [], is_active: data.is_active ?? true,
      });
      setExistingImages(data.images || []);
      if (data.latitude != null && data.longitude != null) {
        setCoords({ lat: Number(data.latitude), lng: Number(data.longitude) });
      }
      if (data.blocked_dates) setBlockedDates(data.blocked_dates.map((d: string) => new Date(d)));
    } catch (error: any) {
      console.error("Error fetching property:", error);
      toast.error("Property not found or access denied");
      navigate("/host");
    } finally {
      setLoading(false);
    }
  };

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      amenities: checked ? [...prev.amenities, amenity] : prev.amenities.filter(a => a !== amenity)
    }));
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (newFiles.length === 0) { toast.error("Please select image files"); return; }
    setNewImageFiles(prev => [...prev, ...newFiles]);
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setNewImagePreviews(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadNewImages = async (): Promise<string[]> => {
    if (!user || newImageFiles.length === 0) return [];
    const urls: string[] = [];
    for (const original of newImageFiles) {
      const file = await optimizeImage(original);
      const ext = (file.name.split(".").pop() || "webp").toLowerCase();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from("property-images")
        .upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
      urls.push(urlData.publicUrl);
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!user || !id) return;
    if (!formData.title || !formData.location || !formData.city || !formData.price_per_night) {
      toast.error("Please fill in all required fields"); return;
    }

    setSaving(true);
    try {
      setUploading(true);
      const uploadedUrls = await uploadNewImages();
      setUploading(false);
      const allImages = [...existingImages, ...uploadedUrls];

      const { error } = await supabase.from("properties").update({
        title: formData.title, location: formData.location, city: formData.city,
        price_per_night: parseFloat(formData.price_per_night),
        bedrooms: parseInt(formData.bedrooms) || 1, bathrooms: parseInt(formData.bathrooms) || 1,
        max_guests: parseInt(formData.max_guests) || 2, description: formData.description,
        amenities: formData.amenities, is_active: formData.is_active,
        blocked_dates: blockedDates.map(d => d.toISOString().split('T')[0]),
        images: allImages,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
      }).eq("id", id).eq("host_id", user.id);

      if (error) throw error;
      toast.success("Property updated successfully");
      navigate("/host");
    } catch (error: any) {
      console.error("Error updating property:", error);
      toast.error(error.message || "Failed to update property");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Edit Listing</h1>
            <p className="text-muted-foreground">Update your property details</p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="property-name">Property Name *</Label>
                    <Input id="property-name" placeholder="e.g., Modern Mountain Villa" className="mt-2"
                      value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location">Address/Location *</Label>
                      <Input id="location" placeholder="e.g., Mountain View Road, Ranya" className="mt-2"
                        value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Select value={formData.city} onValueChange={(value) => setFormData({ ...formData, city: value })}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select a city" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border border-border z-50">
                          {locationsList.map((loc) => (
                            <SelectItem key={loc.name} value={loc.name}>
                              {loc.name} ({loc.region})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="price">Price per Night (USD) *</Label>
                    <Input id="price" type="number" placeholder="150" className="mt-2"
                      value={formData.price_per_night} onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value })} />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="bedrooms">Bedrooms</Label>
                      <Input id="bedrooms" type="number" placeholder="3" className="mt-2" value={formData.bedrooms}
                        onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="bathrooms">Bathrooms</Label>
                      <Input id="bathrooms" type="number" placeholder="2" className="mt-2" value={formData.bathrooms}
                        onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })} />
                    </div>
                    <div>
                      <Label htmlFor="guests">Max Guests</Label>
                      <Input id="guests" type="number" placeholder="4" className="mt-2" value={formData.max_guests}
                        onChange={(e) => setFormData({ ...formData, max_guests: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" placeholder="Describe your property..." className="mt-2 min-h-[120px]"
                      value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="flex items-center gap-3">
                  <Checkbox id="is_active" checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })} />
                  <Label htmlFor="is_active" className="cursor-pointer">Property is active and visible to guests</Label>
                </div>

                {/* Amenities */}
                <div>
                  <Label className="mb-3 block text-lg font-semibold">What This Place Offers</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {amenitiesList.map((amenity) => (
                      <div key={amenity.name} className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <Checkbox id={`edit-${amenity.name}`} checked={formData.amenities.includes(amenity.name)}
                          onCheckedChange={(checked) => handleAmenityChange(amenity.name, checked as boolean)} />
                        {amenity.icon && (
                          <img src={amenity.icon} alt="" className="h-5 w-5 object-contain flex-shrink-0" />
                        )}
                        <Label htmlFor={`edit-${amenity.name}`} className="text-sm font-normal cursor-pointer flex-1">{amenity.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Map Location Picker */}
                <div>
                  <Label className="mb-3 block text-lg font-semibold">Pin Location on Map</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag the pin or click on the map to set the exact spot guests will see.
                  </p>
                  <LocationPicker value={coords} onChange={setCoords} height="420px" />
                </div>

                {/* Image Management */}
                <div>
                  <Label className="mb-3 block text-lg font-semibold">Property Images</Label>
                  
                  {existingImages.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2">Current images</p>
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                        {existingImages.map((url, index) => (
                          <div key={index} className="relative group rounded-lg overflow-hidden aspect-video">
                            <img src={url} alt={`Property ${index + 1}`} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeExistingImage(index)}
                              className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={(e) => handleFilesSelected(e.target.files)} />
                  <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); handleFilesSelected(e.dataTransfer.files); }}>
                    <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click or drag to add more images</p>
                  </div>

                  {newImagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                      {newImagePreviews.map((preview, index) => (
                        <div key={index} className="relative group rounded-lg overflow-hidden aspect-video">
                          <img src={preview} alt={`New ${index + 1}`} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeNewImage(index)}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Availability Calendar */}
            <Card>
              <CardHeader>
                <CardTitle>Availability Calendar</CardTitle>
                <p className="text-sm text-muted-foreground">Click on dates to block/unblock them</p>
              </CardHeader>
              <CardContent>
                <Calendar mode="multiple" selected={blockedDates}
                  onSelect={(dates) => setBlockedDates(dates || [])}
                  numberOfMonths={2} className="rounded-md border p-3 pointer-events-auto"
                  disabled={(date) => date < new Date()} />
                <p className="text-sm text-muted-foreground mt-2">
                  Selected dates ({blockedDates.length}) will be blocked for bookings
                </p>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-12" onClick={() => navigate("/host")}>Cancel</Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90 h-12" onClick={handleSubmit} disabled={saving}>
                {(saving || uploading) ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {uploading ? "Uploading images..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
};

export default EditListing;
