import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useProperties } from "@/hooks/useProperties";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Home, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import kurdish1 from "@/assets/property-kurdish-1.jpg";
import kurdish8 from "@/assets/property-kurdish-8.jpg";

interface Region {
  name: string;
  description: string;
  image: string;
}

const DiscoverPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: settings, isLoading: settingsLoading } = useSiteSettings();
  const { data: properties } = useProperties();
  const [searchQuery, setSearchQuery] = useState("");

  const regions: Region[] = (settings?.regions_list as Region[]) || [];
  const defaultImages = [kurdish1, kurdish8];

  const getPropertyCount = (regionName: string) => {
    return properties?.filter(p => 
      p.city.toLowerCase().includes(regionName.toLowerCase()) ||
      p.location?.toLowerCase().includes(regionName.toLowerCase())
    ).length || 0;
  };

  const filteredRegions = regions.filter(region =>
    region.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    region.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t("discoverKurdistanTitle")}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">{t("discoverKurdistanPageDesc")}</p>
          
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={t("searchRegions")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
        </div>

        {settingsLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredRegions.length === 0 ? (
          <div className="text-center py-20">
            <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">
              {regions.length === 0 ? t("noRegionsYet") : t("noRegionsFound")}
            </h2>
            <p className="text-muted-foreground">
              {regions.length === 0 ? t("regionsComingSoon") : t("adjustSearch")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRegions.map((region, index) => {
              const propertyCount = getPropertyCount(region.name);
              const imageUrl = region.image || defaultImages[index % defaultImages.length];
              
              return (
                <Card 
                  key={region.name}
                  className="overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300"
                  onClick={() => navigate(`/search?location=${encodeURIComponent(region.name)}`)}
                >
                  <div className="relative h-56 overflow-hidden">
                    <img 
                      src={imageUrl} 
                      alt={region.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-2xl font-bold mb-1">{region.name}</h3>
                      <div className="flex items-center gap-2 text-sm">
                        <Home className="h-4 w-4" />
                        <span>{propertyCount} {t("properties")}</span>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-muted-foreground text-sm line-clamp-2">
                      {region.description || `${t("discoverStaysIn")} ${region.name}`}
                    </p>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto mt-2 text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/search?location=${encodeURIComponent(region.name)}`);
                      }}
                    >
                      {t("viewProperties")} →
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

    </AppLayout>
  );
};

export default DiscoverPage;
