import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, BedDouble, Bath, MapPin, User as UserIcon, Mail,
  Loader2, CheckCircle2, Eye, EyeOff, MailCheck, Plus, Minus, Phone,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import PasswordStrengthMeter, { evaluatePassword } from "@/components/PasswordStrengthMeter";
import LocationPicker from "@/components/LocationPicker";

const TOTAL_STEPS = 6;
const EMAIL_OTP_LENGTH = 8;

const IRAQ_CITIES = [
  "Baghdad", "Basra", "Mosul", "Erbil", "Sulaymaniyah", "Duhok", "Halabja",
  "Kirkuk", "Najaf", "Karbala", "Hillah", "Nasiriyah", "Amarah", "Diwaniyah",
  "Kut", "Ramadi", "Fallujah", "Samarra", "Tikrit", "Baquba", "Zakho",
  "Soran", "Koya", "Ranya", "Chamchamal", "Kifri", "Khanaqin", "Tuz Khurmatu",
  "Sinjar", "Tal Afar", "Bayji", "Haditha", "Hit", "Rutba", "Anah",
  "Al Qa'im", "Balad", "Dujail", "Mahmudiyah", "Yusufiyah", "Iskandariyah",
  "Musayyib", "Mahawil", "Shomali", "Hashimiyah", "Abu Ghraib", "Madain",
  "Mahmur", "Shaqlawa", "Akre", "Bardarash", "Dibis", "Hawija", "Daquq",
  "Ankawa", "Pirmam", "Choman", "Penjwen", "Said Sadiq", "Dukan", "Qaladze",
  "Rawanduz", "Galala", "Mergasur", "Amedi",
];


const STEPS = [
  { id: 1, title: "How many rooms?", subtitle: "Bedrooms in your property", icon: BedDouble },
  { id: 2, title: "How many bathrooms?", subtitle: "Including half-baths", icon: Bath },
  { id: 3, title: "Where's your property?", subtitle: "City and neighborhood", icon: MapPin },
  { id: 4, title: "What's your name?", subtitle: "Guests will see this", icon: UserIcon },
  { id: 5, title: "Create your account", subtitle: "Email, mobile and a strong password", icon: Mail },
  { id: 6, title: "Review & submit", subtitle: "Double-check before we create your account", icon: CheckCircle2 },
];

