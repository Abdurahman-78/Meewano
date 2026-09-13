import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { usePreLaunch } from "@/contexts/PreLaunchContext";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import {
  HeartHandshake,
  CheckCircle,
  HelpCircle,
  Building2,
  ArrowRight,
  Users,
  CalendarDays,
  Tag,
  MessageCircleOff,
  ShieldCheck,
  MapPin,
} from "lucide-react";

export const PreLaunchSections: React.FC = () => {
  const { settings } = usePreLaunch();
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="space-y-16 md:space-y-24 py-12 md:py-20 bg-background text-foreground">
      {/* 1. What is MEEWANO? Section */}
      <section id="what-is-meewano" className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6">
            {t("whatIsMeewano")}
          </h2>
          <div className="max-w-2xl mx-auto space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
            <p className="text-base sm:text-lg text-primary/90 font-medium leading-relaxed">
              {t("whatIsMeewanoDesc1")}
            </p>
            <p className="text-sm sm:text-base text-primary/80 leading-relaxed">
              {t("whatIsMeewanoDesc2")}
            </p>
          </div>
        </div>

        {/* How it Works Grid */}
      </section>
      
      <section id="how-it-works" className="container mx-auto px-4 py-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {t("howItWorks")}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {[
            { id: 1, title: t("hwRegister"), desc: t("hwRegisterDesc") },
            { id: 2, title: t("hwPublish"), desc: t("hwPublishDesc") },
            { id: 3, title: t("hwBookings"), desc: t("hwBookingsDesc") },
            { id: 4, title: t("hwHost"), desc: t("hwHostDesc") },
          ].map((step) => (
            <div key={step.id} className="flex flex-col items-center text-center space-y-4">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold shrink-0 shadow-lg">
                  {step.id}
                </div>
                <div className="h-14 border border-border flex items-center justify-center px-6 min-w-[140px] bg-card shadow-sm">
                  <h3 className="text-lg font-mono font-medium text-foreground">
                    {step.title}
                  </h3>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[240px]">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Why List Your Property with Meewano? Section */}
      <section id="why-list" className="bg-background py-16 md:py-24 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
              {t("whyListTitle")}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t("whyListSubtitle")}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 max-w-6xl mx-auto mb-16">
            {[
              { icon: Users, title: t("whyReachGuests"), desc: t("whyReachGuestsDesc") },
              { icon: CalendarDays, title: t("whyMoreBookings"), desc: t("whyMoreBookingsDesc") },
              { icon: Tag, title: t("whySetPrices"), desc: t("whySetPricesDesc") },
              { icon: MessageCircleOff, title: t("whyLessNegotiation"), desc: t("whyLessNegotiationDesc") },
              { icon: ShieldCheck, title: t("whyBuildTrust"), desc: t("whyBuildTrustDesc") },
              { icon: MapPin, title: t("whyLocalPlatform"), desc: t("whyLocalPlatformDesc") },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <item.icon className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-foreground">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm max-w-sm">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <Link to={user ? "/host" : "/become-host"}>
              <Button className="rounded-full bg-primary hover:bg-primary/90 font-semibold px-8 py-6 text-lg text-primary-foreground shadow-md transition-all hover:scale-105">
                {t("registerYourProperty")} &rarr;
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. {t("aboutUs")} Section */}
      <section id="about-us" className="bg-muted/30 border-y border-border py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Mission & Values */}
            <div className="lg:col-span-12 space-y-5 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                <HeartHandshake className="h-3.5 w-3.5" />
                {t("ourStoryVision")}
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                {t("aboutUs")}
              </h2>
              <h3 className="text-lg font-semibold text-primary">
                {t("aboutUsSubtitle")}
              </h3>
              <div className="space-y-3.5 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-3xl mx-auto text-left">
                <p>{t("aboutUsP1")}</p>
                <p>{t("aboutUsP2")}</p>
                <p>{t("aboutUsP3")}</p>
                <p>{t("aboutUsP4")}</p>
                <p>{t("aboutUsP5")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Host FAQ Section (Accordion) */}
      <section id="host-faq" className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-bold mb-3 border border-border">
            <HelpCircle className="h-3.5 w-3.5 text-primary" />
            {t("hostKb")}
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            {t("faqs")}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            {t("faqDesc")}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm">
          <Accordion type="single" collapsible className="w-full space-y-2">
            {[1, 2, 3, 4, 5].map((num) => (
              <AccordionItem
                key={num}
                value={`faq-${num}`}
                className="border border-border/70 rounded-xl px-4 py-1 data-[state=open]:border-primary/40 data-[state=open]:bg-muted/20"
              >
                <AccordionTrigger className="text-left font-semibold text-sm sm:text-base text-foreground hover:text-primary transition-colors py-3.5">
                  {t(`faq${num}q` as any)}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pt-1 pb-4">
                  {t(`faq${num}a` as any)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
};
export default PreLaunchSections;
