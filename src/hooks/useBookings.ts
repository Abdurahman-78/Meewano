import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Booking {
  id: string;
  property_id: string;
  guest_id: string;
  host_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  currency: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "rejected";
  guest_message?: string;
  host_response?: string;
  created_at: string;
  updated_at: string;
  properties?: {
    title: string;
    location: string;
    images: string[];
  };
  profiles?: {
    full_name: string;
    email: string;
  };
}

export const useBookings = (options?: { guestId?: string; hostId?: string; status?: string }) => {
  return useQuery({
    queryKey: ["bookings", options],
    queryFn: async () => {
      let query = supabase
        .from("bookings")
        .select(`
          *,
          properties (title, location, images)
        `);

      if (options?.guestId) {
        query = query.eq("guest_id", options.guestId);
      }
      if (options?.hostId) {
        query = query.eq("host_id", options.hostId);
      }
      if (options?.status) {
        query = query.eq("status", options.status);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data as Booking[];
    },
  });
};

export const useAllBookings = () => {
  const queryClient = useQueryClient();

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("admin-bookings-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["all-bookings"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["all-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          properties (title, location, images)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Booking[];
    },
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (booking: {
      property_id: string;
      host_id: string;
      check_in: string;
      check_out: string;
      guests: number;
      total_price: number;
      currency?: string;
      guest_message?: string;
    }) => {
      if (!user) throw new Error("Must be logged in");

      const { data, error } = await supabase
        .from("bookings")
        .insert({
          ...booking,
          guest_id: user.id,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
};

export const useUpdateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Booking> & { id: string }) => {
      const { data, error } = await supabase
        .from("bookings")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["all-bookings"] });
    },
  });
};
