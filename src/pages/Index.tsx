import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import SearchBar from "@/components/SearchBar";
import PropertyCard from "@/components/PropertyCard";
import RegionCard from "@/components/RegionCard";
import { useProperties } from "@/hooks/useProperties";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import heroBanner from "@/assets/hero-banner.jpg";
import kurdish1 from "@/assets/property-kurdish-1.jpg";
import kurdish8 from "@/assets/property-kurdish-8.jpg";
import { useTranslation } from "@/hooks/useTranslation";
import { Star, Loader2, Home, CheckCircle2, XCircle, Clock, RefreshCw, Eye, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMyHostVerification } from "@/hooks/useHostVerification";

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: hostVerification } = useMyHostVerification();
  const { formatPrice } = useCurrency();
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

  // Public listings: only approved & active. Excludes any rejected/pending
  // properties belonging to the current host so they never appear in public sections.
  const publicProperties = (properties || []).filter(
    (p: any) => p.is_active && p.approval_status === "approved"
  );

  // Current host's own properties (all statuses) — used for the host-only "My Properties" section.
  const myProperties = user
    ? (properties || []).filter((p: any) => p.host_id === user.id)
    : [];

  // Get properties by city (public approved only)
  const getPropertiesByCity = (city: string) => {
    return publicProperties.filter((p) =>
      p.city.toLowerCase().includes(city.toLowerCase())
    );
  };

  // Recently reviewed (public approved only)
  const recentlyReviewed = [...publicProperties]
    .sort((a, b) => (b.review_count || 0) - (a.review_count || 0))
    .slice(0, 3);

  // Get featured properties
  const featuredProperties = publicProperties.filter((p) => p.is_featured);

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
  const isVerifiedHost = !!user && hostVerification?.status === "approved";
  const hostCtaPath = !user
    ? "/auth?mode=signup&redirect=/host/verification"
    : isVerifiedHost
      ? "/host/add-listing"
      : "/host/verification";

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

      {/* My Properties — visible only to logged-in hosts (users who own properties) */}
      {user && myProperties.length > 0 && (
        <section className="container mx-auto px-4 pt-6 md:pt-10">
          <div className="rounded-2xl border border-border bg-muted/30 p-4 md:p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 min-w-0">
                <Home className="h-5 w-5 md:h-6 md:w-6 text-primary shrink-0" />
                <h2 className="text-base md:text-2xl font-bold truncate">My Properties</h2>
                <Badge variant="secondary" className="text-[10px] md:text-xs shrink-0">
                  {myProperties.length}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="shrink-0 text-primary hover:text-primary"
                onClick={() => navigate("/host/dashboard")}
              >
                Manage all
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
              {myProperties.slice(0, 6).map((p: any) => {
                const s = p.approval_status;
                const badge =
                  s === "approved"
                    ? { label: "Live", icon: CheckCircle2, cls: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30" }
                    : s === "rejected"
                    ? { label: "Rejected", icon: XCircle, cls: "bg-destructive/10 text-destructive border-destructive/30" }
                    : s === "changes_pending"
                    ? { label: "Edits pending", icon: RefreshCw, cls: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30" }
                    : { label: "Pending review", icon: Clock, cls: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30" };
                const Icon = badge.icon;
                const canView = s === "approved";
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card transition-shadow hover:shadow-sm"
                  >
                    <img
                      src={p.images?.[0] || "/placeholder.svg"}
                      alt={p.title}
                      className="h-14 w-14 md:h-16 md:w-16 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm truncate max-w-full">{p.title}</p>
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${badge.cls}`}>
                          <Icon className="h-3 w-3 mr-1" />
                          {badge.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{p.location}</p>
                      <p className="text-xs text-primary font-semibold mt-0.5">
                        {formatPrice(p.price_per_night)}/night
                      </p>
                      {s === "rejected" && p.rejection_reason && (
                        <p className="text-[11px] text-destructive mt-1 line-clamp-2">
                          Reason: {p.rejection_reason}
                        </p>
                      )}
                    </div>
                    {canView && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="shrink-0"
                        onClick={() => navigate(`/property/${p.id}`)}
                        aria-label="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            <Button
              variant="default"
              className="w-full mt-4 h-11"
              onClick={() => navigate(hostCtaPath)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isVerifiedHost ? "Add new property" : "Become host"}
            </Button>
          </div>
        </section>
      )}


      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : publicProperties.length > 0 ? (
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
                    approvalStatus={(property as any).approval_status}
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
                    approvalStatus={(property as any).approval_status}
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
                    approvalStatus={(property as any).approval_status}
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
            <Button onClick={() => navigate(hostCtaPath)} size="lg">
              {isVerifiedHost ? t("addYourProperty") : "Become host"}
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
