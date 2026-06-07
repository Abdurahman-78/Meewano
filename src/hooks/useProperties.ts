import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DbProperty {
  id: string;
  host_id: string;
  title: string;
  title_ku?: string;
  title_ar?: string;
  description?: string;
  description_ku?: string;
  description_ar?: string;
  location: string;
  location_ku?: string;
  location_ar?: string;
  city: string;
  price_per_night: number;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  amenities: string[];
  images: string[];
  is_featured: boolean;
  is_active: boolean;
  rating: number;
  review_count: number;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
  cleaning_policy?: string;
  welcome_message?: string;
}

export const useProperties = (options?: { hostId?: string; city?: string; featured?: boolean }) => {
  return useQuery({
    queryKey: ["properties", options],
    queryFn: async () => {
      let query = supabase.from("properties").select("*");

      if (options?.hostId) {
        query = query.eq("host_id", options.hostId);
      }
      if (options?.city) {
        query = query.eq("city", options.city);
      }
      if (options?.featured) {
        query = query.eq("is_featured", true);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data as DbProperty[];
    },
  });
};

export const useProperty = (id: string) => {
  return useQuery({
    queryKey: ["property", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as DbProperty;
    },
    enabled: !!id,
  });
};

export const useCreateProperty = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (property: Omit<DbProperty, "id" | "host_id" | "created_at" | "updated_at" | "rating" | "review_count">) => {
      if (!user) throw new Error("Must be logged in");

      const { data, error } = await supabase
        .from("properties")
        .insert({
          ...property,
          host_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
};

export const useUpdateProperty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbProperty> & { id: string }) => {
      const { data, error } = await supabase
        .from("properties")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["all-properties"] });
      queryClient.invalidateQueries({ queryKey: ["pending-properties"] });
      queryClient.invalidateQueries({ queryKey: ["property", data.id] });
    },
  });
};

export const useDeleteProperty = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("properties").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
};
