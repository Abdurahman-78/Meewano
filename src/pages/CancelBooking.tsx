import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Loader2, ArrowLeft, AlertTriangle, Upload, X, FileText, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "sonner";
import { computeRefund } from "@/lib/refundCalculator";
import { countWords } from "@/lib/cancellationStatus";

const GENERAL_REASONS = [
  "My travel plans have changed",
  "My travel dates have changed",
  "I booked by accident",
  "Changed my mind",
  "Found an alternative accommodation",
  "Transport disruption",
  "I am unhappy about the host",
  "The property listing is not as described",
  "Other — please specify",
];

const EXCEPTIONAL_REASONS = [
  "Severe illness or injury",
  "Property safety concern",
  "Natural disaster",
  "Death of a family member",
  "War or civil unrest",
  "Government travel restrictions",
  "Other exceptional circumstances — please specify",
];

type Mode = "eligible" | "not_eligible" | "request_review";

const CancelBooking = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { formatPrice } = useCurrency();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<any>(null);

  // Eligible-path state (automatic refund)
  const [category, setCategory] = useState<"general" | "exceptional">("general");
  const [reason, setReason] = useState("");
  const [otherText, setOtherText] = useState("");
  const [ack, setAck] = useState(false);
  const [ackNotEligible, setAckNotEligible] = useState(false);

  // Not-eligible / request-review state
  const [mode, setMode] = useState<Mode>("eligible");
  const [xReason, setXReason] = useState("");
  const [xOther, setXOther] = useState("");
  const [details, setDetails] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [reviewAck, setReviewAck] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    (async () => {
      if (!bookingId || !user) return;
      const { data, error } = await supabase
        .from("bookings")
        .select("*, property:properties(id, title, location, cancellation_policy, host_id)")
        .eq("id", bookingId)
        .eq("guest_id", user.id)
        .maybeSingle();
      if (error || !data) { toast.error("Booking not found"); navigate("/guest"); return; }
      if (data.status === "cancelled") { toast.info("This booking is already cancelled"); navigate("/guest"); return; }
      setBooking(data);
      setLoading(false);
    })();
  }, [bookingId, user, navigate]);

  const refund = useMemo(() => {
    if (!booking) return null;
    return computeRefund({
      policyText: booking.property?.cancellation_policy,
      checkIn: booking.check_in,
      totalPrice: Number(booking.total_price),
    });
  }, [booking]);

  useEffect(() => {
    if (refund) setMode(refund.refundPct > 0 ? "eligible" : "not_eligible");
  }, [refund]);

  // ---- Eligible-path submit ----
  const isOther = /Other/i.test(reason);
  const finalReason = isOther ? otherText.trim() : reason;
  const canSubmitEligible = !!category && !!reason && (!isOther || otherText.trim().length >= 3) && ack;

  const handleCancelEligible = async () => {
    if (!canSubmitEligible || !booking) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-booking", {
        body: { bookingId: booking.id, category, reason: finalReason },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Booking cancelled — refund is being processed");
      navigate("/guest");
    } catch (e: any) {
      toast.error(e.message || "Failed to cancel booking");
    } finally { setSubmitting(false); }
  };

  const handleCancelNotEligible = async () => {
    if (!ackNotEligible || !booking) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-booking", {
        body: { bookingId: booking.id, category: "general", reason: "Cancelled outside refund period" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Booking cancelled");
      navigate("/guest");
    } catch (e: any) {
      toast.error(e.message || "Failed to cancel booking");
    } finally { setSubmitting(false); }
  };

  // ---- Review-request submit ----
  const MAX_FILES = 3;
  const MAX_FILE_SIZE_MB = 5;
  const MAX_WORDS = 500;
  const MIN_WORDS = 5;

  const isXOther = /Other/i.test(xReason);
  const finalXReason = isXOther ? xOther.trim() : xReason;
  const wordCount = useMemo(() => countWords(details), [details]);
  const isWordCountValid = wordCount >= MIN_WORDS && wordCount <= MAX_WORDS;
  const isCharCountValid = details.trim().length >= 20 && details.length <= 4000;

  const canSubmitReview =
    !!xReason &&
    (!isXOther || xOther.trim().length >= 3) &&
    isCharCountValid &&
    isWordCountValid &&
    reviewAck;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const onFilesChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(e.target.files || []);
    if (!chosen.length) return;

    const oversized = chosen.filter((f) => f.size > MAX_FILE_SIZE_MB * 1024 * 1024);
    if (oversized.length > 0) {
      toast.error(`File "${oversized[0].name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit per file.`);
    }

    const validChosen = chosen.filter((f) => f.size <= MAX_FILE_SIZE_MB * 1024 * 1024);
    const remainingSlots = Math.max(0, MAX_FILES - files.length);

    if (validChosen.length > remainingSlots) {
      toast.warning(`Maximum ${MAX_FILES} files allowed. Only ${remainingSlots} more file(s) added.`);
    }

    const capped = [...files, ...validChosen.slice(0, remainingSlots)];
    setFiles(capped);
    e.target.value = "";
  };

  const handleSubmitReview = async () => {
    if (!canSubmitReview || !booking || !user) return;
    setSubmitting(true);
    try {
      let evidenceUrls: string[] = [];
      if (files.length > 0) {
        setUploading(true);
        for (const file of files) {
          const path = `${user.id}/${booking.id}/${crypto.randomUUID()}-${file.name}`;
          const { error: upErr } = await supabase.storage.from("refund-evidence").upload(path, file, {
            cacheControl: "3600", upsert: false,
          });
          if (upErr) throw upErr;
          evidenceUrls.push(path);
        }
        setUploading(false);
      }

      const { data, error } = await supabase.functions.invoke("request-refund-review", {
        body: { bookingId: booking.id, reason: finalXReason, details: details.trim(), evidenceUrls },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Refund request submitted — the host will review your request");
      navigate("/guest");
    } catch (e: any) {
      toast.error(e.message || "Failed to submit refund request");
    } finally { setSubmitting(false); setUploading(false); }
  };

  if (authLoading || loading || !booking || !refund) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const dateBooked = new Date(booking.created_at).toLocaleDateString();
  const checkInStr = new Date(booking.check_in).toLocaleDateString();

  const SummaryHeader = (
    <>
      <Link to="/guest" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>
      <h1 className="text-3xl md:text-4xl font-bold mb-1">Cancel booking</h1>
      <p className="text-muted-foreground mb-6">
        {booking.property?.title} · {booking.property?.location}
      </p>
    </>
  );

  const SummaryCard = (
    <Card className="mb-6">
      <CardHeader><CardTitle>Cancellation Summary</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div><p className="text-muted-foreground">Date booked</p><p className="font-medium">{dateBooked}</p></div>
          <div><p className="text-muted-foreground">Check-in date</p><p className="font-medium">{checkInStr}</p></div>
          <div><p className="text-muted-foreground">Days remaining until check-in</p><p className="font-medium">{refund.daysUntilCheckIn}</p></div>
          <div><p className="text-muted-foreground">Policy</p><p className="font-medium">{refund.policyLabel}</p></div>
        </div>
      </CardContent>
    </Card>
  );

  // -------- NOT ELIGIBLE screen --------
  if (mode === "not_eligible") {
    return (
      <AppLayout>
        <main className="container mx-auto px-4 py-6 md:py-10 max-w-3xl">
          {SummaryHeader}
          {SummaryCard}

          <Card className="mb-6 border-destructive/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Outside automatic refund period
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>You are outside this property's automatic refund period.</p>
              <p>According to the cancellation policy, you are not entitled to an automatic refund.</p>
              <p className="text-muted-foreground">
                If you are cancelling your booking due to exceptional circumstances, you may{" "}
                <button type="button" className="text-primary hover:underline font-medium" onClick={() => setMode("request_review")}>
                  request a refund review
                </button>.
              </p>
            </CardContent>
          </Card>

          <div className="mb-6 flex items-start gap-3">
            <Checkbox id="ack-not-eligible" checked={ackNotEligible} onCheckedChange={(v) => setAckNotEligible(!!v)} />
            <div className="grid gap-1.5 leading-none">
              <label htmlFor="ack-not-eligible" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                I understand this action cannot be undone
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1 h-12" onClick={() => navigate("/guest")} disabled={submitting}>
              Keep booking
            </Button>
            <Button variant="destructive" className="flex-1 h-12" onClick={handleCancelNotEligible} disabled={!ackNotEligible || submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Cancel Booking
            </Button>
          </div>
        </main>
      </AppLayout>
    );
  }

  // -------- REQUEST REVIEW screen --------
  if (mode === "request_review") {
    return (
      <AppLayout>
        <main className="container mx-auto px-4 py-6 md:py-10 max-w-3xl">
          {SummaryHeader}

          <Card className="mb-6">
            <CardHeader><CardTitle>Select reason for cancellation</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Label className="text-sm font-semibold">Exceptional circumstances</Label>
              <RadioGroup value={xReason} onValueChange={(v) => { setXReason(v); setXOther(""); }} className="space-y-2">
                {EXCEPTIONAL_REASONS.map((r) => (
                  <label key={r} className="flex items-start gap-3 p-2 rounded hover:bg-muted/40 cursor-pointer">
                    <RadioGroupItem value={r} className="mt-0.5" />
                    <span className="text-sm">{r}</span>
                  </label>
                ))}
              </RadioGroup>
              {isXOther && (
                <div>
                  <Label htmlFor="x-other" className="text-sm">Please specify</Label>
                  <Textarea id="x-other" className="mt-2" rows={2} value={xOther} onChange={(e) => setXOther(e.target.value)} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Provide more details of the circumstance</CardTitle>
              <Badge variant="outline" className={`text-xs ${wordCount > MAX_WORDS ? "border-destructive text-destructive" : ""}`}>
                {wordCount} / {MAX_WORDS} words
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2 pt-2">
              <p className="text-xs text-muted-foreground mb-1">
                Please provide clear explanation of the situation (min 5 words, max 500 words / 4,000 characters).
              </p>
              <Textarea
                rows={5}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe the circumstance in detail (e.g. emergency medical reasons, sudden government travel restriction, etc.)…"
                maxLength={4000}
                className={
                  (details.trim().length > 0 && (!isWordCountValid || !isCharCountValid))
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }
              />
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 pt-1">
                <div>
                  {details.trim().length > 0 && wordCount < MIN_WORDS && (
                    <p className="text-xs text-destructive font-medium">
                      Minimum {MIN_WORDS} words required ({MIN_WORDS - wordCount} more word{MIN_WORDS - wordCount > 1 ? "s" : ""}).
                    </p>
                  )}
                  {wordCount > MAX_WORDS && (
                    <p className="text-xs text-destructive font-medium">
                      Word limit exceeded ({wordCount}/{MAX_WORDS} words). Please shorten your text.
                    </p>
                  )}
                  {details.trim().length > 0 && details.trim().length < 20 && wordCount >= MIN_WORDS && (
                    <p className="text-xs text-destructive font-medium">Minimum 20 characters required.</p>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className={wordCount > MAX_WORDS ? "text-destructive font-medium" : ""}>
                    Word count: <strong>{wordCount}</strong>/{MAX_WORDS}
                  </span>
                  <span>·</span>
                  <span>{details.length}/4,000 chars</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Upload supporting evidence</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {files.length} / {MAX_FILES} files
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <p className="text-sm text-muted-foreground">
                Please upload as much relevant supporting evidence as possible. For example: medical reports, photos/messages/videos of a safety concern, or official notices.
              </p>
              
              {files.length < MAX_FILES ? (
                <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/40 transition-colors">
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={onFilesChosen}
                    accept="image/*,application/pdf,video/*"
                  />
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Upload className="h-4 w-4 text-primary" />
                    Click to upload evidence files
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Max {MAX_FILES} files · Up to {MAX_FILE_SIZE_MB}MB each (Images, PDF, Videos)
                  </p>
                </label>
              ) : (
                <div className="p-3 bg-muted/40 border rounded-lg text-xs text-muted-foreground text-center font-medium">
                  Maximum file limit reached ({MAX_FILES}/{MAX_FILES} files). Remove a file below to upload another.
                </div>
              )}

              {files.length > 0 && (
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Uploaded evidence ({files.length}/{MAX_FILES}):
                  </p>
                  <ul className="space-y-1.5">
                    {files.map((f, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between text-sm rounded-md bg-muted/40 border border-border px-3 py-2"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <span className="truncate font-medium">{f.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            ({formatFileSize(f.size)})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFiles(files.filter((_, j) => j !== i))}
                          className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                          title="Remove file"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="pt-6 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox checked={reviewAck} onCheckedChange={(v) => setReviewAck(v === true)} className="mt-0.5" />
                <span className="text-sm">
                  By ticking this box I understand that I am not automatically eligible for a refund. I am requesting the host to review my exceptional circumstances for a refund. The host will review my request and can decide to agree to a full or partial refund, no refund or agree to re-schedule my booking.
                </span>
              </label>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1 h-12" onClick={() => setMode("not_eligible")} disabled={submitting}>
              Back
            </Button>
            <Button className="flex-1 h-12" onClick={handleSubmitReview} disabled={!canSubmitReview || submitting}>
              {(submitting || uploading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit request for refund
            </Button>
          </div>
        </main>
      </AppLayout>
    );
  }

  // -------- ELIGIBLE (automatic refund) screen --------
  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-6 md:py-10 max-w-3xl">
        {SummaryHeader}

        <Card className="mb-6">
          <CardHeader><CardTitle>Cancellation Summary</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><p className="text-muted-foreground">Date booked</p><p className="font-medium">{dateBooked}</p></div>
              <div><p className="text-muted-foreground">Check-in date</p><p className="font-medium">{checkInStr}</p></div>
              <div><p className="text-muted-foreground">Days remaining until check-in</p><p className="font-medium">{refund.daysUntilCheckIn}</p></div>
              <div><p className="text-muted-foreground">Policy</p><p className="font-medium">{refund.policyLabel}</p></div>
            </div>
            <div className="rounded-md bg-muted/40 border border-border p-3 text-sm flex gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
              <span>{refund.tierSentence}</span>
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Accommodation refund</span><span className="font-medium">{formatPrice(refund.accommodationRefund)}</span></div>
              <div className="flex justify-between"><span>Meewano service fee {refund.serviceFeeRefund > 0 ? "" : "(non-refundable)"}</span><span className="font-medium">{formatPrice(refund.serviceFeeRefund)}</span></div>
              <Separator />
              <div className="flex justify-between text-base font-semibold"><span>Refund amount</span><span className="text-primary">{formatPrice(refund.totalRefund)}</span></div>
            </div>
            <p className="text-xs text-muted-foreground">
              Refund depends on your payment method. Please allow up to 14 days for the refund to be processed before contacting Meewano.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader><CardTitle>Select a reason for cancellation</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-sm font-semibold mb-3 block">General reasons</Label>
              <RadioGroup
                value={category === "general" ? reason : ""}
                onValueChange={(v) => { setCategory("general"); setReason(v); setOtherText(""); }}
                className="space-y-2"
              >
                {GENERAL_REASONS.map((r) => (
                  <label key={r} className="flex items-start gap-3 p-2 rounded hover:bg-muted/40 cursor-pointer">
                    <RadioGroupItem value={r} className="mt-0.5" />
                    <span className="text-sm">{r}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
            {isOther && (
              <div>
                <Label htmlFor="other-text" className="text-sm font-medium">Please specify</Label>
                <Textarea id="other-text" className="mt-2" rows={3} value={otherText} onChange={(e) => setOtherText(e.target.value)} placeholder="Tell us what happened…" />
              </div>
            )}
            <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/40">
              <Checkbox checked={ack} onCheckedChange={(v) => setAck(v === true)} className="mt-0.5" />
              <span className="text-sm">I understand this action cannot be undone.</span>
            </label>
            <div className="rounded-md bg-muted/40 border border-border p-3 text-xs text-muted-foreground">
              Cancelling due to exceptional circumstances (illness, safety, bereavement, etc.)?{" "}
              <button type="button" className="text-primary hover:underline font-medium" onClick={() => setMode("request_review")}>
                Request a refund review instead
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="flex-1 h-12" onClick={() => navigate("/guest")} disabled={submitting}>Keep booking</Button>
          <Button variant="destructive" className="flex-1 h-12" onClick={handleCancelEligible} disabled={!canSubmitEligible || submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Cancel booking
          </Button>
        </div>
      </main>
    </AppLayout>
  );
};

export default CancelBooking;
