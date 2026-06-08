import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/AppLayout";
import { useTranslation } from "@/hooks/useTranslation";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import { PasswordStrength } from "@/components/PasswordStrength";
import PasswordRequirements, { evaluatePasswordRequirements } from "@/components/PasswordRequirements";

type AuthMode = "login" | "signup" | "signup_verify" | "forgot" | "forgot_code" | "forgot_new_password";

const Auth = () => {
  const initialMode: AuthMode = new URLSearchParams(window.location.search).get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeNewsletter, setAgreeNewsletter] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [signupCode, setSignupCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}${redirectTo}`,
      });

      if (result.error) {
        throw result.error;
      }

      if (result.redirected) {
        return;
      }

      toast({
        title: t("welcomeBackToast"),
        description: t("loginSuccessDesc"),
      });
      navigate(redirectTo);
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error.message || "Google sign-in failed",
        variant: "destructive",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        if (!username.trim() || !fullName.trim()) {
          throw new Error("Please fill in all fields");
        }
        if (!agreeTerms) {
          throw new Error("Please agree to the Terms & Privacy Policy");
        }
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        const reqs = evaluatePasswordRequirements(password);
        const missing = reqs.filter((r) => !r.passed);
        if (missing.length > 0) {
          throw new Error("Password does not meet all requirements");
        }

        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", username.trim().toLowerCase())
          .maybeSingle();

        if (existing) {
          throw new Error("Username is already taken");
        }

        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: fullName.trim(),
              username: username.trim().toLowerCase(),
              phone: phone.trim() || null,
            },
          },
        });

        if (error) throw error;

        toast({
          title: "Verification code sent",
          description: `Check ${email} for your verification code.`,
        });
        setSignupCode("");
        setMode("signup_verify");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: t("welcomeBackToast"),
          description: t("loginSuccessDesc"),
        });
        navigate(redirectTo);
      }
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = signupCode.trim();
    if (code.length < 6) {
      toast({ title: t("error"), description: "Enter the verification code from your email", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });
      if (error) throw error;

      if (data.user) {
        await supabase
          .from("profiles")
          .update({
            full_name: fullName.trim(),
            username: username.trim().toLowerCase(),
            phone: phone.trim() || null,
            newsletter_opt_in: agreeNewsletter,
            terms_accepted_at: new Date().toISOString(),
          })
          .eq("id", data.user.id);
      }

      toast({
        title: t("accountCreated"),
        description: t("accountCreatedDesc"),
      });
      navigate(redirectTo);
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error.message || "Invalid or expired code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendSignupCode = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) throw error;
      toast({ title: "Code resent", description: `A new code has been sent to ${email}.` });
    } catch (error: any) {
      toast({ title: t("error"), description: error.message || "Could not resend code", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };


  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({
        title: t("error"),
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) throw error;

      toast({
        title: "Code sent",
        description: "Check your email for the 6-digit code.",
      });
      setResetCode("");
      setMode("forgot_code");
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetCode.trim().length < 6) {
      toast({ title: t("error"), description: "Enter the 6-digit code", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: resetCode.trim(),
        type: "recovery",
      });
      if (error) throw error;
      setNewPassword("");
      setConfirmNewPassword("");
      setMode("forgot_new_password");
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error.message || "Invalid or expired code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: t("error"), description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({ title: t("error"), description: "Passwords do not match", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      await supabase.auth.signOut();
      toast({ title: "Password updated", description: "Sign in with your new password." });
      setPassword("");
      setResetCode("");
      setNewPassword("");
      setConfirmNewPassword("");
      setMode("login");
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error.message || "Could not update password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (mode === "signup_verify") {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <button
                onClick={() => setMode("signup")}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 w-fit"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <CardTitle>Verify your email</CardTitle>
              <CardDescription>
                We sent a verification code to {email}. Enter it below to activate your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerifySignup} className="space-y-4">
                <Input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="12345678"
                  maxLength={8}
                  value={signupCode}
                  onChange={(e) => setSignupCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  className="text-center text-2xl tracking-[0.4em]"
                  required
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t("loading") : "Verify & Create Account"}
                </Button>
                <button
                  type="button"
                  onClick={handleResendSignupCode}
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                  disabled={loading}
                >
                  Didn't get it? Resend code
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (mode === "forgot") {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <button
                onClick={() => setMode("login")}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 w-fit"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </button>
              <CardTitle>Reset Password</CardTitle>
              <CardDescription>
                Enter your email and we'll send you a 6-digit code to reset your password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder={t("email")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t("loading") : "Send Code"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (mode === "forgot_code") {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <button
                onClick={() => setMode("forgot")}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 w-fit"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <CardTitle>Enter Verification Code</CardTitle>
              <CardDescription>
                We sent a 6-digit code to {email}. Enter it below to continue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerifyResetCode} className="space-y-4">
                <Input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="12345678"
                  maxLength={8}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  className="text-center text-2xl tracking-[0.4em]"
                  required
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t("loading") : "Verify Code"}
                </Button>
                <button
                  type="button"
                  onClick={handleForgotPassword as any}
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                  disabled={loading}
                >
                  Didn't get it? Resend code
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (mode === "forgot_new_password") {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Set New Password</CardTitle>
              <CardDescription>
                Choose a new password for your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSetNewPassword} className="space-y-4">
                <div>
                  <Input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                  <PasswordStrength password={newPassword} />
                </div>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  minLength={6}
                  required
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t("loading") : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{mode === "signup" ? t("createAccount") : t("welcomeBack")}</CardTitle>
            <CardDescription>
              {mode === "signup" ? t("signUpDesc") : t("loginDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              {mode === "signup" && (
                <>
                  <div>
                    <Input
                      type="text"
                      placeholder={t("fullName") || "Full Name"}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase())}
                      required
                      minLength={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Letters, numbers, and underscores only
                    </p>
                  </div>
                  <div>
                    <Input
                      type="tel"
                      placeholder="Phone number (optional)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoComplete="tel"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Optional — used for booking updates
                    </p>
                  </div>
                </>
              )}
              <div>
                <Input
                  type="email"
                  placeholder={t("email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder={t("password")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {mode === "signup" && <PasswordRequirements password={password} />}
              </div>
              {mode === "signup" && (
                <div>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}
              {mode === "login" && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
              {mode === "signup" && (
                <div className="space-y-3 pt-1">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <Checkbox
                      checked={agreeTerms}
                      onCheckedChange={(c) => setAgreeTerms(c === true)}
                      className="mt-0.5"
                    />
                    <span className="text-xs text-muted-foreground leading-snug">
                      I agree to the{" "}
                      <Link to="/terms" target="_blank" className="text-primary hover:underline">Terms of Service</Link>
                      {" "}and{" "}
                      <Link to="/privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</Link>.
                    </span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <Checkbox
                      checked={agreeNewsletter}
                      onCheckedChange={(c) => setAgreeNewsletter(c === true)}
                      className="mt-0.5"
                    />
                    <span className="text-xs text-muted-foreground leading-snug">
                      Send me occasional updates, travel tips and special offers (you can unsubscribe anytime).
                    </span>
                  </label>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("loading") : mode === "signup" ? t("signUp") : t("login")}
              </Button>
            </form>
            {mode === "login" && (
              <>
                <div className="my-4 flex items-center gap-3">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <Separator className="flex-1" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center gap-2"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {googleLoading ? t("loading") : `Continue with Google`}
                </Button>
              </>
            )}
            <div className="mt-4 text-center">
              <button
                onClick={() => setMode(mode === "signup" ? "login" : "signup")}
                className="text-sm text-primary hover:underline"
              >
                {mode === "signup" ? t("alreadyHaveAccount") : t("dontHaveAccount")}
                {" "}
                {mode === "signup" ? t("login") : t("signUp")}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Auth;
