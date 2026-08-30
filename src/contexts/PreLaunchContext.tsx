import React, { createContext, useContext, useState, useEffect } from "react";
import { DEFAULT_PRE_LAUNCH_SETTINGS, DEFAULT_DEMO_PROPERTIES } from "@/data/defaultPreLaunchData";
import { PreLaunchSettings, PreLaunchDemoProperty } from "@/types/preLaunch";
import { toast } from "sonner";

export type SiteMode = "live" | "pre-launch";

export interface PreLaunchPropertyItem extends PreLaunchDemoProperty {
  isCustom?: boolean;
  amenities?: string[];
}

interface PreLaunchContextType {
  mode: SiteMode;
  setMode: (mode: SiteMode) => void;
  toggleMode: () => void;
  settings: PreLaunchSettings;
  properties: PreLaunchPropertyItem[];
  isHostModalOpen: boolean;
  setIsHostModalOpen: (open: boolean) => void;
  editingProperty: PreLaunchPropertyItem | null;
  setEditingProperty: (property: PreLaunchPropertyItem | null) => void;
  openAddPropertyModal: () => void;
  openEditPropertyModal: (property: PreLaunchPropertyItem) => void;
  addProperty: (property: Omit<PreLaunchPropertyItem, "id">) => PreLaunchPropertyItem;
  updateProperty: (id: string, property: Partial<PreLaunchPropertyItem>) => void;
  deleteProperty: (id: string) => void;
  selectedPreviewProperty: PreLaunchPropertyItem | null;
  setSelectedPreviewProperty: (property: PreLaunchPropertyItem | null) => void;
}

const STORAGE_KEY_MODE = "meewano_site_mode";
const STORAGE_KEY_PROPERTIES = "meewano_prelaunch_properties";

const PreLaunchContext = createContext<PreLaunchContextType | undefined>(undefined);

export const PreLaunchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<SiteMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_MODE);
    return saved === "live" ? "live" : "pre-launch";
  });

  const [settings] = useState<PreLaunchSettings>(DEFAULT_PRE_LAUNCH_SETTINGS);

  const [properties, setProperties] = useState<PreLaunchPropertyItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROPERTIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return DEFAULT_DEMO_PROPERTIES.map((p) => ({
      ...p,
      amenities: p.badges || ["WiFi", "Mountain View", "Kitchen", "Free Parking"],
    }));
  });

  const [isHostModalOpen, setIsHostModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<PreLaunchPropertyItem | null>(null);
  const [selectedPreviewProperty, setSelectedPreviewProperty] = useState<PreLaunchPropertyItem | null>(null);

  // Sync properties to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROPERTIES, JSON.stringify(properties));
    } catch {
      // ignore
    }
  }, [properties]);

  const setMode = (newMode: SiteMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY_MODE, newMode);
    toast.info(`Switched view to ${newMode === "pre-launch" ? "Pre-Launch Mode" : "Live Website"}`);
  };

  const toggleMode = () => {
    setMode(mode === "pre-launch" ? "live" : "pre-launch");
  };

  const openAddPropertyModal = () => {
    setEditingProperty(null);
    setIsHostModalOpen(true);
  };

  const openEditPropertyModal = (property: PreLaunchPropertyItem) => {
    setEditingProperty(property);
    setIsHostModalOpen(true);
  };

  const addProperty = (newProp: Omit<PreLaunchPropertyItem, "id">): PreLaunchPropertyItem => {
    const created: PreLaunchPropertyItem = {
      ...newProp,
      id: `prop-${Date.now()}`,
      rating: 5.0,
      reviews_count: 0,
      is_active: true,
      isCustom: true,
    };

    setProperties((prev) => [created, ...prev]);
    toast.success("Listing submitted successfully! It is now live in the Pre-Launch feed.");
    return created;
  };

  const updateProperty = (id: string, updates: Partial<PreLaunchPropertyItem>) => {
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    if (selectedPreviewProperty?.id === id) {
      setSelectedPreviewProperty((prev) => (prev ? { ...prev, ...updates } : null));
    }
    toast.success("Property listing updated successfully!");
  };

  const deleteProperty = (id: string) => {
    setProperties((prev) => prev.filter((p) => p.id !== id));
    if (selectedPreviewProperty?.id === id) {
      setSelectedPreviewProperty(null);
    }
    toast.success("Property listing removed");
  };

  return (
    <PreLaunchContext.Provider
      value={{
        mode,
        setMode,
        toggleMode,
        settings,
        properties,
        isHostModalOpen,
        setIsHostModalOpen,
        editingProperty,
        setEditingProperty,
        openAddPropertyModal,
        openEditPropertyModal,
        addProperty,
        updateProperty,
        deleteProperty,
        selectedPreviewProperty,
        setSelectedPreviewProperty,
      }}
    >
      {children}
    </PreLaunchContext.Provider>
  );
};

export const usePreLaunch = () => {
  const context = useContext(PreLaunchContext);
  if (!context) {
    throw new Error("usePreLaunch must be used within a PreLaunchProvider");
  }
  return context;
};
