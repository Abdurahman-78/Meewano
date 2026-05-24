import { useState } from "react";
import { Loader2, CheckCircle2, XCircle, FileText, Camera, FileCheck2, ExternalLink, Clock, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAllHostVerifications, useReviewHostVerification, useDeleteHostVerification, getHostDocSignedUrl } from "@/hooks/useHostVerification";
import { toast } from "sonner";

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
  const [rejectFor, setRejectFor] = useState<{ id: string; name: string } | null>(null);
  const [reason, setReason] = useState("");
  const [deleteFor, setDeleteFor] = useState<{ id: string; name: string } | null>(null);

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
      await review.mutateAsync({ id: rejectFor.id, status: "rejected", reason });
      toast.success("Host rejected");
      setRejectFor(null); setReason("");
    } catch (e: any) { toast.error(e.message); }
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
              <Button size="sm" variant="outline" onClick={() => setRejectFor({ id: r.id, name: r.profiles?.full_name || r.profiles?.email })}>
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
                <Button size="sm" variant="outline" onClick={() => setRejectFor({ id: r.id, name: r.profiles?.full_name || r.profiles?.email })}>
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

      <Dialog open={!!rejectFor} onOpenChange={(o) => { if (!o) { setRejectFor(null); setReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {rejectFor?.name}</DialogTitle>
            <DialogDescription>Tell the host what to fix. They'll see this and can resubmit.</DialogDescription>
          </DialogHeader>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. ID photo is blurry, please upload a clearer image." rows={4} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectFor(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={review.isPending || !reason.trim()}>
              Reject
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