const Counter = ({ value, onChange, min = 1, max = 20 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) => (
  <div className="flex items-center justify-center gap-6">
    <Button type="button" variant="outline" size="icon" className="h-14 w-14 rounded-full"
      disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>
      <Minus className="h-5 w-5" />
    </Button>
    <div className="text-6xl font-bold tabular-nums w-24 text-center">{value}</div>
    <Button type="button" variant="outline" size="icon" className="h-14 w-14 rounded-full"
      disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>
      <Plus className="h-5 w-5" />
    </Button>
  </div>
);

const BECOME_HOST_DRAFT_KEY = "meewano:become-host-draft:v1";

const DEFAULT_FORM = {
  bedrooms: 2,
  bathrooms: 1,
  city: "",
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
  const [step, setStep] = useState(initial?.step ?? 1);
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
    } catch { /* ignore quota errors */ }
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
    if (step === 4) return form.first_name.trim().length >= 2 && form.last_name.trim().length >= 2;
    if (step === 5) {
      const { isStrong } = evaluatePassword(form.password);
      return /\S+@\S+\.\S+/.test(form.email) && isStrong && phoneOk(form.phone);
    }
    return true;
  };

  const next = () => {
    if (!canAdvance()) {
      if (step === 3) toast.error("Please enter the city your property is in");
      else if (step === 4) toast.error("Please enter your first and last name");
      else if (step === 5) toast.error("Enter a valid email, mobile number and a stronger password");
      return;
    }
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  };
  const back = () => setStep((s) => Math.max(1, s - 1));

  const handleSubmit = async () => {
    if (!canAdvance()) return;
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
      try { localStorage.removeItem(BECOME_HOST_DRAFT_KEY); } catch { /* ignore */ }
      // Fire welcome email + next-steps (non-blocking)
      supabase.functions.invoke("send-host-welcome", {
        body: { email: form.email.trim(), firstName: form.first_name.trim() },
      }).catch((e) => console.warn("welcome email failed", e));
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

  if (submitted) {
    return (
      <AppLayout>
        <main className="container mx-auto px-4 py-12 max-w-xl">
          <Card>
            <CardContent className="pt-10 pb-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 text-primary mb-5">
                <MailCheck className="h-10 w-10" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Enter your code</h1>
              <p className="text-muted-foreground mb-1">We sent a verification code to</p>
              <p className="font-semibold mb-6 break-all">{form.email}</p>

              <div className="flex justify-center mb-6">
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
                className="w-full h-12 mb-3"
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

              <p className="text-xs text-muted-foreground mt-6">
                Check your spam folder if you don't see the email within a minute.
              </p>
            </CardContent>
          </Card>
        </main>
      </AppLayout>
    );
  }

  const current = STEPS[step - 1];
  const Icon = current.icon;
  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <AppLayout>
      <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-accent/30 via-background to-background">
        {/* Sticky progress */}
        <div className="sticky top-14 md:top-20 z-30 bg-background/80 backdrop-blur border-b border-border">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
              <span>Step {step} of {TOTAL_STEPS}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-1.5" />
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
                    <Counter value={form.bedrooms} onChange={(v) => update({ bedrooms: v })} min={1} max={20} />
                  )}

                  {step === 2 && (
                    <Counter value={form.bathrooms} onChange={(v) => update({ bathrooms: v })} min={1} max={10} />
                  )}

                  {step === 3 && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          autoFocus
                          className="mt-2 h-12"
                          placeholder="Start typing a city in Iraq..."
                          list="iraq-cities"
                          autoComplete="off"
                          value={form.city}
                          onChange={(e) => update({ city: e.target.value })}
                        />
                        <datalist id="iraq-cities">
                          {IRAQ_CITIES.map((c) => (
                            <option key={c} value={c} />
                          ))}
                        </datalist>
                      </div>
                      <div>
                        <Label htmlFor="area">Neighborhood / area <span className="text-muted-foreground text-xs">(optional)</span></Label>
                        <Input id="area" className="mt-2 h-12" placeholder="e.g. Ankawa"
                          value={form.area} onChange={(e) => update({ area: e.target.value })} />
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="first_name">First name</Label>
                        <Input id="first_name" autoFocus className="mt-2 h-12" value={form.first_name}
                          onChange={(e) => update({ first_name: e.target.value })} />
                      </div>
                      <div>
                        <Label htmlFor="last_name">Surname</Label>
                        <Input id="last_name" className="mt-2 h-12" value={form.last_name}
                          onChange={(e) => update({ last_name: e.target.value })} />
                      </div>
                    </div>
                  )}

                  {step === 5 && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" autoComplete="email" className="mt-2 h-12"
                          placeholder="you@example.com"
                          value={form.email} onChange={(e) => update({ email: e.target.value })} />
                      </div>
                      <div>
                        <Label htmlFor="phone">Mobile number</Label>
                        <div className="relative mt-2">
                          <Phone className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                          <Input id="phone" type="tel" autoComplete="tel" inputMode="tel"
                            className="h-12 pl-10"
                            placeholder="+964 7XX XXX XXXX"
                            value={form.phone} onChange={(e) => update({ phone: e.target.value })} />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <div className="relative mt-2">
                          <Input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password"
                            className="h-12 pr-11"
                            placeholder="Create a strong password"
                            value={form.password} onChange={(e) => update({ password: e.target.value })} />
                          <button type="button" onClick={() => setShowPassword((s) => !s)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <PasswordStrengthMeter password={form.password} />
                      </div>
                    </div>
                  )}

                  {step === 6 && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">Here's what we'll set up for you:</p>
                      <div className="bg-accent/40 rounded-xl p-5 space-y-3 text-sm">
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Rooms</span>
                          <span className="font-semibold">{form.bedrooms}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Bathrooms</span>
                          <span className="font-semibold">{form.bathrooms}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Location</span>
                          <span className="font-semibold text-right">{form.city}{form.area ? `, ${form.area}` : ""}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Name</span>
                          <span className="font-semibold">{form.first_name} {form.last_name}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Email</span>
                          <span className="font-semibold break-all text-right">{form.email}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Mobile</span>
                          <span className="font-semibold text-right">{form.phone}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        After submitting, we'll email you a verification code. Once verified, you'll add your payment details and a selfie to complete your host account.
                      </p>
                    </div>
                  )}
                </div>

                {/* Nav buttons */}
                <div className="flex items-center justify-between mt-6 gap-3">
                  <Button variant="ghost" onClick={back} disabled={step === 1}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                  </Button>
                  {step < TOTAL_STEPS ? (
                    <Button size="lg" className="h-12 px-6" onClick={next} disabled={!canAdvance()}>
                      Continue <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button size="lg" className="h-12 px-6" onClick={handleSubmit} disabled={submitting}>
                      {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Create my host account
                    </Button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </AppLayout>
  );
};

export default BecomeHost;
