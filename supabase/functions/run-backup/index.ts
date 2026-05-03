// Exports key tables to a JSON file in the `backups` storage bucket.
// Tracked in backup_runs. Intended to be called by pg_cron (weekly).
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const TABLES = ["profiles", "user_roles", "properties", "bookings", "reviews", "messages", "favorites", "site_settings", "blog_posts", "blog_categories", "blog_tags"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data: run } = await admin.from("backup_runs").insert({ status: "pending" }).select().single();
  const runId = run!.id;

  try {
    const dump: Record<string, unknown[]> = {};
    let totalRows = 0;
    for (const t of TABLES) {
      const { data, error } = await admin.from(t).select("*");
      if (error) throw new Error(`Backup of ${t} failed: ${error.message}`);
      dump[t] = data ?? [];
      totalRows += dump[t].length;
    }

    const json = JSON.stringify({ exported_at: new Date().toISOString(), tables: dump }, null, 2);
    const file = new Blob([json], { type: "application/json" });
    const date = new Date().toISOString().split("T")[0];
    const path = `${date}/backup-${runId}.json`;

    const { error: upErr } = await admin.storage.from("backups").upload(path, file, { upsert: true, contentType: "application/json" });
    if (upErr) throw upErr;

    await admin.from("backup_runs").update({
      status: "success",
      file_path: path,
      file_size_bytes: file.size,
      tables_included: TABLES,
      row_count: totalRows,
      completed_at: new Date().toISOString(),
    }).eq("id", runId);

    return new Response(JSON.stringify({ success: true, path, rows: totalRows }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await admin.from("backup_runs").update({ status: "failed", error_message: message, completed_at: new Date().toISOString() }).eq("id", runId);
    console.error("run-backup error:", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
