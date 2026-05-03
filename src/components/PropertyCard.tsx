import { Bath, Bed, Home, Star, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { useNavigate } from "react-router-dom";

interface PropertyCardProps {
  id: string;
  image: string;
  name: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  beds?: number;
  price: number;
  rating: number;
  reviews?: number;
}

const PropertyCard = ({
  id,
  image,
  name,
  location,
  bedrooms,
  bathrooms,
  beds,
  price,
  rating,
  reviews,
}: PropertyCardProps) => {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites(user?.id || null);
  const navigate = useNavigate();

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      navigate("/auth");
      return;
    }
    
    await toggleFavorite(id);
  };

  const handleCardClick = () => {
    navigate(`/property/${id}`);
  };

  const favorited = isFavorite(id);
  
  return (
    <Card 
      className="overflow-hidden transition-all duration-300 hover:shadow-lg border-border cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="relative aspect-[4/3] overflow-hidden group">
        <img 
          src={image || "/placeholder.svg"} 
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white transition-all duration-200 hover:scale-110 z-10"
          aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            className={`h-5 w-5 transition-all duration-200 ${
              favorited
                ? "fill-primary text-primary"
                : "text-gray-600 hover:text-primary"
            }`}
          />
        </button>
      </div>
      <CardContent className="p-3 md:p-4">
        <div className="flex items-start justify-between mb-1 md:mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm md:text-lg text-foreground truncate">{name}</h3>
            <p className="text-xs md:text-sm text-muted-foreground truncate">{location}</p>
          </div>
          <div className="flex items-center gap-0.5 ml-1 shrink-0">
            <Star className="h-3 w-3 md:h-4 md:w-4 fill-yellow-500 text-yellow-500" />
            <span className="text-xs md:text-sm font-semibold text-foreground">{rating || 0}</span>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Home className="h-4 w-4" />
            <span>{bedrooms}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="h-4 w-4" />
            <span>{bathrooms}</span>
          </div>
          {beds !== undefined && (
            <div className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              <span>{beds}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-baseline gap-1 mt-1 md:mt-0">
          <span className="text-sm md:text-xl font-bold text-foreground">{formatPrice(price)}</span>
          <span className="text-[10px] md:text-sm text-muted-foreground">{t("perNight")}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyCard;
