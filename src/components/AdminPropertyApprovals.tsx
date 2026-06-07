import { useState } from "react";
import { Loader2, CheckCircle2, XCircle, ExternalLink, Clock, RefreshCw, FileCheck2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { usePendingProperties, useReviewProperty } from "@/hooks/usePropertyApprovals";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const REJECTION_REASONS = [
  "Photos are low quality or don't match the property",
  "Photos appear to be stock images or taken from the internet",
  "Property title or description is misleading or incomplete",
  "Address or location is inaccurate",
  "Price is unrealistic for the property and area",
  "Ownership document is missing, unclear, or doesn't match",
  "Listing contains prohibited content or violates our policies",
  "Duplicate of an existing listing",
  "Other (specify below)",
];

const AdminPropertyApprovals = () => {
  const { data: rows, isLoading } = usePendingProperties();
  const review = useReviewProperty();
  const navigate = useNavigate();
  const [rejectFor, setRejectFor] = useState<{ id: string; title: string; host_id: string; host_label: string } | null>(null);
  const [reasonChoice, setReasonChoice] = useState<string>("");
  const [reasonDetails, setReasonDetails] = useState("");



  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const handleApprove = async (id: string) => {
    try { await review.mutateAsync({ id, action: "approve" }); toast.success("Property approved & live"); }
    catch (e: any) { toast.error(e.message); }
  };
  const resetReject = () => { setRejectFor(null); setReasonChoice(""); setReasonDetails(""); };
  const composedReason = () => {
    if (!reasonChoice) return "";
    if (reasonChoice.startsWith("Other")) return reasonDetails.trim();
    return reasonDetails.trim() ? `${reasonChoice} — ${reasonDetails.trim()}` : reasonChoice;
  };
  const handleReject = async () => {
    if (!rejectFor) return;
    const reason = composedReason();
    if (!reason) { toast.error("Please choose a reason"); return; }
    try {
      await review.mutateAsync({ id: rejectFor.id, action: "reject", reason });
      toast.success("Property rejected");
      resetReject();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleRejectAndBan = async () => {
    if (!rejectFor) return;
    const reason = composedReason();
    if (!reason) { toast.error("Please choose a reason"); return; }
    if (!confirm(`Permanently ban ${rejectFor.host_label}? Their email and phone will be blocked from creating a new account.`)) return;
    try {
      await review.mutateAsync({ id: rejectFor.id, action: "reject", reason });
      const { error } = await supabase.rpc("admin_ban_user", {
        _user_id: rejectFor.host_id,
        _reason: reason,
      });
      if (error) throw error;
      toast.success("Property rejected and host banned");
      resetReject();
    } catch (e: any) { toast.error(e.message || "Failed to ban"); }
  };



  const viewOwnershipDoc = async (path: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("host-documents")
        .createSignedUrl(path, 300);
      if (error) throw error;
      if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast.error(e.message || "Could not open document");
    }
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Properties Awaiting Review
            <Badge variant="secondary">{(rows || []).length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(!rows || rows.length === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-6">No properties awaiting review.</p>
          ) : rows.map((p: any) => {
            const isEdits = p.approval_status === "changes_pending";
            const display = isEdits && p.pending_changes ? { ...p, ...p.pending_changes } : p;
            return (
              <Card key={p.id} className="border-yellow-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4 flex-wrap">
                    {display.images?.[0] && (
                      <img src={display.images[0]} alt="" className="w-24 h-24 rounded-lg object-cover" />
                    )}
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold">{display.title}</h4>
                        {isEdits ? (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30">
                            <RefreshCw className="h-3 w-3 mr-1" /> Edits
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{display.location}, {display.city}</p>
                      <p className="text-sm font-semibold mt-1">{display.price_per_night} {p.currency || "USD"} / night</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {new Date(p.updated_at).toLocaleString()} · Host: {p.host?.email || p.host?.full_name || "—"}
                      </p>
                      {display.description && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{display.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/property/${p.id}`)}>
                        <ExternalLink className="h-4 w-4 mr-1" /> View
                      </Button>
                      {p.ownership_document_url && (
                        <Button size="sm" variant="outline" onClick={() => viewOwnershipDoc(p.ownership_document_url)}>
                          <FileCheck2 className="h-4 w-4 mr-1" /> Ownership doc
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => setRejectFor({ id: p.id, title: p.title, host_id: p.host_id, host_label: p.host?.email || p.host?.full_name || "this host" })}>
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                      <Button size="sm" onClick={() => handleApprove(p.id)} disabled={review.isPending}>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={!!rejectFor} onOpenChange={(o) => { if (!o) resetReject(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject "{rejectFor?.title}"</DialogTitle>
            <DialogDescription>Pick what's wrong — the host will see this in their email.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>What's wrong?</Label>
              <Select value={reasonChoice} onValueChange={setReasonChoice}>
                <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
                <SelectContent>
                  {REJECTION_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>
                {reasonChoice.startsWith("Other") ? "Describe the issue" : "Additional details (optional)"}
              </Label>
              <Textarea
                value={reasonDetails}
                onChange={(e) => setReasonDetails(e.target.value)}
                rows={3}
                placeholder="Add any specifics the host needs to fix..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2 flex-col sm:flex-row">
            <Button variant="outline" onClick={resetReject}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleRejectAndBan}
              disabled={review.isPending || !reasonChoice || (reasonChoice.startsWith("Other") && !reasonDetails.trim())}
              title="Rejects, removes the host account, and blocks the email & phone from signing up again"
            >
              Reject & permanently ban host
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={review.isPending || !reasonChoice || (reasonChoice.startsWith("Other") && !reasonDetails.trim())}
            >
              Reject & email host
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default AdminPropertyApprovals;
