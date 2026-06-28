import { useState, useMemo, useEffect } from "react";
import { trackEvent } from "@/lib/tracking";
import { useParams, useNavigate } from "react-router-dom";
import {
  Bath,
  Bed,
  Home,
  MapPin,
  Star,
  Wifi,
  Car,
  Tv,
  Waves,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Share2,
  Heart,
  Users,
  Maximize2,
  X,
  Minus,
  Plus,
  ArrowRight,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import PropertyCard from "@/components/PropertyCard";
import MarkdownLite from "@/components/MarkdownLite";
import PropertyLocationMap from "@/components/PropertyLocationMap";
import ReviewDialog from "@/components/ReviewDialog";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { useProperty, useProperties } from "@/hooks/useProperties";
import { useFavorites } from "@/hooks/useFavorites";
import { useSiteSettings } from "@/hooks/useAdminData";
import { normalizeAmenities } from "@/lib/amenities";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import BookingStepIndicator from "@/components/BookingStepIndicator";
import { toast } from "sonner";
import { format } from "date-fns";

const PropertyDetail = () => {
  const { id } = useParams();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [savedCheckIn, setSavedCheckIn] = useState("");
  const [savedCheckOut, setSavedCheckOut] = useState("");
  const [guests, setGuests] = useState(1);

  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showBookingSheet, setShowBookingSheet] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [sendingContact, setSendingContact] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);

  const queryClient = useQueryClient();
  const { data: property, isLoading, error } = useProperty(id || "");
  const { data: allProperties } = useProperties();
  const { isFavorite, toggleFavorite } = useFavorites(user?.id || null);
  const favorited = id ? isFavorite(id) : false;

  // Track property view (once per mount per property)
  useEffect(() => {
    if (id) trackEvent("property_view", { property_id: id, user_id: user?.id });
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error("Please log in to save favorites");
      navigate(`/auth?redirect=${encodeURIComponent(`/property/${id}`)}`);
      return;
    }
    if (id) await toggleFavorite(id);
  };

  const [shareOpen, setShareOpen] = useState(false);

  const getShareUrl = () => {
    // Use the published URL when in an iframe preview so the link is publicly openable
    try {
      if (window.top && window.top !== window.self) {
        return `${window.location.origin}${window.location.pathname}`;
      }
    } catch {
      /* cross-origin top — fall through */
    }
    return window.location.href;
  };

  const copyShareLink = async () => {
    const url = getShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      // Fallback for browsers/iframes blocking clipboard
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        toast.success("Link copied to clipboard");
      } catch {
        toast.error("Couldn't copy automatically — long-press the link to copy");
      }
      document.body.removeChild(ta);
    }
  };

  const handleShare = async () => {
    const url = getShareUrl();
    const title = property?.title || "Property";
    // Try the native share sheet first on mobile / supported browsers
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title, text: title, url });
        return;
      } catch (err: any) {
        // AbortError = user cancelled; anything else falls through to dialog
        if (err?.name === "AbortError") return;
      }
    }
    setShareOpen(true);
  };

  const { data: hostProfile } = useQuery({
    queryKey: ["host-profile", property?.host_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, is_verified, bio")
        .eq("id", property!.host_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!property?.host_id,
  });

  const { data: reviews } = useQuery({
    queryKey: ["property-reviews", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, guest_id, host_response")
        .eq("property_id", id!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      const guestIds = Array.from(new Set((data || []).map((r) => r.guest_id)));
      let profileMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
      if (guestIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", guestIds);
        profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
      }
      return (data || []).map((r) => ({ ...r, profile: profileMap[r.guest_id] }));
    },
    enabled: !!id,
  });

  // Fetch confirmed/pending bookings to compute disabled dates
  const { data: existingBookings } = useQuery({
    queryKey: ["property-bookings", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("check_in, check_out, status")
        .eq("property_id", id!)
        .in("status", ["pending", "confirmed", "completed"]);
      if (error) throw error;
      return data as { check_in: string; check_out: string; status: string }[];
    },
    enabled: !!id,
  });

  // Find the current user's most recent eligible booking for this property
  // (past check-out, not cancelled, no review yet)
  const { data: reviewableBooking, refetch: refetchReviewable } = useQuery({
    queryKey: ["reviewable-booking", id, user?.id],
    queryFn: async () => {
      if (!user || !id) return null;
      const today = new Date().toISOString().slice(0, 10);
      const { data: bks } = await supabase
        .from("bookings")
        .select("id, check_out, status")
        .eq("property_id", id)
        .eq("guest_id", user.id)
        .lte("check_out", today)
        .neq("status", "cancelled")
        .order("check_out", { ascending: false });
      if (!bks || bks.length === 0) return null;
      const ids = bks.map((b) => b.id);
      const { data: existingReviews } = await supabase.from("reviews").select("booking_id").in("booking_id", ids);
      const reviewed = new Set((existingReviews || []).map((r) => r.booking_id));
      return bks.find((b) => !reviewed.has(b.id)) || null;
    },
    enabled: !!user && !!id,
  });

  // Build a Set of YYYY-MM-DD strings that are booked, plus a list of Date ranges
  const bookedDates = useMemo(() => {
    const dates: Date[] = [];
    (existingBookings || []).forEach((b) => {
      const start = new Date(b.check_in);
      const end = new Date(b.check_out);
      // Mark every day from check_in through check_out - 1 (checkout day is free)
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
      }
    });
    return dates;
  }, [existingBookings]);

  const isDateBooked = (date: Date) => {
    const t = date.setHours(0, 0, 0, 0);
    return bookedDates.some((d) => new Date(d).setHours(0, 0, 0, 0) === t);
  };

  const isDateOutsideAvailability = (date: Date) => {
    const availableFrom = (property as any)?.available_from ? new Date((property as any).available_from) : null;
    const availableTo = (property as any)?.available_to ? new Date((property as any).available_to) : null;
    const day = new Date(date).setHours(0, 0, 0, 0);
    return !!(
      (availableFrom && day < availableFrom.setHours(0, 0, 0, 0)) ||
      (availableTo && day > availableTo.setHours(0, 0, 0, 0))
    );
  };

  const isDateBlocked = (date: Date) => {
    const blocked = (property as any)?.blocked_dates as string[] | undefined;
    const day = new Date(date).setHours(0, 0, 0, 0);
    return !!blocked?.some((d) => new Date(d).setHours(0, 0, 0, 0) === day);
  };

  // Pre-fill default available dates so dates are always shown
  useEffect(() => {
    if (!property) return;
    if (checkIn || checkOut) return; // respect user selection

    const isDateAvailable = (date: Date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return (
        d >= new Date(new Date().setHours(0, 0, 0, 0)) &&
        !isDateBooked(d) &&
        !isDateBlocked(d) &&
        !isDateOutsideAvailability(d)
      );
    };

    const findNextAvailable = (start: Date) => {
      const d = new Date(start);
      d.setHours(0, 0, 0, 0);
      for (let i = 0; i < 365; i++) {
        if (isDateAvailable(d)) return new Date(d);
        d.setDate(d.getDate() + 1);
      }
      return null;
    };

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const ci = findNextAvailable(tomorrow);
    if (!ci) return;

    const dayAfter = new Date(ci);
    dayAfter.setDate(dayAfter.getDate() + 1);
    const co = findNextAvailable(dayAfter);
    if (!co) return;

    setCheckIn(format(ci, "yyyy-MM-dd"));
    setCheckOut(format(co, "yyyy-MM-dd"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property]);

  // Track saved dates for change detection
  useEffect(() => {
    if (checkIn && checkOut && !savedCheckIn && !savedCheckOut) {
      setSavedCheckIn(checkIn);
      setSavedCheckOut(checkOut);
    }
  }, [checkIn, checkOut, savedCheckIn, savedCheckOut]);

  const currentNights =
    checkIn && checkOut
      ? Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)))
      : 1;

  const hasDateChanges = checkIn !== savedCheckIn || checkOut !== savedCheckOut;

  const handleSaveDates = () => {
    setSavedCheckIn(checkIn);
    setSavedCheckOut(checkOut);
  };

  const setNights = (n: number) => {
    if (!checkIn || n < 1) return;
    const ci = new Date(checkIn);
    ci.setDate(ci.getDate() + n);
    setCheckOut(format(ci, "yyyy-MM-dd"));
  };

  const calculateTotal = () => {
    if (!checkIn || !checkOut || !property) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights * property.price_per_night : 0;
  };

  const handleSendContact = async () => {
    if (!user) {
      toast.error("Please log in to contact the host");
      navigate(`/auth?redirect=${encodeURIComponent(`/property/${id}`)}`);
      return;
    }
    if (!property) return;
    if (user.id === property.host_id) {
      toast.error("You can't message yourself as the host");
      return;
    }
    const text = contactMessage.trim();
    if (!text) {
      toast.error("Please write a message first");
      return;
    }
    setSendingContact(true);
    try {
      const { error: msgError } = await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: property.host_id,
        content: `[About: ${property.title}]\n${text}`,
      });
      if (msgError) throw msgError;

      // Best-effort notification for the host
      await supabase.from("notifications").insert({
        user_id: property.host_id,
        type: "message",
        title: "New message about your property",
        message: `Inquiry about "${property.title}"`,
        link: "/messages",
      });

      toast.success("Message sent to the host", {
        description: "They'll get back to you soon. You can continue the chat from Messages.",
      });
      setContactMessage("");
      setContactOpen(false);
    } catch (e: any) {
      console.error("Contact host failed:", e);
      toast.error(e.message || "Could not send message");
    } finally {
      setSendingContact(false);
    }
  };

  const handleReserve = async () => {
    if (!user) {
      setAuthPromptOpen(true);
      return;
    }

    if (!checkIn || !checkOut) {
      toast.error(t("selectDatesError"));
      return;
    }

    if (!property) return;

    if (user.id === property.host_id) {
      toast.error("You can't book your own property");
      return;
    }

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
      toast.error(t("checkOutAfterCheckIn"));
      return;
    }

    if (isDateOutsideAvailability(start) || isDateOutsideAvailability(end)) {
      toast.error("Selected dates are outside this property's available range");
      return;
    }

    // Validate against blocked dates
    const blocked = (property as any).blocked_dates as string[] | undefined;
    if (blocked && blocked.length > 0) {
      const conflict = blocked.some((d) => {
        const blockedDate = new Date(d);
        return blockedDate >= start && blockedDate < end;
      });
      if (conflict) {
        toast.error("Some of the selected dates are unavailable");
        return;
      }
    }

    // Validate against existing bookings (any day inside requested range that's already booked)
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      if (isDateBooked(new Date(d))) {
        toast.error("Some of the selected dates are already booked");
        return;
      }
    }

    setLoading(true);
    try {
      const bookingData = {
        property_id: property.id,
        property_name: property.title,
        property_image: property.images?.[0] || "/placeholder.svg",
        property_location: property.location,
        check_in: checkIn,
        check_out: checkOut,
        guests,
        nights,
        price_per_night: property.price_per_night,
        total_price: calculateTotal(),
        host_id: property.host_id,
      };

      sessionStorage.setItem("pendingBooking", JSON.stringify(bookingData));
      await trackEvent("booking_started", {
        property_id: property.id,
        user_id: user?.id,
        metadata: { nights, total: calculateTotal() },
      });
      navigate("/booking-details");
    } catch (error: any) {
      toast.error(t("bookingFailed"));
    } finally {
      setLoading(false);
    }
  };

  const similarListings = allProperties?.filter((p) => p.id !== id).slice(0, 3) || [];

  const amenityIcons: Record<string, any> = {
    WiFi: Wifi,
    "Free Parking": Car,
    Parking: Car,
    TV: Tv,
    Pool: Waves,
  };

  const { data: siteSettings } = useSiteSettings();
  const { amenityIconMap, amenityCategoryMap } = useMemo(() => {
    const iconMap: Record<string, string> = {};
    const catMap: Record<string, string> = {};
    const settingsArr = Array.isArray(siteSettings) ? siteSettings : [];
    const entry = settingsArr.find((s: any) => s.key === "amenities_list");
    normalizeAmenities(entry?.value).forEach((a) => {
      if (a.icon) iconMap[a.name] = a.icon;
      if (a.category) catMap[a.name] = a.category;
    });
    return { amenityIconMap: iconMap, amenityCategoryMap: catMap };
  }, [siteSettings]);

  const nextImage = () => {
    if (property?.images) {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    }
  };

  const prevImage = () => {
    if (property?.images) {
      setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (error || !property) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Home className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">{t("propertyNotFound")}</h1>
          <p className="text-muted-foreground mb-6">{t("propertyNotFoundDesc")}</p>
          <Button onClick={() => navigate("/search")}>{t("browseProperties")}</Button>
        </div>
      </AppLayout>
    );
  }

  const images = property.images?.length ? property.images : ["/placeholder.svg"];

  return (
    <AppLayout>
      {/* Mobile: Full-bleed image gallery */}
      <div className="md:hidden relative">
        <div className="relative h-[300px] w-full overflow-hidden">
          <img src={images[currentImageIndex]} alt={property.title} className="w-full h-full object-cover" />
          {/* Top overlay buttons */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-card/80 backdrop-blur-sm h-9 w-9"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-card/80 backdrop-blur-sm h-9 w-9"
                onClick={() => setFullscreenOpen(true)}
                aria-label="View fullscreen"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-card/80 backdrop-blur-sm h-9 w-9"
                onClick={handleShare}
                aria-label="Share"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-card/80 backdrop-blur-sm h-9 w-9"
                onClick={handleToggleFavorite}
                aria-label={favorited ? "Remove from favorites" : "Save to favorites"}
              >
                <Heart className={`h-4 w-4 ${favorited ? "fill-primary text-primary" : ""}`} />
              </Button>
            </div>
          </div>
          {/* Image nav arrows */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-card/60 backdrop-blur-sm h-8 w-8"
                onClick={prevImage}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-card/60 backdrop-blur-sm h-8 w-8"
                onClick={nextImage}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
          {/* Image counter pill */}
          <div className="absolute bottom-3 right-3 bg-card/80 backdrop-blur-sm text-foreground text-xs font-medium px-2.5 py-1 rounded-full">
            {currentImageIndex + 1} / {images.length}
          </div>
          {/* Dot indicators */}
          {images.length > 1 && images.length <= 8 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentImageIndex ? "bg-primary-foreground w-3" : "bg-primary-foreground/50"}`}
                  onClick={() => setCurrentImageIndex(i)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Mobile thumbnail strip */}
        {images.length > 1 && (
          <div className="flex gap-1.5 px-4 py-2 overflow-x-auto scrollbar-hide">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrentImageIndex(i)}
                className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  i === currentImageIndex ? "border-primary" : "border-transparent opacity-60"
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: Container image gallery */}
      <div className="hidden md:block container mx-auto px-4 pt-8">
        <div className="rounded-2xl overflow-hidden mb-8 h-[500px] relative group">
          <img src={images[currentImageIndex]} alt={property.title} className="w-full h-full object-cover" />
          <Button
            variant="outline"
            size="sm"
            className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm"
            onClick={() => setFullscreenOpen(true)}
          >
            <Maximize2 className="h-4 w-4 mr-2" />
            Fullscreen
          </Button>
          {images.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-card/90"
                onClick={prevImage}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-card/90"
                onClick={nextImage}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full cursor-pointer ${i === currentImageIndex ? "bg-primary" : "bg-primary-foreground/50"}`}
                    onClick={() => setCurrentImageIndex(i)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Fullscreen image viewer */}
      {fullscreenOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          onClick={() => setFullscreenOpen(false)}
        >
          <img
            src={images[currentImageIndex]}
            alt={property.title}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setFullscreenOpen(false)}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-sm"
            aria-label="Close fullscreen"
          >
            <X className="h-5 w-5" />
          </button>
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-sm"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-sm"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 text-white text-sm px-3 py-1 rounded-full backdrop-blur-sm">
                {currentImageIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      )}

      <main className="container mx-auto px-4 pb-8 md:py-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left Column - Property Details */}
          <div className="lg:col-span-2 space-y-5 md:space-y-6">
            {/* Title & location */}
            <div className="pt-3 md:pt-0">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl md:text-4xl font-bold mb-1.5 md:mb-2 flex-1">{property.title}</h1>
                {/* Desktop: Save + Share actions */}
                <div className="hidden md:flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button variant={favorited ? "default" : "outline"} size="sm" onClick={handleToggleFavorite}>
                    <Heart className={`h-4 w-4 mr-2 ${favorited ? "fill-current" : ""}`} />
                    {favorited ? "Saved" : "Save"}
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm md:text-base text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 md:h-5 md:w-5 fill-yellow-500 text-yellow-500" />
                  <span className="font-semibold text-foreground">{property.rating || 0}</span>
                  <span>
                    ({property.review_count || 0} {t("reviews")})
                  </span>
                </div>
                <span className="hidden md:inline">·</span>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 md:h-5 md:w-5" />
                  <span>{property.location}</span>
                </div>
              </div>
            </div>

            {/* Property Stats - horizontal scroll on mobile */}
            <div className="flex items-center gap-3 md:gap-0 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
              <Card className="flex-shrink-0 md:flex-1">
                <CardContent className="p-3 md:p-6 flex items-center gap-2 md:gap-3">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <Home className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-bold text-base md:text-lg">{property.bedrooms}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">{t("bedrooms")}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="flex-shrink-0 md:flex-1">
                <CardContent className="p-3 md:p-6 flex items-center gap-2 md:gap-3">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <Bath className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-bold text-base md:text-lg">{property.bathrooms}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">{t("bathrooms")}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="flex-shrink-0 md:flex-1">
                <CardContent className="p-3 md:p-6 flex items-center gap-2 md:gap-3">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-bold text-base md:text-lg">{property.max_guests}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">{t("maxGuests")}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Mobile inline date picker */}
            <div className="lg:hidden">
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                {t("checkIn")} <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" /> {t("checkOut")}
              </label>
              <div className="rounded-lg border border-border bg-background overflow-hidden">
                <Calendar
                  mode="range"
                  numberOfMonths={1}
                  selected={{
                    from: checkIn ? new Date(checkIn) : undefined,
                    to: checkOut ? new Date(checkOut) : undefined,
                  }}
                  onSelect={(range) => {
                    if (range?.from) setCheckIn(format(range.from, "yyyy-MM-dd"));
                    else setCheckIn("");
                    if (range?.to) setCheckOut(format(range.to, "yyyy-MM-dd"));
                    else setCheckOut("");
                  }}
                  disabled={(date) =>
                    date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                    isDateBooked(date) ||
                    isDateBlocked(date) ||
                    isDateOutsideAvailability(date)
                  }
                  modifiers={{ booked: bookedDates }}
                  modifiersClassNames={{
                    booked: "line-through text-destructive bg-destructive/10 rounded-md",
                  }}
                  className="p-3 pointer-events-auto"
                />
                <div className="px-3 pb-3 text-xs text-muted-foreground flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded bg-destructive/20 border border-destructive/40" />
                  Booked — not available
                </div>
                <div className="px-3 pb-3">
                  <Button
                    className="w-full"
                    size="sm"
                    onClick={handleSaveDates}
                    disabled={!hasDateChanges}
                  >
                    Save Change
                  </Button>
                </div>
              </div>
            </div>

            {/* Floor plan (only shown when host uploaded one) */}
            {(property as any).floor_plan_url && (
              <div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-11 gap-2">
                      <Home className="h-4 w-4" />
                      View floor plan
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Floor plan</DialogTitle>
                      <DialogDescription>{property.title}</DialogDescription>
                    </DialogHeader>
                    <img
                      src={(property as any).floor_plan_url}
                      alt={`Floor plan for ${property.title}`}
                      className="w-full h-auto rounded-lg border bg-muted"
                    />
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* Host Info */}
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3 md:gap-4">
                  <Avatar className="h-12 w-12 md:h-16 md:w-16">
                    {hostProfile?.avatar_url && (
                      <AvatarImage src={hostProfile.avatar_url} alt={hostProfile?.full_name || "Host"} />
                    )}
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg md:text-xl">
                      {(hostProfile?.full_name || "H").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-base md:text-xl font-bold">{hostProfile?.full_name || t("propertyHost")}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {hostProfile?.is_verified ? t("verifiedHost") : t("propertyHost")}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="md:flex" onClick={() => setContactOpen(true)}>
                    Contact
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <div>
              <h2 className="text-lg md:text-2xl font-bold mb-2 md:mb-4">{t("aboutThisPlace")}</h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                {property.description || t("noDescription")}
              </p>
            </div>

            {/* Welcome message from host */}
            {(property as any).welcome_message && (
              <div>
                <h2 className="text-lg md:text-2xl font-bold mb-2 md:mb-4">Welcome message from host</h2>
                <MarkdownLite text={(property as any).welcome_message} />
              </div>
            )}

            {/* Stay details */}
            {((property as any).check_in_time ||
              (property as any).check_out_time ||
              (property as any).minimum_nights) && (
              <div>
                <h2 className="text-lg md:text-2xl font-bold mb-2 md:mb-4">Stay details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(property as any).check_in_time && (
                    <div className="p-3 rounded-xl border border-border">
                      <p className="text-xs text-muted-foreground">Check-in</p>
                      <p className="text-sm md:text-base font-medium">
                        {(property as any).check_in_time}
                      </p>
                    </div>
                  )}
                  {(property as any).check_out_time && (
                    <div className="p-3 rounded-xl border border-border">
                      <p className="text-xs text-muted-foreground">Check-out</p>
                      <p className="text-sm md:text-base font-medium">
                        {(property as any).check_out_time}
                      </p>
                    </div>
                  )}
                  {(property as any).minimum_nights && (
                    <div className="p-3 rounded-xl border border-border">
                      <p className="text-xs text-muted-foreground">Minimum nights</p>
                      <p className="text-sm md:text-base font-medium">
                        {(property as any).minimum_nights}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cleaning Policy */}
            {(property as any).cleaning_policy && (
              <div>
                <h2 className="text-lg md:text-2xl font-bold mb-2 md:mb-4">Cleaning policy</h2>
                <MarkdownLite text={(property as any).cleaning_policy} />
              </div>
            )}

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (() => {
              const categoryMap: Record<string, string> = {
                // Bathroom
                "Shampoo": "Bathroom", "Conditioner": "Bathroom", "Body soap": "Bathroom",
                "Hot water": "Bathroom", "Shower gel": "Bathroom", "Hair dryer": "Bathroom",
                "Bathtub": "Bathroom", "Bidet": "Bathroom", "Towels": "Bathroom",
                // Bedroom & Laundry
                "Washer": "Bedroom & Laundry", "Dryer": "Bedroom & Laundry",
                "Essentials": "Bedroom & Laundry", "Hangers": "Bedroom & Laundry",
                "Bed linens": "Bedroom & Laundry", "Extra pillows and blankets": "Bedroom & Laundry",
                "Iron": "Bedroom & Laundry", "Clothing storage": "Bedroom & Laundry",
                "Room-darkening shades": "Bedroom & Laundry",
                // Entertainment
                "TV": "Entertainment", "Cable TV": "Entertainment", "Sound system": "Entertainment",
                "Game console": "Entertainment", "Books": "Entertainment",
                // Heating & Cooling
                "Air Conditioning": "Heating & Cooling", "Air conditioning": "Heating & Cooling",
                "Heating": "Heating & Cooling", "Ceiling fan": "Heating & Cooling",
                "Portable fans": "Heating & Cooling",
                // Internet & Office
                "WiFi": "Internet & Office", "Wifi": "Internet & Office",
                "Dedicated workspace": "Internet & Office", "Ethernet connection": "Internet & Office",
                // Kitchen & Dining
                "Kitchen": "Kitchen & Dining", "Refrigerator": "Kitchen & Dining",
                "Microwave": "Kitchen & Dining", "Cooking basics": "Kitchen & Dining",
                "Dishes and silverware": "Kitchen & Dining", "Freezer": "Kitchen & Dining",
                "Dishwasher": "Kitchen & Dining", "Stove": "Kitchen & Dining",
                "Oven": "Kitchen & Dining", "Coffee maker": "Kitchen & Dining",
                "Wine glasses": "Kitchen & Dining", "Toaster": "Kitchen & Dining",
                "Dining table": "Kitchen & Dining", "Hot Tub": "Kitchen & Dining",
                // Outdoor
                "Garden": "Outdoor", "Patio or balcony": "Outdoor", "Backyard": "Outdoor",
                "BBQ grill": "Outdoor", "Outdoor furniture": "Outdoor",
                "Outdoor dining area": "Outdoor",
                // Parking & Facilities
                "Free Parking": "Parking & Facilities", "Parking": "Parking & Facilities",
                "Free parking on premises": "Parking & Facilities", "Pool": "Parking & Facilities",
                "Gym": "Parking & Facilities", "Elevator": "Parking & Facilities",
                "EV charger": "Parking & Facilities",
                // Safety
                "Smoke alarm": "Safety", "Carbon monoxide alarm": "Safety",
                "Fire extinguisher": "Safety", "First aid kit": "Safety",
                "Security cameras": "Safety",
              };
              const grouped: Record<string, string[]> = {};
              property.amenities.forEach((a: string) => {
                const cat = amenityCategoryMap[a] || categoryMap[a] || "Other";
                (grouped[cat] ||= []).push(a);
              });
              const settingsArr = Array.isArray(siteSettings) ? siteSettings : [];
              const catEntry = settingsArr.find((s: any) => s.key === "amenity_categories");
              const adminOrder: string[] = Array.isArray(catEntry?.value)
                ? catEntry!.value.filter((c: any) => typeof c === "string")
                : [];
              const fallbackOrder = ["Bathroom","Bedroom & Laundry","Entertainment","Heating & Cooling","Internet & Office","Kitchen & Dining","Outdoor","Parking & Facilities","Safety"];
              const baseOrder = adminOrder.length ? adminOrder : fallbackOrder;
              const extras = Object.keys(grouped).filter((c) => !baseOrder.includes(c) && c !== "Other");
              const order = [...baseOrder, ...extras, "Other"];
              return (
                <div>
                  <h2 className="text-lg md:text-2xl font-bold mb-3 md:mb-4">{t("whatThisPlaceOffers")}</h2>
                  <div className="space-y-5 md:space-y-6">
                    {order.filter((c) => grouped[c]?.length).map((cat) => (
                      <div key={cat}>
                        <h3 className="text-sm md:text-base font-semibold text-muted-foreground mb-2 md:mb-3 uppercase tracking-wide">{cat}</h3>
                        <div className="grid grid-cols-2 gap-2 md:gap-4">
                          {grouped[cat].map((amenity) => {
                            const customIcon = amenityIconMap[amenity];
                            const Icon = amenityIcons[amenity] || Home;
                            return (
                              <div key={amenity} className="flex items-center gap-2.5 p-2.5 md:p-3 rounded-xl border border-border">
                                <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0 overflow-hidden">
                                  {customIcon ? (
                                    <img src={customIcon} alt="" className="h-6 w-6 object-contain" />
                                  ) : (
                                    <Icon className="h-4 w-4 text-accent-foreground" />
                                  )}
                                </div>
                                <span className="text-sm md:text-base">{amenity}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}


            {/* Map */}
            <div>
              <h2 className="text-lg md:text-2xl font-bold mb-3 md:mb-4">{t("location")}</h2>
              <Card>
                <CardContent className="p-0 overflow-hidden rounded-xl">
                  {property.latitude && property.longitude ? (
                    <PropertyLocationMap
                      lat={property.latitude}
                      lng={property.longitude}
                      title={property.title}
                      location={property.location}
                      price={formatPrice(property.price_per_night)}
                      image={images[0]}
                    />
                  ) : (
                    <div className="w-full h-[200px] md:h-[300px] bg-accent flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-8 w-8 md:h-12 md:w-12 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm md:text-base text-muted-foreground">
                          {t("mapViewOf")} {property.location}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Things to know */}
            <div>
              <h2 className="text-lg md:text-2xl font-bold mb-3 md:mb-4">Things to know</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border bg-card p-4">
                  <h3 className="font-semibold mb-2">House rules</h3>
                  <div className="text-sm text-muted-foreground whitespace-pre-line">
                    <MarkdownLite text={(property as any).house_rules || "Check-in after the listed check-in time. No smoking. No parties or events. Pets are not allowed unless agreed with the host."} />
                  </div>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <h3 className="font-semibold mb-2">Safety & property</h3>
                  <div className="text-sm text-muted-foreground whitespace-pre-line">
                    <MarkdownLite text={(property as any).safety_property || "Smoke alarm not reported. Carbon monoxide alarm not reported. Please review all safety information with the host on arrival."} />
                  </div>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <h3 className="font-semibold mb-2">Cancellation policy</h3>
                  <div className="text-sm text-muted-foreground whitespace-pre-line">
                    <MarkdownLite text={(property as any).cancellation_policy || "Free cancellation up to 7 days before check-in. After that, cancellations may be partially refundable depending on timing."} />
                  </div>
                </div>
              </div>
            </div>


            {/* Reviews */}
            <div id="reviews" className="scroll-mt-24">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-lg md:text-2xl font-bold flex items-center gap-2">
                  <Star className="h-5 w-5 md:h-6 md:w-6 fill-yellow-500 text-yellow-500" />
                  {property.rating || 0} · {property.review_count || 0} {t("reviews")}
                </h2>
                {reviewableBooking ? (
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-xs md:text-sm"
                    onClick={() => setReviewOpen(true)}
                  >
                    {t("writeReview")}
                  </Button>
                ) : !user ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs md:text-sm"
                    onClick={() => navigate(`/auth?redirect=${encodeURIComponent(`/property/${id}`)}`)}
                  >
                    {t("writeReview")}
                  </Button>
                ) : null}
              </div>

              {!reviews || reviews.length === 0 ? (
                <div className="text-center py-6 md:py-8 border rounded-xl">
                  <Star className="h-8 w-8 md:h-12 md:w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm md:text-base text-muted-foreground">{t("noReviewsYet")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <Card key={r.id}>
                      <CardContent className="p-4 md:p-6">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            {r.profile?.avatar_url && (
                              <AvatarImage src={r.profile.avatar_url} alt={r.profile.full_name || "Guest"} />
                            )}
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {(r.profile?.full_name || "G").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold text-sm md:text-base">{r.profile?.full_name || "Guest"}</p>
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: r.rating }).map((_, i) => (
                                  <Star key={i} className="h-3 w-3 md:h-4 md:w-4 fill-yellow-500 text-yellow-500" />
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              {new Date(r.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long" })}
                            </p>
                            {r.comment && <p className="text-sm md:text-base">{r.comment}</p>}
                            {r.host_response && (
                              <div className="mt-3 pl-3 border-l-2 border-primary">
                                <p className="text-xs font-semibold mb-1">Response from host</p>
                                <p className="text-sm text-muted-foreground">{r.host_response}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Booking Card (desktop only) */}
          <div className="hidden lg:block lg:col-span-1">
            <Card className="sticky top-24 border-2">
              <CardContent className="p-6">
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{formatPrice(property.price_per_night)}</span>
                    <span className="text-muted-foreground">{t("perNight")}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Prices include all fees</p>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                      {t("checkIn")} <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" /> {t("checkOut")}
                    </label>
                    <div className="rounded-lg border border-border bg-background overflow-hidden">
                      <Calendar
                        mode="range"
                        numberOfMonths={1}
                        selected={{
                          from: checkIn ? new Date(checkIn) : undefined,
                          to: checkOut ? new Date(checkOut) : undefined,
                        }}
                        onSelect={(range) => {
                          if (range?.from) setCheckIn(format(range.from, "yyyy-MM-dd"));
                          else setCheckIn("");
                          if (range?.to) setCheckOut(format(range.to, "yyyy-MM-dd"));
                          else setCheckOut("");
                        }}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                          isDateBooked(date) ||
                          isDateBlocked(date) ||
                          isDateOutsideAvailability(date)
                        }
                        modifiers={{ booked: bookedDates }}
                        modifiersClassNames={{
                          booked: "line-through text-destructive bg-destructive/10 rounded-md",
                        }}
                        className="p-3 pointer-events-auto"
                      />
                      <div className="px-3 pb-3 text-xs text-muted-foreground flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded bg-destructive/20 border border-destructive/40" />
                        Booked — not available
                      </div>
                      <div className="px-3 pb-3">
                        <Button
                          className="w-full"
                          size="sm"
                          onClick={handleSaveDates}
                          disabled={!hasDateChanges}
                        >
                          Save Change
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t("nights") || "Nights"}</label>
                    <div className="flex items-center justify-between rounded-lg border border-border bg-background p-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setNights(Math.max(1, currentNights - 1))}
                        disabled={!checkIn || currentNights <= 1}
                        aria-label="Decrease nights"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <div className="text-sm font-medium">
                        {currentNights} {currentNights === 1 ? "night" : "nights"}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setNights(currentNights + 1)}
                        disabled={!checkIn}
                        aria-label="Increase nights"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t("guests")}</label>
                    <select
                      value={guests}
                      onChange={(e) => setGuests(Number(e.target.value))}
                      className="w-full p-3 rounded-lg border border-border bg-background"
                    >
                      {Array.from({ length: property.max_guests }, (_, i) => i + 1).map((num) => (
                        <option key={num} value={num}>
                          {num} {num > 1 ? t("guests") : t("guest")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {calculateTotal() > 0 && (
                  <div className="border-t pt-4 mb-4">
                    <div className="flex justify-between mb-2">
                      <span>
                        {formatPrice(property.price_per_night)} ×{" "}
                        {Math.ceil(
                          (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24),
                        )}{" "}
                        {t("nights")}
                      </span>
                      <span>{formatPrice(calculateTotal())}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>{t("total")}</span>
                      <span>{formatPrice(calculateTotal())}</span>
                    </div>
                  </div>
                )}

                <Button className="w-full" size="lg" onClick={handleReserve} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("processing")}
                    </>
                  ) : (
                    t("reserve")
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Similar Listings */}
        {similarListings.length > 0 && (
          <section className="mt-8 md:mt-16">
            <h2 className="text-lg md:text-2xl font-bold mb-4 md:mb-6">{t("similarProperties")}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
              {similarListings.map((listing) => (
                <PropertyCard
                  key={listing.id}
                  id={listing.id}
                  image={listing.images?.[0] || "/placeholder.svg"}
                  name={listing.title}
                  location={listing.location}
                  bedrooms={listing.bedrooms}
                  bathrooms={listing.bathrooms}
                  price={listing.price_per_night}
                  rating={listing.rating || 0}
                  reviews={listing.review_count}
                  approvalStatus={(listing as any).approval_status}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Mobile sticky bottom booking bar */}
      <div className="fixed bottom-16 left-0 right-0 z-40 bg-card border-t border-border p-3 md:hidden safe-area-bottom">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold">{formatPrice(property.price_per_night)}</span>
              <span className="text-xs text-muted-foreground">/ {t("perNight")}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Prices include all fees</p>
            {checkIn && checkOut && (
              <div className="text-xs font-medium text-foreground mt-0.5">
                {format(new Date(checkIn), "MMM d")} – {format(new Date(checkOut), "MMM d")}
              </div>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              <span>
                {property.rating || 0} ({property.review_count || 0})
              </span>
            </div>
          </div>
          <Button size="sm" className="px-6 rounded-xl" onClick={handleReserve} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("reserve")}
          </Button>
        </div>
      </div>

      {/* Auth prompt before reservation */}
      <Dialog open={authPromptOpen} onOpenChange={setAuthPromptOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Sign in to reserve</DialogTitle>
            <DialogDescription>
              You need an account to book this property. Log in if you already have one, or create a new account in
              seconds.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              className="w-full"
              onClick={() => {
                setAuthPromptOpen(false);
                navigate(`/auth?redirect=${encodeURIComponent(`/property/${id}`)}`);
              }}
            >
              Log in
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setAuthPromptOpen(false);
                navigate(`/auth?mode=signup&redirect=${encodeURIComponent(`/property/${id}`)}`);
              }}
            >
              Create an account
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Host Dialog */}
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Message {hostProfile?.full_name || "the host"}</DialogTitle>
            <DialogDescription>
              About <span className="font-medium text-foreground">{property?.title}</span>. Your message will appear in
              your Messages thread with the host.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={contactMessage}
            onChange={(e) => setContactMessage(e.target.value)}
            placeholder="Hi! I'm interested in your place — is it available on the dates I'm looking at?"
            className="min-h-[140px]"
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground text-right">{contactMessage.length}/1000</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setContactOpen(false)} disabled={sendingContact}>
              Cancel
            </Button>
            <Button onClick={handleSendContact} disabled={sendingContact || !contactMessage.trim()}>
              {sendingContact ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Send message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Write a Review Dialog */}
      {reviewableBooking && property && (
        <ReviewDialog
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          bookingId={reviewableBooking.id}
          propertyId={property.id}
          hostId={property.host_id}
          propertyTitle={property.title}
          onSuccess={() => {
            refetchReviewable();
            queryClient.invalidateQueries({ queryKey: ["property-reviews", id] });
            queryClient.invalidateQueries({ queryKey: ["property", id] });
          }}
        />
      )}

      {/* Share Dialog (fallback when native share isn't available) */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share this property</DialogTitle>
            <DialogDescription>Copy the link or share it on your favourite app.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <input
              readOnly
              value={getShareUrl()}
              onFocus={(e) => e.currentTarget.select()}
              className="flex-1 h-10 px-3 rounded-md border bg-muted text-sm"
            />
            <Button onClick={copyShareLink}>Copy</Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            <Button variant="outline" asChild>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${property?.title || "Property"} — ${getShareUrl()}`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(getShareUrl())}&text=${encodeURIComponent(property?.title || "Property")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Telegram
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Facebook
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a
                href={`mailto:?subject=${encodeURIComponent(property?.title || "Property")}&body=${encodeURIComponent(getShareUrl())}`}
              >
                Email
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default PropertyDetail;
