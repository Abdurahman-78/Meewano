import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface HostVerification {
  id: string;
  user_id: string;
  id_document_url: string | null;
  selfie_url: string | null;
  ownership_document_url: string | null;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useMyHostVerification = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["host-verification", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("host_verifications")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as HostVerification | null;
    },
  });
};

export const useUpsertHostVerification = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<HostVerification>) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("host_verifications")
        .upsert(
          { user_id: user.id, ...patch, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["host-verification", user?.id] }),
  });
};

// Admin
export const useAllHostVerifications = () => {
  return useQuery({
    queryKey: ["all-host-verifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("host_verifications")
        .select("*")
        .order("submitted_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      const ids = Array.from(new Set((data || []).map((r) => r.user_id)));
      if (ids.length === 0) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", ids);
      const map = new Map((profiles || []).map((p: any) => [p.id, p]));
      return (data || []).map((r: any) => ({ ...r, profiles: map.get(r.user_id) || null }));
    },
  });
};

export const useReviewHostVerification = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: "approved" | "rejected"; reason?: string }) => {
      const { data: row, error: fetchErr } = await supabase
        .from("host_verifications")
        .select("user_id, status")
        .eq("id", id)
        .single();
      if (fetchErr) throw fetchErr;
      const wasApproved = row.status === "approved";

      const { error } = await supabase
        .from("host_verifications")
        .update({
          status,
          rejection_reason: status === "rejected" ? reason || null : null,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;

      // Send approval email (only on transition to approved)
      if (status === "approved" && !wasApproved) {
        try {
          await supabase.functions.invoke("send-host-approved", {
            body: { userId: row.user_id },
          });
        } catch (e) {
          console.error("send-host-approved failed", e);
        }
      }

      // Send rejection email (only on transition to rejected)
      if (status === "rejected" && row.status !== "rejected") {
        try {
          await supabase.functions.invoke("send-host-rejected", {
            body: { userId: row.user_id, reason: reason || "" },
          });
        } catch (e) {
          console.error("send-host-rejected failed", e);
        }
      }

      // Notify the host
      await supabase.from("notifications").insert({
        user_id: row.user_id,
        title: status === "approved" ? "You're verified!" : "Verification needs attention",
        message: status === "approved"
          ? "Your account has been verified. You can now list properties."
          : `Your verification was rejected: ${reason || "Please review and resubmit your documents."}`,
        type: status === "approved" ? "success" : "warning",
        link: "/host/verification",
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all-host-verifications"] }),
  });
};

export const useDeleteHostVerification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("host_verifications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all-host-verifications"] }),
  });
};

// Signed URL helper for private bucket
export const getHostDocSignedUrl = async (path: string) => {
  if (!path) return null;
  const { data } = await supabase.storage.from("host-documents").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
};
