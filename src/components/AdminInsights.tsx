import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Activity, Database, Download, Loader2 } from "lucide-react";
import { useConversionFunnel, useAdminActivity, useBackupRuns } from "@/hooks/useAdminInsights";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const Stat = ({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) => (
  <div className="rounded-lg border p-4">
    <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
    <p className="text-2xl font-bold mt-1">{value.toLocaleString()}{suffix}</p>
  </div>
);

const AdminInsights = () => {
  const { data: funnel, isLoading: fLoading } = useConversionFunnel(30);
  const { data: activity } = useAdminActivity(50);
  const { data: backups } = useBackupRuns();
  const qc = useQueryClient();
  const [running, setRunning] = useState(false);

  const runBackup = async () => {
    setRunning(true);
    try {
      const { error } = await supabase.functions.invoke("run-backup");
      if (error) throw error;
      toast.success("Backup completed");
      qc.invalidateQueries({ queryKey: ["backup-runs"] });
    } catch (e: any) {
      toast.error(e.message || "Backup failed");
    } finally { setRunning(false); }
  };

  const downloadBackup = async (path: string) => {
    const { data, error } = await supabase.storage.from("backups").createSignedUrl(path, 60);
    if (error || !data?.signedUrl) { toast.error("Could not generate download link"); return; }
    window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Conversion funnel (last 30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {fLoading || !funnel ? <p>Loading…</p> : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Stat label="Property views" value={funnel.views} />
                <Stat label="Bookings started" value={funnel.bookings_started} />
                <Stat label="Bookings completed" value={funnel.bookings_completed} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Stat label="View → Start" value={Math.round(funnel.view_to_start_rate * 10) / 10} suffix="%" />
                <Stat label="Start → Complete" value={Math.round(funnel.start_to_complete_rate * 10) / 10} suffix="%" />
                <Stat label="View → Complete" value={Math.round(funnel.view_to_complete_rate * 10) / 10} suffix="%" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Admin activity log</CardTitle></CardHeader>
        <CardContent>
          {activity && activity.length > 0 ? (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {activity.map((a: any) => (
                <div key={a.id} className="flex items-start justify-between p-3 border rounded-lg text-sm">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline">{a.action}</Badge>
                      {a.entity_type && <span className="text-xs text-muted-foreground">{a.entity_type}</span>}
                    </div>
                    {a.details && Object.keys(a.details).length > 0 && (
                      <p className="text-xs text-muted-foreground truncate">{JSON.stringify(a.details)}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-3">
                    {new Date(a.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : <p className="text-muted-foreground text-sm">No activity yet.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" /> Database backups</CardTitle>
            <Button size="sm" onClick={runBackup} disabled={running}>
              {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Database className="h-4 w-4 mr-2" />}
              Run backup now
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {backups && backups.length > 0 ? (
            <div className="space-y-2">
              {backups.map((b: any) => (
                <div key={b.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={b.status === "success" ? "default" : b.status === "failed" ? "destructive" : "secondary"}>{b.status}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(b.started_at).toLocaleString()}</span>
                    </div>
                    {b.row_count != null && <p className="text-xs text-muted-foreground">{b.row_count.toLocaleString()} rows · {b.file_size_bytes ? Math.round(b.file_size_bytes/1024) + " KB" : ""}</p>}
                    {b.error_message && <p className="text-xs text-destructive">{b.error_message}</p>}
                  </div>
                  {b.file_path && (
                    <Button size="sm" variant="outline" onClick={() => downloadBackup(b.file_path)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : <p className="text-muted-foreground text-sm">No backups yet — click "Run backup now" or set up the weekly schedule.</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInsights;
