import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Users,
  CalendarDays,
  Tag,
  MessageCircleOff,
  ShieldCheck,
  MapPin,
  ArrowRight,
} from "lucide-react";

export const PreLaunchWhyList: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const benefits = [
    { icon: Users, title: t("whyReachGuests"), desc: t("whyReachGuestsDesc") },
    { icon: CalendarDays, title: t("whyMoreBookings"), desc: t("whyMoreBookingsDesc") },
    { icon: Tag, title: t("whySetPrices"), desc: t("whySetPricesDesc") },
    { icon: MessageCircleOff, title: t("whyLessNegotiation"), desc: t("whyLessNegotiationDesc") },
    { icon: ShieldCheck, title: t("whyBuildTrust"), desc: t("whyBuildTrustDesc") },
    { icon: MapPin, title: t("whyLocalPlatform"), desc: t("whyLocalPlatformDesc") },
  ];

  return (
    <section id="why-list" className="py-14 md:py-20 bg-muted/20 border-b border-border">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            {t("whyListTitle")}
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("whyListSubtitle")}
          </p>
        </div>

        {/* 6 Core Advantages Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
          {benefits.map((item, i) => (
            <div
              key={i}
              className="group relative flex flex-col p-6 sm:p-7 rounded-2xl border border-border bg-card shadow-xs hover:shadow-md hover:border-primary/40 transition-all duration-300"
            >
              <div className="w-13 h-13 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105 transition-all duration-300 shadow-xs">
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Register CTA Button */}
        <div className="flex flex-col items-center justify-center text-center">
          <Link to={user ? "/host" : "/become-host"}>
            <Button
              size="lg"
              className="h-12 md:h-13 px-8 rounded-full bg-primary hover:bg-primary/90 font-bold text-base text-primary-foreground shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <span>{t("registerYourProperty")}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-3">
            {t("first100HostsOffer")}
          </p>
        </div>
      </div>
    </section>
  );
};

export default PreLaunchWhyList;
