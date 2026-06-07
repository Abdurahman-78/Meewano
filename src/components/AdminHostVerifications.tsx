import { useState } from "react";
import { Loader2, CheckCircle2, XCircle, FileText, Camera, FileCheck2, ExternalLink, Clock, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAllHostVerifications, useReviewHostVerification, useDeleteHostVerification, getHostDocSignedUrl } from "@/hooks/useHostVerification";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const REJECT_CATEGORIES = [
  { id: "id_document", label: "ID document", hint: "Unclear, expired, or missing ID upload" },
  { id: "selfie", label: "Selfie", hint: "Blurry, doesn't match ID, or missing" },
  { id: "payment_details", label: "Payment details", hint: "Missing or incorrect payout info" },
] as const;

type RejectCategoryId = typeof REJECT_CATEGORIES[number]["id"];

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: "Pending", className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30" },
    approved: { label: "Approved", className: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30" },
    rejected: { label: "Rejected", className: "bg-destructive/10 text-destructive border-destructive/30" },
  };
  const s = map[status] || map.pending;
  return <Badge variant="outline" className={s.className}>{s.label}</Badge>;
};

const DocLink = ({ path, label, icon: Icon }: { path: string | null; label: string; icon: any }) => {
  const [loading, setLoading] = useState(false);
  if (!path) return <div className="text-xs text-muted-foreground flex items-center gap-2"><Icon className="h-3.5 w-3.5" /> {label}: not uploaded</div>;
  const open = async () => {
    setLoading(true);
    const url = await getHostDocSignedUrl(path);
    setLoading(false);
    if (url) window.open(url, "_blank");
    else toast.error("Could not generate link");
  };
  return (
    <Button size="sm" variant="outline" className="h-8 gap-2" onClick={open} disabled={loading}>
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
      {label}
      <ExternalLink className="h-3 w-3" />
    </Button>
  );
};

