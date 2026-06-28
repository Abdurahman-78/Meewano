import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  Bath,
  MapPin,
  UserPlus,
  Loader2,
  Eye,
  EyeOff,
  Phone,
  ShieldCheck,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import PasswordStrengthMeter, { evaluatePassword } from "@/components/PasswordStrengthMeter";
import LocationPicker from "@/components/LocationPicker";
import HostStepIndicator from "@/components/HostStepIndicator";

const TOTAL_STEPS = 5;
const EMAIL_OTP_LENGTH = 8;

const IRAQ_CITIES = [
  "Baghdad",
  "Basra",
  "Mosul",
  "Erbil",
  "Sulaymaniyah",
  "Duhok",
  "Halabja",
  "Kirkuk",
  "Najaf",
  "Karbala",
  "Hillah",
  "Nasiriyah",
  "Amarah",
  "Diwaniyah",
  "Kut",
  "Ramadi",
  "Fallujah",
  "Samarra",
  "Tikrit",
  "Baquba",
  "Zakho",
  "Soran",
  "Koya",
  "Ranya",
  "Chamchamal",
  "Kifri",
  "Khanaqin",
  "Tuz Khurmatu",
  "Sinjar",
  "Tal Afar",
  "Bayji",
  "Haditha",
  "Hit",
  "Rutba",
  "Anah",
  "Al Qa'im",
  "Balad",
  "Dujail",
  "Mahmudiyah",
  "Yusufiyah",
  "Iskandariyah",
  "Musayyib",
  "Mahawil",
  "Shomali",
  "Hashimiyah",
  "Abu Ghraib",
  "Madain",
  "Mahmur",
  "Shaqlawa",
  "Akre",
  "Bardarash",
  "Dibis",
  "Hawija",
  "Daquq",
  "Ankawa",
  "Pirmam",
  "Choman",
  "Penjwen",
  "Said Sadiq",
  "Dukan",
  "Qaladze",
  "Rawanduz",
  "Galala",
  "Mergasur",
  "Amedi",
];

const STEPS = [
  { id: 1, title: "How many bedrooms?", subtitle: "Bedrooms in your property", icon: BedDouble },
  { id: 2, title: "How many bathrooms?", subtitle: "Including half-baths", icon: Bath },
  { id: 3, title: "Where's your property?", subtitle: "City, street and address", icon: MapPin },
  { id: 4, title: "Create your account", subtitle: "Your name, email, mobile and a strong password", icon: UserPlus },
  { id: 5, title: "Verify your email", subtitle: "Enter the code we sent you", icon: ShieldCheck },
];

