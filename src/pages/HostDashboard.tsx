import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import HostLayout from "@/components/HostLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Edit3,
  CheckCircle2,
  Circle,
  Home,
  ArrowUpDown,
  Settings,
  Trash2,
  ExternalLink,
  Calendar,
  MoreVertical,
  Loader2,
  Hourglass,
  Check,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMyHostVerification } from "@/hooks/useHostVerification";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Property {
  id: string;
  title: string;
  location: string;
  city?: string;
  price_per_night: number;
  is_active: boolean | null;
  instant_booking: boolean | null;
  images: string[] | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  max_guests?: number | null;
  approval_status?: string;
  rejection_reason?: string | null;
  created_at?: string;
}

type SortField = "title" | "status" | "instant" | "location";
type SortDirection = "asc" | "desc";

const HostDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: verification, isLoading: vLoading } = useMyHostVerification();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>("title");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const isVerified = verification?.status === "approved";

  // Fetch ONLY real properties from Supabase for this host — NO DEMO DATA
  const fetchProperties = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("host_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Could not query properties table:", error.message);
      }
      setProperties((data || []) as Property[]);
    } catch (error: any) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      fetchProperties();
    }
  }, [user, authLoading, navigate, fetchProperties]);

  // Toggle Listed / Unlisted status
  const handleToggleActive = async (propertyId: string, makeActive: boolean) => {
    setActionLoadingId(propertyId);
    try {
      const { error } = await supabase
        .from("properties")
        .update({ is_active: makeActive })
        .eq("id", propertyId)
        .eq("host_id", user?.id);

      if (error) throw error;

      setProperties((prev) =>
        prev.map((p) => (p.id === propertyId ? { ...p, is_active: makeActive } : p))
      );
      toast.success(makeActive ? "Listing is now Listed" : "Listing is now Unlisted");
    } catch (err: any) {
      toast.error(err.message || "Failed to update listing status");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Toggle Instant Book On / Off
  const handleToggleInstantBook = async (propertyId: string, currentVal: boolean) => {
    const newVal = !currentVal;
    try {
      const { error } = await supabase
        .from("properties")
        .update({ instant_booking: newVal })
        .eq("id", propertyId)
        .eq("host_id", user?.id);

      if (error) throw error;

      setProperties((prev) =>
        prev.map((p) => (p.id === propertyId ? { ...p, instant_booking: newVal } : p))
      );
      toast.success(`Instant book is now ${newVal ? "On" : "Off"}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update instant booking");
    }
  };

  // Delete property
  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm("Are you sure you want to delete this listing? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", propertyId)
        .eq("host_id", user?.id);

      if (error) throw error;
      toast.success("Listing deleted successfully");
      setSelectedIds((prev) => prev.filter((id) => id !== propertyId));
      fetchProperties();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete listing");
    }
  };

  // Helper to determine status type
  const getListingStatus = (property: Property) => {
    // If not verified or missing key listing details, or status draft/pending
    if (property.approval_status === "draft" || (!property.price_per_night && !property.is_active)) {
      return "in_progress";
    }
    if (property.is_active === true) {
      return "listed";
    }
    return "unlisted";
  };

  // Sort toggle handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter & sort properties
  const filteredAndSortedProperties = useMemo(() => {
    let result = properties.filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchLoc = item.location?.toLowerCase().includes(q);
      const matchCity = item.city?.toLowerCase().includes(q);
      return matchTitle || matchLoc || matchCity;
    });

    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === "title") {
        comparison = (a.title || "").localeCompare(b.title || "");
      } else if (sortField === "status") {
        const sA = getListingStatus(a);
        const sB = getListingStatus(b);
        comparison = sA.localeCompare(sB);
      } else if (sortField === "instant") {
        const iA = a.instant_booking ? 1 : 0;
        const iB = b.instant_booking ? 1 : 0;
        comparison = iA - iB;
      } else if (sortField === "location") {
        comparison = (a.location || a.city || "").localeCompare(b.location || b.city || "");
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [properties, searchQuery, sortField, sortDirection]);

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAndSortedProperties.length && filteredAndSortedProperties.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAndSortedProperties.map((p) => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const allSelected =
    filteredAndSortedProperties.length > 0 &&
    selectedIds.length === filteredAndSortedProperties.length;

  if (authLoading || loading) {
    return (
      <HostLayout>
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </HostLayout>
    );
  }

  return (
    <HostLayout>
      <main className="w-full px-4 sm:px-6 md:px-8 py-6 max-w-7xl mx-auto flex-1 flex flex-col">
        {/* Verification Alert if needed */}
        {!vLoading && !isVerified && (
          <Alert className="mb-6 border-amber-500/40 bg-amber-500/10">
            <AlertTitle className="text-amber-800 dark:text-amber-300 font-semibold">
              Host Verification Required
            </AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-4 flex-wrap text-xs sm:text-sm text-amber-900 dark:text-amber-200">
              <span>
                {verification?.status === "rejected"
                  ? verification.rejection_reason || "Please resubmit your documents."
                  : verification?.status === "pending" && verification?.submitted_at
                  ? "We'll notify you once approved (usually within 24 hours)."
                  : "Upload your ID and documents to publish live listings."}
              </span>
              <Button size="sm" variant="outline" onClick={() => navigate("/host/verification")}>
                {verification?.submitted_at ? "View status" : "Verify now"}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Top Header: "{count} listings" on left, "+ Create listing" on right */}
        <div className="flex items-center justify-between mb-6 pb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {properties.length} {properties.length === 1 ? "listing" : "listings"}
            </h1>
          </div>

          <div>
            <Button
              variant="outline"
              className="h-10 px-4 sm:px-5 font-semibold rounded-xl border border-border/80 shadow-xs hover:bg-accent flex items-center gap-1.5 text-sm"
              onClick={() => navigate("/host/add-listing")}
            >
              <Plus className="h-4 w-4" />
              Create listing
            </Button>
          </div>
        </div>

        {/* Search Bar matching image.png (Crossed out filters are omitted per image annotations) */}
        <div className="mb-6 flex items-center gap-3">
          <div className="relative w-64 sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search listings"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-9 rounded-full border-border/80 bg-background text-sm shadow-xs focus-visible:ring-1"
            />
          </div>
        </div>

        {/* Listings Table styled exactly as image.png */}
        <div className="w-full overflow-x-auto rounded-xl border border-border/60 bg-card shadow-xs">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-border/60 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/20 select-none">
                {/* Checkbox column */}
                <th className="py-3.5 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                    aria-label="Select all listings"
                  />
                </th>

                {/* LISTING */}
                <th className="py-3.5 px-3 min-w-[240px]">
                  <button
                    onClick={() => handleSort("title")}
                    className="flex items-center gap-1.5 hover:text-foreground font-semibold uppercase tracking-wider text-xs"
                  >
                    <span>LISTING</span>
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </button>
                </th>

                {/* STATUS */}
                <th className="py-3.5 px-3 min-w-[130px]">
                  <button
                    onClick={() => handleSort("status")}
                    className="flex items-center gap-1.5 hover:text-foreground font-semibold uppercase tracking-wider text-xs"
                  >
                    <span>STATUS</span>
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </button>
                </th>

                {/* TO DO */}
                <th className="py-3.5 px-3 min-w-[180px]">
                  <span className="font-semibold uppercase tracking-wider text-xs">TO DO</span>
                </th>

                {/* INSTANT BOOK */}
                <th className="py-3.5 px-3 min-w-[140px]">
                  <button
                    onClick={() => handleSort("instant")}
                    className="flex items-center gap-1.5 hover:text-foreground font-semibold uppercase tracking-wider text-xs"
                  >
                    <span>INSTANT BOOK</span>
                    <ArrowUpDown className="h-3 w-3 opacity-60" />
                  </button>
                </th>

                {/* LOCATION with settings gear icon */}
                <th className="py-3.5 px-4 min-w-[160px] text-right">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleSort("location")}
                      className="flex items-center gap-1.5 hover:text-foreground font-semibold uppercase tracking-wider text-xs"
                    >
                      <span>LOCATION</span>
                      <ArrowUpDown className="h-3 w-3 opacity-60" />
                    </button>
                    <Settings className="h-4 w-4 text-muted-foreground" />
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/50 bg-card">
              {filteredAndSortedProperties.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-1">
                        <Home className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="font-semibold text-base text-foreground">
                        {properties.length === 0 ? "No listings found" : "No listings match your search"}
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {properties.length === 0
                          ? "You haven't created any property listings yet. Click below to add your first listing."
                          : "Try searching with a different property title or location."}
                      </p>
                      {properties.length === 0 && (
                        <Button
                          className="mt-3 rounded-xl font-semibold gap-1.5"
                          onClick={() => navigate("/host/add-listing")}
                        >
                          <Plus className="h-4 w-4" />
                          Create listing
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedProperties.map((property) => {
                  const status = getListingStatus(property);
                  const isInstantOn = property.instant_booking ?? true; // defaults to on
                  const isSelected = selectedIds.includes(property.id);
                  const isActionLoading = actionLoadingId === property.id;

                  return (
                    <tr
                      key={property.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        isSelected ? "bg-primary/5" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(property.id)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                          aria-label={`Select ${property.title}`}
                        />
                      </td>

                      {/* LISTING: Thumbnail + Title */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          {/* Thumbnail: image or grey box with white home icon as in image.png */}
                          {property.images && property.images.length > 0 && property.images[0] ? (
                            <img
                              src={property.images[0]}
                              alt={property.title}
                              className="h-11 w-14 object-cover rounded-md border border-border/40 shrink-0 bg-muted"
                            />
                          ) : (
                            <div className="h-11 w-14 rounded-md bg-stone-400 dark:bg-stone-600 flex items-center justify-center shrink-0">
                              <Home className="h-5 w-5 text-white" />
                            </div>
                          )}

                          <span
                            onClick={() => navigate(`/property/${property.id}`)}
                            className="font-semibold text-sm text-foreground hover:underline cursor-pointer line-clamp-1"
                            title={property.title}
                          >
                            {property.title}
                          </span>
                        </div>
                      </td>

                      {/* STATUS: ● Listed / ⏳ In progress / ● Unlisted */}
                      <td className="py-3 px-3">
                        {status === "listed" ? (
                          <span className="inline-flex items-center gap-2 text-xs font-medium text-foreground">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                            Listed
                          </span>
                        ) : status === "in_progress" ? (
                          <span className="inline-flex items-center gap-2 text-xs font-medium text-foreground">
                            <Hourglass className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            In progress
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 text-xs font-medium text-foreground">
                            <span className="h-2.5 w-2.5 rounded-full bg-red-600 shrink-0" />
                            Unlisted
                          </span>
                        )}
                      </td>

                      {/* TO DO: [✎] + [List] / [Un-list] / [Finish] button */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          {/* Pencil icon edit button */}
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-lg border-border/80 hover:bg-accent shrink-0 shadow-2xs"
                            onClick={() => navigate(`/host/edit-listing/${property.id}`)}
                            title="Edit listing details"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>

                          {/* Action button: List / Un-list / Finish */}
                          {status === "listed" ? (
                            <Button
                              variant="outline"
                              disabled={isActionLoading}
                              className="h-9 px-4 rounded-xl text-xs font-semibold border-border/80 hover:bg-accent shadow-2xs"
                              onClick={() => handleToggleActive(property.id, false)}
                            >
                              {isActionLoading ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : null}
                              Un-list
                            </Button>
                          ) : status === "unlisted" ? (
                            <Button
                              variant="outline"
                              disabled={isActionLoading}
                              className="h-9 px-4 rounded-xl text-xs font-semibold border-border/80 hover:bg-accent shadow-2xs"
                              onClick={() => handleToggleActive(property.id, true)}
                            >
                              {isActionLoading ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : null}
                              List
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              className="h-9 px-4 rounded-xl text-xs font-semibold border-border/80 hover:bg-accent shadow-2xs"
                              onClick={() => navigate(`/host/edit-listing/${property.id}`)}
                            >
                              Finish
                            </Button>
                          )}
                        </div>
                      </td>

                      {/* INSTANT BOOK: Green checkmark + On / Off */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleToggleInstantBook(property.id, isInstantOn)}
                          className="inline-flex items-center gap-1.5 text-xs font-medium hover:opacity-80 transition-opacity cursor-pointer"
                          title="Click to toggle Instant Book"
                        >
                          {isInstantOn ? (
                            <>
                              <span className="h-4 w-4 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                                <Check className="h-2.5 w-2.5 text-white stroke-[3]" />
                              </span>
                              <span className="font-semibold text-foreground">On</span>
                            </>
                          ) : (
                            <>
                              <Circle className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Off</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* LOCATION + Row actions */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                            {property.location || property.city || "—"}
                          </span>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-full hover:bg-accent text-muted-foreground"
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem
                                onClick={() => navigate(`/property/${property.id}`)}
                                className="cursor-pointer"
                              >
                                <ExternalLink className="h-3.5 w-3.5 mr-2" />
                                View listing
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => navigate(`/host/edit-listing/${property.id}`)}
                                className="cursor-pointer"
                              >
                                <Edit3 className="h-3.5 w-3.5 mr-2" />
                                Edit listing
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => navigate(`/host/calendar?propertyId=${property.id}`)}
                                className="cursor-pointer"
                              >
                                <Calendar className="h-3.5 w-3.5 mr-2" />
                                Manage calendar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteProperty(property.id)}
                                className="cursor-pointer text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Delete listing
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </HostLayout>
  );
};

export default HostDashboard;
