import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  is_host: boolean;
  is_verified: boolean;
  preferred_language: string;
  preferred_currency: string;
  created_at: string;
  updated_at: string;
}

export interface UserWithRole extends Profile {
  roles: string[];
}

export interface SiteSetting {
  id: string;
  key: string;
  value: any;
  updated_at: string;
  updated_by: string | null;
}

// Fetch all users (profiles)
export const useAllUsers = () => {
  return useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const { data: verifications } = await supabase
        .from("host_verifications")
        .select("user_id, status");

      const { data: ownedProps } = await supabase
        .from("properties")
        .select("host_id");

      const approvedHostIds = new Set(
        (verifications || []).filter((v) => v.status === "approved").map((v) => v.user_id)
      );
      const propertyHostIds = new Set((ownedProps || []).map((p) => p.host_id));

      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => ({
        ...profile,
        is_host:
          profile.is_host ||
          approvedHostIds.has(profile.id) ||
          propertyHostIds.has(profile.id),
        roles: roles?.filter((r) => r.user_id === profile.id).map((r) => r.role) || [],
      }));

      return usersWithRoles;
    },
  });
};

// Fetch all properties (admin view)
export const useAllProperties = () => {
  return useQuery({
    queryKey: ["all-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

// Fetch site settings
export const useSiteSettings = () => {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*");
      if (error) throw error;
      return data as SiteSetting[];
    },
  });
};

// Update site setting
export const useUpdateSiteSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      // Upsert by the unique `key` column. Without onConflict, Postgres uses
      // the primary key (id) and inserts fail because the unique key conflict
      // isn't resolved — that's why deletes/edits/adds for amenities, locations,
      // and regions used to silently do nothing.
      const { data, error } = await supabase
        .from("site_settings")
        .upsert(
          { key, value, updated_at: new Date().toISOString() },
          { onConflict: "key" }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
    },
  });
};

// Assign role to user
export const useAssignRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "moderator" | "user" }) => {
      const { data, error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
    },
  });
};

// Remove role from user
export const useRemoveRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "moderator" | "user" }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
    },
  });
};

// Fully delete a user (auth + all related data) via admin edge function
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("admin-delete-user", {
        body: { userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
};

// Admin stats
export const useAdminStats = () => {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [usersRes, propertiesRes, bookingsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("properties").select("id", { count: "exact", head: true }),
        supabase.from("bookings").select("id, total_price"),
      ]);

      const totalRevenue = bookingsRes.data?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;

      return {
        totalUsers: usersRes.count || 0,
        totalProperties: propertiesRes.count || 0,
        totalBookings: bookingsRes.data?.length || 0,
        totalRevenue,
      };
    },
  });
};
