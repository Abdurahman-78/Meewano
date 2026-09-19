import React from "react";
import { Bath, BedDouble, Home, Star, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/contexts/CurrencyContext";
import { usePreLaunch, PreLaunchPropertyItem } from "@/contexts/PreLaunchContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";

interface PreLaunchPropertyCardProps {
  property: PreLaunchPropertyItem;
}

export const PreLaunchPropertyCard: React.FC<PreLaunchPropertyCardProps> = ({ property }) => {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/property/${property.id}`);
  };

  const handleComingSoonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.info("Bookings will open upon official launch! Host pre-registrations are open now.", {
      icon: "🚀",
    });
  };

  return (
    <Card
      id={`prelaunch-card-${property.id}`}
      className="group overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:shadow-xl hover:border-primary/40 flex flex-col cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Image Container with "Coming Soon" Badge */}
      <div className="relative isolate aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={property.image || "/placeholder.svg"}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Visible Badge: Demo Properties for demo items, Coming Soon for real properties */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/80 text-primary text-[11px] font-bold tracking-wide backdrop-blur-md border border-primary/40 shadow-md">
          <span>{property.isDemo ? t("demoProperties") : t("comingSoon")}</span>
        </div>

        {/* Subtle City Tag at Bottom Left */}
        <div className="absolute bottom-2.5 left-3 z-10">
          <span className="px-2 py-0.5 rounded-md bg-black/60 text-white text-[11px] font-medium backdrop-blur-xs">
            {property.city}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <CardContent className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Title & Rating */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-bold text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {property.title}
            </h3>
            <div className="flex items-center gap-1 shrink-0 bg-secondary/80 px-1.5 py-0.5 rounded text-xs font-semibold text-foreground">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span>{property.rating ? property.rating.toFixed(2) : "5.0"}</span>
            </div>
          </div>

          {/* Location */}
          <p className="text-xs text-muted-foreground line-clamp-1 mb-3">
            {property.location}
          </p>

          {/* Rooms Specs */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 pb-3 border-b border-border/60">
            <div className="flex items-center gap-1">
              <Home className="h-3.5 w-3.5" />
              <span>{property.bedrooms}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" />
              <span>{property.bathrooms}</span>
            </div>
            <div className="flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" />
              <span>{property.max_guests}</span>
            </div>
          </div>
        </div>

        {/* Price & Action Row */}
        <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2 mt-auto">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold text-foreground font-mono">
                {formatPrice(property.price_per_night)}
              </span>
              <span className="text-[11px] text-muted-foreground">{t("perNight")}</span>
            </div>
          </div>

          {/* Disabled Dimmed Button */}
          <Button
            size="sm"
            variant="secondary"
            className="h-8 px-3 rounded-lg text-xs font-semibold bg-muted/80 text-muted-foreground hover:bg-muted border border-border/80 cursor-not-allowed opacity-80 flex items-center gap-1"
            onClick={handleComingSoonClick}
          >
            <Lock className="h-3 w-3" />
            {property.isDemo ? t("demoProperties") : t("comingSoon")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PreLaunchPropertyCard;
