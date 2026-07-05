import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, FileText, Check, X } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "sonner";

const AdminRefundRequests = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isModerator, loading: roleLoading } = useUserRole();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [dialogState, setDialogState] = useState<{ id: string; kind: "approve_rejection" | "decline_rejection" } | null>(null);
  const [pct, setPct] = useState<string>("50");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) { navigate("/auth"); return; }
      if (!isAdmin && !isModerator) { navigate("/"); return; }
    }
  }, [authLoading, roleLoading, user, isAdmin, isModerator, navigate]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("refund_requests")
      .select("*, property:properties(title), booking:bookings(check_in, check_out)")
      .in("status", ["host_rejected", "admin_approved_rejection", "admin_declined_rejection"])
      .order("created_at", { ascending: false });
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => { if (user && (isAdmin || isModerator)) load(); }, [user, isAdmin, isModerator]);

  const openEvidence = async (path: string) => {
    const { data, error } = await supabase.storage.from("refund-evidence").createSignedUrl(path, 300);
    if (error || !data) { toast.error("Could not open file"); return; }
    window.open(data.signedUrl, "_blank");
  };

  const submit = async () => {
    if (!dialogState) return;
    setSubmitting(true);
    try {
      const body: any = { refundRequestId: dialogState.id, decision: dialogState.kind };
      if (dialogState.kind === "decline_rejection") body.refundPct = Number(pct);
      const { data, error } = await supabase.functions.invoke("admin-decide-refund-rejection", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Decision recorded");
      setDialogState(null);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to record decision");
    } finally { setSubmitting(false); }
  };

  if (authLoading || roleLoading || loading) {
    return <AppLayout><div className="container mx-auto px-4 py-16 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout>;
  }

  const pending = rows.filter((r) => r.status === "host_rejected");
  const history = rows.filter((r) => r.status !== "host_rejected");
  const shortId = (id: string) => id.slice(0, 8).toUpperCase();

  const Item = ({ r }: { r: any }) => (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="text-base">Booking #{shortId(r.booking_id)} · {r.property?.title}</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Submitted {new Date(r.created_at).toLocaleString()}</p>
        </div>
        <Badge variant={r.status === "host_rejected" ? "destructive" : "secondary"}>
          {r.status === "host_rejected" ? "Host rejected — needs review" :
           r.status === "admin_approved_rejection" ? "Rejection upheld" : `Refund ${r.admin_refund_pct}% granted`}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div><span className="font-semibold">Guest reason:</span> {r.reason}</div>
        <div><span className="font-semibold">Guest details:</span><p className="whitespace-pre-wrap mt-1">{r.details}</p></div>
        {r.evidence_urls?.length > 0 && (
          <div>
            <span className="font-semibold">Evidence:</span>
            <ul className="mt-1 space-y-1">
              {r.evidence_urls.map((p: string) => (
                <li key={p}>
                  <button className="inline-flex items-center gap-2 text-primary hover:underline text-xs" onClick={() => openEvidence(p)}>
                    <FileText className="h-3.5 w-3.5" /> {p.split("/").pop()}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {r.host_decision_reason && (
          <div className="bg-destructive/10 rounded p-2 text-xs"><strong>Host rejection reason:</strong> {r.host_decision_reason}</div>
        )}
        <div className="text-xs text-muted-foreground">
          Total: <strong>{formatPrice(Number(r.total_price))}</strong>
          {r.refund_amount != null ? <> · Refunded: <strong>{formatPrice(Number(r.refund_amount))}</strong></> : null}
        </div>

        {r.status === "host_rejected" && (
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button size="sm" className="flex-1" onClick={() => setDialogState({ id: r.id, kind: "approve_rejection" })}>
              <Check className="h-4 w-4 mr-1" /> Approve rejection
            </Button>
            <Button size="sm" variant="destructive" className="flex-1" onClick={() => { setDialogState({ id: r.id, kind: "decline_rejection" }); setPct("50"); }}>
              <X className="h-4 w-4 mr-1" /> Decline rejection (override)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-6 md:py-10 max-w-4xl">
        <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to admin
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Refund requests</h1>
        <Tabs defaultValue="open">
          <TabsList>
            <TabsTrigger value="open">Open ({pending.length})</TabsTrigger>
            <TabsTrigger value="history">History ({history.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="open" className="mt-4">
            {pending.length === 0 ? <p className="text-muted-foreground text-sm">No rejections awaiting review.</p> : pending.map((r) => <Item key={r.id} r={r} />)}
          </TabsContent>
          <TabsContent value="history" className="mt-4">
            {history.length === 0 ? <p className="text-muted-foreground text-sm">No history yet.</p> : history.map((r) => <Item key={r.id} r={r} />)}
          </TabsContent>
        </Tabs>

        <Dialog open={!!dialogState} onOpenChange={(o) => { if (!o) setDialogState(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {dialogState?.kind === "approve_rejection" ? "Approve host rejection" : "Decline rejection — override refund"}
              </DialogTitle>
              <DialogDescription>
                {dialogState?.kind === "approve_rejection"
                  ? "The guest will be told their refund was declined by the host."
                  : "Choose the percentage of the booking to refund. Meewano will notify the host and guest."}
              </DialogDescription>
            </DialogHeader>
            {dialogState?.kind === "decline_rejection" && (
              <div className="space-y-2">
                <Label>Refund percentage</Label>
                <Select value={pct} onValueChange={setPct}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100%</SelectItem>
                    <SelectItem value="75">75%</SelectItem>
                    <SelectItem value="50">50%</SelectItem>
                    <SelectItem value="25">25%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogState(null)} disabled={submitting}>Cancel</Button>
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

export default AdminRefundRequests;
