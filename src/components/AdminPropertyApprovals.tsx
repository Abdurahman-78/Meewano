import { useState } from "react";
import { Loader2, CheckCircle2, XCircle, ExternalLink, Clock, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { usePendingProperties, useReviewProperty } from "@/hooks/usePropertyApprovals";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const AdminPropertyApprovals = () => {
  const { data: rows, isLoading } = usePendingProperties();
  const review = useReviewProperty();
  const navigate = useNavigate();
  const [rejectFor, setRejectFor] = useState<{ id: string; title: string } | null>(null);
  const [reason, setReason] = useState("");

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const handleApprove = async (id: string) => {
    try { await review.mutateAsync({ id, action: "approve" }); toast.success("Property approved & live"); }
    catch (e: any) { toast.error(e.message); }
  };
  const handleReject = async () => {
    if (!rejectFor) return;
    try {
      await review.mutateAsync({ id: rejectFor.id, action: "reject", reason });
      toast.success("Property rejected");
      setRejectFor(null); setReason("");
    } catch (e: any) { toast.error(e.message); }
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
                      <Button size="sm" variant="outline" onClick={() => setRejectFor({ id: p.id, title: p.title })}>
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

      <Dialog open={!!rejectFor} onOpenChange={(o) => { if (!o) { setRejectFor(null); setReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject "{rejectFor?.title}"</DialogTitle>
            <DialogDescription>Tell the host why so they can fix it.</DialogDescription>
          </DialogHeader>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} placeholder="e.g. Photos don't match the address, please upload accurate images." />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectFor(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={review.isPending || !reason.trim()}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPropertyApprovals;
