import React from "react";
import heroBanner from "@/assets/hero-banner.jpg";
import { Button } from "@/components/ui/button";
import { usePreLaunch } from "@/contexts/PreLaunchContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Link } from "react-router-dom";
import {
  Home,
  ArrowDown,
} from "lucide-react";

export const PreLaunchHero: React.FC = () => {
  const { t } = useTranslation();
  const { openAddPropertyModal } = usePreLaunch();
  const { user } = useAuth();

  const scrollToProperties = () => {
    const el = document.getElementById("prelaunch-properties-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-[440px] md:min-h-[520px] overflow-hidden flex items-center justify-center">
      {/* Background with Darkened Gradient Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
        style={{ backgroundImage: `url(${heroBanner})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/85" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-14 md:py-20 text-center max-w-4xl">
        {/* Hero Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] mb-5 max-w-3xl mx-auto">
          {t("launchingSoon")}
        </h1>

        {/* Onboarding Messaging Subtitle */}
        <p className="text-base sm:text-lg md:text-xl text-neutral-200 font-normal max-w-2xl mx-auto mb-8 leading-relaxed">
          {t("preLaunchHeroSubtitle")}
        </p>

        {/* Hero Call-to-Actions */}
        <div className="flex flex-col items-center justify-center">
          <Link to={user ? "/host" : "/become-host"} className="w-full sm:w-auto">
            <Button
              id="hero-become-host-btn"
              size="lg"
              className="w-full sm:w-auto h-12 md:h-14 px-8 sm:px-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 border border-primary/30"
            >
              {t("registerYourProperty")}
            </Button>
          </Link>
          <p className="text-xs sm:text-sm text-neutral-300 font-medium mt-3.5 max-w-lg mx-auto">
            {t("first100HostsOffer")}
          </p>
        </div>
      </div>
    </section>
  );
};

export default PreLaunchHero;
