import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useFavorites = (userId: string | null) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchFavorites();
    } else {
      setFavorites([]);
      setLoading(false);
    }
  }, [userId]);

  const fetchFavorites = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from("favorites")
        .select("property_id")
        .eq("user_id", userId);

      if (error) throw error;
      setFavorites(data?.map(f => f.property_id) || []);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (propertyId: string) => {
    if (!userId) {
      toast({
        title: "Login Required",
        description: "Please log in to save favorites",
        variant: "destructive",
      });
      return false;
    }

    const isFavorited = favorites.includes(propertyId);

    try {
      if (isFavorited) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", userId)
          .eq("property_id", propertyId);

        if (error) throw error;

        setFavorites(favorites.filter(id => id !== propertyId));
        toast({
          title: "Removed from favorites",
          description: "Property removed from your favorites",
        });
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: userId, property_id: propertyId });

        if (error) throw error;

        setFavorites([...favorites, propertyId]);
        toast({
          title: "Added to favorites",
          description: "Property saved to your favorites",
        });
      }
      return true;
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
      return false;
    }
  };

  const isFavorite = (propertyId: string) => favorites.includes(propertyId);

  return { favorites, loading, toggleFavorite, isFavorite, refetch: fetchFavorites };
};
