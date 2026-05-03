import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, Home, Calendar, MapPin, User, CreditCard, Banknote, Smartphone, Loader2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { useCurrency } from "@/contexts/CurrencyContext";

interface ConfirmedBooking {
  bookingId: string;
  propertyName: string;
  propertyImage: string;
  propertyLocation: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  pricePerNight: number;
  totalPrice: number;
  paymentMethod: string;
}

const paymentMethodLabels: Record<string, string> = {
  card: "Credit/Debit Card",
  cash: "Cash at Check-in",
  nasswallet: "NassWallet",
  zaincash: "ZainCash",
  fastpay: "FastPay",
  asiapay: "AsiaPay",
  furatpay: "FuratPay",
};

const BookingConfirmation = () => {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<ConfirmedBooking | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("confirmedBooking");
    if (stored) {
      setBooking(JSON.parse(stored));
    }
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!booking) {
    return (
      <AppLayout>
        <main className="container mx-auto px-4 py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">{t("loading")}</p>
        </main>
      </AppLayout>
    );
  }

  const confirmationNumber = `MW-${booking.bookingId.slice(0, 8).toUpperCase()}`;

  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-2xl mx-auto text-center mb-6 md:mb-8">
          <div className="flex justify-center mb-4 md:mb-6">
            <div className="bg-accent rounded-full p-4">
              <CheckCircle className="h-12 w-12 md:h-16 md:w-16 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold mb-2 md:mb-3">{t("bookingConfirmed")}</h1>
          <p className="text-sm md:text-lg text-muted-foreground">
            {t("bookingSuccess")}
          </p>
          <p className="text-xs md:text-sm text-muted-foreground mt-2">
            {t("confirmationNumber")}: <span className="font-mono font-semibold">{confirmationNumber}</span>
          </p>
        </div>

        <Card className="max-w-3xl mx-auto">
          <CardContent className="p-0">
            <img 
              src={booking.propertyImage || "/placeholder.svg"} 
              alt={booking.propertyName}
              className="w-full h-48 md:h-64 object-cover rounded-t-xl"
            />
            
            <div className="p-4 md:p-8 space-y-5 md:space-y-6">
              {/* Property Details */}
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">{booking.propertyName}</h2>
                <div className="flex items-center gap-2 text-sm md:text-base text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{booking.propertyLocation}</span>
                </div>
              </div>

              {/* Booking Details */}
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                <div className="flex items-start gap-2 md:gap-3">
                  <Calendar className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">{t("checkIn")}</p>
                    <p className="text-sm md:text-base font-semibold">{formatDate(booking.checkIn)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 md:gap-3">
                  <Calendar className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">{t("checkOut")}</p>
                    <p className="text-sm md:text-base font-semibold">{formatDate(booking.checkOut)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 md:gap-3">
                  <User className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">{t("guests")}</p>
                    <p className="text-sm md:text-base font-semibold">{booking.guests} {t("guests")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 md:gap-3">
                  {booking.paymentMethod === "cash" ? (
                    <Banknote className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  ) : booking.paymentMethod === "card" ? (
                    <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  ) : (
                    <Smartphone className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <p className="text-xs md:text-sm text-muted-foreground">Payment</p>
                    <p className="text-sm md:text-base font-semibold">{paymentMethodLabels[booking.paymentMethod] || booking.paymentMethod}</p>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="border-t pt-4 md:pt-6">
                <h3 className="font-semibold mb-3 md:mb-4 text-sm md:text-base">{t("bookingSummary")}</h3>
                <div className="space-y-2 text-sm md:text-base">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {formatPrice(booking.pricePerNight)} × {booking.nights} {t("nights")}
                    </span>
                    <span>{formatPrice(booking.pricePerNight * booking.nights)}</span>
                  </div>
                  {booking.totalPrice !== booking.pricePerNight * booking.nights && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Fees & taxes</span>
                      <span>{formatPrice(booking.totalPrice - booking.pricePerNight * booking.nights)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t">
                    <span className="font-bold text-base md:text-lg">{t("total")}</span>
                    <span className="font-bold text-base md:text-lg text-primary">{formatPrice(booking.totalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2 md:pt-4">
                <Link to="/guest/bookings" className="flex-1">
                  <Button variant="outline" className="w-full h-11 md:h-12 text-sm md:text-base">
                    {t("viewBooking")}
                  </Button>
                </Link>
                <Link to="/" className="flex-1">
                  <Button className="w-full h-11 md:h-12 text-sm md:text-base">
                    {t("returnHome")}
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </AppLayout>
  );
};

export default BookingConfirmation;