const NumberSelect = ({
  value,
  onChange,
  min = 1,
  max = 20,
  unit,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  unit: string;
}) => (
  <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
    <SelectTrigger className="h-14 text-lg">
      <SelectValue />
    </SelectTrigger>
    <SelectContent className="bg-popover border border-border z-50 max-h-72">
      {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => (
        <SelectItem key={n} value={String(n)} className="text-base">
          {n} {n === 1 ? unit : `${unit}s`}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

const BECOME_HOST_DRAFT_KEY = "meewano:become-host-draft:v1";

const DEFAULT_FORM = {
  bedrooms: 2,
  bathrooms: 1,
  city: "",
  street: "",
  address: "",
  area: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "+964 ",
  password: "",
  latitude: null as number | null,
  longitude: null as number | null,
};

const loadDraft = (): { form: typeof DEFAULT_FORM; step: number } | null => {
  try {
    const raw = localStorage.getItem(BECOME_HOST_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      form: { ...DEFAULT_FORM, ...(parsed.form ?? {}), password: "" }, // never restore password
      step: typeof parsed.step === "number" ? parsed.step : 1,
    };
  } catch {
    return null;
  }
};

const BecomeHost = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const initial = loadDraft();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const [form, setForm] = useState(initial?.form ?? DEFAULT_FORM);

  // Persist draft on every change (excluding password for safety)
  useEffect(() => {
    try {
      const { password: _pw, ...safeForm } = form;
      localStorage.setItem(BECOME_HOST_DRAFT_KEY, JSON.stringify({ form: safeForm, step }));
    } catch {
      /* ignore quota errors */
    }
  }, [form, step]);

  // If already logged in, skip wizard — they already have an account
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/host/verification");
    }
  }, [user, authLoading, navigate]);

  const update = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const phoneOk = (p: string) => /^[+\d][\d\s\-()]{6,}$/.test(p.trim());

  const canAdvance = () => {
    if (step === 1) return form.bedrooms >= 1;
    if (step === 2) return form.bathrooms >= 1;
    if (step === 3) return form.city.trim().length >= 2;
    if (step === 4) {
      const { isStrong } = evaluatePassword(form.password);
      return (
        form.first_name.trim().length >= 2 &&
        form.last_name.trim().length >= 2 &&
        /\S+@\S+\.\S+/.test(form.email) &&
        isStrong &&
        phoneOk(form.phone)
      );
    }
    if (step === 5) return otp.length === EMAIL_OTP_LENGTH;
    return true;
  };

  const next = async () => {
    if (!canAdvance()) {
      if (step === 3) toast.error("Please enter the city your property is in");
      else if (step === 4) toast.error("Please enter your name, a valid email, mobile number and a stronger password");
      return;
    }
    // When advancing from step 4 (Account) to step 5 (Verify), auto-create the account
    if (step === 4 && !submitted) {
      await handleSubmit();
      return; // handleSubmit sets submitted=true which triggers step 5
    }
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  };
  const back = () => {
    if (step === 5) return; // Can't go back from verification
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          // No emailRedirectTo → sends an email OTP instead of a magic link
          data: {
            first_name: form.first_name.trim(),
            last_name: form.last_name.trim(),
            full_name: `${form.first_name.trim()} ${form.last_name.trim()}`,
            phone: form.phone.trim(),
            intended_bedrooms: form.bedrooms,
            intended_bathrooms: form.bathrooms,
            intended_city: form.city.trim(),
            intended_street: form.street.trim(),
            intended_address: form.address.trim(),
            intended_area: form.area.trim(),
            intended_latitude: form.latitude,
            intended_longitude: form.longitude,
            signup_intent: "host",
          },
        },
      });
      if (error) throw error;
      toast.success("We've sent a verification code to your email");
      setSubmitted(true);
      setStep(5); // Move to verify step
    } catch (e: any) {
      toast.error(e.message || "Failed to create account");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== EMAIL_OTP_LENGTH) return;
    setVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: form.email.trim(),
        token: otp,
        type: "signup",
      });
      if (error) throw error;
      toast.success("Email verified!");
      // Clear the saved wizard draft now that the account exists
      try {
        localStorage.removeItem(BECOME_HOST_DRAFT_KEY);
      } catch {
        /* ignore */
      }
      // Fire welcome email + next-steps (non-blocking)
      supabase.functions
        .invoke("send-host-welcome", {
          body: { email: form.email.trim(), firstName: form.first_name.trim() },
        })
        .catch((e) => console.warn("welcome email failed", e));
      navigate("/host/welcome");
    } catch (e: any) {
      toast.error(e.message || "Invalid or expired code");
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: form.email.trim(),
      });
      if (error) throw error;
      toast.success("New code sent");
      setResendCooldown(45);
    } catch (e: any) {
      toast.error(e.message || "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  if (authLoading) {
    return (
      <AppLayout>
        <main className="container mx-auto px-4 py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </AppLayout>
    );
  }

  // No longer render a separate submitted screen — step 5 handles verification inline

  const current = STEPS[step - 1];
  const Icon = current.icon;

  return (
    <AppLayout>
      <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-accent/30 via-background to-background">
        {/* Sticky step indicator */}
        <div className="sticky top-14 md:top-20 z-30 bg-background/90 backdrop-blur border-b border-border">
          <div className="container mx-auto px-4 py-3 md:py-4 max-w-3xl">
            <HostStepIndicator currentStep={step} />
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 md:py-12">
          <div className="max-w-xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mb-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
                    <Icon className="h-8 w-8" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">{current.title}</h1>
                  <p className="text-muted-foreground">{current.subtitle}</p>
                </div>

                <div className="bg-card rounded-2xl border border-border shadow-sm p-6 md:p-8 space-y-6">
                  {step === 1 && (
                    <NumberSelect
                      value={form.bedrooms}
                      onChange={(v) => update({ bedrooms: v })}
                      min={1}
                      max={20}
                      unit="bedroom"
                    />
                  )}

                  {step === 2 && (
                    <NumberSelect
                      value={form.bathrooms}
                      onChange={(v) => update({ bathrooms: v })}
                      min={1}
                      max={10}
                      unit="bathroom"
                    />
                  )}

                  {step === 3 && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Select value={form.city} onValueChange={(v) => update({ city: v })}>
                          <SelectTrigger id="city" className="mt-2 h-12">
                            <SelectValue placeholder="Select a city in Iraq" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border border-border z-50 max-h-72">
                            {IRAQ_CITIES.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="street">Street</Label>
                        <Input
                          id="street"
                          className="mt-2 h-12"
                          placeholder="e.g. 60m Street"
                          value={form.street}
                          onChange={(e) => update({ street: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          className="mt-2 h-12"
                          placeholder="e.g. Building 15, Apartment 3"
                          value={form.address}
                          onChange={(e) => update({ address: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="area">
                          Neighborhood / area <span className="text-muted-foreground text-xs">(optional)</span>
                        </Label>
                        <Input
                          id="area"
                          className="mt-2 h-12"
                          placeholder="e.g. Ankawa"
                          value={form.area}
                          onChange={(e) => update({ area: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label className="mb-2 block">
                          Pin your property on the map <span className="text-muted-foreground text-xs">(optional)</span>
                        </Label>
                        <LocationPicker
                          value={form.latitude && form.longitude ? { lat: form.latitude, lng: form.longitude } : null}
                          onChange={(c) => update({ latitude: c.lat, longitude: c.lng })}
                          height="280px"
                        />
                        {form.latitude && form.longitude && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Location set: {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="first_name">First name</Label>
                          <Input
                            id="first_name"
                            autoFocus
                            className="mt-2 h-12"
                            value={form.first_name}
                            onChange={(e) => update({ first_name: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="last_name">Surname</Label>
                          <Input
                            id="last_name"
                            className="mt-2 h-12"
                            value={form.last_name}
                            onChange={(e) => update({ last_name: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          autoComplete="email"
                          className="mt-2 h-12"
                          placeholder="you@example.com"
                          value={form.email}
                          onChange={(e) => update({ email: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Mobile number</Label>
                        <div className="relative mt-2">
                          <Phone className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                          <Input
                            id="phone"
                            type="tel"
                            autoComplete="tel"
                            inputMode="tel"
                            className="h-12 pl-10"
                            placeholder="+964 7XX XXX XXXX"
                            value={form.phone}
                            onChange={(e) => update({ phone: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <div className="relative mt-2">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            className="h-12 pr-11"
                            placeholder="Create a strong password"
                            value={form.password}
                            onChange={(e) => update({ password: e.target.value })}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((s) => !s)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <PasswordStrengthMeter password={form.password} />
                      </div>
                    </div>
                  )}

                  {step === 5 && (
                    <div className="space-y-6 text-center">
                      <p className="text-muted-foreground">We sent a verification code to</p>
                      <p className="font-semibold break-all">{form.email}</p>

                      <div className="flex justify-center">
                        <InputOTP maxLength={EMAIL_OTP_LENGTH} value={otp} onChange={setOtp} autoFocus>
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                            <InputOTPSlot index={6} />
                            <InputOTPSlot index={7} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>

                      <Button
                        size="lg"
                        className="w-full h-12"
                        onClick={handleVerifyOtp}
                        disabled={otp.length !== EMAIL_OTP_LENGTH || verifying}
                      >
                        {verifying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Verify & continue
                      </Button>

                      <button
                        onClick={handleResendOtp}
                        disabled={resending || resendCooldown > 0}
                        className="text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                      >
                        {resendCooldown > 0
                          ? `Resend code in ${resendCooldown}s`
                          : resending
                            ? "Sending..."
                            : "Didn't get it? Resend code"}
                      </button>

                      <p className="text-xs text-muted-foreground">
                        Check your spam folder if you don't see the email within a minute.
                      </p>
                    </div>
                  )}
                </div>

                {/* Nav buttons — hidden on step 5 (verification has its own buttons) */}
                {step < 5 && (
                  <div className="flex items-center justify-between mt-6 gap-3">
                    <Button variant="ghost" onClick={back} disabled={step === 1}>
                      <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <Button size="lg" className="h-12 px-6" onClick={next} disabled={!canAdvance() || submitting}>
                      {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      {step === 4 ? "Create account" : "Continue"}
                      {!submitting && <ArrowRight className="h-4 w-4 ml-2" />}
                    </Button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </AppLayout>
  );
};

export default BecomeHost;
