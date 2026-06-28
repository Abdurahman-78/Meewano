import { useState, useEffect, useRef } from "react";
import { Upload, Loader2, X, RefreshCw, Clock, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ListingStepIndicator from "@/components/ListingStepIndicator";
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
  const [showErrors, setShowErrors] = useState(false);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [approvalStatus, setApprovalStatus] = useState<string>("approved");
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
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
    cancellation_policy: "",
    house_rules: "",
    safety_property: "",
  });

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [existingFloorPlan, setExistingFloorPlan] = useState<string | null>(null);
  const [floorPlanFile, setFloorPlanFile] = useState<File | null>(null);
  const floorPlanInputRef = useRef<HTMLInputElement>(null);

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
        cancellation_policy: (data as any).cancellation_policy || "",
        house_rules: (data as any).house_rules || "",
        safety_property: (data as any).safety_property || "",
      });
      setExistingImages(data.images || []);
      setExistingFloorPlan((data as any).floor_plan_url || null);
      setApprovalStatus((data as any).approval_status || "approved");
      setRejectionReason((data as any).rejection_reason || null);
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
    if (!formData.title || !formData.location || !formData.city || !formData.price_per_night || !formData.bedrooms || !formData.bathrooms || !formData.max_guests) {
      setShowErrors(true);
      toast.error("Please fill in all required fields"); return;
    }
    setShowErrors(false);

    setSaving(true);
    try {
      setUploading(true);
      const uploadedUrls = await uploadNewImages();

      let floorPlanUrl: string | null = existingFloorPlan;
      if (floorPlanFile) {
        const file = floorPlanFile.type.startsWith("image/") ? await optimizeImage(floorPlanFile) : floorPlanFile;
        const ext = (file.name.split(".").pop() || "webp").toLowerCase();
        const path = `${user.id}/floorplan-${Date.now()}.${ext}`;
        const { error: fpErr } = await supabase.storage
          .from("property-images")
          .upload(path, file, { contentType: file.type, upsert: true });
        if (fpErr) throw fpErr;
        floorPlanUrl = supabase.storage.from("property-images").getPublicUrl(path).data.publicUrl;
      }
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
        floor_plan_url: floorPlanUrl,
        cancellation_policy: formData.cancellation_policy || null,
        house_rules: formData.house_rules || null,
        safety_property: formData.safety_property || null,
      }).eq("id", id).eq("host_id", user.id);

      if (error) throw error;
      toast.success(approvalStatus === "approved" ? "Changes saved — pending admin review" : "Property updated");
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

          <ListingStepIndicator />

          {approvalStatus === "changes_pending" && (
            <Alert className="mb-6 border-blue-500/40 bg-blue-500/5">
              <RefreshCw className="h-4 w-4 text-blue-600" />
              <AlertTitle>Changes pending admin review</AlertTitle>
              <AlertDescription>Your live listing keeps showing the previously approved version until your edits are reviewed.</AlertDescription>
            </Alert>
          )}
          {approvalStatus === "pending" && (
            <Alert className="mb-6 border-yellow-500/40 bg-yellow-500/5">
              <Clock className="h-4 w-4 text-yellow-600" />
              <AlertTitle>Awaiting initial review</AlertTitle>
              <AlertDescription>This property is not visible to guests yet — admin will review and approve.</AlertDescription>
            </Alert>
          )}
          {approvalStatus === "rejected" && (
            <Alert className="mb-6 border-destructive/40 bg-destructive/5">
              <XCircle className="h-4 w-4 text-destructive" />
              <AlertTitle>Property rejected</AlertTitle>
              <AlertDescription>{rejectionReason || "Please update and re-submit."}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="property-name" className={showErrors && !formData.title ? "text-destructive" : ""}>Property Name *</Label>
                    <Input id="property-name" placeholder="e.g., Modern Mountain Villa"
                      className={`mt-2 ${showErrors && !formData.title ? "border-destructive ring-1 ring-destructive" : ""}`}
                      value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                    {showErrors && !formData.title && (
                      <p className="text-xs text-destructive mt-1">This field is required</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location" className={showErrors && !formData.location ? "text-destructive" : ""}>Address/Location *</Label>
                      <Input id="location" placeholder="e.g., Mountain View Road, Ranya"
                        className={`mt-2 ${showErrors && !formData.location ? "border-destructive ring-1 ring-destructive" : ""}`}
                        value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                      {showErrors && !formData.location && (
                        <p className="text-xs text-destructive mt-1">This field is required</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="city" className={showErrors && !formData.city ? "text-destructive" : ""}>City *</Label>
                      <Select value={formData.city} onValueChange={(value) => setFormData({ ...formData, city: value })}>
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
                      {showErrors && !formData.city && (
                        <p className="text-xs text-destructive mt-1">This field is required</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="price" className={showErrors && !formData.price_per_night ? "text-destructive" : ""}>Price per Night (USD) *</Label>
                    <Input id="price" type="number" placeholder="150"
                      className={`mt-2 ${showErrors && !formData.price_per_night ? "border-destructive ring-1 ring-destructive" : ""}`}
                      value={formData.price_per_night} onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value })} />
                    {showErrors && !formData.price_per_night && (
                      <p className="text-xs text-destructive mt-1">This field is required</p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="bedrooms" className={showErrors && !formData.bedrooms ? "text-destructive" : ""}>Bedrooms *</Label>
                      <Input id="bedrooms" type="number" min="1" placeholder="3"
                        className={`mt-2 ${showErrors && !formData.bedrooms ? "border-destructive ring-1 ring-destructive" : ""}`}
                        value={formData.bedrooms}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setFormData({ ...formData, bedrooms: e.target.value === "" ? "" : String(Math.max(1, isNaN(val) ? 1 : val)) });
                        }}
                      />
                      {showErrors && !formData.bedrooms && (
                        <p className="text-xs text-destructive mt-1">This field is required</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="bathrooms" className={showErrors && !formData.bathrooms ? "text-destructive" : ""}>Bathrooms *</Label>
                      <Input id="bathrooms" type="number" min="1" placeholder="2"
                        className={`mt-2 ${showErrors && !formData.bathrooms ? "border-destructive ring-1 ring-destructive" : ""}`}
                        value={formData.bathrooms}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setFormData({ ...formData, bathrooms: e.target.value === "" ? "" : String(Math.max(1, isNaN(val) ? 1 : val)) });
                        }}
                      />
                      {showErrors && !formData.bathrooms && (
                        <p className="text-xs text-destructive mt-1">This field is required</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="guests" className={showErrors && !formData.max_guests ? "text-destructive" : ""}>Max Guests *</Label>
                      <Input id="guests" type="number" min="1" placeholder="4"
                        className={`mt-2 ${showErrors && !formData.max_guests ? "border-destructive ring-1 ring-destructive" : ""}`}
                        value={formData.max_guests}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setFormData({ ...formData, max_guests: e.target.value === "" ? "" : String(Math.max(1, isNaN(val) ? 1 : val)) });
                        }}
                      />
                      {showErrors && !formData.max_guests && (
                        <p className="text-xs text-destructive mt-1">This field is required</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" placeholder="Describe your property..." className="mt-2 min-h-[120px]"
                      value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                  </div>

                  <div>
                    <Label htmlFor="cancellation_policy">Cancellation policy</Label>
                    <Textarea id="cancellation_policy" placeholder="e.g. Free cancellation up to 7 days before check-in." className="mt-2 min-h-[90px]"
                      value={formData.cancellation_policy} onChange={(e) => setFormData({ ...formData, cancellation_policy: e.target.value })} />
                  </div>

                  <div>
                    <Label htmlFor="house_rules">House rules</Label>
                    <Textarea id="house_rules" placeholder="e.g. No smoking, no parties, quiet hours after 10pm." className="mt-2 min-h-[90px]"
                      value={formData.house_rules} onChange={(e) => setFormData({ ...formData, house_rules: e.target.value })} />
                  </div>

                  <div>
                    <Label htmlFor="safety_property">Safety & property</Label>
                    <Textarea id="safety_property" placeholder="e.g. Smoke alarm, security cameras on exterior." className="mt-2 min-h-[90px]"
                      value={formData.safety_property} onChange={(e) => setFormData({ ...formData, safety_property: e.target.value })} />
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

            {/* Floor plan (optional) */}
            <Card>
              <CardHeader>
                <CardTitle>Floor plan <span className="text-sm font-normal text-muted-foreground">(optional)</span></CardTitle>
                <p className="text-sm text-muted-foreground">Upload a floor plan image so guests can preview the layout. JPG or PNG, max 5MB.</p>
              </CardHeader>
              <CardContent>
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
                {floorPlanFile ? (
                  <div className="flex items-center justify-between rounded-xl border p-3">
                    <span className="text-sm truncate">{floorPlanFile.name}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setFloorPlanFile(null)}>Remove</Button>
                  </div>
                ) : existingFloorPlan ? (
                  <div className="space-y-3">
                    <img src={existingFloorPlan} alt="Floor plan" className="w-full max-h-72 object-contain rounded-xl border bg-muted" />
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => floorPlanInputRef.current?.click()}>Replace</Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setExistingFloorPlan(null)}>Remove</Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => floorPlanInputRef.current?.click()}
                    className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary transition-colors"
                  >
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload floor plan</p>
                  </div>
                )}
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
