import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePreLaunch, PreLaunchPropertyItem } from "@/contexts/PreLaunchContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  Upload,
  Image as ImageIcon,
  Check,
  Plus,
  Trash2,
  Sparkles,
  BedDouble,
  Bath,
  Users,
  Home,
  MapPin,
  X,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import kurdish1 from "@/assets/property-kurdish-1.jpg";
import kurdish2 from "@/assets/property-kurdish-2.jpg";
import kurdish3 from "@/assets/property-kurdish-3.jpg";
import kurdish4 from "@/assets/property-kurdish-4.jpg";
import kurdish5 from "@/assets/property-kurdish-5.jpg";
import kurdish6 from "@/assets/property-kurdish-6.jpg";
import kurdish7 from "@/assets/property-kurdish-7.jpg";
import kurdish8 from "@/assets/property-kurdish-8.jpg";

const PRESET_IMAGES = [
  { label: "Alpine Canyon", src: kurdish1 },
  { label: "Modern Villa", src: kurdish3 },
  { label: "Luxury Penthouse", src: kurdish4 },
  { label: "Pine Chalet", src: kurdish5 },
  { label: "Stone Citadel", src: kurdish8 },
  { label: "Mountain View", src: kurdish7 },
];

const KURDISTAN_CITIES = [
  "Erbil",
  "Sulaymaniyah",
  "Duhok",
  "Rawanduz",
  "Shaqlawa",
  "Ranya",
  "Haji Omran",
  "Dukan",
  "Amedi",
  "Soran",
  "Halabja",
  "Koya",
  "Zakho",
  "Penjwen",
  "Baghdad",
];

const AVAILABLE_AMENITIES = [
  "WiFi",
  "Mountain View",
  "Private Pool",
  "Kitchen",
  "Free Parking",
  "Air Conditioning",
  "Heating / Fireplace",
  "Balcony / Pergola",
  "BBQ Grill",
  "24/7 Electricity",
  "Jacuzzi / Hot Tub",
  "Garden / Yard",
  "Washing Machine",
  "Smart TV",
];

