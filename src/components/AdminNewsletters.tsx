import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Download, Users, Mail, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Newsletter {
  id: string;
  subject: string;
  preview_text: string | null;
  content: string;
  status: string;
  sent_at: string | null;
  sent_count: number;
  created_at: string;
  updated_at: string;
}

const useNewsletters = () =>
  useQuery({
    queryKey: ["newsletters"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("newsletters")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Newsletter[];
    },
  });

const useSubscriberCount = () =>
  useQuery({
    queryKey: ["newsletter-subscriber-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("newsletter_opt_in", true);
      if (error) throw error;
      return count || 0;
    },
  });

const AdminNewsletters = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: newsletters, isLoading } = useNewsletters();
  const { data: subscriberCount } = useSubscriberCount();

  const [editing, setEditing] = useState<Newsletter | null>(null);
  const [creating, setCreating] = useState(false);
  const [previewing, setPreviewing] = useState<Newsletter | null>(null);
  const [deleteFor, setDeleteFor] = useState<Newsletter | null>(null);
  const [exporting, setExporting] = useState(false);

  const [form, setForm] = useState({ subject: "", preview_text: "", content: "" });

  const openCreate = () => {
    setForm({ subject: "", preview_text: "", content: "" });
    setCreating(true);
  };
  const openEdit = (n: Newsletter) => {
    setForm({ subject: n.subject, preview_text: n.preview_text || "", content: n.content });
    setEditing(n);
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!form.subject.trim()) throw new Error("Subject is required");
      if (!form.content.trim()) throw new Error("Content is required");
      if (editing) {
        const { error } = await supabase
          .from("newsletters")
          .update({
            subject: form.subject.trim(),
            preview_text: form.preview_text.trim() || null,
            content: form.content,
          })
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("newsletters").insert({
          subject: form.subject.trim(),
          preview_text: form.preview_text.trim() || null,
          content: form.content,
          status: "draft",
          created_by: user?.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Newsletter updated" : "Draft saved");
      setEditing(null);
      setCreating(false);
      qc.invalidateQueries({ queryKey: ["newsletters"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("newsletters").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      setDeleteFor(null);
      qc.invalidateQueries({ queryKey: ["newsletters"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const markSent = useMutation({
    mutationFn: async (n: Newsletter) => {
      const { error } = await supabase
        .from("newsletters")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          sent_count: subscriberCount || 0,
        })
        .eq("id", n.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Marked as sent");
      qc.invalidateQueries({ queryKey: ["newsletters"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const exportSubscribers = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("email, full_name, created_at")
        .eq("newsletter_opt_in", true)
        .not("email", "is", null);
      if (error) throw error;
      const rows = data || [];
      if (rows.length === 0) {
        toast.error("No subscribers to export");
        return;
      }
      const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const csv = [
        ["email", "full_name", "subscribed_at"].join(","),
        ...rows.map((r: any) => [esc(r.email), esc(r.full_name), esc(r.created_at)].join(",")),
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${rows.length} subscriber${rows.length === 1 ? "" : "s"}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Subscribers</p>
              <p className="text-3xl font-bold">{subscriberCount ?? "..."}</p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Newsletters</p>
              <p className="text-3xl font-bold">{newsletters?.length ?? 0}</p>
            </div>
            <Mail className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col gap-2 justify-center">
            <Button onClick={exportSubscribers} disabled={exporting} variant="outline">
              {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Export subscribers CSV
            </Button>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" /> New newsletter
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Newsletters</CardTitle>
          <CardDescription>
            Write and store newsletter drafts. Export your subscribers as CSV and upload to your mail
            provider (Mailchimp, Brevo, Resend Broadcasts, etc.) to send.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : !newsletters?.length ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No newsletters yet. Click "New newsletter" to create your first draft.
            </p>
          ) : (
            newsletters.map((n) => (
              <Card key={n.id}>
                <CardContent className="p-4 flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[220px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold">{n.subject}</h4>
                      <Badge variant={n.status === "sent" ? "default" : "secondary"}>{n.status}</Badge>
                      {n.status === "sent" && (
                        <span className="text-xs text-muted-foreground">
                          · sent to {n.sent_count} on {n.sent_at ? new Date(n.sent_at).toLocaleDateString() : "—"}
                        </span>
                      )}
                    </div>
                    {n.preview_text && (
                      <p className="text-sm text-muted-foreground mt-1">{n.preview_text}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Updated {new Date(n.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => setPreviewing(n)}>
                      <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(n)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    {n.status !== "sent" && (
                      <Button size="sm" onClick={() => markSent.mutate(n)} disabled={markSent.isPending}>
                        Mark as sent
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => setDeleteFor(n)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Create / Edit dialog */}
      <Dialog
        open={creating || !!editing}
        onOpenChange={(o) => { if (!o) { setCreating(false); setEditing(null); } }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit newsletter" : "New newsletter"}</DialogTitle>
            <DialogDescription>
              Compose your newsletter. HTML is allowed in the content field.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Subject *</label>
              <Input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Your subject line"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Preview text</label>
              <Input
                value={form.preview_text}
                onChange={(e) => setForm({ ...form, preview_text: e.target.value })}
                placeholder="Short preview shown in the inbox"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Content (HTML or plain text) *</label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={14}
                placeholder="<h1>Hello!</h1><p>This month at Meewano...</p>"
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreating(false); setEditing(null); }}>
              Cancel
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? "Save changes" : "Save draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog open={!!previewing} onOpenChange={(o) => { if (!o) setPreviewing(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewing?.subject}</DialogTitle>
            {previewing?.preview_text && (
              <DialogDescription>{previewing.preview_text}</DialogDescription>
            )}
          </DialogHeader>
          <div
            className="prose prose-sm max-w-none border rounded-md p-4 bg-background"
            dangerouslySetInnerHTML={{ __html: previewing?.content || "" }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteFor} onOpenChange={(o) => { if (!o) setDeleteFor(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteFor?.subject}"?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteFor && del.mutate(deleteFor.id)}
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

export default AdminNewsletters;
