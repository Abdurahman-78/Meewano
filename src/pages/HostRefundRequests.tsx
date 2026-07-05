import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, ArrowLeft, FileText, Check, X, Calendar } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "sonner";

type RefundRequest = {
  id: string;
  booking_id: string;
  guest_id: string;
  property_id: string;
  reason: string;
  details: string;
  evidence_urls: string[];
  status: string;
  host_decision_reason: string | null;
  admin_refund_pct: number | null;
  refund_amount: number | null;
  total_price: number;
  created_at: string;
  property?: { title: string };
  guest?: { full_name: string | null; email: string | null };
  booking?: { check_in: string; check_out: string };
};

const statusBadge = (status: string) => {
  const map: Record<string, { label: string; variant: any }> = {
    pending_host: { label: "Pending your review", variant: "default" },
    host_approved_refund: { label: "Refund approved", variant: "secondary" },
    host_approved_rebook: { label: "Reschedule offered", variant: "secondary" },
    host_rejected: { label: "Rejected — under Meewano review", variant: "destructive" },
    admin_approved_rejection: { label: "Rejection upheld", variant: "destructive" },
    admin_declined_rejection: { label: "Refund granted by Meewano", variant: "secondary" },
  };
  const m = map[status] || { label: status, variant: "outline" };
  return <Badge variant={m.variant}>{m.label}</Badge>;
};

