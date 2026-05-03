import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import SearchBar from "@/components/SearchBar";
import PropertyCard from "@/components/PropertyCard";
import RegionCard from "@/components/RegionCard";
import { useProperties } from "@/hooks/useProperties";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import heroBanner from "@/assets/hero-banner.jpg";
import kurdish1 from "@/assets/property-kurdish-1.jpg";
import kurdish8 from "@/assets/property-kurdish-8.jpg";
import { useTranslation } from "@/hooks/useTranslation";
import { Star, Loader2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: properties, isLoading } = useProperties();
  const { data: settings } = useSiteSettings();

  // Get locations from settings
  const locations = (settings?.locations as string[]) || ["Ranya", "Haji Omran"];

  // Get regions from settings
  interface Region {
    name: string;
    description: string;
    image: string;
  }
  const regionsData: Region[] = (settings?.regions_list as Region[]) || [];

  // Default images for regions that don't have custom images
  const defaultImages = [kurdish1, kurdish8];

  // Get properties by city
  const getPropertiesByCity = (city: string) => {
    return properties?.filter(p => p.city.toLowerCase().includes(city.toLowerCase())) || [];
  };

  // Get recently reviewed (highest review count)
  const recentlyReviewed = [...(properties || [])]
    .sort((a, b) => (b.review_count || 0) - (a.review_count || 0))
    .slice(0, 3);

  // Get featured properties
  const featuredProperties = properties?.filter(p => p.is_featured) || [];

  // Build regions from settings regions_list
  const regions = regionsData.slice(0, 4).map((region, index) => ({
    name: region.name,
    description: region.description || `Discover amazing stays in ${region.name}`,
    image: region.image || defaultImages[index % defaultImages.length],
    propertyCount: getPropertiesByCity(region.name).length,
    searchParams: `?location=${encodeURIComponent(region.name)}`,
  }));

  const ranyaProperties = getPropertiesByCity("Ranya");
  const hajiProperties = getPropertiesByCity("Haji Omran");

  return (
    <AppLayout>
      
      {/* Hero Section */}
      <section className="relative h-[360px] md:h-[500px] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBanner})` }}
        >
          <div className="absolute inset-0 bg-black/30" />
        </div>
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col items-center justify-center">
          <h2 className="text-2xl md:text-5xl font-bold text-white text-center mb-4 md:mb-8">
            {t("heroTitle")}
          </h2>
          <div className="w-full max-w-4xl px-2 md:px-0">
            <SearchBar />
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : properties && properties.length > 0 ? (
        <>
          {/* Popular in Ranya */}
          {ranyaProperties.length > 0 && (
            <section className="container mx-auto px-4 py-8 md:py-16">
              <h3 className="text-xl md:text-3xl font-bold mb-4 md:mb-8">{t("popularInRanya")}</h3>
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                {ranyaProperties.slice(0, 4).map((property) => (
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
                  />
                ))}
              </div>
            </section>
          )}

          {/* Recently Reviewed Section */}
          {recentlyReviewed.length > 0 && (
            <section className="container mx-auto px-4 py-8 md:py-12 bg-accent/30">
              <div className="flex items-center gap-2 mb-4 md:mb-6">
                <Star className="h-5 w-5 md:h-6 md:w-6 text-primary fill-primary" />
                <h2 className="text-xl md:text-3xl font-bold">{t("recentlyReviewed")}</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                {recentlyReviewed.map((property) => (
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
                  />
                ))}
              </div>
            </section>
          )}

          {/* Discover Kurdistan - Region Highlights */}
          <section className="container mx-auto px-4 py-8 md:py-12">
            <h2 className="text-xl md:text-3xl font-bold mb-2 text-center">{t("discoverKurdistan")}</h2>
            <p className="text-sm md:text-base text-muted-foreground text-center mb-6 md:mb-8">
              {t("discoverKurdistanDesc")}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-6 max-w-4xl mx-auto">
              {regions.map((region) => (
                <RegionCard
                  key={region.name}
                  name={region.name}
                  description={region.description}
                  image={region.image}
                  propertyCount={region.propertyCount}
                  onClick={() => navigate(`/search${region.searchParams}`)}
                />
              ))}
            </div>
          </section>

          {/* Popular in Haji Omran */}
          {hajiProperties.length > 0 && (
            <section className="container mx-auto px-4 py-8 md:py-16">
              <h3 className="text-xl md:text-3xl font-bold mb-4 md:mb-8">{t("popularInHaji")}</h3>
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                {hajiProperties.slice(0, 4).map((property) => (
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
                  />
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        /* Empty State */
        <section className="container mx-auto px-4 py-20">
          <div className="text-center max-w-md mx-auto">
            <Home className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">{t("noPropertiesYet")}</h2>
            <p className="text-muted-foreground mb-6">
              {t("noPropertiesDesc")}
            </p>
            <Button onClick={() => navigate("/add-listing")} size="lg">
              {t("addYourProperty")}
            </Button>
          </div>

          {/* Still show region cards */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold mb-2 text-center">{t("discoverKurdistan")}</h2>
            <p className="text-muted-foreground text-center mb-8">
              {t("exploreRegions")}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {regions.map((region) => (
                <RegionCard
                  key={region.name}
                  name={region.name}
                  description={region.description}
                  image={region.image}
                  propertyCount={region.propertyCount}
                  onClick={() => navigate(`/search${region.searchParams}`)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

    </AppLayout>
  );
};

export default Index;
