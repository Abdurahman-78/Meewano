import { useState, useRef, useEffect } from "react";
import { Upload, Loader2, X, ArrowRight, ArrowLeft, Home, MapPin, Sparkles, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSiteSettings } from "@/hooks/useAdminData";
import LocationPicker from "@/components/LocationPicker";
import { optimizeImage } from "@/lib/imageOptimizer";
import { normalizeAmenities, DEFAULT_AMENITIES } from "@/lib/amenities";

const STEPS = [
  { id: 1, title: "Tell us about your place", subtitle: "Start with the basics", icon: Home },
  { id: 2, title: "Where is it located?", subtitle: "Help guests find you", icon: MapPin },
  { id: 3, title: "What does it offer?", subtitle: "Highlight your amenities", icon: Sparkles },
  { id: 4, title: "Add some photos", subtitle: "Show off your space", icon: ImageIcon },
  { id: 5, title: "Set your price & publish", subtitle: "Last step!", icon: CheckCircle2 },
];

const BecomeHost = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
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

  // Require login
  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?redirect=${encodeURIComponent("/become-host")}`);
    }
  }, [user, authLoading, navigate]);

  const settingsMap: Record<string, any> = Array.isArray(siteSettings)
    ? siteSettings.reduce((acc: Record<string, any>, s: any) => { acc[s.key] = s.value; return acc; }, {})
    : siteSettings && typeof siteSettings === "object" ? (siteSettings as Record<string, any>) : {};
  const getSetting = (k: string, d: any) => settingsMap[k] ?? d;

  const amenitiesList = normalizeAmenities(getSetting("amenities_list", DEFAULT_AMENITIES));
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
    { name: "Koya", region: "Kurdistan" },
  ]) as { name: string; region: string }[];

  const handleAmenityChange = (a: string, c: boolean) =>
    setFormData(p => ({ ...p, amenities: c ? [...p.amenities, a] : p.amenities.filter(x => x !== a) }));

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!newFiles.length) { toast.error("Please select image files"); return; }
    setImageFiles(p => [...p, ...newFiles]);
    newFiles.forEach(f => {
      const r = new FileReader();
      r.onloadend = () => setImagePreviews(p => [...p, r.result as string]);
      r.readAsDataURL(f);
    });
  };
  const removeImage = (i: number) => {
    setImageFiles(p => p.filter((_, idx) => idx !== i));
    setImagePreviews(p => p.filter((_, idx) => idx !== i));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (!user || !imageFiles.length) return [];
    const urls: string[] = [];
    for (const original of imageFiles) {
      const file = await optimizeImage(original);
      const ext = (file.name.split(".").pop() || "webp").toLowerCase();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("property-images").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("property-images").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  };

  const canAdvance = () => {
    if (step === 1) return formData.title.trim().length > 2 && formData.description.trim().length > 0;
    if (step === 2) return !!formData.city && formData.location.trim().length > 0;
    if (step === 3) return true;
    if (step === 4) return imageFiles.length > 0;
    if (step === 5) return !!formData.price_per_night;
    return true;
  };

  const missingMessage = () => {
    if (step === 1) {
      if (formData.title.trim().length <= 2) return "Property name must be at least 3 characters";
      if (!formData.description.trim()) return "Please add a description";
    }
    if (step === 2) {
      if (!formData.city) return "Please select a city";
      if (!formData.location.trim()) return "Please enter an address";
    }
    if (step === 4 && imageFiles.length === 0) return "Please add at least one photo";
    if (step === 5 && !formData.price_per_night) return "Please set a price per night";
    return "Please complete all required fields";
  };

  const next = () => {
    if (!canAdvance()) { toast.error(missingMessage()); return; }
    setStep(s => Math.min(STEPS.length, s + 1));
  };
  const back = () => setStep(s => Math.max(1, s - 1));

  const handleSubmit = async (isDraft = false) => {
    if (!user) { navigate("/auth"); return; }
    if (!canAdvance()) { toast.error("Please complete all required fields"); return; }
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
      toast.success(isDraft ? "Saved as draft" : "Property published! 🎉");
      navigate("/host");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to publish");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const progress = (step / STEPS.length) * 100;
  const current = STEPS[step - 1];
  const Icon = current.icon;

  return (
    <AppLayout>
      <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-accent/30 via-background to-background">
        {/* Sticky progress */}
        <div className="sticky top-14 md:top-20 z-30 bg-background/80 backdrop-blur border-b border-border">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
              <span>Step {step} of {STEPS.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 md:py-12">
          <div className="max-w-2xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Step header */}
                <div className="mb-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
                    <Icon className="h-8 w-8" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">{current.title}</h1>
                  <p className="text-muted-foreground">{current.subtitle}</p>
                </div>

                {/* Step content */}
                <div className="bg-card rounded-2xl border border-border shadow-sm p-6 md:p-8 space-y-6">
                  {step === 1 && (
                    <>
                      <div>
                        <Label htmlFor="title">Property name *</Label>
                        <Input id="title" placeholder="e.g., Cozy Mountain Retreat" className="mt-2 h-12"
                          value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                      </div>
                      <div>
                        <Label htmlFor="desc">Description *</Label>
                        <Textarea id="desc" placeholder="Tell guests what makes your place special..."
                          className="mt-2 min-h-[140px]" value={formData.description}
                          onChange={e => setFormData({ ...formData, description: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label>Bedrooms</Label>
                          <Input type="number" placeholder="2" className="mt-2 h-12" value={formData.bedrooms}
                            onChange={e => setFormData({ ...formData, bedrooms: e.target.value })} />
                        </div>
                        <div>
                          <Label>Bathrooms</Label>
                          <Input type="number" placeholder="1" className="mt-2 h-12" value={formData.bathrooms}
                            onChange={e => setFormData({ ...formData, bathrooms: e.target.value })} />
                        </div>
                        <div>
                          <Label>Guests</Label>
                          <Input type="number" placeholder="4" className="mt-2 h-12" value={formData.max_guests}
                            onChange={e => setFormData({ ...formData, max_guests: e.target.value })} />
                        </div>
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <div>
                        <Label>City *</Label>
                        <Select value={formData.city} onValueChange={v => setFormData({ ...formData, city: v })}>
                          <SelectTrigger className="mt-2 h-12"><SelectValue placeholder="Select a city" /></SelectTrigger>
                          <SelectContent className="bg-popover border z-50">
                            {locationsList.map(loc => (
                              <SelectItem key={loc.name} value={loc.name}>{loc.name} ({loc.region})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Address *</Label>
                        <Input placeholder="Street, neighborhood..." className="mt-2 h-12"
                          value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                      </div>
                      <div>
                        <Label className="mb-2 block">Pin exact location on map</Label>
                        <LocationPicker value={coords} onChange={setCoords} height="360px" />
                      </div>
                    </>
                  )}

                  {step === 3 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-4">Pick everything your place offers — guests filter by these.</p>
                      <div className="grid grid-cols-2 gap-3">
                        {amenitiesList.map(a => {
                          const checked = formData.amenities.includes(a.name);
                          return (
                            <button key={a.name} type="button"
                              onClick={() => handleAmenityChange(a.name, !checked)}
                              className={`flex items-center gap-3 p-4 border-2 rounded-xl transition-all text-left ${
                                checked ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                              }`}>
                              <Checkbox checked={checked} className="pointer-events-none" />
                              {a.icon && <img src={a.icon} alt="" className="h-5 w-5 object-contain" />}
                              <span className="text-sm font-medium flex-1">{a.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div>
                      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                        onChange={e => handleFilesSelected(e.target.files)} />
                      <div onClick={() => fileInputRef.current?.click()}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => { e.preventDefault(); handleFilesSelected(e.dataTransfer.files); }}
                        className="border-2 border-dashed border-border rounded-2xl p-10 text-center hover:border-primary hover:bg-accent/30 transition-all cursor-pointer">
                        <Upload className="h-12 w-12 mx-auto mb-3 text-primary" />
                        <p className="font-semibold mb-1">Drag photos here</p>
                        <p className="text-sm text-muted-foreground">or click to browse · at least 1 photo required</p>
                      </div>
                      {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 mt-4">
                          {imagePreviews.map((p, i) => (
                            <div key={i} className="relative group rounded-lg overflow-hidden aspect-video">
                              <img src={p} alt="" className="w-full h-full object-cover" />
                              <button type="button" onClick={() => removeImage(i)}
                                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {step === 5 && (
                    <>
                      <div>
                        <Label>Price per night (IQD) *</Label>
                        <Input type="number" placeholder="150000" className="mt-2 h-14 text-2xl font-bold"
                          value={formData.price_per_night}
                          onChange={e => setFormData({ ...formData, price_per_night: e.target.value })} />
                        <p className="text-xs text-muted-foreground mt-2">You can change this anytime from your dashboard.</p>
                      </div>
                      <div className="bg-accent/40 rounded-xl p-4 space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Property</span><span className="font-medium">{formData.title || "—"}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span className="font-medium">{formData.city || "—"}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Photos</span><span className="font-medium">{imageFiles.length}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Amenities</span><span className="font-medium">{formData.amenities.length}</span></div>
                      </div>
                    </>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-6 gap-3">
                  <Button variant="outline" onClick={back} disabled={step === 1} className="h-12">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                  </Button>
                  {step < STEPS.length ? (
                    <Button onClick={next} disabled={!canAdvance()} className="h-12 px-8">
                      Next <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => handleSubmit(true)} disabled={loading} className="h-12">
                        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save draft
                      </Button>
                      <Button onClick={() => handleSubmit(false)} disabled={loading} className="h-12 px-8">
                        {(loading || uploading) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        {uploading ? "Uploading..." : "Publish 🎉"}
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </AppLayout>
  );
};

export default BecomeHost;
