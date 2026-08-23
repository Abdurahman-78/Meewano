import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Home,
  CheckCircle2,
  Calendar,
  DollarSign,
  Camera,
  Award,
  Headphones,
  Percent,
  MapPin,
  Users,
  Building,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
  Clock,
  ArrowRight,
  Phone,
  Mail,
  Send,
  Bed,
  Bath,
  Star,
  Eye,
  Check,
  Globe,
  ExternalLink,
  Zap,
  Languages,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  usePreLaunchSettings,
  usePreLaunchDemoProperties,
  useSubmitPreLaunchHost,
} from "@/hooks/usePreLaunch";
import { PreLaunchDemoProperty } from "@/types/preLaunch";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { preLaunchContent } from "@/i18n/preLaunchTranslations";
import { toast } from "sonner";

export default function PreLaunch() {
  const { data: settings } = usePreLaunchSettings();
  const { data: demoProperties = [] } = usePreLaunchDemoProperties();
  const submitHost = useSubmitPreLaunchHost();
  const { formatPrice, currency, setCurrency } = useCurrency();
  const { language, setLanguage, dir } = useLanguage();

  // Localized dictionary
  const t = preLaunchContent[language] || preLaunchContent.en;

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Erbil");
  const [propertyType, setPropertyType] = useState("Chalet / Mountain Villa");
  const [bedrooms, setBedrooms] = useState("2");
  const [maxGuests, setMaxGuests] = useState("4");
  const [experience, setExperience] = useState("New to hosting");
  const [notes, setNotes] = useState("");
  const [submittedData, setSubmittedData] = useState<any | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // Demo property modal state
  const [selectedDemoProp, setSelectedDemoProp] = useState<PreLaunchDemoProperty | null>(null);
  const [activeRegionFilter, setActiveRegionFilter] = useState("all");

  // Calculator State
  const [calcNights, setCalcNights] = useState(14);
  const [calcRate, setCalcRate] = useState(180000);

  // Countdown timer
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 45, hours: 12, minutes: 30, seconds: 0 });

  useEffect(() => {
    const targetDate = settings?.target_launch_date
      ? new Date(settings.target_launch_date).getTime()
      : new Date("2026-10-15T00:00:00Z").getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [settings?.target_launch_date]);

  const filteredDemoProperties = useMemo(() => {
    const activeList = demoProperties.filter((p) => p.is_active !== false);
    if (activeRegionFilter === "all") return activeList;
    return activeList.filter(
      (p) =>
        p.city.toLowerCase().includes(activeRegionFilter.toLowerCase()) ||
        p.location.toLowerCase().includes(activeRegionFilter.toLowerCase())
    );
  }, [demoProperties, activeRegionFilter]);

  const handlePreRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      toast.error(
        language === "ku"
          ? "تکایە ناوی تەواو و ئیمەیڵ و ژمارەی مۆبایل بنووسە."
          : language === "ar"
          ? "يرجى كتابة الاسم الكامل والبريد الإلكتروني ورقم الهاتف."
          : "Please fill in your name, email, and phone number."
      );
      return;
    }

    try {
      const result = await submitHost.mutateAsync({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        city,
        property_type: propertyType,
        bedrooms: parseInt(bedrooms) || 1,
        max_guests: parseInt(maxGuests) || 2,
        experience,
        notes: notes.trim() || null,
      });

      setSubmittedData(result);
      setShowSuccessDialog(true);
      toast.success(
        language === "ku"
          ? "بەخێربێیت! پێش-تۆمارکردنەکەت بە سەرکەوتوویی تەواو بوو."
          : language === "ar"
          ? "مرحباً بك! تم تأكيد تسجيلك المسبق بنجاح."
          : "Welcome aboard! Your pre-registration is confirmed."
      );

      // Reset form fields
      setFullName("");
      setEmail("");
      setPhone("");
      setNotes("");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit pre-registration");
    }
  };

  const getPerkIcon = (iconName: string) => {
    switch (iconName) {
      case "Percent":
        return <Percent className="h-6 w-6 text-primary" />;
      case "Camera":
        return <Camera className="h-6 w-6 text-amber-500" />;
      case "Award":
        return <Award className="h-6 w-6 text-primary" />;
      case "Banknote":
        return <DollarSign className="h-6 w-6 text-rose-400" />;
      case "Headphones":
        return <Headphones className="h-6 w-6 text-sky-400" />;
      case "Calendar":
        return <Calendar className="h-6 w-6 text-rose-500" />;
      default:
        return <Sparkles className="h-6 w-6 text-primary" />;
    }
  };

  const calculatedMonthly = calcNights * calcRate;
  const calculatedYearly = calculatedMonthly * 12;

  return (
    <div
      dir={dir}
      className={`min-h-screen bg-[#0b0e17] text-slate-100 selection:bg-primary selection:text-white antialiased ${
        language === "ku" || language === "ar" ? "font-sans text-right" : "font-sans text-left"
      }`}
    >
      {/* Top Pre-Launch Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0b0e17]/90 border-b border-slate-800/80 transition-all">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <img
                src="/favicon.png"
                alt="Meewano"
                className="h-8 sm:h-9 w-auto drop-shadow-md group-hover:scale-105 transition-transform"
              />
              <span className="text-primary text-[10px] px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/30 uppercase tracking-widest font-bold whitespace-nowrap">
                {t.preLaunchTag}
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-300">
            <a href="#about" className="hover:text-primary transition-colors">
              {t.navAbout}
            </a>
            <a href="#demo-properties" className="hover:text-primary transition-colors">
              {t.navShowcase}
            </a>
            <a href="#perks" className="hover:text-primary transition-colors">
              {t.navPerks}
            </a>
            <a href="#calculator" className="hover:text-primary transition-colors">
              {t.navCalculator}
            </a>
            <a href="#faq" className="hover:text-primary transition-colors">
              {t.navFaq}
            </a>
          </nav>

          {/* Action Tools: Language, Currency, Live App, Pre-Register */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-slate-800 bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs px-2.5 sm:px-3 h-9"
                >
                  <Globe className="h-3.5 w-3.5 mr-1.5 text-primary" />
                  <span className="font-semibold uppercase">{language}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200 min-w-[130px]">
                <DropdownMenuItem
                  onClick={() => setLanguage("ku")}
                  className={`cursor-pointer flex items-center justify-between text-xs py-2 ${
                    language === "ku" ? "text-primary font-bold bg-primary/10" : ""
                  }`}
                >
                  <span>کوردی (Kurdish)</span>
                  {language === "ku" && <CheckCheck className="h-3.5 w-3.5 text-primary" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLanguage("ar")}
                  className={`cursor-pointer flex items-center justify-between text-xs py-2 ${
                    language === "ar" ? "text-primary font-bold bg-primary/10" : ""
                  }`}
                >
                  <span>العربية (Arabic)</span>
                  {language === "ar" && <CheckCheck className="h-3.5 w-3.5 text-primary" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLanguage("en")}
                  className={`cursor-pointer flex items-center justify-between text-xs py-2 ${
                    language === "en" ? "text-primary font-bold bg-primary/10" : ""
                  }`}
                >
                  <span>English (EN)</span>
                  {language === "en" && <CheckCheck className="h-3.5 w-3.5 text-primary" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Currency Switcher */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrency(currency === "IQD" ? "USD" : "IQD")}
              className="hidden sm:inline-flex rounded-full text-slate-400 hover:text-white hover:bg-slate-900 text-xs border border-slate-800 h-9 px-2.5 font-bold"
            >
              {currency}
            </Button>

            {/* Live App Link */}
            <Link to="/" className="hidden sm:inline-flex">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white hover:bg-slate-900 text-xs border border-slate-800 h-9 rounded-full px-3"
              >
                {t.liveApp}
              </Button>
            </Link>

            {/* Pre-Register Button */}
            <a href="#pre-register-form">
              <Button
                size="sm"
                className="bg-gradient-to-r from-primary to-rose-500 hover:from-rose-500 hover:to-primary text-white font-extrabold text-xs sm:text-sm px-4 sm:px-5 h-9 sm:h-10 rounded-full shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40 hover:scale-[1.02]"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                {t.preRegisterHostBtn}
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section with Kurdish Hospitality & Signature Coral/Rose Colors */}
      <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32">
        {/* Background glow & subtle ambient light motif */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/15 blur-[140px] rounded-full" />
          <div className="absolute top-1/3 -right-20 w-[400px] h-[400px] bg-rose-500/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0b0e17] to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Pulsating Pre-Launch Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-bold tracking-wide shadow-inner shadow-primary/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              {settings?.badge_text || t.badgeText}
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.18]">
              {settings?.hero_title || t.heroTitle}
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto font-normal">
              {settings?.hero_subtitle || t.heroSubtitle}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a href="#pre-register-form" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-primary to-rose-500 hover:from-rose-500 hover:to-primary text-white font-extrabold text-base px-8 h-14 rounded-xl shadow-xl shadow-primary/25 transition-transform hover:-translate-y-0.5"
                >
                  <Home className="h-5 w-5 mr-2 shrink-0" />
                  {t.preRegisterCta}
                </Button>
              </a>

              <a href="#demo-properties" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-base h-14 rounded-xl backdrop-blur-sm"
                >
                  <Eye className="h-5 w-5 mr-2 text-primary shrink-0" />
                  {t.exploreShowcaseCta}
                </Button>
              </a>
            </div>

            {/* Launch Countdown */}
            <div className="pt-10">
              <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-3">
                {t.countdownTitle}
              </p>
              <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-md mx-auto">
                {[
                  { label: t.days, value: timeLeft.days },
                  { label: t.hours, value: timeLeft.hours },
                  { label: t.minutes, value: timeLeft.minutes },
                  { label: t.seconds, value: timeLeft.seconds },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="p-3 sm:p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-center shadow-lg hover:border-primary/30 transition-colors"
                  >
                    <span className="block text-2xl sm:text-3xl font-black text-white font-mono">
                      {String(item.value).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider font-semibold">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Ribbon */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 max-w-4xl mx-auto border-t border-slate-800/80">
              <div className="text-center p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
                <span className="text-2xl sm:text-3xl font-black text-primary block">
                  {settings?.registered_hosts_count || t.statHostsCount}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {t.statHostsLabel}
                </span>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
                <span className="text-2xl sm:text-3xl font-black text-white block">
                  {settings?.cities_count || t.statCitiesCount}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {t.statCitiesLabel}
                </span>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
                <span className="text-2xl sm:text-3xl font-black text-amber-400 block">
                  {t.statCommissionValue}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {t.statCommissionLabel}
                </span>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
                <span className="text-2xl sm:text-3xl font-black text-rose-300 block">
                  {t.statPayoutValue}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {t.statPayoutLabel}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us: What is Meewan? (مێوان چییە؟ / ما هو ميووان؟) Section */}
      <section id="about" className="py-20 bg-slate-900/50 border-y border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                {t.aboutBadge}
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {settings?.about_title || t.aboutTitle}
              </h2>

              <p className="text-lg font-bold text-primary">
                {settings?.about_tagline || t.aboutTagline}
              </p>

              <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
                <p>{t.aboutParagraph1}</p>
                <p>{t.aboutParagraph2}</p>
              </div>

              {/* 4 Core Pillars */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-slate-200">
                    {t.aboutPillar1}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-slate-200">
                    {t.aboutPillar2}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-slate-200">
                    {t.aboutPillar3}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-slate-200">
                    {t.aboutPillar4}
                  </span>
                </div>
              </div>
            </div>

            {/* Showcase Visual Card */}
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 p-3 hover:border-primary/40 transition-all">
                <img
                  src={demoProperties[0]?.image || "/assets/property-kurdish-1.jpg"}
                  alt="Rawanduz Kurdistan Chalet"
                  className="rounded-xl object-cover w-full h-[400px] sm:h-[480px]"
                />
                <div className="absolute inset-x-6 bottom-6 p-5 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                        {t.showcaseCardTag}
                      </p>
                      <h3 className="text-lg font-bold text-white mt-0.5">
                        {t.showcaseCardTitle}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {t.showcaseCardSub}
                      </p>
                    </div>
                    <Badge className="bg-primary text-white font-bold">
                      {t.showcaseCardBadge}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Kurdistan Demo Properties Showcase */}
      <section id="demo-properties" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold mb-3">
                <Building className="h-3.5 w-3.5 text-primary" />
                {t.showcaseBadge}
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {t.showcaseTitle}
              </h2>
              <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-xl">
                {t.showcaseSubtitle}
              </p>
            </div>

            {/* Region Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "all", label: t.regionAll },
                { id: "Erbil", label: t.regionErbil },
                { id: "Sulaymaniyah", label: t.regionSulaymaniyah },
                { id: "Duhok", label: t.regionDuhok },
                { id: "Rawanduz", label: t.regionRawanduz },
                { id: "Shaqlawa", label: t.regionShaqlawa },
                { id: "Soran", label: t.regionSoran },
                { id: "Halabja", label: t.regionHalabja },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveRegionFilter(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeRegionFilter === tab.id
                      ? "bg-primary text-white shadow-md shadow-primary/25 font-bold"
                      : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDemoProperties.map((property) => (
              <div
                key={property.id}
                onClick={() => setSelectedDemoProp(property)}
                className="group cursor-pointer rounded-2xl overflow-hidden bg-slate-900/90 border border-slate-800 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/15 flex flex-col"
              >
                {/* Property Image Container */}
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-950">
                  <img
                    src={property.image}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <Badge className="bg-slate-950/80 backdrop-blur-md text-primary border border-primary/30 text-[11px] font-semibold">
                      {t.demoListingBadge}
                    </Badge>
                    <Badge className="bg-slate-950/80 backdrop-blur-md text-slate-200 border border-slate-800 text-[11px]">
                      {property.city}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-slate-950/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-1 text-xs font-bold text-amber-400">
                    <Star className="h-3.5 w-3.5 fill-amber-400" />
                    <span>{property.rating || 4.95}</span>
                    <span className="text-slate-400 font-normal">
                      ({property.reviews_count || 32})
                    </span>
                  </div>
                </div>

                {/* Property Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors line-clamp-1">
                      {property.title}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">{property.location}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-300 py-2 border-y border-slate-800/80">
                    <span className="flex items-center gap-1">
                      <Bed className="h-3.5 w-3.5 text-slate-400" />
                      {property.bedrooms} {t.bedsLabel}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="h-3.5 w-3.5 text-slate-400" />
                      {property.bathrooms} {t.bathsLabel}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      {property.max_guests} {t.guestsLabel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-xs text-slate-400 block">{t.estNightlyRate}</span>
                      <span className="text-base font-extrabold text-white">
                        {formatPrice(property.price_per_night)}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-700 bg-slate-800/80 text-xs font-semibold text-slate-200 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-colors"
                    >
                      {t.inspectDemoBtn}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-slate-900 to-slate-950 border border-primary/20 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">
                {t.havePropertyBannerTitle}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                {t.havePropertyBannerSub}
              </p>
            </div>
            <a href="#pre-register-form" className="shrink-0">
              <Button className="bg-primary hover:bg-primary/90 text-white font-bold px-6 shadow-md shadow-primary/25">
                {t.havePropertyBannerBtn}
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Pioneer Host Perks & Benefits */}
      <section id="perks" className="py-20 bg-slate-900/40 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold">
              <Award className="h-3.5 w-3.5" />
              {t.perksBadge}
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {t.perksTitle}
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              {t.perksSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: "Percent",
                title: t.perk1Title,
                desc: t.perk1Desc,
              },
              {
                icon: "Camera",
                title: t.perk2Title,
                desc: t.perk2Desc,
              },
              {
                icon: "Award",
                title: t.perk3Title,
                desc: t.perk3Desc,
              },
              {
                icon: "Banknote",
                title: t.perk4Title,
                desc: t.perk4Desc,
              },
              {
                icon: "Headphones",
                title: t.perk5Title,
                desc: t.perk5Desc,
              },
              {
                icon: "Sparkles",
                title: t.perk6Title,
                desc: t.perk6Desc,
              },
            ].map((perk, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-primary/40 transition-all space-y-4 hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center border border-slate-800">
                  {getPerkIcon(perk.icon)}
                </div>
                <h3 className="font-bold text-lg text-white">{perk.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {perk.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Host Earnings Calculator */}
      <section id="calculator" className="py-20 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="text-center space-y-2 mb-10">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
                <DollarSign className="h-4 w-4" />
                {t.calcBadge}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                {t.calcTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
                {t.calcSubtitle}
              </p>
            </div>

            <div className="space-y-8">
              {/* Nightly Rate Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <Label className="text-slate-300 font-semibold">
                    {t.calcRateLabel}
                  </Label>
                  <span className="text-base font-bold text-primary">
                    {formatPrice(calcRate)}
                  </span>
                </div>
                <Slider
                  value={[calcRate]}
                  min={50000}
                  max={600000}
                  step={10000}
                  onValueChange={(val) => setCalcRate(val[0])}
                  className="py-2"
                />
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>50,000 IQD</span>
                  <span>300,000 IQD</span>
                  <span>600,000 IQD</span>
                </div>
              </div>

              {/* Nights Booked Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <Label className="text-slate-300 font-semibold">
                    {t.calcNightsLabel}
                  </Label>
                  <span className="text-base font-bold text-primary">
                    {calcNights} {t.nightsUnit}
                  </span>
                </div>
                <Slider
                  value={[calcNights]}
                  min={2}
                  max={30}
                  step={1}
                  onValueChange={(val) => setCalcNights(val[0])}
                  className="py-2"
                />
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>2 {t.nightsUnit}</span>
                  <span>15 {t.nightsUnit}</span>
                  <span>30 {t.nightsUnit}</span>
                </div>
              </div>

              {/* Result Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="p-6 rounded-2xl bg-slate-950 border border-primary/30 text-center shadow-lg shadow-primary/5">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    {t.calcMonthlyTitle}
                  </span>
                  <span className="block text-2xl sm:text-3xl font-black text-primary mt-1">
                    {formatPrice(calculatedMonthly)}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {t.calcMonthlyNote}
                  </span>
                </div>

                <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                    {t.calcYearlyTitle}
                  </span>
                  <span className="block text-2xl sm:text-3xl font-black text-white mt-1">
                    {formatPrice(calculatedYearly)}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {t.calcYearlyNote}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Host Pre-Registration Form Section */}
      <section id="pre-register-form" className="py-20 bg-slate-900/70 border-t border-slate-800 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              {t.formBadge}
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {t.formTitle}
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              {t.formSubtitle}
            </p>
          </div>

          <form
            onSubmit={handlePreRegister}
            className="p-6 sm:p-10 rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Label htmlFor="full-name" className="text-xs font-semibold text-slate-300">
                  {t.formFullName}
                </Label>
                <Input
                  id="full-name"
                  type="text"
                  placeholder={t.formFullNamePlaceholder}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1.5 bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 focus:border-primary"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-xs font-semibold text-slate-300">
                  {t.formPhone}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder={t.formPhonePlaceholder}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1.5 bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 focus:border-primary"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-xs font-semibold text-slate-300">
                  {t.formEmail}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t.formEmailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 focus:border-primary"
                  required
                />
              </div>

              <div>
                <Label htmlFor="city" className="text-xs font-semibold text-slate-300">
                  {t.formCity}
                </Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="mt-1.5 bg-slate-900 border-slate-800 text-white">
                    <SelectValue placeholder={t.formCityPlaceholder} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-white">
                    <SelectItem value="Erbil">{language === "ku" ? "هەولێر (Erbil)" : language === "ar" ? "أربيل (Erbil)" : "Erbil"}</SelectItem>
                    <SelectItem value="Sulaymaniyah">{language === "ku" ? "سلێمانی (Sulaymaniyah)" : language === "ar" ? "السليمانية (Sulaymaniyah)" : "Sulaymaniyah"}</SelectItem>
                    <SelectItem value="Duhok">{language === "ku" ? "دهۆک (Duhok)" : language === "ar" ? "دهوك (Duhok)" : "Duhok"}</SelectItem>
                    <SelectItem value="Rawanduz">{language === "ku" ? "ڕەواندز (Rawanduz)" : language === "ar" ? "رواندز (Rawanduz)" : "Rawanduz"}</SelectItem>
                    <SelectItem value="Shaqlawa">{language === "ku" ? "شەقڵاوە (Shaqlawa)" : language === "ar" ? "شقلاوة (Shaqlawa)" : "Shaqlawa"}</SelectItem>
                    <SelectItem value="Soran">{language === "ku" ? "سۆران (Soran)" : language === "ar" ? "سوران (Soran)" : "Soran"}</SelectItem>
                    <SelectItem value="Halabja">{language === "ku" ? "هەڵەبجە (Halabja)" : language === "ar" ? "حلبجة (Halabja)" : "Halabja"}</SelectItem>
                    <SelectItem value="Amedi">{language === "ku" ? "ئامێدی (Amedi)" : language === "ar" ? "العمادية (Amedi)" : "Amedi"}</SelectItem>
                    <SelectItem value="Zakho">{language === "ku" ? "زاخۆ (Zakho)" : language === "ar" ? "زاخو (Zakho)" : "Zakho"}</SelectItem>
                    <SelectItem value="Dukan">{language === "ku" ? "دووکان (Dukan)" : language === "ar" ? "دوكان (Dukan)" : "Dukan"}</SelectItem>
                    <SelectItem value="Other Kurdistan Region">{language === "ku" ? "ناوچەی تری کوردستان" : language === "ar" ? "منطقة أخرى في كوردستان" : "Other Kurdistan District"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="prop-type" className="text-xs font-semibold text-slate-300">
                  {t.formPropType}
                </Label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger className="mt-1.5 bg-slate-900 border-slate-800 text-white">
                    <SelectValue placeholder={t.formPropTypePlaceholder} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-white">
                    <SelectItem value="Chalet / Mountain Villa">{t.typeChalet}</SelectItem>
                    <SelectItem value="Apartment / Flat">{t.typeApartment}</SelectItem>
                    <SelectItem value="Farmhouse / Resort Villa">{t.typeFarmhouse}</SelectItem>
                    <SelectItem value="Traditional Heritage House">{t.typeHeritage}</SelectItem>
                    <SelectItem value="Private Guesthouse / Room">{t.typeGuesthouse}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="bedrooms" className="text-xs font-semibold text-slate-300">
                    {t.formBedrooms}
                  </Label>
                  <Select value={bedrooms} onValueChange={setBedrooms}>
                    <SelectTrigger className="mt-1.5 bg-slate-900 border-slate-800 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                      <SelectItem value="1">1 {t.bedsLabel}</SelectItem>
                      <SelectItem value="2">2 {t.bedsLabel}</SelectItem>
                      <SelectItem value="3">3 {t.bedsLabel}</SelectItem>
                      <SelectItem value="4">4 {t.bedsLabel}</SelectItem>
                      <SelectItem value="5+">5+ {t.bedsLabel}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="guests" className="text-xs font-semibold text-slate-300">
                    {t.formGuests}
                  </Label>
                  <Select value={maxGuests} onValueChange={setMaxGuests}>
                    <SelectTrigger className="mt-1.5 bg-slate-900 border-slate-800 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                      <SelectItem value="2">2 {t.guestsLabel}</SelectItem>
                      <SelectItem value="4">4 {t.guestsLabel}</SelectItem>
                      <SelectItem value="6">6 {t.guestsLabel}</SelectItem>
                      <SelectItem value="8">8 {t.guestsLabel}</SelectItem>
                      <SelectItem value="10+">10+ {t.guestsLabel}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="experience" className="text-xs font-semibold text-slate-300">
                {t.formExperience}
              </Label>
              <Select value={experience} onValueChange={setExperience}>
                <SelectTrigger className="mt-1.5 bg-slate-900 border-slate-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                  <SelectItem value="New to hosting">{t.expNew}</SelectItem>
                  <SelectItem value="Currently host on other platforms">{t.expExisting}</SelectItem>
                  <SelectItem value="Professional property manager">{t.expPro}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes" className="text-xs font-semibold text-slate-300">
                {t.formNotes}
              </Label>
              <Textarea
                id="notes"
                placeholder={t.formNotesPlaceholder}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1.5 min-h-[90px] bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 focus:border-primary"
              />
            </div>

            <Button
              type="submit"
              disabled={submitHost.isPending}
              className="w-full h-14 bg-gradient-to-r from-primary to-rose-500 hover:from-rose-500 hover:to-primary text-white font-extrabold text-base rounded-xl shadow-xl shadow-primary/25 transition-all hover:scale-[1.01]"
            >
              {submitHost.isPending ? (
                <>{t.formSubmittingBtn}</>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2 shrink-0" />
                  {t.formSubmitBtn}
                </>
              )}
            </Button>

            <p className="text-center text-xs text-slate-500">
              {t.formPrivacyNote}
            </p>
          </form>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-12">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
              <HelpCircle className="h-4 w-4" />
              {t.faqBadge}
            </div>
            <h2 className="text-3xl font-extrabold text-white">
              {t.faqTitle}
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {[
              { id: "faq-1", q: t.faq1Q, a: t.faq1A },
              { id: "faq-2", q: t.faq2Q, a: t.faq2A },
              { id: "faq-3", q: t.faq3Q, a: t.faq3A },
              { id: "faq-4", q: t.faq4Q, a: t.faq4A },
              { id: "faq-5", q: t.faq5Q, a: t.faq5A },
            ].map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="border border-slate-800 rounded-xl px-5 bg-slate-900/60"
              >
                <AccordionTrigger className={`text-base font-semibold text-white hover:text-primary hover:no-underline py-4 ${dir === "rtl" ? "text-right" : "text-left"}`}>
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-slate-300 text-sm leading-relaxed pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Pre-Launch Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/favicon.png" alt="Meewano" className="h-8 w-auto" />
            <span className="font-extrabold text-lg text-white">
              Meewano (میوانۆ)
            </span>
            <span className="text-xs text-slate-500">
              • {t.footerSlogan}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <Link to="/" className="hover:text-primary">
              {t.liveApp}
            </Link>
            <Link to="/about" className="hover:text-primary">
              {t.navAbout}
            </Link>
            <Link to="/contact" className="hover:text-primary">
              Contact Concierge
            </Link>
            <Link to="/terms" className="hover:text-primary">
              Terms of Service
            </Link>
            <Link to="/privacy" className="hover:text-primary">
              Privacy Policy
            </Link>
          </div>

          <div className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} {t.footerRights}
          </div>
        </div>
      </footer>

      {/* Success Celebration Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
          <DialogHeader className="text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/20 border border-primary flex items-center justify-center text-primary">
              <Check className="h-7 w-7" />
            </div>
            <DialogTitle className="text-2xl font-black text-white">
              {t.successTitle}
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-sm">
              {t.successDesc}
            </DialogDescription>
          </DialogHeader>

          {submittedData && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">{t.successHostName}</span>
                <span className="font-semibold text-white">{submittedData.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t.successCity}</span>
                <span className="font-semibold text-primary">{submittedData.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t.successPropType}</span>
                <span className="font-semibold text-white">{submittedData.property_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t.successStatus}</span>
                <Badge className="bg-primary text-white font-bold">{t.successStatusValue}</Badge>
              </div>
            </div>
          )}

          <div className="pt-2 flex flex-col gap-2">
            <a
              href="https://wa.me/9647500000000"
              target="_blank"
              rel="noreferrer"
              className="w-full"
            >
              <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold">
                <Phone className="h-4 w-4 mr-2" />
                {t.successWhatsAppBtn}
              </Button>
            </a>
            <Button
              variant="ghost"
              onClick={() => setShowSuccessDialog(false)}
              className="text-slate-400 hover:text-white"
            >
              {t.successCloseBtn}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Demo Property Inspection Modal */}
      <Dialog
        open={!!selectedDemoProp}
        onOpenChange={(open) => !open && setSelectedDemoProp(null)}
      >
        {selectedDemoProp && (
          <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 mb-4 border border-slate-800">
              <img
                src={selectedDemoProp.image}
                alt={selectedDemoProp.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 flex gap-2">
                <Badge className="bg-primary text-white font-bold">
                  {t.modalDemoBadge}
                </Badge>
                <Badge className="bg-slate-950/80 text-white border border-slate-700">
                  {selectedDemoProp.city}
                </Badge>
              </div>
            </div>

            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-white">
                {selectedDemoProp.title}
              </DialogTitle>
              <DialogDescription className="text-primary flex items-center gap-1.5 text-xs font-semibold">
                <MapPin className="h-3.5 w-3.5" />
                {selectedDemoProp.location}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm">
              <div className="flex flex-wrap gap-2">
                {(selectedDemoProp.badges || []).map((badge, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700"
                  >
                    ✨ {badge}
                  </span>
                ))}
              </div>

              <p className="text-slate-300 leading-relaxed text-sm">
                {selectedDemoProp.description}
              </p>

              <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div>
                  <span className="text-xs text-slate-400 block">{t.bedsLabel}</span>
                  <span className="text-base font-bold text-white">
                    {selectedDemoProp.bedrooms}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">{t.bathsLabel}</span>
                  <span className="text-base font-bold text-white">
                    {selectedDemoProp.bathrooms}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">{t.guestsLabel}</span>
                  <span className="text-base font-bold text-white">
                    {selectedDemoProp.max_guests}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">{t.modalSimulatedPrice}</span>
                  <span className="text-xl font-black text-white">
                    {formatPrice(selectedDemoProp.price_per_night)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">{t.modalHostContact}</span>
                  <span className="text-sm font-semibold text-primary">
                    {selectedDemoProp.host_name}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <Button
                className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold"
                onClick={() => {
                  setSelectedDemoProp(null);
                  document
                    .getElementById("pre-register-form")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {t.modalListSimilarBtn}
              </Button>
              <Button
                variant="outline"
                className="border-slate-800 text-slate-300"
                onClick={() => setSelectedDemoProp(null)}
              >
                {t.modalCloseBtn}
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