const HostRefundRequests = () => {
  const { user, loading: authLoading } = useAuth();
  const { formatPrice } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [dialogState, setDialogState] = useState<{ id: string; kind: "approve_refund" | "approve_rebook" | "reject" } | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("refund_requests")
      .select("*, property:properties(title), guest:profiles!refund_requests_guest_id_fkey(full_name, email), booking:bookings(check_in, check_out)")
      .eq("host_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      // fallback without FK alias if not resolvable
      const { data: d2 } = await supabase
        .from("refund_requests")
        .select("*, property:properties(title), booking:bookings(check_in, check_out)")
        .eq("host_id", user.id)
        .order("created_at", { ascending: false });
      setRequests((d2 as any) || []);
    } else {
      setRequests((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => { if (!authLoading && user) load(); }, [user, authLoading]);

  const openEvidence = async (path: string) => {
    if (signedUrls[path]) { window.open(signedUrls[path], "_blank"); return; }
    const { data, error } = await supabase.storage.from("refund-evidence").createSignedUrl(path, 300);
    if (error || !data) { toast.error("Could not open file"); return; }
    setSignedUrls((s) => ({ ...s, [path]: data.signedUrl }));
    window.open(data.signedUrl, "_blank");
  };

  const submit = async () => {
    if (!dialogState) return;
    if (dialogState.kind === "reject" && note.trim().length < 10) {
      toast.error("Please provide a rejection reason (min 10 chars)"); return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("decide-refund-request", {
        body: { refundRequestId: dialogState.id, decision: dialogState.kind, hostNote: note },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Decision recorded");
      setDialogState(null); setNote("");
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to record decision");
    } finally { setSubmitting(false); }
  };

  if (authLoading || loading) {
    return <AppLayout><div className="container mx-auto px-4 py-16 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout>;
  }

  const pending = requests.filter((r) => r.status === "pending_host");
  const history = requests.filter((r) => r.status !== "pending_host");

  const shortId = (id: string) => id.slice(0, 8).toUpperCase();

  const Item = ({ r }: { r: RefundRequest }) => (
    <Card key={r.id} className="mb-4">
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
        <div>
          <CardTitle className="text-base">Booking #{shortId(r.booking_id)} · {r.property?.title}</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Submitted {new Date(r.created_at).toLocaleString()}</p>
        </div>
        {statusBadge(r.status)}
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {r.booking && (
          <p className="text-muted-foreground">
            Check-in {new Date(r.booking.check_in).toLocaleDateString()} · Check-out {new Date(r.booking.check_out).toLocaleDateString()}
          </p>
        )}
        <div><span className="font-semibold">Reason:</span> {r.reason}</div>
        <div><span className="font-semibold">Details:</span><p className="whitespace-pre-wrap mt-1">{r.details}</p></div>
        {r.evidence_urls && r.evidence_urls.length > 0 && (
          <div>
            <span className="font-semibold">Evidence:</span>
            <ul className="mt-1 space-y-1">
              {r.evidence_urls.map((p) => (
                <li key={p}>
                  <button className="inline-flex items-center gap-2 text-primary hover:underline text-xs" onClick={() => openEvidence(p)}>
                    <FileText className="h-3.5 w-3.5" /> {p.split("/").pop()}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          Total booking amount: <strong>{formatPrice(Number(r.total_price))}</strong>
          {r.refund_amount != null ? <> · Refunded: <strong>{formatPrice(Number(r.refund_amount))}</strong></> : null}
        </div>
        {r.host_decision_reason && (
          <div className="text-xs bg-muted/40 rounded p-2"><strong>Your note:</strong> {r.host_decision_reason}</div>
        )}

        {r.status === "pending_host" && (
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button size="sm" className="flex-1" onClick={() => { setDialogState({ id: r.id, kind: "approve_refund" }); setNote(""); }}>
              <Check className="h-4 w-4 mr-1" /> Approve — Refund
            </Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={() => { setDialogState({ id: r.id, kind: "approve_rebook" }); setNote(""); }}>
              <Calendar className="h-4 w-4 mr-1" /> Approve — Re-booking
            </Button>
            <Button size="sm" variant="destructive" className="flex-1" onClick={() => { setDialogState({ id: r.id, kind: "reject" }); setNote(""); }}>
              <X className="h-4 w-4 mr-1" /> Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-6 md:py-10 max-w-4xl">
        <Link to="/host" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to host dashboard
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Refund requests</h1>

        <Tabs defaultValue="open">
          <TabsList>
            <TabsTrigger value="open">Open ({pending.length})</TabsTrigger>
            <TabsTrigger value="history">History ({history.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="open" className="mt-4">
            {pending.length === 0 ? (
              <p className="text-muted-foreground text-sm">No open refund requests.</p>
            ) : pending.map((r) => <Item key={r.id} r={r} />)}
          </TabsContent>
          <TabsContent value="history" className="mt-4">
            {history.length === 0 ? (
              <p className="text-muted-foreground text-sm">No history yet.</p>
            ) : history.map((r) => <Item key={r.id} r={r} />)}
          </TabsContent>
        </Tabs>

        <Dialog open={!!dialogState} onOpenChange={(o) => { if (!o) { setDialogState(null); setNote(""); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {dialogState?.kind === "approve_refund" && "Approve full refund"}
                {dialogState?.kind === "approve_rebook" && "Offer to reschedule"}
                {dialogState?.kind === "reject" && "Reject refund request"}
              </DialogTitle>
              <DialogDescription>
                {dialogState?.kind === "approve_refund" && "The guest will be refunded the full booking amount. A confirmation email will be sent."}
                {dialogState?.kind === "approve_rebook" && "Suggest alternative dates to the guest. Your note will be sent as a message and email."}
                {dialogState?.kind === "reject" && "Provide a reason. Meewano will review your rejection before notifying the guest."}
              </DialogDescription>
            </DialogHeader>
            {dialogState?.kind !== "approve_refund" && (
              <Textarea
                placeholder={dialogState?.kind === "reject" ? "Reason for rejection (min 10 chars)…" : "Suggest dates or add a note…"}
                rows={4} value={note} onChange={(e) => setNote(e.target.value)}
              />
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogState(null); setNote(""); }} disabled={submitting}>Cancel</Button>
              <Button onClick={submit} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </AppLayout>
  );
};

export default HostRefundRequests;
