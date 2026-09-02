import React from "react";
import { Bath, BedDouble, Home, Star, Sparkles, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/contexts/CurrencyContext";
import { usePreLaunch, PreLaunchPropertyItem } from "@/contexts/PreLaunchContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface PreLaunchPropertyCardProps {
  property: PreLaunchPropertyItem;
}

export const PreLaunchPropertyCard: React.FC<PreLaunchPropertyCardProps> = ({ property }) => {
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

        {/* Visible "Coming Soon" Badge matching brand */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/80 text-primary text-[11px] font-bold tracking-wide backdrop-blur-md border border-primary/40 shadow-md">
          <Sparkles className="h-3 w-3 text-primary" />
          <span>Coming Soon</span>
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
          <div className="flex flex-col gap-1.5 mb-1.5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                {property.title}
              </h3>
              <div className="flex items-center gap-1 shrink-0 bg-secondary/80 px-1.5 py-0.5 rounded text-xs font-semibold text-foreground">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span>{property.rating ? property.rating.toFixed(2) : "5.0"}</span>
              </div>
            </div>
            {/* Demo Property Label */}
            <span className="inline-flex w-max items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 uppercase tracking-wider">
              Demo Property
            </span>
          </div>

          {/* Location */}
          <p className="text-xs text-muted-foreground line-clamp-1 mb-3">
            {property.location}
          </p>

          {/* Rooms Specs */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 pb-3 border-b border-border/60">
            <div className="flex items-center gap-1">
              <Home className="h-3.5 w-3.5" />
              <span>{property.bedrooms} {property.bedrooms === 1 ? "bd" : "bds"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" />
              <span>{property.bathrooms} {property.bathrooms === 1 ? "ba" : "ba"}</span>
            </div>
            <div className="flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" />
              <span>{property.max_guests} guests</span>
            </div>
          </div>

          {/* Feature Badges */}
          {property.badges && property.badges.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {property.badges.slice(0, 2).map((badge, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="text-[10px] py-0 px-1.5 font-normal bg-accent/40 text-muted-foreground border-border/60"
                >
                  {badge}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Price & Action Row */}
        <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2 mt-auto">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold text-foreground font-mono">
                {formatPrice(property.price_per_night)}
              </span>
              <span className="text-[11px] text-muted-foreground">/ night</span>
            </div>
            <p className="text-[10px] text-primary font-medium">
              Host: {property.host_name || "Host"}
            </p>
          </div>

          {/* Disabled Dimmed/Darkened "Coming Soon" Button */}
          <Button
            size="sm"
            variant="secondary"
            className="h-8 px-3 rounded-lg text-xs font-semibold bg-muted/80 text-muted-foreground hover:bg-muted border border-border/80 cursor-not-allowed opacity-80 flex items-center gap-1"
            onClick={handleComingSoonClick}
          >
            <Lock className="h-3 w-3" />
            Coming Soon
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PreLaunchPropertyCard;