const AdminHostVerifications = () => {
  const { data: rows, isLoading } = useAllHostVerifications();
  const review = useReviewHostVerification();
  const del = useDeleteHostVerification();
  const queryClient = useQueryClient();
  const [rejectFor, setRejectFor] = useState<{ id: string; name: string; user_id: string } | null>(null);
  const [rejectCats, setRejectCats] = useState<Record<RejectCategoryId, boolean>>({
    id_document: false, selfie: false, payment_details: false,
  });
  const [reason, setReason] = useState("");
  const [deleteFor, setDeleteFor] = useState<{ id: string; name: string } | null>(null);

  const resetRejectDialog = () => {
    setRejectFor(null);
    setReason("");
    setRejectCats({ id_document: false, selfie: false, payment_details: false });
  };

  const selectedCats = REJECT_CATEGORIES.filter((c) => rejectCats[c.id]);
  const canSubmitReject = selectedCats.length > 0 || reason.trim().length > 0;
  const composedReason = (() => {
    const parts: string[] = [];
    if (selectedCats.length) {
      parts.push(`Issue${selectedCats.length > 1 ? "s" : ""} with: ${selectedCats.map((c) => c.label).join(", ")}.`);
    }
    if (reason.trim()) parts.push(reason.trim());
    return parts.join(" ");
  })();

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const submitted = (rows || []).filter((r: any) => r.submitted_at);
  const pending = submitted.filter((r: any) => r.status === "pending");
  const reviewed = submitted.filter((r: any) => r.status !== "pending");

  const handleApprove = async (id: string) => {
    try { await review.mutateAsync({ id, status: "approved" }); toast.success("Host approved"); }
    catch (e: any) { toast.error(e.message); }
  };

  const handleReject = async () => {
    if (!rejectFor) return;
    try {
      await review.mutateAsync({ id: rejectFor.id, status: "rejected", reason: composedReason });
      toast.success("Host rejected — email sent");
      resetRejectDialog();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleRejectAndBan = async () => {
    if (!rejectFor) return;
    if (!confirm(`Permanently ban ${rejectFor.name}? Their email and phone will be blocked from creating a new account.`)) return;
    try {
      await review.mutateAsync({ id: rejectFor.id, status: "rejected", reason: composedReason });
      const { error } = await supabase.rpc("admin_ban_user", {
        _user_id: rejectFor.user_id,
        _reason: composedReason || "Banned by admin",
      });
      if (error) throw error;
      toast.success("Host rejected and banned — account removed");
      queryClient.invalidateQueries({ queryKey: ["all-host-verifications"] });
      queryClient.invalidateQueries({ queryKey: ["pending-host-verifications"] });
      resetRejectDialog();
    } catch (e: any) { toast.error(e.message || "Failed to ban"); }
  };


  const renderRow = (r: any) => (
    <Card key={r.id}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4 flex-wrap">
          <Avatar className="h-12 w-12">
            <AvatarImage src={r.profiles?.avatar_url} />
            <AvatarFallback>{(r.profiles?.full_name || r.profiles?.email || "?").charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold">{r.profiles?.full_name || "Unnamed user"}</h4>
              <StatusBadge status={r.status} />
            </div>
            <p className="text-sm text-muted-foreground">{r.profiles?.email}</p>
            <p className="text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3 inline mr-1" />
              Submitted {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : "—"}
            </p>
            {r.rejection_reason && (
              <p className="text-xs text-destructive mt-1">Reason: {r.rejection_reason}</p>
            )}
            <div className="flex gap-2 flex-wrap mt-3">
              <DocLink path={r.id_document_url} label="ID" icon={FileText} />
              <DocLink path={r.selfie_url} label="Selfie" icon={Camera} />
              <DocLink path={r.ownership_document_url} label="Ownership" icon={FileCheck2} />
            </div>
          </div>
          {r.status === "pending" ? (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setRejectFor({ id: r.id, user_id: r.user_id, name: r.profiles?.full_name || r.profiles?.email })}>
                <XCircle className="h-4 w-4 mr-1" /> Reject
              </Button>
              <Button size="sm" onClick={() => handleApprove(r.id)} disabled={review.isPending}>
                <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              {r.status === "rejected" ? (
                <Button size="sm" variant="outline" onClick={() => handleApprove(r.id)} disabled={review.isPending}>
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setRejectFor({ id: r.id, user_id: r.user_id, name: r.profiles?.full_name || r.profiles?.email })}>
                  <Pencil className="h-4 w-4 mr-1" /> Change to Reject
                </Button>
              )}
              <Button size="sm" variant="destructive" onClick={() => setDeleteFor({ id: r.id, name: r.profiles?.full_name || r.profiles?.email || "this verification" })}>
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Pending Host Verifications
            <Badge variant="secondary">{pending.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No pending verifications.</p>
          ) : pending.map(renderRow)}
        </CardContent>
      </Card>

      {reviewed.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Recently Reviewed</CardTitle></CardHeader>
          <CardContent className="space-y-3">{reviewed.slice(0, 20).map(renderRow)}</CardContent>
        </Card>
      )}

      <Dialog open={!!rejectFor} onOpenChange={(o) => { if (!o) resetRejectDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {rejectFor?.name}</DialogTitle>
            <DialogDescription>
              Pick what's wrong — the host will get an email with these details and can resubmit.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Label className="text-sm font-medium">What's the problem?</Label>
            <div className="space-y-2">
              {REJECT_CATEGORIES.map((cat) => (
                <label
                  key={cat.id}
                  className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/50"
                >
                  <Checkbox
                    checked={rejectCats[cat.id]}
                    onCheckedChange={(c) =>
                      setRejectCats((prev) => ({ ...prev, [cat.id]: c === true }))
                    }
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{cat.label}</div>
                    <div className="text-xs text-muted-foreground">{cat.hint}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="space-y-1.5 pt-1">
              <Label htmlFor="reject-notes" className="text-sm font-medium">
                Additional notes <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id="reject-notes"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. ID photo is blurry, please upload a clearer image."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2 flex-col sm:flex-row">
            <Button variant="outline" onClick={resetRejectDialog}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleRejectAndBan}
              disabled={review.isPending || !canSubmitReject}
              title="Rejects, removes the account, and blocks the email & phone from signing up again"
            >
              Reject & permanently ban
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={review.isPending || !canSubmitReject}
            >
              Reject & notify host
            </Button>
          </DialogFooter>

        </DialogContent>
      </Dialog>


      <AlertDialog open={!!deleteFor} onOpenChange={(o) => { if (!o) setDeleteFor(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete verification for {deleteFor?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the verification record. The host will need to resubmit their documents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteFor) return;
                try {
                  await del.mutateAsync(deleteFor.id);
                  toast.success("Verification deleted");
                  setDeleteFor(null);
                } catch (e: any) { toast.error(e.message); }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminHostVerifications;
