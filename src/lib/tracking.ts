import { supabase } from "@/integrations/supabase/client";

export type ConversionEventType = "property_view" | "booking_started" | "booking_completed" | "search";

export async function trackEvent(
  event_type: ConversionEventType,
  opts: { property_id?: string; booking_id?: string; user_id?: string; metadata?: Record<string, unknown> } = {}
) {
  try {
    await supabase.from("conversion_events").insert([{
      event_type,
      property_id: opts.property_id,
      booking_id: opts.booking_id,
      user_id: opts.user_id,
      metadata: (opts.metadata ?? {}) as any,
    }]);
  } catch (e) {
    console.warn("trackEvent failed (non-fatal):", e);
  }
}

export async function logAdminAction(
  admin_id: string,
  action: string,
  opts: { entity_type?: string; entity_id?: string; details?: Record<string, unknown> } = {}
) {
  try {
    await supabase.from("admin_activity_log").insert([{
      admin_id, action,
      entity_type: opts.entity_type,
      entity_id: opts.entity_id,
      details: (opts.details ?? {}) as any,
    }]);
  } catch (e) {
    console.warn("logAdminAction failed (non-fatal):", e);
  }
}
