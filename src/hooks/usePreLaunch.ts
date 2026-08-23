import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PreLaunchSettings, PreLaunchDemoProperty, PreLaunchHostSubmission } from "@/types/preLaunch";
import { DEFAULT_PRE_LAUNCH_SETTINGS, DEFAULT_DEMO_PROPERTIES } from "@/data/defaultPreLaunchData";
import { toast } from "sonner";

const SETTINGS_KEY = "pre_launch_settings";
const DEMO_PROPERTIES_KEY = "pre_launch_demo_properties";
const LOCAL_HOSTS_STORAGE_KEY = "meewan:pre_launch_hosts:v1";

export const usePreLaunchSettings = () => {
  return useQuery({
    queryKey: ["pre-launch-settings"],
    queryFn: async (): Promise<PreLaunchSettings> => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", SETTINGS_KEY)
          .maybeSingle();

        if (error || !data || !data.value) {
          return DEFAULT_PRE_LAUNCH_SETTINGS;
        }

        return {
          ...DEFAULT_PRE_LAUNCH_SETTINGS,
          ...(data.value as Partial<PreLaunchSettings>),
        };
      } catch (err) {
        console.warn("Using default pre-launch settings due to:", err);
        return DEFAULT_PRE_LAUNCH_SETTINGS;
      }
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdatePreLaunchSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<PreLaunchSettings>) => {
      // Fetch current or combine
      const { data: existing } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", SETTINGS_KEY)
        .maybeSingle();

      const updated = {
        ...DEFAULT_PRE_LAUNCH_SETTINGS,
        ...(existing?.value || {}),
        ...settings,
      };

      const { error } = await supabase
        .from("site_settings")
        .upsert(
          {
            key: SETTINGS_KEY,
            value: updated,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        );

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pre-launch-settings"] });
      toast.success("Pre-launch settings updated successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update pre-launch settings");
    },
  });
};

export const usePreLaunchDemoProperties = () => {
  return useQuery({
    queryKey: ["pre-launch-demo-properties"],
    queryFn: async (): Promise<PreLaunchDemoProperty[]> => {
      try {
        // Try site_settings first as reliable JSON store
        const { data, error } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", DEMO_PROPERTIES_KEY)
          .maybeSingle();

        if (!error && data && Array.isArray(data.value) && data.value.length > 0) {
          return data.value as PreLaunchDemoProperty[];
        }

        return DEFAULT_DEMO_PROPERTIES;
      } catch (err) {
        console.warn("Using default demo properties:", err);
        return DEFAULT_DEMO_PROPERTIES;
      }
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdatePreLaunchDemoProperties = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (properties: PreLaunchDemoProperty[]) => {
      const { error } = await supabase
        .from("site_settings")
        .upsert(
          {
            key: DEMO_PROPERTIES_KEY,
            value: properties,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        );

      if (error) throw error;
      return properties;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pre-launch-demo-properties"] });
      toast.success("Demo properties updated successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update demo properties");
    },
  });
};

export const usePreLaunchHostSubmissions = () => {
  return useQuery({
    queryKey: ["pre-launch-hosts"],
    queryFn: async (): Promise<PreLaunchHostSubmission[]> => {
      try {
        // Try query dedicated pre_launch_hosts table
        const { data, error } = await (supabase as any)
          .from("pre_launch_hosts")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data) {
          return data as PreLaunchHostSubmission[];
        }
      } catch (e) {
        console.info("Falling back to local/settings pre_launch_hosts store");
      }

      // Fallback to site_settings or local storage
      try {
        const { data: fallbackData } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "pre_launch_hosts_submissions")
          .maybeSingle();

        if (fallbackData && Array.isArray(fallbackData.value)) {
          return fallbackData.value as PreLaunchHostSubmission[];
        }
      } catch (e) {
        // ignore
      }

      // Local storage fallback
      const local = localStorage.getItem(LOCAL_HOSTS_STORAGE_KEY);
      if (local) {
        try {
          return JSON.parse(local);
        } catch (e) {
          return [];
        }
      }

      return [];
    },
  });
};

export const useSubmitPreLaunchHost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: Omit<PreLaunchHostSubmission, "id" | "created_at" | "status">
    ) => {
      const newSubmission: PreLaunchHostSubmission = {
        id: crypto.randomUUID(),
        ...payload,
        status: "pending",
        created_at: new Date().toISOString(),
      };

      let insertedInDb = false;

      try {
        const { error } = await (supabase as any)
          .from("pre_launch_hosts")
          .insert([newSubmission]);

        if (!error) {
          insertedInDb = true;
        }
      } catch (err) {
        console.warn("pre_launch_hosts table insert error, trying site_settings store:", err);
      }

      if (!insertedInDb) {
        // Store in site_settings list
        try {
          const { data: existing } = await supabase
            .from("site_settings")
            .select("value")
            .eq("key", "pre_launch_hosts_submissions")
            .maybeSingle();

          const list: PreLaunchHostSubmission[] = Array.isArray(existing?.value)
            ? existing!.value
            : [];

          list.unshift(newSubmission);

          await supabase.from("site_settings").upsert(
            {
              key: "pre_launch_hosts_submissions",
              value: list,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "key" }
          );
        } catch (err) {
          console.warn("site_settings store error, persisting to local storage:", err);
        }
      }

      // Also persist to local storage as safety backup
      try {
        const local = localStorage.getItem(LOCAL_HOSTS_STORAGE_KEY);
        const list = local ? JSON.parse(local) : [];
        list.unshift(newSubmission);
        localStorage.setItem(LOCAL_HOSTS_STORAGE_KEY, JSON.stringify(list));
      } catch (err) {
        // ignore
      }

      return newSubmission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pre-launch-hosts"] });
      queryClient.invalidateQueries({ queryKey: ["pre-launch-settings"] });
    },
  });
};

export const useUpdatePreLaunchHostStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      admin_notes,
    }: {
      id: string;
      status: PreLaunchHostSubmission["status"];
      admin_notes?: string;
    }) => {
      let updatedInDb = false;

      try {
        const { error } = await (supabase as any)
          .from("pre_launch_hosts")
          .update({
            status,
            admin_notes: admin_notes ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);

        if (!error) updatedInDb = true;
      } catch (err) {
        console.warn("Update DB error:", err);
      }

      // Always update site_settings backup as well
      try {
        const { data: existing } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "pre_launch_hosts_submissions")
          .maybeSingle();

        if (existing && Array.isArray(existing.value)) {
          const list = existing.value.map((item: PreLaunchHostSubmission) =>
            item.id === id ? { ...item, status, admin_notes } : item
          );
          await supabase.from("site_settings").upsert(
            {
              key: "pre_launch_hosts_submissions",
              value: list,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "key" }
          );
        }
      } catch (err) {
        // ignore
      }

      return { id, status, admin_notes };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pre-launch-hosts"] });
      toast.success("Host lead status updated");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update host status");
    },
  });
};
