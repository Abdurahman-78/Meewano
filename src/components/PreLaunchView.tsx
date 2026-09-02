import React, { useState } from "react";
import PreLaunchHero from "@/components/PreLaunchHero";
import PreLaunchPropertyCard from "@/components/PreLaunchPropertyCard";
import PreLaunchSections from "@/components/PreLaunchSections";
import { usePreLaunch } from "@/contexts/PreLaunchContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Plus, Home, Search, MapPin, SlidersHorizontal, Eye } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

export const PreLaunchView: React.FC = () => {
  const { user } = useAuth();
  const { properties, openAddPropertyModal } = usePreLaunch();

  const [selectedCity, setSelectedCity] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const CITIES = ["All", "Erbil", "Sulaymaniyah", "Duhok", "Rawanduz", "Shaqlawa", "Ranya", "Haji Omran"];

  const filteredProperties = properties.filter((prop) => {
    const matchesCity =
      selectedCity === "All" ||
      prop.city.toLowerCase() === selectedCity.toLowerCase() ||
      prop.location.toLowerCase().includes(selectedCity.toLowerCase());

    const matchesSearch =
      !searchQuery.trim() ||
      prop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prop.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prop.city.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCity && matchesSearch;
  });

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Pre-Launch Hero Section */}
      <PreLaunchHero />

      {/* 2. Pre-Launch Property Feed Section */}
      <section
        id="prelaunch-properties-section"
        className="container mx-auto px-4 py-12 md:py-16 scroll-mt-20"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="h-3.5 w-3.5" />
                Preview Directory
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                ({properties.length} Properties Registered)
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              Featured Upcoming Stays in Kurdistan
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-1 max-w-xl">
              Explore founding properties and chalets. Guest bookings activate during public launch.
            </p>
          </div>

          <Link to={user ? "/host/add-listing" : "/become-host"}>
            <Button
              id="prelaunch-add-property-btn"
              className="rounded-full bg-primary hover:bg-primary/90 font-semibold px-5 shadow-sm shrink-0 self-start md:self-end flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Property</span>
            </Button>
          </Link>
        </div>

        {/* City Filter Pills & Quick Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-8 bg-muted/40 p-2.5 rounded-2xl border border-border">
          {/* City Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {CITIES.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCity === city
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "bg-background text-muted-foreground hover:text-foreground hover:bg-card border border-border/70"
                }`}
              >
                {city === "All" ? "All Locations" : city}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[200px] sm:max-w-xs">
            <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search stays or areas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 text-xs rounded-full bg-background border-border/80"
            />
          </div>
        </div>

        {/* Property Grid */}
        {filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProperties.map((property) => (
              <PreLaunchPropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-border bg-muted/20 max-w-md mx-auto">
            <Home className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-60" />
            <h3 className="text-lg font-bold text-foreground mb-1">No stays matched your filter</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Try adjusting your city selection or list a new space in this region.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedCity("All");
                setSearchQuery("");
              }}
            >
              Reset Filters
            </Button>
          </div>
        )}
      </section>

      {/* 3. Informational Sections: What is MEEWANO?, About Us, Host FAQ */}
      <PreLaunchSections />
    </div>
  );
};

export default PreLaunchView;
