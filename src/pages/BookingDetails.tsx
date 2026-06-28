import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import BookingStepIndicator from "@/components/BookingStepIndicator";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowRight, MapPin, Banknote, CreditCard, Smartphone, Wallet } from "lucide-react";
import { toast } from "sonner";

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

const COUNTRIES = [
  "Iraq", "Kurdistan Region", "Turkey", "Iran", "Syria", "Jordan", "Lebanon",
  "United Arab Emirates", "Saudi Arabia", "Qatar", "Kuwait", "Bahrain", "Oman",
  "Egypt", "United States", "United Kingdom", "Germany", "France", "Italy",
  "Spain", "Netherlands", "Sweden", "Norway", "Canada", "Australia", "Other",
];

const TITLES = ["Mr", "Mrs", "Ms", "Mx", "Dr"];

const PAYMENT_METHODS = [
  { id: "cash", label: "Cash at check-in", icon: Banknote },
  { id: "fastpay", label: "FastPay", icon: Smartphone },
  { id: "zaincash", label: "ZainCash", icon: Wallet },
  { id: "qicard", label: "Qi Card", icon: CreditCard },
];

const BookingDetails = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { formatPrice } = useCurrency();

  const [booking, setBooking] = useState<PendingBooking | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [title, setTitle] = useState("Mr");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("Iraq");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    const pending = sessionStorage.getItem("pendingBooking");
    if (!pending) {
      navigate("/");
      return;
    }
    setBooking(JSON.parse(pending));
  }, [user, authLoading, navigate]);

  // Auto-fill from profile + auth, but only on first load (keep user edits)
  useEffect(() => {
    if (!user || profileLoaded) return;
    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email, phone")
        .eq("id", user.id)
        .maybeSingle();

      const fullName = (profile?.full_name || (user as any)?.user_metadata?.full_name || "").trim();
      const [first, ...rest] = fullName.split(/\s+/);
      setFirstName((prev) => prev || first || "");
      setLastName((prev) => prev || rest.join(" ") || "");
      const e = profile?.email || user.email || "";
      setEmail((prev) => prev || e);
      setConfirmEmail((prev) => prev || e);
      setPhone((prev) => prev || profile?.phone || "");

      // Try to restore previously entered details if user came back
      const saved = sessionStorage.getItem("bookingGuestDetails");
      if (saved) {
        try {
          const g = JSON.parse(saved);
          if (g.title) setTitle(g.title);
          if (g.firstName) setFirstName(g.firstName);
          if (g.lastName) setLastName(g.lastName);
          if (g.email) { setEmail(g.email); setConfirmEmail(g.email); }
          if (g.phone) setPhone(g.phone);
          if (g.country) setCountry(g.country);
          if (g.address) setAddress(g.address);
          if (g.paymentMethod) setPaymentMethod(g.paymentMethod);
        } catch { /* ignore */ }
      }

      setProfileLoaded(true);
    })();
  }, [user, profileLoaded]);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Please enter your first and last name");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      toast.error("Please enter a valid email");
      return;
    }
    if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
      toast.error("Emails do not match");
      return;
    }
    if (!phone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }
    if (!country) {
      toast.error("Please select your country");
      return;
    }
    if (!address.trim()) {
      toast.error("Please enter your address");
      return;
    }

    setLoading(true);
    const details = {
      title,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      country,
      address: address.trim(),
      paymentMethod,
    };
    sessionStorage.setItem("bookingGuestDetails", JSON.stringify(details));
    sessionStorage.setItem("bookingPaymentMethod", paymentMethod);
    navigate("/payment");
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
        <BookingStepIndicator currentStep={1} />
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Your details</h1>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Form */}
          <form onSubmit={handleContinue} className="lg:col-span-2 space-y-6">
            <Card className="p-6 space-y-4">
              <div className="grid sm:grid-cols-[140px_1fr_1fr] gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Select value={title} onValueChange={setTitle}>
                    <SelectTrigger id="title" className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TITLES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    autoComplete="given-name"
                    className="mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    autoComplete="family-name"
                    className="mt-1.5"
                    required
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="confirmEmail">Confirm email</Label>
                  <Input
                    id="confirmEmail"
                    type="email"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-1.5"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+964 7XX XXX XXXX"
                  autoComplete="tel"
                  className="mt-1.5"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Used by the host to reach you about your booking.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger id="country" className="mt-1.5">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <div className="relative mt-1.5">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street, city, postal code"
                      autoComplete="street-address"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Payment Method */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Payment method</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  const selected = paymentMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${selected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="font-medium text-sm">{method.label}</span>
                      {selected && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
              {paymentMethod === "cash" && (
                <p className="text-xs text-muted-foreground mt-3">
                  You will pay the host in cash when you arrive at the property.
                </p>
              )}
              {(paymentMethod === "fastpay" || paymentMethod === "zaincash" || paymentMethod === "qicard") && (
                <p className="text-xs text-muted-foreground mt-3">
                  Payment instructions will be shown on the next step.
                </p>
              )}
            </Card>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button type="submit" size="lg" className="flex-1" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Continue to payment
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate(-1)}
                className="flex-1 sm:flex-initial"
              >
                Back
              </Button>
            </div>
          </form>

          {/* Booking summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <h2 className="text-lg font-semibold mb-4">Booking summary</h2>
              <div className="flex gap-3 mb-4 pb-4 border-b border-border">
                <img
                  src={booking.property_image}
                  alt={booking.property_name}
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div>
                  <h3 className="font-semibold text-sm mb-1">{booking.property_name}</h3>
                  <p className="text-xs text-muted-foreground">{booking.property_location}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-in</span>
                  <span className="font-medium">{booking.check_in}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-out</span>
                  <span className="font-medium">{booking.check_out}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Guests</span>
                  <span className="font-medium">{booking.guests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nights</span>
                  <span className="font-medium">{booking.nights}</span>
                </div>
                <div className="flex justify-between pt-3 mt-3 border-t border-border">
                  <span className="font-semibold">Subtotal</span>
                  <span className="font-bold">{formatPrice(booking.total_price)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </AppLayout>
  );
};

export default BookingDetails;
