import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const usePendingProperties = () => {
  return useQuery({
    queryKey: ["pending-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .in("approval_status", ["pending", "changes_pending"])
        .order("updated_at", { ascending: false });
      if (error) throw error;
      const ids = Array.from(new Set((data || []).map((r) => r.host_id)));
      if (ids.length === 0) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", ids);
      const map = new Map((profiles || []).map((p: any) => [p.id, p]));
      return (data || []).map((r: any) => ({ ...r, host: map.get(r.host_id) || null }));
    },
  });
};

export const useReviewProperty = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      action,
      reason,
    }: {
      id: string;
      action: "approve" | "reject";
      reason?: string;
    }) => {
      // Fetch current row to know if it's a new submission or pending edits
      const { data: row, error: fetchErr } = await supabase
        .from("properties")
        .select("approval_status, pending_changes, title, host_id")
        .eq("id", id)
        .single();
      if (fetchErr) throw fetchErr;

      const isEdits = row.approval_status === "changes_pending";
      const updates: any = {
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      };

      if (action === "approve") {
        updates.approval_status = "approved";
        updates.is_active = true;
        updates.rejection_reason = null;
        if (isEdits && row.pending_changes) {
          Object.assign(updates, row.pending_changes);
          updates.pending_changes = null;
        }
      } else {
        updates.approval_status = "rejected";
        updates.is_active = false;
        updates.rejection_reason = reason || null;
        if (isEdits) updates.pending_changes = null;
      }

      const { error } = await supabase.from("properties").update(updates).eq("id", id);
      if (error) throw error;

      await supabase.from("property_reviews").insert({
        property_id: id,
        reviewer_id: user!.id,
        action: action === "approve" ? (isEdits ? "changes_approved" : "approved") : isEdits ? "changes_rejected" : "rejected",
        reason: reason || null,
      });

      // Notify the host (in-app)
      await supabase.from("notifications").insert({
        user_id: row.host_id,
        title: action === "approve"
          ? (isEdits ? "Your edits are live" : "Your listing is live!")
          : (isEdits ? "Your edits were rejected" : "Listing rejected"),
        message: action === "approve"
          ? `"${row.title}" is now visible to guests.`
          : `"${row.title}" was rejected: ${reason || "Please review and resubmit."}`,
        type: action === "approve" ? "success" : "warning",
        link: `/host/edit-listing/${id}`,
      });

      // Send email to host
      try {
        const { data: prof } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", row.host_id)
          .maybeSingle();
        if (prof?.email) {
          const templateName = action === "approve" ? "property-approved" : "property-rejected";
          await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName,
              recipientEmail: prof.email,
              idempotencyKey: `${templateName}-${id}-${Date.now()}`,
              templateData: {
                firstName: (prof.full_name || "").split(" ")[0] || "",
                propertyTitle: row.title,
                reason: reason || "",
                isEdits,
                propertyId: id,
                siteUrl: window.location.origin,
              },
            },
          });
        }
      } catch (e) {
        console.error(`send ${action} email failed`, e);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending-properties"] });
      qc.invalidateQueries({ queryKey: ["all-properties"] });
      qc.invalidateQueries({ queryKey: ["properties"] });
    },
  });
};
