import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import PropertyCard from "@/components/PropertyCard";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";
import { useProperties } from "@/hooks/useProperties";
import { useTranslation } from "@/hooks/useTranslation";
import { Heart, Loader2 } from "lucide-react";

const Favorites = () => {
  const { user, loading: authLoading } = useAuth();
  const { favorites, loading: favLoading } = useFavorites(user?.id || null);
  const { data: properties, isLoading: propertiesLoading } = useProperties();
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const isLoading = authLoading || favLoading || propertiesLoading;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const favoriteProperties = properties?.filter(property => 
    favorites.includes(property.id)
  ) || [];

  return (
    <AppLayout>
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center gap-2 mb-8">
          <Heart className="h-8 w-8 fill-primary text-primary" />
          <h1 className="text-3xl font-bold">{t("myFavorites")}</h1>
        </div>
        
        {favorites.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">{t("noFavoritesYet")}</h2>
            <p className="text-muted-foreground mb-6">
              {t("noFavoritesDesc")}
            </p>
            <button
              onClick={() => navigate("/search")}
              className="text-primary hover:underline"
            >
              {t("browseProperties")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {favoriteProperties.map((property) => (
              <PropertyCard
                key={property.id}
                id={property.id}
                image={property.images?.[0] || "/placeholder.svg"}
                name={property.title}
                location={property.location}
                bedrooms={property.bedrooms}
                bathrooms={property.bathrooms}
                price={property.price_per_night}
                rating={property.rating || 0}
                reviews={property.review_count}
                    approvalStatus={(property as any).approval_status}
              />
            ))}
          </div>
        )}
      </section>
    </AppLayout>
  );
};

export default Favorites;
