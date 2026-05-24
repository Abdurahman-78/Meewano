import { useState, useRef } from "react";
import { Upload, Loader2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSiteSettings } from "@/hooks/useAdminData";
import LocationPicker from "@/components/LocationPicker";
import { optimizeImage } from "@/lib/imageOptimizer";
import { normalizeAmenities, DEFAULT_AMENITIES } from "@/lib/amenities";

const AddListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { data: siteSettings } = useSiteSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  });

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Normalize siteSettings to a key-value map safely
  const settingsMap: Record<string, any> = Array.isArray(siteSettings)
    ? siteSettings.reduce((acc: Record<string, any>, s: any) => { acc[s.key] = s.value; return acc; }, {})
    : siteSettings && typeof siteSettings === "object"
      ? (siteSettings as Record<string, any>)
      : {};

  const getSetting = (key: string, defaultValue: any) => {
    return settingsMap[key] ?? defaultValue;
  };

  const amenitiesList = normalizeAmenities(
    getSetting("amenities_list", DEFAULT_AMENITIES)
  );

  const locationsList = getSetting("locations_list", [
    { name: "Erbil", region: "Kurdistan" },
    { name: "Sulaymaniyah", region: "Kurdistan" },
    { name: "Duhok", region: "Kurdistan" },
    { name: "Zakho", region: "Kurdistan" },
    { name: "Ranya", region: "Kurdistan" },
    { name: "Haji Omran", region: "Kurdistan" },
    { name: "Shaqlawa", region: "Kurdistan" },
    { name: "Soran", region: "Kurdistan" },
    { name: "Halabja", region: "Kurdistan" },
    { name: "Koya", region: "Kurdistan" }
  ]) as { name: string; region: string }[];

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      amenities: checked 
        ? [...prev.amenities, amenity]
        : prev.amenities.filter(a => a !== amenity)
    }));
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (newFiles.length === 0) { toast.error("Please select image files"); return; }
    
    setImageFiles(prev => [...prev, ...newFiles]);
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreviews(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (!user || imageFiles.length === 0) return [];
    const urls: string[] = [];

    for (const original of imageFiles) {
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

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!user) { toast.error("Please log in to add a listing"); navigate("/auth"); return; }
    if (!formData.title || !formData.location || !formData.city || !formData.price_per_night) {
      toast.error("Please fill in all required fields"); return;
    }

    setLoading(true);
    try {
      setUploading(true);
      const imageUrls = await uploadImages();
      setUploading(false);

      const { error } = await supabase.from("properties").insert({
        host_id: user.id,
        title: formData.title,
        location: formData.location,
        city: formData.city,
        price_per_night: parseFloat(formData.price_per_night),
        bedrooms: parseInt(formData.bedrooms) || 1,
        bathrooms: parseInt(formData.bathrooms) || 1,
        max_guests: parseInt(formData.max_guests) || 2,
        description: formData.description,
        amenities: formData.amenities,
        is_active: !isDraft,
        images: imageUrls,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
      });

      if (error) throw error;
      toast.success(isDraft ? "Property saved as draft" : "Submitted for admin review");
      navigate("/host");
    } catch (error: any) {
      console.error("Error adding property:", error);
      toast.error(error.message || "Failed to add property");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <AppLayout>
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Add New Listing</h1>
            <p className="text-muted-foreground">Create a new property listing for guests to book</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="property-name">Property Name *</Label>
                  <Input 
                    id="property-name" 
                    placeholder="e.g., Modern Mountain Villa" 
                    className="mt-2"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Select 
                      value={formData.city} 
                      onValueChange={(value) => setFormData({ ...formData, city: value })}
                    >
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
                  <div>
                    <Label htmlFor="location">Address/Location *</Label>
                    <Input 
                      id="location" 
                      placeholder="e.g., Dream City, Street 10" 
                      className="mt-2"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="price">Price per Night (IQD) *</Label>
                  <Input 
                    id="price" 
                    type="number" 
                    placeholder="150" 
                    className="mt-2"
                    value={formData.price_per_night}
                    onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value })}
                  />
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
                  <Textarea 
                    id="description" 
                    placeholder="Describe your property, its features, and what makes it special..."
                    className="mt-2 min-h-[120px]"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              {/* Map Location Picker */}
              <div>
                <Label className="mb-3 block text-lg font-semibold">Pin Location on Map</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Set the exact spot where guests will find your property.
                </p>
                <LocationPicker
                  value={coords}
                  onChange={setCoords}
                  height="420px"
                />
              </div>

              {/* Amenities */}
              <div>
                <Label className="mb-3 block text-lg font-semibold">What This Place Offers</Label>
                <p className="text-sm text-muted-foreground mb-4">Select the amenities available at your property</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {amenitiesList.map((amenity) => (
                    <div key={amenity.name} className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <Checkbox
                        id={amenity.name}
                        checked={formData.amenities.includes(amenity.name)}
                        onCheckedChange={(checked) => handleAmenityChange(amenity.name, checked as boolean)}
                      />
                      {amenity.icon && (
                        <img src={amenity.icon} alt="" className="h-5 w-5 object-contain flex-shrink-0" />
                      )}
                      <Label htmlFor={amenity.name} className="text-sm font-normal cursor-pointer flex-1">
                        {amenity.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <Label className="mb-3 block">Property Images</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFilesSelected(e.target.files)}
                />
                <div 
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); handleFilesSelected(e.dataTransfer.files); }}
                >
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop images here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Recommended: High-quality images (min 1200x800px)
                  </p>
                </div>

                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group rounded-lg overflow-hidden aspect-video">
                        <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1 h-12"
                  onClick={() => handleSubmit(true)}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save as Draft
                </Button>
                <Button 
                  className="flex-1 bg-primary hover:bg-primary/90 h-12"
                  onClick={() => handleSubmit(false)}
                  disabled={loading}
                >
                  {(loading || uploading) ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {uploading ? "Uploading images..." : "Submit for Review"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </AppLayout>
  );
};

export default AddListing;
