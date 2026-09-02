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
import {
  Sparkles,
  Percent,
  Camera,
  Award,
  Banknote,
  Headphones,
  Calendar,
  ShieldCheck,
  HeartHandshake,
  CheckCircle,
  HelpCircle,
  Building2,
  Home,
  ArrowRight,
} from "lucide-react";

export const PreLaunchSections: React.FC = () => {
  const { settings, openAddPropertyModal } = usePreLaunch();
  const { user } = useAuth();

  const perkIconMap: Record<string, React.ElementType> = {
    Percent: Percent,
    Camera: Camera,
    Award: Award,
    Banknote: Banknote,
    Headphones: Headphones,
    Calendar: Calendar,
  };

  return (
    <div className="space-y-16 md:space-y-24 py-12 md:py-20 bg-background text-foreground">
      {/* 1. What is MEEWANO? Section */}
      <section id="what-is-meewano" className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3 border border-primary/20">
            <Sparkles className="h-3.5 w-3.5" />
            Platform Concept & Host Advantages
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            What is MEEWANO? (میوانۆ)
          </h2>
          <p className="mt-3 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Kurdistan’s purpose-built vacation rental ecosystem. We empower local property owners to share authentic hospitality with travelers while maintaining full pricing and calendar autonomy.
          </p>
        </div>

        {/* Perks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {settings.perks.map((perk) => {
            const Icon = perkIconMap[perk.icon] || Sparkles;
            return (
              <div
                key={perk.id}
                className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/50 flex flex-col justify-between"
              >
                <div>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {perk.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {perk.description}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-border/50 flex items-center text-xs font-semibold text-primary">
                  <span>Host Benefit</span>
                  <CheckCircle className="h-3.5 w-3.5 ml-1.5" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. About Us Section */}
      <section id="about-us" className="bg-muted/30 border-y border-border py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Mission & Values */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                <HeartHandshake className="h-3.5 w-3.5" />
                Our Story & Vision
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                About Us
              </h2>
              <h3 className="text-lg font-semibold text-primary">
                Rooted in Kurdish Generosity. Built for Modern Hospitality.
              </h3>

              <div className="space-y-3.5 text-sm sm:text-base text-muted-foreground leading-relaxed">
                <p>
                  In the Kurdish language, <strong className="text-foreground">"Meewano" (میوانۆ)</strong> translates to <em>"Guest"</em>—traditionally regarded as the most honored person in any household. For generations, Kurdish culture has been celebrated for open doors, warm glasses of mountain chai, and welcoming visitors with genuine warmth.
                </p>
                <p>
                  Meewano modernizes this timeless tradition into an intuitive digital platform engineered specifically for Kurdistan. We streamline verified guest identities and offer multilingual concierge support in Kurdish, English, and Arabic.
                </p>
                <p>
                  Whether you own an alpine stone chalet in Rawanduz, a lakefront retreat in Dukan, or a high-rise luxury apartment in Erbil, Meewano gives you the tools to succeed as an independent host.
                </p>
              </div>

              <div className="pt-3">
                <Link to={user ? "/host" : "/become-host"}>
                  <Button className="rounded-full bg-primary hover:bg-primary/90 font-semibold px-6">
                    <Sparkles className="h-4 w-4 mr-2" />
                    {user ? "Host Dashboard" : "Become a Host"}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column: Key Highlights Box */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-xl space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg">
                    می
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">Meewano Kurdistan</h4>
                    <p className="text-xs text-muted-foreground">Premier Vacation Rental Network</p>
                  </div>
                </div>

                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground block">Free Pre-Registration</strong>
                      <span className="text-xs text-muted-foreground">No upfront sign-up fees or credit cards needed.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground block">Verified Guest Community</strong>
                      <span className="text-xs text-muted-foreground">Phone number and identity validation on all guests.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground block">Full Calendar Autonomy</strong>
                      <span className="text-xs text-muted-foreground">Total freedom to set your nightly pricing and availability.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground block">Host Protection & Support</strong>
                      <span className="text-xs text-muted-foreground">Dedicated regional concierge team on WhatsApp and phone.</span>
                    </div>
                  </div>
                </div>
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
            Host Knowledge Base
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Everything you need to know about adding your property during pre-launch.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm">
          <Accordion type="single" collapsible className="w-full space-y-2">
            {settings.faqs.map((faq, index) => (
              <AccordionItem
                key={faq.id || index}
                value={`faq-${index}`}
                className="border border-border/70 rounded-xl px-4 py-1 data-[state=open]:border-primary/40 data-[state=open]:bg-muted/20"
              >
                <AccordionTrigger className="text-left font-semibold text-sm sm:text-base text-foreground hover:text-primary transition-colors py-3.5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pt-1 pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}

            {/* Additional curated FAQs for pre-launch */}
            <AccordionItem
              value="faq-extra-1"
              className="border border-border/70 rounded-xl px-4 py-1 data-[state=open]:border-primary/40 data-[state=open]:bg-muted/20"
            >
              <AccordionTrigger className="text-left font-semibold text-sm sm:text-base text-foreground hover:text-primary transition-colors py-3.5">
                When does guest booking go live?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pt-1 pb-4">
                Public bookings will officially open once our host network across all key governorates (Erbil, Sulaymaniyah, Duhok) reaches our initial launch target. All pre-registered hosts will be notified prior to calibrate calendars and confirm pricing.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="faq-extra-2"
              className="border border-border/70 rounded-xl px-4 py-1 data-[state=open]:border-primary/40 data-[state=open]:bg-muted/20"
            >
              <AccordionTrigger className="text-left font-semibold text-sm sm:text-base text-foreground hover:text-primary transition-colors py-3.5">
                How do listing approvals work?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pt-1 pb-4">
                During the pre-launch phase, any property you add is immediately available for preview in the pre-launch feed. Prior to public booking launch, our local concierge team verifies property ownership and ensures house rules are set.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="faq-extra-3"
              className="border border-border/70 rounded-xl px-4 py-1 data-[state=open]:border-primary/40 data-[state=open]:bg-muted/20"
            >
              <AccordionTrigger className="text-left font-semibold text-sm sm:text-base text-foreground hover:text-primary transition-colors py-3.5">
                Are there registration fees during pre-launch?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pt-1 pb-4">
                None at all! Pre-registering and listing your property on Meewano is 100% free with no hidden charges.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* 4. Pre-Launch Final Call to Action Banner (Primary Brand Theme) */}
      <section className="container mx-auto px-4 max-w-5xl">
        <div className="rounded-3xl bg-gradient-to-r from-primary via-primary/95 to-primary p-8 sm:p-12 text-center text-primary-foreground shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/25 text-white text-xs font-bold border border-white/20">
              <Sparkles className="h-3.5 w-3.5" />
              Pioneer Host Registration Open
            </span>

            <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Ready to showcase your Kurdish stay to the world?
            </h3>

            <p className="text-sm sm:text-base text-white/90 font-normal leading-relaxed">
              Join homeowners across Erbil, Sulaymaniyah, Duhok, and Rawanduz.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to={user ? "/host" : "/become-host"} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-12 px-8 rounded-full bg-slate-950 hover:bg-slate-900 text-white font-bold shadow-lg transition-transform hover:scale-105"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {user ? "Host Dashboard" : "Become a Host Now"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PreLaunchSections;
