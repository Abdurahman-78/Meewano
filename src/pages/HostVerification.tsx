import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, CheckCircle2, XCircle, Clock, Loader2, Camera, ShieldCheck, CreditCard, FileText } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMyHostVerification, useUpsertHostVerification } from "@/hooks/useHostVerification";
import { detectFacesInFile } from "@/lib/faceDetection";
import { validatePayoutDetails, isPayoutValid, type PayoutMethod } from "@/lib/payoutValidation";

const HostVerification = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: verification, isLoading } = useMyHostVerification();
  const upsert = useUpsertHostVerification();

  const [uploadingSelfie, setUploadingSelfie] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [idUrl, setIdUrl] = useState<string | null>(null);

  // Payment details state
  const [payoutLoaded, setPayoutLoaded] = useState(false);
  const [method, setMethod] = useState<PayoutMethod>("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate(`/auth?redirect=${encodeURIComponent("/host/verification")}`);
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (verification) {
      setSelfieUrl(verification.selfie_url);
      setIdUrl(verification.id_document_url);
    }
  }, [verification]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("payout_method, payout_details")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setMethod((data.payout_method as PayoutMethod) || "");
        const d = (data.payout_details as any) || {};
        setAccountName(d.account_name || "");
        setAccountNumber(d.account_number || "");
        setBankName(d.bank_name || "");
        setPhone(d.phone || "");
      }
      setPayoutLoaded(true);
    })();
  }, [user]);

  const handleSelfieUpload = async (file: File) => {
    if (!user) return;
    setUploadingSelfie(true);
    try {
      try {
        const { faceCount, confidence } = await detectFacesInFile(file);
        if (faceCount === 0) {
          toast.error("No face detected. Please upload a clear selfie of your face.");
          return;
        }
        if (faceCount > 1) {
          toast.error("Multiple faces detected. Please upload a selfie with only you in the frame.");
          return;
        }
        if (confidence < 0.5) {
          toast.error("Face is unclear. Please retake in better lighting.");
          return;
        }
      } catch (err) {
        console.warn("Face detection failed, allowing upload:", err);
      }
      const ext = (file.name.split(".").pop() || "bin").toLowerCase();
      const path = `${user.id}/selfie-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("host-documents")
        .upload(path, file, { contentType: file.type, upsert: true });
      if (error) throw error;
      setSelfieUrl(path);
      await upsert.mutateAsync({ selfie_url: path } as any);
      toast.success("Selfie verified and uploaded");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploadingSelfie(false);
    }
  };

  const handleIdUpload = async (file: File) => {
    if (!user) return;
    setUploadingId(true);
    try {
      if (file.type.startsWith("image/")) {
        try {
          const { faceCount } = await detectFacesInFile(file);
          if (faceCount === 0) {
            toast.error("No face found on the ID. Please upload a clear photo of your ID showing your face.");
            return;
          }
        } catch (err) {
          console.warn("Face detection failed, allowing upload:", err);
        }
      }
      const ext = (file.name.split(".").pop() || "bin").toLowerCase();
      const path = `${user.id}/id-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("host-documents")
        .upload(path, file, { contentType: file.type, upsert: true });
      if (error) throw error;
      setIdUrl(path);
      await upsert.mutateAsync({ id_document_url: path } as any);
      toast.success("ID verified and uploaded");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploadingId(false);
    }
  };

  const needsPhone = method === "fastpay" || method === "zaincash" || method === "fib";

  const payoutErrors = validatePayoutDetails({ method, accountName, phone, accountNumber });
  const payoutValid = () => !!method && isPayoutValid(payoutErrors);

  const status = verification?.status;
  const submitted = !!verification?.submitted_at;
  const rejected = status === "rejected";
  const canSubmit = !!selfieUrl && !!idUrl && payoutValid();

  const handleSubmit = async () => {
    if (!user) return;
    if (!idUrl) { toast.error("Please upload your ID document"); return; }
    if (!selfieUrl) { toast.error("Please upload a selfie"); return; }
    if (!payoutValid()) { toast.error("Please complete your payment details"); return; }
    setSubmitting(true);
    try {
      // Save payment details on profile
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({
          payout_method: method,
          payout_details: { account_name: accountName, account_number: accountNumber, bank_name: bankName, phone },
        })
        .eq("id", user.id);
      if (profileErr) throw profileErr;

      await upsert.mutateAsync({ submitted_at: new Date().toISOString(), status: "pending", rejection_reason: null });
      toast.success("Submitted for admin review");
    } catch (e: any) {
      toast.error(e.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || isLoading || !payoutLoaded) {
    return (
      <AppLayout>
        <main className="container mx-auto px-4 py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </AppLayout>
    );
  }

  const lock = status === "pending" && submitted;

  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-4">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Account Verification</h1>
          <p className="text-muted-foreground">
            Verify your identity and add your payment details so we can pay you out for bookings.
          </p>
        </div>

        {/* Status banner */}
        {status === "approved" && (
          <Alert className="mb-6 border-green-500/40 bg-green-500/5">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>You're verified!</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>You can now list properties.</span>
              <Button size="sm" onClick={() => navigate("/host/add-listing")}>List a property</Button>
            </AlertDescription>
          </Alert>
        )}
        {status === "pending" && submitted && (
          <Alert className="mb-6 border-yellow-500/40 bg-yellow-500/5">
            <Clock className="h-4 w-4 text-yellow-600" />
            <AlertTitle>Pending admin review</AlertTitle>
            <AlertDescription>We'll email you once your details are reviewed (usually within 24 hours).</AlertDescription>
          </Alert>
        )}
        {status === "rejected" && (
          <Alert className="mb-6 border-destructive/40 bg-destructive/5">
            <XCircle className="h-4 w-4 text-destructive" />
            <AlertTitle>Verification rejected</AlertTitle>
            <AlertDescription>
              {verification?.rejection_reason || "Please update your details and submit again."}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* ID Document */}
          <Card className={rejected ? "border-destructive/60 bg-destructive/5" : ""}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-base">
                <FileText className={`h-5 w-5 ${rejected ? "text-destructive" : "text-primary"}`} />
                <span className="flex-1">ID Document</span>
                {rejected ? <XCircle className="h-5 w-5 text-destructive" /> : idUrl && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              </CardTitle>
              <CardDescription>
                Upload a clear photo of your government-issued ID (passport, national ID, or driver's license).
              </CardDescription>
              {rejected && (
                <p className="text-xs text-destructive font-medium mt-1">Rejected — please replace and resubmit.</p>
              )}
            </CardHeader>
            <CardContent>
              <Label
                htmlFor="upload-id"
                className={`block border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  idUrl ? "border-green-500/40 bg-green-500/5" : "border-border hover:border-primary"
                }`}
              >
                {uploadingId ? (
                  <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin" />
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">{idUrl ? "Replace document" : "Click to upload"}</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG, or PDF · max 10MB</p>
                  </>
                )}
                <Input
                  id="upload-id"
                  type="file"
                  className="hidden"
                  accept="image/*,application/pdf"
                  disabled={lock}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleIdUpload(f); }}
                />
              </Label>
            </CardContent>
          </Card>

          {/* Selfie */}
          <Card className={rejected ? "border-destructive/60 bg-destructive/5" : ""}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-base">
                <Camera className={`h-5 w-5 ${rejected ? "text-destructive" : "text-primary"}`} />
                <span className="flex-1">Selfie</span>
                {rejected ? <XCircle className="h-5 w-5 text-destructive" /> : selfieUrl && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              </CardTitle>
              <CardDescription>A clear photo of your face so we can confirm your identity.</CardDescription>
              {rejected && (
                <p className="text-xs text-destructive font-medium mt-1">Rejected — please replace and resubmit.</p>
              )}
            </CardHeader>
            <CardContent>
              <Label
                htmlFor="upload-selfie"
                className={`block border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  selfieUrl ? "border-green-500/40 bg-green-500/5" : "border-border hover:border-primary"
                }`}
              >
                {uploadingSelfie ? (
                  <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin" />
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">{selfieUrl ? "Replace photo" : "Click to upload"}</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG or PNG · max 10MB</p>
                  </>
                )}
                <Input
                  id="upload-selfie"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  disabled={lock}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSelfieUpload(f); }}
                />
              </Label>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card className={rejected ? "border-destructive/60 bg-destructive/5" : ""}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-base">
                <CreditCard className={`h-5 w-5 ${rejected ? "text-destructive" : "text-primary"}`} />
                <span className="flex-1">Payment Details</span>
                {rejected ? <XCircle className="h-5 w-5 text-destructive" /> : payoutValid() && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              </CardTitle>
              <CardDescription>How you'd like to receive payouts from bookings.</CardDescription>
              {rejected && (
                <p className="text-xs text-destructive font-medium mt-1">Rejected — please review and resubmit.</p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="payout-method">Payout method</Label>
                <Select value={method} onValueChange={(v) => setMethod(v as PayoutMethod)} disabled={lock}>
                  <SelectTrigger id="payout-method" className="mt-2">
                    <SelectValue placeholder="Select a method" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border z-50">
                  <SelectItem value="fastpay">FastPay</SelectItem>
                    <SelectItem value="zaincash">ZainCash</SelectItem>
                    <SelectItem value="qi_card">Qi Card</SelectItem>
                    <SelectItem value="fib">FIB</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {method && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <Label htmlFor="account-name">Account holder name</Label>
                    <Input
                      id="account-name"
                      className={`mt-2 ${accountName && payoutErrors.accountName ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      value={accountName}
                      disabled={lock}
                      placeholder="e.g. Ahmed Hassan"
                      onChange={(e) => setAccountName(e.target.value)}
                      aria-invalid={!!(accountName && payoutErrors.accountName)}
                    />
                    {accountName && payoutErrors.accountName && (
                      <p className="text-xs text-destructive mt-1">{payoutErrors.accountName}</p>
                    )}
                  </div>
                  {needsPhone && (
                    <div className="md:col-span-2">
                      <Label htmlFor="payout-phone">Wallet phone number</Label>
                      <Input
                        id="payout-phone"
                        inputMode="tel"
                        placeholder="+964 7XX XXX XXXX"
                        className={`mt-2 ${phone && payoutErrors.phone ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        value={phone}
                        disabled={lock}
                        onChange={(e) => setPhone(e.target.value)}
                        aria-invalid={!!(phone && payoutErrors.phone)}
                      />
                      {phone && payoutErrors.phone ? (
                        <p className="text-xs text-destructive mt-1">{payoutErrors.phone}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">
                          Iraqi mobile format. Include country code or start with 0.
                        </p>
                      )}
                    </div>
                  )}
                  {method === "qi_card" && (
                    <div className="md:col-span-2">
                      <Label htmlFor="qi-number">Qi Card number</Label>
                      <Input
                        id="qi-number"
                        inputMode="numeric"
                        maxLength={19}
                        placeholder="XXXX XXXX XXXX XXXX"
                        className={`mt-2 font-mono tracking-wider ${accountNumber && payoutErrors.accountNumber ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        value={accountNumber}
                        disabled={lock}
                        onChange={(e) => {
                          const d = e.target.value.replace(/[^\d]/g, "").slice(0, 16);
                          const grouped = d.replace(/(.{4})/g, "$1 ").trim();
                          setAccountNumber(grouped);
                        }}
                        aria-invalid={!!(accountNumber && payoutErrors.accountNumber)}
                      />
                      {accountNumber && payoutErrors.accountNumber ? (
                        <p className="text-xs text-destructive mt-1">{payoutErrors.accountNumber}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">16-digit Qi Card number.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {status !== "approved" && (
          <div className="mt-6 flex justify-end">
            <Button
              size="lg"
              disabled={!canSubmit || submitting || lock}
              onClick={handleSubmit}
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {status === "rejected" ? "Resubmit for review" : submitted ? "Submitted" : "Submit for review"}
            </Button>
          </div>
        )}
      </main>
    </AppLayout>
  );
};

export default HostVerification;
