import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import BookingStepIndicator from "@/components/BookingStepIndicator";
import { useTranslation } from "@/hooks/useTranslation";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createNotification } from "@/hooks/useNotifications";
import { trackEvent } from "@/lib/tracking";

type PaymentMethod = "card";

interface PendingBooking {
  property_id: string;
  property_name: string;
  property_image: string;
  property_location: string;
  check_in: string;
  check_out: string;
  guests: number;
  nights: number;
  price_per_night: number;
  total_price: number;
  host_id: string;
}

const Payment = () => {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("card");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<PendingBooking | null>(null);
  const [guestMessage, setGuestMessage] = useState("");
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
  });
  

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    // Get booking data from session storage
    const pendingBooking = sessionStorage.getItem("pendingBooking");
    if (pendingBooking) {
      setBooking(JSON.parse(pendingBooking));
    } else {
      // If no booking data, redirect back
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const cleaningFee = 50;
  const tax = booking ? Math.round(booking.total_price * 0.05) : 0;
  const total = booking ? booking.total_price + cleaningFee + tax : 0;

  // Card is the only supported payment method


  const handlePayment = async () => {
    if (!agreedToTerms) {
      toast.error(t("paymentAgreeTerms"));
      return;
    }

    if (!user || !booking) {
      toast.error("Missing booking information");
      return;
    }

    // Validate card details (only payment method now)
    if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv || !cardDetails.name) {
      toast.error(t("paymentFillFields"));
      return;
    }

    setLoading(true);
    try {
      if (!booking.host_id) {
        toast.error("Missing host information for this property");
        setLoading(false);
        return;
      }

      // Create the booking in the database
      const { data: newBooking, error } = await supabase.from("bookings").insert({
        guest_id: user.id,
        host_id: booking.host_id,
        property_id: booking.property_id,
        check_in: booking.check_in,
        check_out: booking.check_out,
        guests: booking.guests,
        total_price: total,
        status: "pending",
        guest_message: guestMessage || null,
        payment_method: "card",
        is_paid: true,
      }).select().single();

      if (error) throw error;

      // Create notification for the host
      await createNotification({
        user_id: booking.host_id,
        title: "New Booking Request",
        message: `You have a new booking request for ${booking.property_name}. Check-in: ${booking.check_in}`,
        type: "booking",
        link: "/host/bookings",
      });

      // Track conversion
      await trackEvent("booking_completed", {
        booking_id: newBooking.id,
        property_id: booking.property_id,
        user_id: user.id,
        metadata: { total: total, nights: booking.nights },
      });

      // Send WhatsApp confirmations (best-effort, won't fail booking)
      try {
        const { data: hostProfile } = await supabase.from("profiles").select("phone, phone_verified").eq("id", booking.host_id).maybeSingle();
        const { data: guestProfile } = await supabase.from("profiles").select("phone, phone_verified, full_name").eq("id", user.id).maybeSingle();
        if (hostProfile?.phone && hostProfile.phone_verified) {
          supabase.functions.invoke("send-whatsapp", { body: { to: hostProfile.phone, body: `🏠 New booking request!\n\nProperty: ${booking.property_name}\nGuest: ${guestProfile?.full_name ?? "A guest"}\nCheck-in: ${booking.check_in}\nCheck-out: ${booking.check_out}\n\nReview it: https://meewano-kurdish-stays.lovable.app/host/bookings` } }).then();
        }
        if (guestProfile?.phone && guestProfile.phone_verified) {
          supabase.functions.invoke("send-whatsapp", { body: { to: guestProfile.phone, body: `✅ Booking received!\n\n${booking.property_name}\nCheck-in: ${booking.check_in}\nCheck-out: ${booking.check_out}\nTotal: $${total}\n\nWe'll notify you when the host confirms.` } }).then();
        }
      } catch (waErr) { console.warn("WhatsApp send failed (non-fatal):", waErr); }

      // Send booking confirmation + invoice email to guest (best-effort)
      try {
        const { data: guestProf } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", user.id)
          .maybeSingle();
        const { data: propExtra } = await supabase
          .from("properties")
          .select("welcome_message, cleaning_policy")
          .eq("id", booking.property_id)
          .maybeSingle();
        const recipientEmail = guestProf?.email || user.email || null;
        const firstName = (guestProf?.full_name || "").split(" ")[0] || "";
        supabase.functions.invoke("send-booking-confirmation", {
          body: {
            email: recipientEmail,
            guest_id: user.id,
            firstName,
            booking: {
              confirmationNumber: `MW-${newBooking.id.slice(0, 8).toUpperCase()}`,
              propertyName: booking.property_name,
              propertyLocation: booking.property_location,
              checkIn: booking.check_in,
              checkOut: booking.check_out,
              guests: booking.guests,
              nights: booking.nights,
              pricePerNight: booking.price_per_night,
              subtotal: booking.total_price,
              cleaningFee,
              tax,
              total,
              currency: "IQD",
              paymentMethod: "Credit/Debit Card",
              welcomeMessage: propExtra?.welcome_message || "",
              cleaningPolicy: propExtra?.cleaning_policy || "",
            },
          },
        }).catch((e) => console.warn("booking email failed", e));

        // Send email notification to the HOST about the new booking request
        const { data: hostProf } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", booking.host_id)
          .maybeSingle();
        // Use host_id to look up email – pass it to the edge function so
        // it can resolve the email from auth.users via service role if needed
        const hostEmail = hostProf?.email || null;
        supabase.functions.invoke("send-host-booking-notification", {
          body: {
            email: hostEmail,
            host_id: booking.host_id,
            booking: {
              hostName: hostProf?.full_name || "Host",
              guestName: guestProf?.full_name || "A guest",
              propertyName: booking.property_name,
              propertyLocation: booking.property_location,
              checkIn: booking.check_in,
              checkOut: booking.check_out,
              guests: booking.guests,
              nights: booking.nights,
              totalPrice: total,
              currency: "IQD",
              guestMessage: guestMessage || "",
              confirmationNumber: `MW-${newBooking.id.slice(0, 8).toUpperCase()}`,
            },
          },
        }).catch((e) => console.warn("host booking notification email failed", e));
      } catch (e) { console.warn("email lookup failed (non-fatal):", e); }



      // Store confirmation data for the next page
      sessionStorage.setItem("confirmedBooking", JSON.stringify({
        bookingId: newBooking.id,
        propertyName: booking.property_name,
        propertyImage: booking.property_image,
        propertyLocation: booking.property_location,
        propertyId: booking.property_id,
        hostId: booking.host_id,
        checkIn: booking.check_in,
        checkOut: booking.check_out,
        guests: booking.guests,
        nights: booking.nights,
        pricePerNight: booking.price_per_night,
        totalPrice: total,
        paymentMethod: "card",
      }));

      // Clear pending booking
      sessionStorage.removeItem("pendingBooking");

      toast.success(t("paymentProcessing"));
      navigate("/booking-confirmation");
    } catch (error: any) {
      console.error("Booking error:", error);
      toast.error(error.message || "Failed to complete booking");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !booking) {
    return (
      <AppLayout>
        <main className="flex-1 container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="flex-1 container mx-auto px-4 py-8">
        <BookingStepIndicator currentStep={2} />
        <h1 className="text-3xl font-bold mb-8">{t("paymentTitle")}</h1>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column: Payment Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Message to Host */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Message to Host (Optional)</h2>
              <Textarea
                placeholder="Introduce yourself and share why you're traveling..."
                value={guestMessage}
                onChange={(e) => setGuestMessage(e.target.value)}
                className="min-h-[100px]"
              />
            </Card>

            {/* Card Payment */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">{t("paymentDetails")}</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cardNumber">{t("paymentCardNumber")}</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardDetails.number}
                    onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                    maxLength={19}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry">{t("paymentExpiry")}</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      value={cardDetails.expiry}
                      onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">{t("paymentCVV")}</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      type="password"
                      value={cardDetails.cvv}
                      onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                      maxLength={4}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="cardName">{t("paymentCardName")}</Label>
                  <Input
                    id="cardName"
                    placeholder="John Doe"
                    value={cardDetails.name}
                    onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                  />
                </div>
              </div>
            </Card>

            {/* Security & Terms */}
            <Card className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <Lock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  {t("paymentSecurityMessage")}
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                />
                <label htmlFor="terms" className="text-sm cursor-pointer">
                  {t("paymentAgreeText")}{" "}
                  <a href="/terms" className="text-primary hover:underline">
                    {t("paymentTermsLink")}
                  </a>{" "}
                  {t("paymentAnd")}{" "}
                  <a href="/cancellation" className="text-primary hover:underline">
                    {t("paymentCancellationLink")}
                  </a>
                </label>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={handlePayment} 
                className="flex-1" 
                size="lg"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {t("paymentPayNow")} • {formatPrice(total)}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex-1 sm:flex-initial"
                size="lg"
              >
                {t("paymentCancel")}
              </Button>
            </div>
          </div>

          {/* Right Column: Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">{t("paymentBookingSummary")}</h2>
              
              {/* Property Info */}
              <div className="flex gap-3 mb-4 pb-4 border-b border-border">
                <img
                  src={booking.property_image}
                  alt={booking.property_name}
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div>
                  <h3 className="font-semibold text-sm mb-1">{booking.property_name}</h3>
                  <p className="text-xs text-muted-foreground mb-1">{booking.property_location}</p>
                </div>
              </div>

              {/* Stay Details */}
              <div className="space-y-2 mb-4 pb-4 border-b border-border text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("paymentCheckIn")}</span>
                  <span className="font-medium">{booking.check_in}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("paymentCheckOut")}</span>
                  <span className="font-medium">{booking.check_out}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("paymentGuests")}</span>
                  <span className="font-medium">{booking.guests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("paymentNights")}</span>
                  <span className="font-medium">{booking.nights}</span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {formatPrice(booking.price_per_night)} × {booking.nights} {t("paymentNights")}
                  </span>
                  <span>{formatPrice(booking.total_price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("paymentCleaningFee")}</span>
                  <span>{formatPrice(cleaningFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("paymentTax")}</span>
                  <span>{formatPrice(tax)}</span>
                </div>
              </div>

              {/* Total */}
              <div className="pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">{t("paymentTotal")}</span>
                  <span className="font-bold text-xl text-primary">{formatPrice(total)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

    </AppLayout>
  );
};

export default Payment;