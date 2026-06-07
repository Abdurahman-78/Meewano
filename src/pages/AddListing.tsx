import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Upload, Loader2, X, FileCheck2, CheckCircle2 } from "lucide-react";
import ListingStepIndicator from "@/components/ListingStepIndicator";
import { useNavigate } from "react-router-dom";
import type { DateRange } from "react-day-picker";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSiteSettings } from "@/hooks/useAdminData";
import LocationPicker from "@/components/LocationPicker";
import { optimizeImage } from "@/lib/imageOptimizer";
import { normalizeAmenities, DEFAULT_AMENITIES } from "@/lib/amenities";

const formatDateRange = (range?: DateRange) => {
  if (!range?.from) return "Select date range";
  if (!range.to) return format(range.from, "MMM dd, yyyy");
  return `${format(range.from, "MMM dd, yyyy")} - ${format(range.to, "MMM dd, yyyy")}`;
};

const toDateString = (date: Date) => format(date, "yyyy-MM-dd");

const getDatesInRange = (range?: DateRange) => {
  if (!range?.from) return [];
  const end = range.to ?? range.from;
  const dates: string[] = [];
  for (const date = new Date(range.from); date <= end; date.setDate(date.getDate() + 1)) {
    dates.push(toDateString(date));
  }
  return dates;
};

const draftKey = (uid?: string) => `meewano:add-listing-draft:${uid ?? "anon"}:v1`;

const AddListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const { data: siteSettings } = useSiteSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const meta = (user?.user_metadata ?? {}) as Record<string, any>;
  const intendedLat = typeof meta.intended_latitude === "number" ? meta.intended_latitude : null;
  const intendedLng = typeof meta.intended_longitude === "number" ? meta.intended_longitude : null;
  const intendedArea = typeof meta.intended_area === "string" ? meta.intended_area : "";
  const intendedCity = typeof meta.intended_city === "string" ? meta.intended_city : "";
  const intendedBedrooms = meta.intended_bedrooms != null ? String(meta.intended_bedrooms) : "";
  const intendedBathrooms = meta.intended_bathrooms != null ? String(meta.intended_bathrooms) : "";

  const defaultForm = {
    title: "",
    location: intendedArea,
    city: intendedCity,
    price_per_night: "",
    bedrooms: intendedBedrooms,
    bathrooms: intendedBathrooms,
    max_guests: "",
    description: "",
    amenities: [] as string[],
    cleaning_policy: "",
    welcome_message: "",
    minimum_nights: "1",
    check_in_time: "15:00",
    check_out_time: "11:00",
  };

  const defaultCoords = intendedLat != null && intendedLng != null
    ? { lat: intendedLat, lng: intendedLng }
    : null;

  const reviveRange = (r?: { from?: string; to?: string }): DateRange | undefined =>
    r?.from ? { from: new Date(r.from), to: r.to ? new Date(r.to) : undefined } : undefined;

  const [formData, setFormData] = useState({ ...defaultForm });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(defaultCoords);
  const [availableRange, setAvailableRange] = useState<DateRange | undefined>(undefined);
  const [unavailableRange, setUnavailableRange] = useState<DateRange | undefined>(undefined);
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Restore saved draft once we know the user id (avoids reading 'anon' key on first render)
  useEffect(() => {
    if (draftLoaded) return;
    if (!user?.id) return;
    try {
      const raw = localStorage.getItem(draftKey(user.id));
      if (raw) {
        const restored = JSON.parse(raw) as {
          formData?: typeof defaultForm;
          coords?: { lat: number; lng: number } | null;
          availableRange?: { from?: string; to?: string };
          unavailableRange?: { from?: string; to?: string };
        };
        if (restored.formData) setFormData((f) => ({ ...f, ...restored.formData }));
        if (restored.coords) setCoords(restored.coords);
        if (restored.availableRange) setAvailableRange(reviveRange(restored.availableRange));
        if (restored.unavailableRange) setUnavailableRange(reviveRange(restored.unavailableRange));
      }
    } catch { /* ignore */ }
    setDraftLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Persist draft on every change (only after initial restore attempt to avoid wiping it)
  useEffect(() => {
    if (!draftLoaded || !user?.id) return;
    try {
      const serializeRange = (r?: DateRange) =>
        r?.from ? { from: r.from.toISOString(), to: r.to?.toISOString() } : undefined;
      localStorage.setItem(
        draftKey(user.id),
        JSON.stringify({
          formData,
          coords,
          availableRange: serializeRange(availableRange),
          unavailableRange: serializeRange(unavailableRange),
        })
      );
    } catch { /* ignore quota errors */ }
  }, [draftLoaded, user?.id, formData, coords, availableRange, unavailableRange]);



  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [ownershipFile, setOwnershipFile] = useState<File | null>(null);
  const ownershipInputRef = useRef<HTMLInputElement>(null);
  const [floorPlanFile, setFloorPlanFile] = useState<File | null>(null);
  const floorPlanInputRef = useRef<HTMLInputElement>(null);

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

  const uploadOwnershipDoc = async (): Promise<string | null> => {
    if (!user || !ownershipFile) return null;
    const ext = (ownershipFile.name.split(".").pop() || "bin").toLowerCase();
    const path = `${user.id}/ownership-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("host-documents")
      .upload(path, ownershipFile, { contentType: ownershipFile.type, upsert: true });
    if (error) throw error;
    return path;
  };

  const uploadFloorPlan = async (): Promise<string | null> => {
    if (!user || !floorPlanFile) return null;
    const file = floorPlanFile.type.startsWith("image/") ? await optimizeImage(floorPlanFile) : floorPlanFile;
    const ext = (file.name.split(".").pop() || "webp").toLowerCase();
    const path = `${user.id}/floorplan-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("property-images")
      .upload(path, file, { contentType: file.type, upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!user) { toast.error("Please log in to add a listing"); navigate("/auth"); return; }
    if (!formData.title || !formData.location || !formData.city || !formData.price_per_night || (!isDraft && !ownershipFile)) {
      setShowErrors(true);
      toast.error("Please fill in all required fields and upload proof of ownership");
      return;
    }
    setShowErrors(false);

    setLoading(true);
    try {
      setUploading(true);
      const imageUrls = await uploadImages();
      const ownershipPath = await uploadOwnershipDoc();
      const floorPlanUrl = await uploadFloorPlan();
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
        available_from: availableRange?.from ? toDateString(availableRange.from) : null,
        available_to: availableRange?.to ? toDateString(availableRange.to) : null,
        blocked_dates: getDatesInRange(unavailableRange),
        cleaning_policy: formData.cleaning_policy || null,
        welcome_message: formData.welcome_message || null,
        minimum_nights: parseInt(formData.minimum_nights) || 1,
        check_in_time: formData.check_in_time,
        check_out_time: formData.check_out_time,
        ownership_document_url: ownershipPath,
        floor_plan_url: floorPlanUrl,
      });

      if (error) throw error;
      try { localStorage.removeItem(draftKey(user?.id)); } catch { /* ignore */ }
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

          <ListingStepIndicator />

          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="property-name" className={showErrors && !formData.title ? "text-destructive" : ""}>Property Name *</Label>
                  <Input 
                    id="property-name" 
                    placeholder="e.g., Modern Mountain Villa" 
                    className={`mt-2 ${showErrors && !formData.title ? "border-destructive ring-1 ring-destructive" : ""}`}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city" className={showErrors && !formData.city ? "text-destructive" : ""}>City *</Label>
                    <Select 
                      value={formData.city} 
                      onValueChange={(value) => setFormData({ ...formData, city: value })}
                    >
                      <SelectTrigger className={`mt-2 ${showErrors && !formData.city ? "border-destructive ring-1 ring-destructive" : ""}`}>
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
                    <Label htmlFor="location" className={showErrors && !formData.location ? "text-destructive" : ""}>Address/Location *</Label>
                    <Input 
                      id="location" 
                      placeholder="e.g., Dream City, Street 10" 
                      className={`mt-2 ${showErrors && !formData.location ? "border-destructive ring-1 ring-destructive" : ""}`}
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="price" className={showErrors && !formData.price_per_night ? "text-destructive" : ""}>Price per Night (IQD) *</Label>
                  <Input 
                    id="price" 
                    type="number" 
                    placeholder="150" 
                    className={`mt-2 ${showErrors && !formData.price_per_night ? "border-destructive ring-1 ring-destructive" : ""}`}
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="min-nights">Minimum nights</Label>
                    <Input id="min-nights" type="number" min="1" className="mt-2"
                      value={formData.minimum_nights}
                      onChange={(e) => setFormData({ ...formData, minimum_nights: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="checkin">Check-in time</Label>
                    <Input id="checkin" type="time" className="mt-2"
                      value={formData.check_in_time}
                      onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="checkout">Check-out time</Label>
                    <Input id="checkout" type="time" className="mt-2"
                      value={formData.check_out_time}
                      onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Available date range</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className={!availableRange?.from ? "text-muted-foreground" : ""}>
                            {formatDateRange(availableRange)}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          selected={availableRange}
                          onSelect={setAvailableRange}
                          numberOfMonths={2}
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground">Optional bookable season for this listing.</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Not available date range</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className={!unavailableRange?.from ? "text-muted-foreground" : ""}>
                            {formatDateRange(unavailableRange)}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          selected={unavailableRange}
                          onSelect={setUnavailableRange}
                          numberOfMonths={2}
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground">Optional dates guests cannot book.</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="cleaning">Cleaning policy</Label>
                  <Textarea id="cleaning"
                    placeholder="e.g. Professional cleaning between every stay. Guests are asked to leave dishes in the sink and bag any trash."
                    className="mt-2 min-h-[90px]"
                    value={formData.cleaning_policy}
                    onChange={(e) => setFormData({ ...formData, cleaning_policy: e.target.value })} />
                </div>

                <div>
                  <Label htmlFor="welcome">Welcome message to guests</Label>
                  <Textarea id="welcome"
                    placeholder="Sent automatically when a booking is confirmed. Include WiFi tips, check-in instructions, local recommendations…"
                    className="mt-2 min-h-[90px]"
                    value={formData.welcome_message}
                    onChange={(e) => setFormData({ ...formData, welcome_message: e.target.value })} />
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
                    Required: minimum 1200 x 800 px · JPG or PNG · max 10 MB each
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Images are resized up to 1920 px wide for fast loading
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

              {/* Ownership document */}
              <div>
                <Label className={`mb-1 block ${showErrors && !ownershipFile ? "text-destructive" : ""}`}>Proof of property ownership *</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Title deed, rental agreement, or utility bill in your name. Required for admin approval.
                </p>
                <input
                  ref={ownershipInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setOwnershipFile(f);
                  }}
                />
                <div
                  onClick={() => ownershipInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    ownershipFile ? "border-green-500/40 bg-green-500/5" : showErrors ? "border-destructive bg-destructive/5" : "border-border hover:border-primary"
                  }`}
                >
                  {ownershipFile ? (
                    <>
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <p className="text-sm font-medium">{ownershipFile.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">Click to replace</p>
                    </>
                  ) : (
                    <>
                      <FileCheck2 className={`h-8 w-8 mx-auto mb-2 ${showErrors ? "text-destructive" : "text-muted-foreground"}`} />
                      <p className={`text-sm ${showErrors ? "text-destructive" : "text-muted-foreground"}`}>Click to upload ownership document</p>
                      <p className="text-xs text-muted-foreground mt-1">JPG, PNG or PDF · max 10MB</p>
                    </>
                  )}
                </div>
              </div>

              {/* Floor plan (optional) */}
              <div>
                <Label className="mb-1 block">Floor plan <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Upload a floor plan image so guests can preview the layout. Recommended 1200×900px, JPG or PNG, max 5MB.
                </p>
                <input
                  ref={floorPlanInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    if (f.size > 5 * 1024 * 1024) { toast.error("Floor plan must be under 5MB"); return; }
                    setFloorPlanFile(f);
                  }}
                />
                <div
                  onClick={() => floorPlanInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    floorPlanFile ? "border-green-500/40 bg-green-500/5" : "border-border hover:border-primary"
                  }`}
                >
                  {floorPlanFile ? (
                    <>
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <p className="text-sm font-medium">{floorPlanFile.name}</p>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setFloorPlanFile(null); }}
                        className="text-xs text-destructive mt-1 underline"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Click to upload floor plan</p>
                      <p className="text-xs text-muted-foreground mt-1">Optional · JPG or PNG · max 5MB</p>
                    </>
                  )}
                </div>
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
