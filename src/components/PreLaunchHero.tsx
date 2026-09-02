import React from "react";
import heroBanner from "@/assets/hero-banner.jpg";
import { Button } from "@/components/ui/button";
import { usePreLaunch } from "@/contexts/PreLaunchContext";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Home,
  ArrowDown,
} from "lucide-react";

export const PreLaunchHero: React.FC = () => {
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
        {/* Prominent Coming Soon Notification Badge matching brand */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 text-primary border border-primary/40 backdrop-blur-md text-xs md:text-sm font-semibold mb-6 shadow-lg">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-white">Coming Soon • Kurdistan Pioneer Pre-Launch</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] mb-5">
          Meewano is launching soon!
          <span className="block text-primary font-extrabold mt-1 text-2xl sm:text-3xl md:text-4xl">
            Become a host today.
          </span>
        </h1>

        {/* Onboarding Messaging Subtitle */}
        <p className="text-base sm:text-lg md:text-xl text-neutral-200 font-normal max-w-2xl mx-auto mb-8 leading-relaxed">
          Kurdistan’s dedicated vacation rental platform. Pre-register your villa, chalet, or modern apartment across Erbil, Sulaymaniyah, Duhok, Rawanduz, and beyond.
        </p>

        {/* Hero Call-to-Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link to={user ? "/host" : "/become-host"} className="w-full sm:w-auto">
            <Button
              id="hero-become-host-btn"
              size="lg"
              className="w-full h-12 md:h-14 px-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 border border-primary/30"
            >
              <Sparkles className="h-5 w-5" />
              {user ? "Host Dashboard" : "Become a Host"}
            </Button>
          </Link>

          <Button
            id="hero-preview-stays-btn"
            size="lg"
            variant="outline"
            className="w-full sm:w-auto h-12 md:h-14 px-7 rounded-full bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-md font-semibold text-base transition-all flex items-center justify-center gap-2"
            onClick={scrollToProperties}
          >
            <ArrowDown className="h-4 w-4" />
            Preview Demo Stays
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PreLaunchHero;
