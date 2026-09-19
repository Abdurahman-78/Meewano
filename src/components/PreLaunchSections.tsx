import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  UserPlus,
  Camera,
  CalendarCheck,
  HeartHandshake,
} from "lucide-react";

export const PreLaunchSections: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const steps = [
    {
      id: "01",
      icon: UserPlus,
      title: t("hwRegister"),
      desc: t("hwRegisterDesc"),
      highlight: "Quick 2-minute sign up",
    },
    {
      id: "02",
      icon: Camera,
      title: t("hwPublish"),
      desc: t("hwPublishDesc"),
      highlight: "Photos, pricing & rules",
    },
    {
      id: "03",
      icon: CalendarCheck,
      title: t("hwBookings"),
      desc: t("hwBookingsDesc"),
      highlight: "Direct verified bookings",
    },
    {
      id: "04",
      icon: HeartHandshake,
      title: t("hwHost"),
      desc: t("hwHostDesc"),
      highlight: "0% commission first 10 stays",
    },
  ];

  const faqs = [
    { question: t("faq1q"), answer: t("faq1a") },
    { question: t("faq2q"), answer: t("faq2a") },
    { question: t("faq3q"), answer: t("faq3a") },
    { question: t("faq4q"), answer: t("faq4a") },
    { question: t("faq5q"), answer: t("faq5a") },
  ];

  return (
    <div className="space-y-16 md:space-y-24 py-12 md:py-20 bg-background text-foreground">
      {/* 1. What is MEEWANO? Section */}
      <section id="what-is-meewano" className="container mx-auto px-4 max-w-5xl">
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-background p-8 sm:p-12 md:p-16 shadow-sm">
          {/* Ambient Decorative Accents */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            {/* Main Title */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground mb-6">
              {t("whatIsMeewano")}
            </h2>

            {/* Cultural Meaning & Primary Description */}
            <p className="text-base sm:text-lg md:text-xl font-medium text-foreground/90 leading-relaxed mb-5">
              {t("whatIsMeewanoDesc1")}
            </p>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              {t("whatIsMeewanoDesc2")}
            </p>
          </div>
        </div>
      </section>

      {/* 2. How It Works Section */}
      <section id="how-it-works" className="container mx-auto px-4 max-w-6xl">
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground mb-4">
            {t("howItWorks")}
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
            From registering your space to welcoming your first guest, hosting on Meewano is effortless.
          </p>
        </div>

        {/* 4-Step Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => (
            <div
              key={step.id}
              className="group relative flex flex-col justify-between p-6 rounded-2xl border border-border bg-card shadow-xs hover:shadow-md hover:border-primary/40 transition-all duration-300"
            >
              {/* Step Header with Number and Icon */}
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="text-3xl font-black font-mono text-muted-foreground/30 group-hover:text-primary/60 transition-colors">
                    {step.id}
                  </span>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105 transition-all duration-300 shadow-xs">
                    <step.icon className="w-5 h-5" />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {step.desc}
                </p>
              </div>

              {/* Step Bottom Highlight without Sparkles icon */}
              <div className="pt-4 border-t border-border/70 text-xs font-semibold text-primary">
                <span className="truncate block">{step.highlight}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="mt-12 text-center">
          <Link to={user ? "/host" : "/become-host"}>
            <Button
              size="lg"
              className="h-12 px-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md hover:scale-105 active:scale-95 transition-all"
            >
              {t("registerYourProperty")}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* 3. Frequently Asked Questions (FAQ) Section */}
      <section id="host-faq" className="container mx-auto px-4 max-w-4xl scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground mb-4">
            {t("faqs")}
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
            {t("faqDesc")}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 sm:p-8 shadow-xs">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, idx) => (
              <AccordionItem
                key={idx}
                value={`faq-${idx}`}
                className={idx === faqs.length - 1 ? "border-b-0" : "border-b border-border/70"}
              >
                <AccordionTrigger className="text-left font-bold text-base sm:text-lg hover:text-primary py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm sm:text-base text-muted-foreground leading-relaxed pb-4">
                  {faq.answer}
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
