import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ConversionFunnel {
  views: number;
  bookings_started: number;
  bookings_completed: number;
  view_to_start_rate: number;
  start_to_complete_rate: number;
  view_to_complete_rate: number;
}

export const useConversionFunnel = (days = 30) =>
  useQuery({
    queryKey: ["conversion-funnel", days],
    queryFn: async (): Promise<ConversionFunnel> => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("conversion_events")
        .select("event_type")
        .gte("created_at", since);
      if (error) throw error;
      const counts = { property_view: 0, booking_started: 0, booking_completed: 0 } as any;
      (data ?? []).forEach((e: any) => { if (counts[e.event_type] !== undefined) counts[e.event_type]++; });
      const v = counts.property_view, s = counts.booking_started, c = counts.booking_completed;
      return {
        views: v, bookings_started: s, bookings_completed: c,
        view_to_start_rate: v ? (s / v) * 100 : 0,
        start_to_complete_rate: s ? (c / s) * 100 : 0,
        view_to_complete_rate: v ? (c / v) * 100 : 0,
      };
    },
  });

export const useAdminActivity = (limit = 100) =>
  useQuery({
    queryKey: ["admin-activity", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_activity_log")
        .select("*, profiles!admin_activity_log_admin_id_fkey(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) {
        // FK might not be defined; fallback
        const { data: rows } = await supabase
          .from("admin_activity_log").select("*").order("created_at", { ascending: false }).limit(limit);
        return rows ?? [];
      }
      return data ?? [];
    },
  });

export const useBackupRuns = () =>
  useQuery({
    queryKey: ["backup-runs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("backup_runs").select("*").order("started_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
