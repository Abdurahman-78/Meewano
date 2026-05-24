import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, CheckCircle2, XCircle, Clock, Loader2, FileText, Camera, FileCheck2, ShieldCheck } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMyHostVerification, useUpsertHostVerification } from "@/hooks/useHostVerification";

type DocKey = "id_document_url" | "selfie_url" | "ownership_document_url";

const DOCS: { key: DocKey; title: string; desc: string; icon: any; accept: string }[] = [
  { key: "id_document_url", title: "Government-issued ID", desc: "Upload a clear photo of your national ID or passport.", icon: FileText, accept: "image/*,.pdf" },
  { key: "selfie_url", title: "Selfie holding your ID", desc: "Take a photo of yourself holding the same ID.", icon: Camera, accept: "image/*" },
  { key: "ownership_document_url", title: "Proof of property ownership", desc: "Title deed, rental agreement, or utility bill in your name.", icon: FileCheck2, accept: "image/*,.pdf" },
];

const HostVerification = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: verification, isLoading } = useMyHostVerification();
  const upsert = useUpsertHostVerification();

  const [uploading, setUploading] = useState<DocKey | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [docs, setDocs] = useState<Record<DocKey, string | null>>({
    id_document_url: null,
    selfie_url: null,
    ownership_document_url: null,
  });

  useEffect(() => {
    if (!authLoading && !user) navigate(`/auth?redirect=${encodeURIComponent("/host/verification")}`);
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (verification) {
      setDocs({
        id_document_url: verification.id_document_url,
        selfie_url: verification.selfie_url,
        ownership_document_url: verification.ownership_document_url,
      });
    }
  }, [verification]);

  const handleUpload = async (key: DocKey, file: File) => {
    if (!user) return;
    setUploading(key);
    try {
      const ext = (file.name.split(".").pop() || "bin").toLowerCase();
      const path = `${user.id}/${key}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("host-documents").upload(path, file, { contentType: file.type, upsert: true });
      if (error) throw error;
      setDocs((d) => ({ ...d, [key]: path }));
      await upsert.mutateAsync({ [key]: path } as any);
      toast.success("Uploaded");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const allUploaded = !!(docs.id_document_url && docs.selfie_url && docs.ownership_document_url);
  const status = verification?.status;
  const submitted = !!verification?.submitted_at;

  const handleSubmit = async () => {
    if (!allUploaded) { toast.error("Please upload all three documents"); return; }
    setSubmitting(true);
    try {
      await upsert.mutateAsync({ submitted_at: new Date().toISOString(), status: "pending", rejection_reason: null });
      toast.success("Submitted for admin review");
    } catch (e: any) {
      toast.error(e.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <AppLayout>
        <main className="container mx-auto px-4 py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-4">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Account Verification</h1>
          <p className="text-muted-foreground">Verify your identity and property ownership before listing.</p>
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
            <AlertDescription>We'll email you once your documents are reviewed (usually within 24 hours).</AlertDescription>
          </Alert>
        )}
        {status === "rejected" && (
          <Alert className="mb-6 border-destructive/40 bg-destructive/5">
            <XCircle className="h-4 w-4 text-destructive" />
            <AlertTitle>Verification rejected</AlertTitle>
            <AlertDescription>
              {verification?.rejection_reason || "Please re-upload corrected documents and submit again."}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {DOCS.map(({ key, title, desc, icon: Icon, accept }) => {
            const uploaded = !!docs[key];
            const isThis = uploading === key;
            return (
              <Card key={key}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-base">
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="flex-1">{title}</span>
                    {uploaded && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                  </CardTitle>
                  <CardDescription>{desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Label htmlFor={`upload-${key}`} className={`block border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${uploaded ? "border-green-500/40 bg-green-500/5" : "border-border hover:border-primary"}`}>
                    {isThis ? (
                      <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium">{uploaded ? "Replace file" : "Click to upload"}</p>
                        <p className="text-xs text-muted-foreground mt-1">JPG, PNG or PDF · max 10MB</p>
                      </>
                    )}
                    <Input
                      id={`upload-${key}`}
                      type="file"
                      className="hidden"
                      accept={accept}
                      disabled={status === "pending" && submitted}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(key, f); }}
                    />
                  </Label>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {status !== "approved" && (
          <div className="mt-6 flex justify-end">
            <Button
              size="lg"
              disabled={!allUploaded || submitting || (status === "pending" && submitted)}
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
