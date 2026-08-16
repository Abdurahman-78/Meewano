const fs = require('fs');
let code = fs.readFileSync('src/pages/CancelBooking.tsx', 'utf8');

// Add ackNotEligible state
code = code.replace(
  /const \[ack, setAck\] = useState\(false\);/,
  'const [ack, setAck] = useState(false);\n  const [ackNotEligible, setAckNotEligible] = useState(false);'
);

// Add handleCancelNotEligible
code = code.replace(
  /  \/\/ ---- Review-request submit ----/,
  `  const handleCancelNotEligible = async () => {
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

  // ---- Review-request submit ----`
);

const oldNotEligibleBlock = `  // -------- NOT ELIGIBLE screen --------
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
              <p className="text-muted-foreground">You may request a refund review if there are exceptional circumstances.</p>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1 h-12" onClick={() => navigate("/guest")}>
              Keep booking
            </Button>
            <Button className="flex-1 h-12" onClick={() => setMode("request_review")}>
              Request refund review
            </Button>
          </div>
        </main>
      </AppLayout>
    );
  }`;

const newNotEligibleBlock = `  // -------- NOT ELIGIBLE screen --------
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
  }`;

code = code.replace(oldNotEligibleBlock, newNotEligibleBlock);

fs.writeFileSync('src/pages/CancelBooking.tsx', code);