export const PreLaunchHostModal: React.FC = () => {
  const {
    isHostModalOpen,
    setIsHostModalOpen,
    editingProperty,
    setEditingProperty,
    addProperty,
    updateProperty,
  } = usePreLaunch();

  const { currency } = useCurrency();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("Erbil");
  const [location, setLocation] = useState("");
  const [pricePerNight, setPricePerNight] = useState<number>(150000);
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(1);
  const [maxGuests, setMaxGuests] = useState(4);
  const [description, setDescription] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    "WiFi",
    "Kitchen",
    "Air Conditioning",
    "Free Parking",
  ]);
  const [images, setImages] = useState<string[]>([kurdish1]);
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [hostName, setHostName] = useState("");

  // Populate when editing
  useEffect(() => {
    if (editingProperty) {
      setTitle(editingProperty.title || "");
      setCity(editingProperty.city || "Erbil");
      setLocation(editingProperty.location || "");
      setPricePerNight(editingProperty.price_per_night || 150000);
      setBedrooms(editingProperty.bedrooms || 2);
      setBathrooms(editingProperty.bathrooms || 1);
      setMaxGuests(editingProperty.max_guests || 4);
      setDescription(editingProperty.description || "");
      setSelectedAmenities(
        editingProperty.amenities || editingProperty.badges || ["WiFi", "Kitchen"]
      );
      setImages(
        editingProperty.image
          ? [editingProperty.image]
          : [kurdish1]
      );
      setHostName(editingProperty.host_name || "Founding Host");
    } else {
      // Reset form
      setTitle("");
      setCity("Erbil");
      setLocation("Gulan St, Dream City");
      setPricePerNight(180000);
      setBedrooms(3);
      setBathrooms(2);
      setMaxGuests(6);
      setDescription(
        "A beautiful modern space in Kurdistan offering comfort, breathtaking views, and warm hospitality for your upcoming stay."
      );
      setSelectedAmenities(["WiFi", "Mountain View", "Kitchen", "Free Parking", "Air Conditioning"]);
      setImages([kurdish3]);
      setHostName("Founding Host");
      setCustomImageUrl("");
    }
  }, [editingProperty, isHostModalOpen]);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages([event.target.result as string, ...images.slice(0, 3)]);
          toast.success("Image uploaded successfully!");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addCustomUrl = () => {
    if (!customImageUrl.trim()) return;
    setImages([customImageUrl.trim(), ...images.slice(0, 3)]);
    setCustomImageUrl("");
    toast.success("Image added from URL");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a property title");
      return;
    }

    if (!location.trim()) {
      toast.error("Please enter a location or street area");
      return;
    }

    if (pricePerNight <= 0) {
      toast.error("Please specify a valid nightly rate");
      return;
    }

    const payload: Omit<PreLaunchPropertyItem, "id"> = {
      title: title.trim(),
      city,
      location: location.trim(),
      price_per_night: Number(pricePerNight),
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      max_guests: Number(maxGuests),
      description: description.trim(),
      image: images[0] || kurdish1,
      host_name: hostName.trim() || "Founding Host",
      rating: editingProperty?.rating || 5.0,
      reviews_count: editingProperty?.reviews_count || 0,
      badges: selectedAmenities.slice(0, 3),
      amenities: selectedAmenities,
      is_active: true,
    };

    if (editingProperty) {
      updateProperty(editingProperty.id, payload);
    } else {
      addProperty(payload);
    }

    setIsHostModalOpen(false);
    setEditingProperty(null);
  };

  return (
    <Dialog open={isHostModalOpen} onOpenChange={(open) => {
      setIsHostModalOpen(open);
      if (!open) setEditingProperty(null);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl border border-border shadow-2xl">
        <div className="sticky top-0 z-10 bg-card border-b border-border p-5 md:p-6 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/25">
              <Sparkles className="h-3.5 w-3.5" />
              Pre-Launch Host Onboarding
            </span>
          </div>
          <DialogTitle className="text-xl md:text-2xl font-bold tracking-tight">
            {editingProperty ? "Edit Your Pre-Launch Listing" : "Add a Property to Meewano"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            {editingProperty
              ? "Update your property details. Changes sync immediately to the pre-launch feed."
              : "Pre-register your property today and join Kurdistan's dedicated vacation rental network."}
          </DialogDescription>
        </div>

        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-6">
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Home className="h-4 w-4 text-primary" />
              Property Basics
            </h4>

            <div>
              <Label htmlFor="prop-title" className="text-sm font-medium">
                Property Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="prop-title"
                placeholder="e.g. Korek Mountain Pine Chalet & Fireplace"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5 h-11"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prop-city" className="text-sm font-medium">
                  City / Governorate <span className="text-destructive">*</span>
                </Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger id="prop-city" className="mt-1.5 h-11">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {KURDISTAN_CITIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="prop-location" className="text-sm font-medium">
                  Specific Location / Area <span className="text-destructive">*</span>
                </Label>
                <div className="relative mt-1.5">
                  <MapPin className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="prop-location"
                    placeholder="e.g. Rawanduz Canyon Overlook"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-9 h-11"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prop-price" className="text-sm font-medium">
                  Estimated Nightly Rate (IQD) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="prop-price"
                  type="number"
                  min="10000"
                  step="5000"
                  placeholder="180000"
                  value={pricePerNight}
                  onChange={(e) => setPricePerNight(Number(e.target.value))}
                  className="mt-1.5 h-11 font-mono"
                  required
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Approx. ${Math.round(pricePerNight / 1320)} USD / night
                </p>
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-xs text-muted-foreground flex items-start gap-2 mt-2">
                  <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>After Meewano is launched, we will verify and set the official price of properties with you.</span>
                </div>
              </div>

              <div>
                <Label htmlFor="prop-host" className="text-sm font-medium">
                  Host Name / Business
                </Label>
                <Input
                  id="prop-host"
                  placeholder="e.g. Kak Dana & Family"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  className="mt-1.5 h-11"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Capacity */}
          <div className="space-y-4 pt-2 border-t border-border">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Rooms & Capacity
            </h4>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="prop-bedrooms" className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
                  <BedDouble className="h-3.5 w-3.5" /> Bedrooms
                </Label>
                <Input
                  id="prop-bedrooms"
                  type="number"
                  min="1"
                  max="20"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(Number(e.target.value))}
                  className="h-10 text-center"
                />
              </div>

              <div>
                <Label htmlFor="prop-bathrooms" className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
                  <Bath className="h-3.5 w-3.5" /> Bathrooms
                </Label>
                <Input
                  id="prop-bathrooms"
                  type="number"
                  min="1"
                  max="15"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(Number(e.target.value))}
                  className="h-10 text-center"
                />
              </div>

              <div>
                <Label htmlFor="prop-guests" className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
                  <Users className="h-3.5 w-3.5" /> Max Guests
                </Label>
                <Input
                  id="prop-guests"
                  type="number"
                  min="1"
                  max="50"
                  value={maxGuests}
                  onChange={(e) => setMaxGuests(Number(e.target.value))}
                  className="h-10 text-center"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Photos & Imagery */}
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                Photos & Imagery
              </h4>
              <span className="text-xs text-muted-foreground">Select preset or upload</span>
            </div>

            {/* Current Active Image Preview */}
            <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-border bg-muted/40">
              <img
                src={images[0] || kurdish1}
                alt="Listing preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2.5 py-1 rounded-md backdrop-blur-sm">
                Primary Cover Photo
              </div>
            </div>

            {/* Preset Image Options */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Choose from Kurdish architectural presets:</p>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_IMAGES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setImages([preset.src, ...images.slice(1)])}
                    className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                      images[0] === preset.src
                        ? "border-primary ring-2 ring-primary/40 scale-105"
                        : "border-transparent opacity-75 hover:opacity-100"
                    }`}
                  >
                    <img src={preset.src} alt={preset.label} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Upload or URL custom image */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-9 text-xs"
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Upload from device
              </Button>

              <div className="flex-1 flex gap-1.5">
                <Input
                  placeholder="Or paste image URL (https://...)"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  className="h-9 text-xs"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addCustomUrl}
                  disabled={!customImageUrl.trim()}
                  className="h-9 text-xs"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Section 4: Amenities */}
          <div className="space-y-3 pt-2 border-t border-border">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Amenities & Features
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AVAILABLE_AMENITIES.map((amenity) => {
                const isSelected = selectedAmenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs transition-all ${
                      isSelected
                        ? "bg-primary/10 border-primary text-primary font-semibold shadow-xs"
                        : "bg-card border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded flex items-center justify-center border ${
                        isSelected ? "bg-primary border-primary text-white" : "border-muted-foreground/40"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <span className="truncate">{amenity}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Description */}
          <div className="space-y-2 pt-2 border-t border-border">
            <Label htmlFor="prop-desc" className="text-sm font-medium">
              Property Description
            </Label>
            <Textarea
              id="prop-desc"
              rows={4}
              placeholder="Highlight what makes your stay unique: mountain views, traditional hospitality, garden barbecue, or quiet serenity..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none text-sm"
            />
          </div>

          {/* Pre-launch Note */}
          <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-xs text-foreground">
            <p className="font-semibold flex items-center gap-1.5 mb-1 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Pre-Launch Registration Active
            </p>
            <p className="text-muted-foreground">
              Your property will be previewed in the pre-launch catalog. Our team will verify your listing details and calibrate availability prior to public guest bookings.
            </p>
          </div>

          <DialogFooter className="sticky bottom-0 bg-card border-t border-border -mx-5 -mb-5 p-4 md:-mx-6 md:-mb-6 flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsHostModalOpen(false);
                setEditingProperty(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 font-semibold px-6">
              {editingProperty ? "Save Changes" : "Publish to Pre-Launch Feed"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PreLaunchHostModal;
