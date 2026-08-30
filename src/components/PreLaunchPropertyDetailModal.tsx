import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePreLaunch, PreLaunchPropertyItem } from "@/contexts/PreLaunchContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  Star,
  MapPin,
  Home,
  Bath,
  Users,
  BedDouble,
  Sparkles,
  Lock,
  ShieldCheck,
  CheckCircle2,
  X,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

export const PreLaunchPropertyDetailModal: React.FC = () => {
  const {
    selectedPreviewProperty,
    setSelectedPreviewProperty,
  } = usePreLaunch();

  const { formatPrice } = useCurrency();

  if (!selectedPreviewProperty) return null;

  const prop = selectedPreviewProperty;

  const handleShare = () => {
    toast.success("Listing preview link copied to clipboard!");
  };

  return (
    <Dialog
      open={!!selectedPreviewProperty}
      onOpenChange={(open) => {
        if (!open) setSelectedPreviewProperty(null);
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl border border-border shadow-2xl">
        {/* Cover Photo */}
        <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden bg-muted">
          <img
            src={prop.image || "/placeholder.svg"}
            alt={prop.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Coming Soon Pill */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/80 text-primary-foreground text-xs font-bold border border-primary/40 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Pre-Launch Preview • Stays Launching Soon</span>
          </div>

          {/* Title Overlay */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center gap-2 text-xs text-primary font-medium mb-1">
              <MapPin className="h-3.5 w-3.5" />
              <span className="text-white">{prop.location}, {prop.city}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white line-clamp-2">
              {prop.title}
            </h2>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 md:p-6 space-y-6">
          {/* Quick Stats Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-muted/40 border border-border text-center">
            <div>
              <p className="text-xs text-muted-foreground">Nightly Rate</p>
              <p className="text-base font-bold text-foreground font-mono">
                {formatPrice(prop.price_per_night)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rooms</p>
              <p className="text-base font-bold text-foreground">
                {prop.bedrooms} Bed · {prop.bathrooms} Bath
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Capacity</p>
              <p className="text-base font-bold text-foreground">
                Up to {prop.max_guests} Guests
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Host</p>
              <p className="text-base font-bold text-primary truncate">
                {prop.host_name || "Host"}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              About this space
            </h3>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
              {prop.description ||
                "Located in one of Kurdistan's most scenic destinations, this property offers serene comfort, traditional hospitality, and all modern amenities for family vacations and weekend retreats."}
            </p>
          </div>

          {/* Amenities Badges */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Included Amenities & Highlights
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(prop.amenities || prop.badges || ["WiFi", "Mountain View", "Kitchen", "Free Parking"]).map(
                (item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground"
                  >
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate">{item}</span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Pre-Launch Reservation Card (Disabled & Dimmed) */}
          <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-5 text-center space-y-3">
            <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-foreground">
                Reservations Open at Public Launch
              </h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                Meewano is currently in Pre-Launch mode. Homeowners can list their space now, and guest booking will activate on launch day.
              </p>
            </div>

            {/* Dimmed Button */}
            <Button
              disabled
              size="lg"
              className="w-full max-w-sm h-11 rounded-xl bg-muted text-muted-foreground opacity-60 cursor-not-allowed border border-border"
            >
              <Lock className="h-4 w-4 mr-2" />
              Bookings Coming Soon
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PreLaunchPropertyDetailModal;
