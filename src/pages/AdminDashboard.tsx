import { useState, useRef } from "react";
import { 
  Users, Home, DollarSign, TrendingUp, Search, MoreVertical, Shield, 
  FileText, Settings, Download, Edit, Trash2, Eye, Check, X, 
  UserPlus, Building, Calendar, AlertTriangle, RefreshCw, Ban, Banknote, Plus,
  Compass, MapPin, Pencil, Upload, Image, Mail
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { optimizeImage } from "@/lib/imageOptimizer";
import { normalizeAmenities, DEFAULT_AMENITIES, type AmenityItem } from "@/lib/amenities";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  useAllUsers, 
  useAllProperties, 
  useAdminStats, 
  useSiteSettings,
  useUpdateSiteSetting,
  useAssignRole,
  useRemoveRole,
  useDeleteUser 
} from "@/hooks/useAdminData";
import { useAllBookings, useUpdateBooking } from "@/hooks/useBookings";
import { useUpdateProperty, useDeleteProperty, useCreateProperty } from "@/hooks/useProperties";
import AdminFinanceReports from "@/components/AdminFinanceReports";
import AdminContentEditor from "@/components/AdminContentEditor";
import LocationPicker from "@/components/LocationPicker";
import { supabase } from "@/integrations/supabase/client";
import AdminBlogManager from "@/components/AdminBlogManager";
import AdminInsights from "@/components/AdminInsights";
import AdminHostVerifications from "@/components/AdminHostVerifications";
import AdminPropertyApprovals from "@/components/AdminPropertyApprovals";
import AdminNewsletters from "@/components/AdminNewsletters";

const AdminDashboard = () => {
  const { formatPrice } = useCurrency();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  // Data hooks
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useAllUsers();
  const { data: properties, isLoading: propertiesLoading, refetch: refetchProperties } = useAllProperties();
  const { data: bookings, isLoading: bookingsLoading, refetch: refetchBookings } = useAllBookings();
  const { data: siteSettings, isLoading: settingsLoading } = useSiteSettings();

  // Mutations
  const updateSiteSetting = useUpdateSiteSetting();
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();
  const deleteUser = useDeleteUser();
  const updateProperty = useUpdateProperty();
  const deleteProperty = useDeleteProperty();
  const createProperty = useCreateProperty();
  const updateBooking = useUpdateBooking();

  // Local state
  const [searchUsers, setSearchUsers] = useState("");
  const [searchProperties, setSearchProperties] = useState("");
  const [searchBookings, setSearchBookings] = useState("");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [creatingProperty, setCreatingProperty] = useState(false);
  const [newProperty, setNewProperty] = useState({
    title: "",
    city: "",
    location: "",
    price_per_night: 100,
    bedrooms: 1,
    bathrooms: 1,
    max_guests: 2,
    description: "",
    amenities: [] as string[],
    is_featured: false,
    is_active: true,
    latitude: null as number | null,
    longitude: null as number | null,
  });
  const [newPropertyImages, setNewPropertyImages] = useState<File[]>([]);
  const [newPropertyPreviews, setNewPropertyPreviews] = useState<string[]>([]);
  const [newPropertyUploading, setNewPropertyUploading] = useState(false);
  const newPropertyFileRef = useRef<HTMLInputElement>(null);
  const [editingBooking, setEditingBooking] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string } | null>(null);
  const [editingSettings, setEditingSettings] = useState<Record<string, any>>({});
  const [newAmenity, setNewAmenity] = useState("");
  const [editingAmenity, setEditingAmenity] = useState<{ original: string; updated: string } | null>(null);
  const [uploadingIconFor, setUploadingIconFor] = useState<string | null>(null);
  const amenityIconInputRef = useRef<HTMLInputElement>(null);
  const [pendingIconAmenity, setPendingIconAmenity] = useState<string | null>(null);
  const [newLocation, setNewLocation] = useState({ name: "", region: "" });
  const [editingLocation, setEditingLocation] = useState<{ original: string; name: string; region: string } | null>(null);
  const [newRegion, setNewRegion] = useState({ name: "", description: "", image: "" });
  const [editingRegion, setEditingRegion] = useState<{ name: string; description: string; image: string } | null>(null);
  const [searchRegions, setSearchRegions] = useState("");
  const [searchAmenities, setSearchAmenities] = useState("");
  const [regionImageUploading, setRegionImageUploading] = useState(false);
  const regionImageInputRef = useRef<HTMLInputElement>(null);
  const editRegionImageInputRef = useRef<HTMLInputElement>(null);

  const uploadRegionImage = async (originalFile: File): Promise<string> => {
    const file = await optimizeImage(originalFile);
    const fileExt = (file.name.split(".").pop() || "webp").toLowerCase();
    const fileName = `regions/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error } = await supabase.storage
      .from("property-images")
      .upload(fileName, file, { contentType: file.type });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const uploadAmenityIcon = async (originalFile: File): Promise<string> => {
    const file = await optimizeImage(originalFile, 256, 256, 0.9);
    const fileExt = (file.name.split(".").pop() || "webp").toLowerCase();
    const fileName = `amenity-icons/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error } = await supabase.storage
      .from("property-images")
      .upload(fileName, file, { contentType: file.type });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  // Loading state
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Auth check
  if (!user) {
    return (
      <AppLayout>
        <main className="container mx-auto px-4 py-16 text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">Please log in to access the admin dashboard.</p>
          <Button onClick={() => navigate("/auth")}>Log In</Button>
        </main>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AppLayout>
        <main className="container mx-auto px-4 py-16 text-center">
          <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">Admin Access Required</h1>
          <p className="text-muted-foreground mb-4">You don't have permission to access this page.</p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </main>
      </AppLayout>
    );
  }

  // Filter functions
  const filteredUsers = users?.filter(u => 
    u.email?.toLowerCase().includes(searchUsers.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchUsers.toLowerCase())
  ) || [];

  const filteredProperties = properties?.filter(p => 
    p.title?.toLowerCase().includes(searchProperties.toLowerCase()) ||
    p.city?.toLowerCase().includes(searchProperties.toLowerCase())
  ) || [];

  const filteredBookings = bookings?.filter(b => 
    b.properties?.title?.toLowerCase().includes(searchBookings.toLowerCase()) ||
    b.status?.toLowerCase().includes(searchBookings.toLowerCase())
  ) || [];

  // Normalize settings so we never rely on Array.prototype.find (prevents runtime crashes when the shape changes)
  const siteSettingsMap: Record<string, any> = Array.isArray(siteSettings)
    ? siteSettings.reduce((acc: Record<string, any>, s: any) => {
        acc[s.key] = s.value;
        return acc;
      }, {})
    : siteSettings && typeof siteSettings === "object"
      ? (siteSettings as Record<string, any>)
      : {};

  // Get setting value helper
  const getSetting = (key: string, defaultValue: any = "") => {
    return editingSettings[key] !== undefined ? editingSettings[key] : (siteSettingsMap[key] ?? defaultValue);
  };

  // Handle role change
  const handleRoleChange = async (userId: string, role: "admin" | "moderator" | "user", hasRole: boolean) => {
    try {
      if (hasRole) {
        await removeRole.mutateAsync({ userId, role });
        toast.success(`Removed ${role} role`);
      } else {
        await assignRole.mutateAsync({ userId, role });
        toast.success(`Assigned ${role} role`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
    }
  };

  // Handle property create
  const handlePropertyCreate = async () => {
    try {
      setNewPropertyUploading(true);
      
      // Upload images
      let imageUrls: string[] = [];
      if (newPropertyImages.length > 0 && user) {
        for (const original of newPropertyImages) {
          const file = await optimizeImage(original);
          const ext = (file.name.split(".").pop() || "webp").toLowerCase();
          const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const { error } = await supabase.storage
            .from("property-images")
            .upload(path, file, { contentType: file.type });
          if (error) throw error;
          const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
          imageUrls.push(urlData.publicUrl);
        }
      }

      await createProperty.mutateAsync({
        ...newProperty,
        currency: "USD",
        amenities: newProperty.amenities,
        images: imageUrls,
        is_featured: newProperty.is_featured,
        is_active: newProperty.is_active,
      });
      toast.success("Property created successfully");
      setCreatingProperty(false);
      setNewProperty({
        title: "",
        city: "",
        location: "",
        price_per_night: 100,
        bedrooms: 1,
        bathrooms: 1,
        max_guests: 2,
        description: "",
        amenities: [],
        is_featured: false,
        is_active: true,
        latitude: null,
        longitude: null,
      });
      setNewPropertyImages([]);
      setNewPropertyPreviews([]);
      refetchProperties();
    } catch (error: any) {
      toast.error(error.message || "Failed to create property");
    } finally {
      setNewPropertyUploading(false);
    }
  };

  // Handle property update
  const handlePropertyUpdate = async () => {
    if (!editingProperty) return;
    try {
      await updateProperty.mutateAsync(editingProperty);
      toast.success("Property updated successfully");
      setEditingProperty(null);
      refetchProperties();
    } catch (error: any) {
      toast.error(error.message || "Failed to update property");
    }
  };

  // Handle booking update
  const handleBookingUpdate = async (id: string, status: string) => {
    try {
      await updateBooking.mutateAsync({ id, status: status as any });
      toast.success(`Booking ${status}`);
      refetchBookings();
    } catch (error: any) {
      toast.error(error.message || "Failed to update booking");
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === "user") {
        await deleteUser.mutateAsync(deleteConfirm.id);
        toast.success("User deleted");
        refetchUsers();
      } else if (deleteConfirm.type === "property") {
        await deleteProperty.mutateAsync(deleteConfirm.id);
        toast.success("Property deleted");
        refetchProperties();
      }
      setDeleteConfirm(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete");
    }
  };

  // Handle settings save
  const handleSaveSettings = async () => {
    try {
      for (const [key, value] of Object.entries(editingSettings)) {
        await updateSiteSetting.mutateAsync({ key, value });
      }
      toast.success("Settings saved successfully");
      setEditingSettings({});
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    }
  };

  const statCards = [
    { title: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "text-blue-600" },
    { title: "Total Listings", value: stats?.totalProperties || 0, icon: Home, color: "text-green-600" },
    { title: "Total Bookings", value: stats?.totalBookings || 0, icon: TrendingUp, color: "text-purple-600" },
    { title: "Total Revenue", value: stats?.totalRevenue || 0, icon: DollarSign, color: "text-primary", isPrice: true },
  ];

  return (
    <AppLayout>
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Full control over users, listings, bookings, and platform settings</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold">
                      {statsLoading ? "..." : stat.isPrice ? formatPrice(stat.value as number) : stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full bg-accent ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto w-full justify-start gap-1 p-1">
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="host-verifications">
              <Shield className="h-4 w-4 mr-2" />
              Host Verifications
            </TabsTrigger>
            <TabsTrigger value="property-approvals">
              <Check className="h-4 w-4 mr-2" />
              Property Approvals
            </TabsTrigger>
            <TabsTrigger value="properties">
              <Building className="h-4 w-4 mr-2" />
              Properties
            </TabsTrigger>
            <TabsTrigger value="bookings">
              <Calendar className="h-4 w-4 mr-2" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="amenities">
              <Home className="h-4 w-4 mr-2" />
              Amenities
            </TabsTrigger>
            <TabsTrigger value="locations">
              <TrendingUp className="h-4 w-4 mr-2" />
              Locations
            </TabsTrigger>
            <TabsTrigger value="regions">
              <Compass className="h-4 w-4 mr-2" />
              Discover Kurdistan
            </TabsTrigger>
            <TabsTrigger value="finance">
              <DollarSign className="h-4 w-4 mr-2" />
              Finance
            </TabsTrigger>
            <TabsTrigger value="about">
              <FileText className="h-4 w-4 mr-2" />
              About Us
            </TabsTrigger>
            <TabsTrigger value="contact">
              <FileText className="h-4 w-4 mr-2" />
              Contact Us
            </TabsTrigger>
            <TabsTrigger value="content">
              <FileText className="h-4 w-4 mr-2" />
              Content
            </TabsTrigger>
            <TabsTrigger value="blog">
              <FileText className="h-4 w-4 mr-2" />
              Blog
            </TabsTrigger>
            <TabsTrigger value="newsletters">
              <Mail className="h-4 w-4 mr-2" />
              Newsletters
            </TabsTrigger>
            <TabsTrigger value="insights">
              <TrendingUp className="h-4 w-4 mr-2" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Site Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="blog">
            <AdminBlogManager />
          </TabsContent>

          <TabsContent value="newsletters">
            <AdminNewsletters />
          </TabsContent>

          <TabsContent value="insights">
            <AdminInsights />
          </TabsContent>

          <TabsContent value="host-verifications">
            <AdminHostVerifications />
          </TabsContent>

          <TabsContent value="property-approvals">
            <AdminPropertyApprovals />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <CardTitle>User Management ({filteredUsers.length})</CardTitle>
                  <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search users..." 
                        className="pl-9"
                        value={searchUsers}
                        onChange={(e) => setSearchUsers(e.target.value)}
                      />
                    </div>
                    <Button variant="outline" onClick={() => refetchUsers()}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead>Host</TableHead>
                        <TableHead>Verified</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.full_name || "No name"}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {u.roles.map((role) => (
                                <Badge key={role} variant={role === "admin" ? "default" : "outline"}>
                                  {role}
                                </Badge>
                              ))}
                              {u.is_host && (
                                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700">
                                  host
                                </Badge>
                              )}
                              {u.roles.length === 0 && !u.is_host && <Badge variant="secondary">guest</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={u.is_host ? "default" : "secondary"}>
                              {u.is_host ? "Yes" : "No"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={u.is_verified ? "default" : "secondary"}>
                              {u.is_verified ? "Verified" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditingUser(u)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Roles
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleRoleChange(u.id, "admin", u.roles.includes("admin"))}
                                >
                                  <Shield className="h-4 w-4 mr-2" />
                                  {u.roles.includes("admin") ? "Remove Admin" : "Make Admin"}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => setDeleteConfirm({ type: "user", id: u.id })}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <CardTitle>Property Management ({filteredProperties.length})</CardTitle>
                  <div className="flex gap-2 w-full md:w-auto">
                    <Button onClick={() => navigate("/host/add-listing")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Property
                    </Button>
                    <div className="relative flex-1 md:w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search properties..." 
                        className="pl-9"
                        value={searchProperties}
                        onChange={(e) => setSearchProperties(e.target.value)}
                      />
                    </div>
                    <Button variant="outline" onClick={() => refetchProperties()}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {propertiesLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredProperties.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No properties found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Price/Night</TableHead>
                        <TableHead>Featured</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProperties.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.title}</TableCell>
                          <TableCell>{p.city}</TableCell>
                          <TableCell>{formatPrice(p.price_per_night)}</TableCell>
                          <TableCell>
                            <Badge variant={p.is_featured ? "default" : "secondary"}>
                              {p.is_featured ? "Yes" : "No"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={p.is_active ? "default" : "destructive"}>
                              {p.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>{p.rating?.toFixed(1) || "N/A"}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditingProperty(p)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Property
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => window.open(`/property/${p.id}`, '_blank')}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Property
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => updateProperty.mutate({ 
                                    id: p.id, 
                                    is_featured: !p.is_featured 
                                  })}
                                >
                                  <TrendingUp className="h-4 w-4 mr-2" />
                                  {p.is_featured ? "Remove Featured" : "Make Featured"}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => updateProperty.mutate(
                                    { id: p.id, is_active: !p.is_active },
                                    {
                                      onSuccess: () => toast.success(p.is_active ? "Property deactivated" : "Property activated"),
                                      onError: (e: any) => toast.error(e?.message || "Failed to update"),
                                    }
                                  )}
                                >
                                  {p.is_active ? <X className="h-4 w-4 mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                                  {p.is_active ? "Deactivate" : "Activate"}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => setDeleteConfirm({ type: "property", id: p.id })}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Property
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <CardTitle>Booking Management ({filteredBookings.length})</CardTitle>
                  <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search bookings..." 
                        className="pl-9"
                        value={searchBookings}
                        onChange={(e) => setSearchBookings(e.target.value)}
                      />
                    </div>
                    <Button variant="outline" onClick={() => refetchBookings()}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredBookings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No bookings found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Check-in</TableHead>
                        <TableHead>Check-out</TableHead>
                        <TableHead>Guests</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell className="font-medium">{b.properties?.title || "N/A"}</TableCell>
                          <TableCell>{new Date(b.check_in).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(b.check_out).toLocaleDateString()}</TableCell>
                          <TableCell>{b.guests}</TableCell>
                          <TableCell>{formatPrice(b.total_price)}</TableCell>
                          <TableCell>
                            <Badge variant={
                              b.status === "confirmed" ? "default" :
                              b.status === "pending" ? "secondary" :
                              b.status === "completed" ? "outline" :
                              "destructive"
                            }>
                              {b.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {b.status === "pending" && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleBookingUpdate(b.id, "confirmed")}>
                                      <Check className="h-4 w-4 mr-2" />
                                      Confirm Booking
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleBookingUpdate(b.id, "rejected")}>
                                      <X className="h-4 w-4 mr-2" />
                                      Reject Booking
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {b.status === "confirmed" && (
                                  <DropdownMenuItem onClick={() => handleBookingUpdate(b.id, "completed")}>
                                    <Check className="h-4 w-4 mr-2" />
                                    Mark Completed
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleBookingUpdate(b.id, "cancelled")}>
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel Booking
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Amenities Tab */}
          <TabsContent value="amenities">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle>What This Place Offers</CardTitle>
                    <CardDescription>Manage amenities that hosts can select when adding properties</CardDescription>
                  </div>
                  <div className="relative flex-1 md:w-64 md:flex-none">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search amenities..." 
                      className="pl-9"
                      value={searchAmenities}
                      onChange={(e) => setSearchAmenities(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {(() => {
                  const currentList = normalizeAmenities(
                    getSetting("amenities_list", DEFAULT_AMENITIES)
                  );

                  const saveList = async (list: AmenityItem[]) => {
                    await updateSiteSetting.mutateAsync({ key: "amenities_list", value: list });
                  };

                  const addAmenity = async () => {
                    const name = newAmenity.trim();
                    if (!name) return;
                    if (currentList.some((a) => a.name.toLowerCase() === name.toLowerCase())) {
                      toast.error("Amenity already exists");
                      return;
                    }
                    await saveList([...currentList, { name }]);
                    toast.success(`Added "${name}" to amenities`);
                    setNewAmenity("");
                  };

                  const handleIconFile = async (file: File) => {
                    if (!pendingIconAmenity) return;
                    try {
                      setUploadingIconFor(pendingIconAmenity);
                      const url = await uploadAmenityIcon(file);
                      const updated = currentList.map((a) =>
                        a.name === pendingIconAmenity ? { ...a, icon: url } : a
                      );
                      await saveList(updated);
                      toast.success("Icon updated");
                    } catch (err: any) {
                      toast.error(err.message || "Failed to upload icon");
                    } finally {
                      setUploadingIconFor(null);
                      setPendingIconAmenity(null);
                      if (amenityIconInputRef.current) amenityIconInputRef.current.value = "";
                    }
                  };

                  return (
                    <>
                      <input
                        ref={amenityIconInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleIconFile(file);
                        }}
                      />
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add new amenity (e.g., Swimming Pool)"
                          value={newAmenity}
                          onChange={(e) => setNewAmenity(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") addAmenity();
                          }}
                        />
                        <Button
                          disabled={updateSiteSetting.isPending || !newAmenity.trim()}
                          onClick={addAmenity}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {currentList
                          .filter((a) => a.name.toLowerCase().includes(searchAmenities.toLowerCase()))
                          .map((amenity) => {
                            const isEditing = editingAmenity?.original === amenity.name;
                            return (
                              <div
                                key={amenity.name}
                                className="flex items-center gap-2 p-3 bg-muted rounded-lg"
                              >
                                {/* Icon preview / placeholder */}
                                <div className="h-10 w-10 rounded-lg bg-background border flex items-center justify-center flex-shrink-0 overflow-hidden">
                                  {amenity.icon ? (
                                    <img
                                      src={amenity.icon}
                                      alt={amenity.name}
                                      className="h-8 w-8 object-contain"
                                    />
                                  ) : (
                                    <Image className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>

                                {isEditing ? (
                                  <Input
                                    value={editingAmenity!.updated}
                                    onChange={(e) =>
                                      setEditingAmenity({
                                        ...editingAmenity!,
                                        updated: e.target.value,
                                      })
                                    }
                                    className="h-8 text-sm flex-1"
                                    autoFocus
                                  />
                                ) : (
                                  <span className="text-sm font-medium flex-1 truncate">
                                    {amenity.name}
                                  </span>
                                )}

                                <div className="flex gap-0.5 flex-shrink-0">
                                  {isEditing ? (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={updateSiteSetting.isPending}
                                        onClick={async () => {
                                          const newName = editingAmenity!.updated.trim();
                                          if (newName && newName !== editingAmenity!.original) {
                                            const updated = currentList.map((a) =>
                                              a.name === editingAmenity!.original
                                                ? { ...a, name: newName }
                                                : a
                                            );
                                            await saveList(updated);
                                            toast.success("Amenity updated");
                                          }
                                          setEditingAmenity(null);
                                        }}
                                      >
                                        <Check className="h-4 w-4 text-primary" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingAmenity(null)}
                                      >
                                        <X className="h-4 w-4 text-muted-foreground" />
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        title="Upload icon"
                                        disabled={uploadingIconFor === amenity.name}
                                        onClick={() => {
                                          setPendingIconAmenity(amenity.name);
                                          amenityIconInputRef.current?.click();
                                        }}
                                      >
                                        {uploadingIconFor === amenity.name ? (
                                          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                                        ) : (
                                          <Upload className="h-4 w-4 text-muted-foreground" />
                                        )}
                                      </Button>
                                      {amenity.icon && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          title="Remove icon"
                                          disabled={updateSiteSetting.isPending}
                                          onClick={async () => {
                                            const updated = currentList.map((a) =>
                                              a.name === amenity.name ? { name: a.name } : a
                                            );
                                            await saveList(updated);
                                            toast.success("Icon removed");
                                          }}
                                        >
                                          <X className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        title="Rename"
                                        onClick={() =>
                                          setEditingAmenity({
                                            original: amenity.name,
                                            updated: amenity.name,
                                          })
                                        }
                                      >
                                        <Pencil className="h-4 w-4 text-muted-foreground" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        title="Delete"
                                        disabled={updateSiteSetting.isPending}
                                        onClick={async () => {
                                          const updated = currentList.filter(
                                            (a) => a.name !== amenity.name
                                          );
                                          await saveList(updated);
                                          toast.success(`Removed "${amenity.name}"`);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Locations Tab */}
          <TabsContent value="locations">
            <Card>
              <CardHeader>
                <CardTitle>Property Locations</CardTitle>
                <CardDescription>Manage cities and locations that hosts can select</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-2">
                  <Input
                    placeholder="City name (e.g., Erbil)"
                    value={newLocation.name}
                    onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Region (e.g., Kurdistan)"
                    value={newLocation.region}
                    onChange={(e) => setNewLocation({ ...newLocation, region: e.target.value })}
                    className="flex-1"
                  />
                  <Button 
                    disabled={updateSiteSetting.isPending}
                    onClick={async () => {
                      if (newLocation.name.trim()) {
                        const currentLocations = getSetting("locations_list", [
                          { name: "Erbil", region: "Kurdistan" },
                          { name: "Sulaymaniyah", region: "Kurdistan" },
                          { name: "Duhok", region: "Kurdistan" },
                          { name: "Zakho", region: "Kurdistan" },
                          { name: "Ranya", region: "Kurdistan" },
                          { name: "Haji Omran", region: "Kurdistan" },
                          { name: "Shaqlawa", region: "Kurdistan" },
                          { name: "Soran", region: "Kurdistan" },
                          { name: "Halabja", region: "Kurdistan" },
                          { name: "Koya", region: "Kurdistan" }
                        ]) as { name: string; region: string }[];
                        if (!currentLocations.find(l => l.name === newLocation.name.trim())) {
                          const updatedList = [...currentLocations, { 
                            name: newLocation.name.trim(), 
                            region: newLocation.region.trim() || "Kurdistan" 
                          }];
                          await updateSiteSetting.mutateAsync({ key: "locations_list", value: updatedList });
                          toast.success("Location added");
                          setNewLocation({ name: "", region: "" });
                        }
                      }
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>City</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(getSetting("locations_list", [
                      { name: "Erbil", region: "Kurdistan" },
                      { name: "Sulaymaniyah", region: "Kurdistan" },
                      { name: "Duhok", region: "Kurdistan" },
                      { name: "Zakho", region: "Kurdistan" },
                      { name: "Ranya", region: "Kurdistan" },
                      { name: "Haji Omran", region: "Kurdistan" },
                      { name: "Shaqlawa", region: "Kurdistan" },
                      { name: "Soran", region: "Kurdistan" },
                      { name: "Halabja", region: "Kurdistan" },
                      { name: "Koya", region: "Kurdistan" }
                    ]) as { name: string; region: string }[]).map((location) => (
                      <TableRow key={location.name}>
                        <TableCell className="font-medium">
                          {editingLocation?.original === location.name ? (
                            <Input value={editingLocation.name} className="h-8"
                              onChange={(e) => setEditingLocation({ ...editingLocation, name: e.target.value })} />
                          ) : location.name}
                        </TableCell>
                        <TableCell>
                          {editingLocation?.original === location.name ? (
                            <Input value={editingLocation.region} className="h-8"
                              onChange={(e) => setEditingLocation({ ...editingLocation, region: e.target.value })} />
                          ) : location.region}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {editingLocation?.original === location.name ? (
                              <>
                                <Button variant="ghost" size="sm" disabled={updateSiteSetting.isPending}
                                  onClick={async () => {
                                    if (editingLocation.name.trim()) {
                                      const currentLocations = getSetting("locations_list", []) as { name: string; region: string }[];
                                      const updatedList = currentLocations.map(l =>
                                        l.name === editingLocation.original
                                          ? { name: editingLocation.name.trim(), region: editingLocation.region.trim() || "Kurdistan" }
                                          : l
                                      );
                                      await updateSiteSetting.mutateAsync({ key: "locations_list", value: updatedList });
                                      toast.success("Location updated");
                                    }
                                    setEditingLocation(null);
                                  }}>
                                  <Check className="h-4 w-4 text-primary" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setEditingLocation(null)}>
                                  <X className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button variant="ghost" size="sm"
                                  onClick={() => setEditingLocation({ original: location.name, name: location.name, region: location.region })}>
                                  <Pencil className="h-4 w-4 text-muted-foreground" />
                                </Button>
                                <Button variant="ghost" size="sm"
                                  disabled={updateSiteSetting.isPending}
                                  onClick={async () => {
                                    const currentLocations = getSetting("locations_list", []) as { name: string; region: string }[];
                                    const updatedList = currentLocations.filter(l => l.name !== location.name);
                                    await updateSiteSetting.mutateAsync({ key: "locations_list", value: updatedList });
                                    toast.success("Location removed");
                                  }}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

              </CardContent>
            </Card>
          </TabsContent>

          {/* Discover Kurdistan (Regions) Tab */}
          <TabsContent value="regions">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <CardTitle>Discover Kurdistan Regions</CardTitle>
                    <CardDescription>Manage featured regions displayed on the home page and Discover page</CardDescription>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search regions..." 
                        className="pl-9"
                        value={searchRegions}
                        onChange={(e) => setSearchRegions(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add New Region Form */}
                <div className="p-4 border rounded-lg bg-muted/30">
                  <h4 className="font-medium mb-3">Add New Region</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input
                      placeholder="Region name (e.g., Erbil)"
                      value={newRegion.name}
                      onChange={(e) => setNewRegion({ ...newRegion, name: e.target.value })}
                    />
                    <Input
                      placeholder="Description"
                      value={newRegion.description}
                      onChange={(e) => setNewRegion({ ...newRegion, description: e.target.value })}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        ref={regionImageInputRef}
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              setRegionImageUploading(true);
                              const url = await uploadRegionImage(file);
                              setNewRegion({ ...newRegion, image: url });
                              toast.success("Image uploaded");
                            } catch (err: any) {
                              toast.error("Upload failed: " + err.message);
                            } finally {
                              setRegionImageUploading(false);
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        disabled={regionImageUploading}
                        onClick={() => regionImageInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {regionImageUploading ? "Uploading..." : newRegion.image ? "Change Image" : "Upload Image"}
                      </Button>
                      {newRegion.image && (
                        <img src={newRegion.image} alt="Preview" className="h-10 w-16 object-cover rounded" />
                      )}
                    </div>
                  </div>
                  <Button 
                    className="mt-3"
                    disabled={updateSiteSetting.isPending}
                    onClick={async () => {
                      if (newRegion.name.trim()) {
                        const currentRegions = getSetting("regions_list", []) as { name: string; description: string; image: string }[];
                        if (!currentRegions.find(r => r.name.toLowerCase() === newRegion.name.trim().toLowerCase())) {
                          const updatedList = [...currentRegions, { 
                            name: newRegion.name.trim(), 
                            description: newRegion.description.trim() || `Discover amazing stays in ${newRegion.name.trim()}`,
                            image: newRegion.image.trim() || ""
                          }];
                          await updateSiteSetting.mutateAsync({ key: "regions_list", value: updatedList });
                          toast.success("Region added");
                          setNewRegion({ name: "", description: "", image: "" });
                        } else {
                          toast.error("Region already exists");
                        }
                      }
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Region
                  </Button>
                </div>

                {/* Regions List */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Region Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Image</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(getSetting("regions_list", []) as { name: string; description: string; image: string }[])
                      .filter(region => 
                        region.name.toLowerCase().includes(searchRegions.toLowerCase()) ||
                        region.description?.toLowerCase().includes(searchRegions.toLowerCase())
                      )
                      .map((region) => (
                      <TableRow key={region.name}>
                        <TableCell className="font-medium">{region.name}</TableCell>
                        <TableCell className="max-w-xs truncate">{region.description}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {region.image ? (
                              <img src={region.image} alt={region.name} className="h-10 w-16 object-cover rounded" />
                            ) : (
                              <span className="text-muted-foreground text-sm">No image</span>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const input = document.createElement("input");
                                input.type = "file";
                                input.accept = "image/*";
                                input.onchange = async (e) => {
                                  const file = (e.target as HTMLInputElement).files?.[0];
                                  if (file) {
                                    try {
                                      setRegionImageUploading(true);
                                      const url = await uploadRegionImage(file);
                                      const currentRegions = getSetting("regions_list", []) as { name: string; description: string; image: string }[];
                                      const updatedList = currentRegions.map(r => 
                                        r.name === region.name ? { ...r, image: url } : r
                                      );
                                      await updateSiteSetting.mutateAsync({ key: "regions_list", value: updatedList });
                                      toast.success("Region image updated");
                                    } catch (err: any) {
                                      toast.error("Upload failed: " + err.message);
                                    } finally {
                                      setRegionImageUploading(false);
                                    }
                                  }
                                };
                                input.click();
                              }}
                              disabled={regionImageUploading}
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingRegion(region)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={updateSiteSetting.isPending}
                              onClick={async () => {
                                const currentRegions = getSetting("regions_list", []) as { name: string; description: string; image: string }[];
                                const updatedList = currentRegions.filter(r => r.name !== region.name);
                                await updateSiteSetting.mutateAsync({ key: "regions_list", value: updatedList });
                                toast.success("Region removed");
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(getSetting("regions_list", []) as { name: string; description: string; image: string }[]).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No regions added yet. Add your first region above.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

              </CardContent>
            </Card>
          </TabsContent>

          {/* Finance Tab */}
          <TabsContent value="finance">
            <AdminFinanceReports 
              bookings={bookings || []} 
              commissionRate={getSetting("commission_rate", 10)} 
            />
          </TabsContent>

          {/* About Us Tab */}
          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle>About Us Page Content</CardTitle>
                <CardDescription>Edit the content displayed on the About Us page</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="aboutMission">Mission Statement</Label>
                  <Textarea
                    id="aboutMission"
                    value={getSetting("about_mission", "Meewano was founded with a simple goal: to make finding and booking accommodations in Kurdistan easier than ever. We connect travelers with local hosts, offering authentic experiences while supporting local communities and the tourism industry in the region.")}
                    onChange={(e) => setEditingSettings(prev => ({
                      ...prev,
                      about_mission: e.target.value
                    }))}
                    className="mt-2"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="aboutStory">Our Story</Label>
                  <Textarea
                    id="aboutStory"
                    value={getSetting("about_story", "Meewano began as a vision to showcase the beauty and hospitality of Kurdistan to the world. Our founders recognized the need for a dedicated platform that understands the unique needs of both travelers and local property owners. Today, we're proud to serve thousands of guests and hosts across Erbil, Sulaymaniyah, Duhok, and beyond.")}
                    onChange={(e) => setEditingSettings(prev => ({
                      ...prev,
                      about_story: e.target.value
                    }))}
                    className="mt-2"
                    rows={6}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="aboutValue1">Value 1 - Quality Properties</Label>
                    <Input
                      id="aboutValue1"
                      value={getSetting("about_value_1", "We ensure all listed properties meet our quality standards for your comfort.")}
                      onChange={(e) => setEditingSettings(prev => ({
                        ...prev,
                        about_value_1: e.target.value
                      }))}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="aboutValue2">Value 2 - Community First</Label>
                    <Input
                      id="aboutValue2"
                      value={getSetting("about_value_2", "We support local hosts and communities by promoting sustainable tourism.")}
                      onChange={(e) => setEditingSettings(prev => ({
                        ...prev,
                        about_value_2: e.target.value
                      }))}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="aboutValue3">Value 3 - Hospitality</Label>
                    <Input
                      id="aboutValue3"
                      value={getSetting("about_value_3", "Experience the renowned Kurdish hospitality through our trusted hosts.")}
                      onChange={(e) => setEditingSettings(prev => ({
                        ...prev,
                        about_value_3: e.target.value
                      }))}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="aboutValue4">Value 4 - Trust & Safety</Label>
                    <Input
                      id="aboutValue4"
                      value={getSetting("about_value_4", "Your security is our priority with verified hosts and secure payments.")}
                      onChange={(e) => setEditingSettings(prev => ({
                        ...prev,
                        about_value_4: e.target.value
                      }))}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    onClick={handleSaveSettings}
                    disabled={Object.keys(editingSettings).length === 0 || updateSiteSetting.isPending}
                  >
                    {updateSiteSetting.isPending ? "Saving..." : "Save About Us Content"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Us Tab */}
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Contact Us Page Content</CardTitle>
                <CardDescription>Edit everything shown on the Contact Us page</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="contactTitle">Page Title</Label>
                    <Input
                      id="contactTitle"
                      value={getSetting("contact_title", "Contact Us")}
                      onChange={(e) => setEditingSettings(prev => ({ ...prev, contact_title: e.target.value }))}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactDesc">Page Description</Label>
                    <Input
                      id="contactDesc"
                      value={getSetting("contact_description", "We'd love to hear from you. Get in touch with our team.")}
                      onChange={(e) => setEditingSettings(prev => ({ ...prev, contact_description: e.target.value }))}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactEmail">Email</Label>
                    <Input
                      id="contactEmail"
                      value={getSetting("contact_email", "support@meewano.com")}
                      onChange={(e) => setEditingSettings(prev => ({ ...prev, contact_email: e.target.value }))}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPhone">Phone</Label>
                    <Input
                      id="contactPhone"
                      value={getSetting("contact_phone", "+964 750 123 4567")}
                      onChange={(e) => setEditingSettings(prev => ({ ...prev, contact_phone: e.target.value }))}
                      className="mt-2"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="contactAddress">Office Address</Label>
                    <Textarea
                      id="contactAddress"
                      value={getSetting("contact_address", "Erbil, Kurdistan Region\nIraq")}
                      onChange={(e) => setEditingSettings(prev => ({ ...prev, contact_address: e.target.value }))}
                      className="mt-2"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactHoursWeek">Mon - Fri Hours</Label>
                    <Input
                      id="contactHoursWeek"
                      value={getSetting("contact_hours_weekdays", "9:00 AM - 6:00 PM")}
                      onChange={(e) => setEditingSettings(prev => ({ ...prev, contact_hours_weekdays: e.target.value }))}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactHoursSat">Saturday Hours</Label>
                    <Input
                      id="contactHoursSat"
                      value={getSetting("contact_hours_saturday", "10:00 AM - 4:00 PM")}
                      onChange={(e) => setEditingSettings(prev => ({ ...prev, contact_hours_saturday: e.target.value }))}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactHoursSun">Sunday Hours</Label>
                    <Input
                      id="contactHoursSun"
                      value={getSetting("contact_hours_sunday", "Closed")}
                      onChange={(e) => setEditingSettings(prev => ({ ...prev, contact_hours_sunday: e.target.value }))}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    onClick={handleSaveSettings}
                    disabled={Object.keys(editingSettings).length === 0 || updateSiteSetting.isPending}
                  >
                    {updateSiteSetting.isPending ? "Saving..." : "Save Contact Us Content"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab — Terms, Cancellation, Help */}
          <TabsContent value="content">
            <AdminContentEditor />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
                <CardDescription>Configure global site settings and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="heroTitle">Hero Title (English)</Label>
                    <Input
                      id="heroTitle"
                      value={typeof getSetting("hero_title") === 'object' ? getSetting("hero_title").en : getSetting("hero_title", "Find Your Perfect Stay")}
                      onChange={(e) => setEditingSettings(prev => ({
                        ...prev,
                        hero_title: { 
                          ...(typeof getSetting("hero_title") === 'object' ? getSetting("hero_title") : {}),
                          en: e.target.value 
                        }
                      }))}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="heroSubtitle">Hero Subtitle (English)</Label>
                    <Input
                      id="heroSubtitle"
                      value={typeof getSetting("hero_subtitle") === 'object' ? getSetting("hero_subtitle").en : getSetting("hero_subtitle", "Discover unique homes")}
                      onChange={(e) => setEditingSettings(prev => ({
                        ...prev,
                        hero_subtitle: {
                          ...(typeof getSetting("hero_subtitle") === 'object' ? getSetting("hero_subtitle") : {}),
                          en: e.target.value
                        }
                      }))}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                    <Input
                      id="commissionRate"
                      type="number"
                      step="0.01"
                      value={parseFloat(getSetting("commission_rate", "0.10")) * 100}
                      onChange={(e) => setEditingSettings(prev => ({
                        ...prev,
                        commission_rate: (parseFloat(e.target.value) / 100).toString()
                      }))}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={getSetting("contact_email", "support@meewano.com").replace(/"/g, '')}
                      onChange={(e) => setEditingSettings(prev => ({
                        ...prev,
                        contact_email: `"${e.target.value}"`
                      }))}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      value={getSetting("contact_phone", "+964 750 000 0000").replace(/"/g, '')}
                      onChange={(e) => setEditingSettings(prev => ({
                        ...prev,
                        contact_phone: `"${e.target.value}"`
                      }))}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="exchangeRate">USD to IQD Exchange Rate</Label>
                    <Input
                      id="exchangeRate"
                      type="number"
                      step="1"
                      value={getSetting("usd_to_iqd_rate", 1300)}
                      onChange={(e) => setEditingSettings(prev => ({
                        ...prev,
                        usd_to_iqd_rate: parseInt(e.target.value) || 1300
                      }))}
                      className="mt-2"
                      placeholder="e.g. 1300"
                    />
                    <p className="text-xs text-muted-foreground mt-1">1 USD = {getSetting("usd_to_iqd_rate", 1300)} IQD</p>
                  </div>

                  <div>
                    <Label htmlFor="defaultCurrency">Default Currency</Label>
                    <Select 
                      value={getSetting("default_currency", "USD")}
                      onValueChange={(value) => setEditingSettings(prev => ({
                        ...prev,
                        default_currency: value
                      }))}
                    >
                      <SelectTrigger id="defaultCurrency" className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="IQD">IQD (ع.د)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="defaultLanguage">Default Language</Label>
                    <Select 
                      value={getSetting("default_language", "en")}
                      onValueChange={(value) => setEditingSettings(prev => ({
                        ...prev,
                        default_language: value
                      }))}
                    >
                      <SelectTrigger id="defaultLanguage" className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ku">Kurdish</SelectItem>
                        <SelectItem value="ar">Arabic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    onClick={handleSaveSettings}
                    disabled={Object.keys(editingSettings).length === 0 || updateSiteSetting.isPending}
                  >
                    {updateSiteSetting.isPending ? "Saving..." : "Save Settings"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Property Dialog */}
      <Dialog open={!!editingProperty} onOpenChange={() => setEditingProperty(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
            <DialogDescription>Make changes to the property details</DialogDescription>
          </DialogHeader>
          {editingProperty && (
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={editingProperty.title}
                  onChange={(e) => setEditingProperty({ ...editingProperty, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City</Label>
                  <Input
                    value={editingProperty.city}
                    onChange={(e) => setEditingProperty({ ...editingProperty, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    value={editingProperty.location}
                    onChange={(e) => setEditingProperty({ ...editingProperty, location: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Price/Night</Label>
                  <Input
                    type="number"
                    value={editingProperty.price_per_night}
                    onChange={(e) => setEditingProperty({ ...editingProperty, price_per_night: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Bedrooms</Label>
                  <Input
                    type="number"
                    value={editingProperty.bedrooms}
                    onChange={(e) => setEditingProperty({ ...editingProperty, bedrooms: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Bathrooms</Label>
                  <Input
                    type="number"
                    value={editingProperty.bathrooms}
                    onChange={(e) => setEditingProperty({ ...editingProperty, bathrooms: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editingProperty.description || ""}
                  onChange={(e) => setEditingProperty({ ...editingProperty, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingProperty.is_featured}
                    onCheckedChange={(checked) => setEditingProperty({ ...editingProperty, is_featured: checked })}
                  />
                  <Label>Featured</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingProperty.is_active}
                    onCheckedChange={(checked) => setEditingProperty({ ...editingProperty, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProperty(null)}>Cancel</Button>
            <Button onClick={handlePropertyUpdate} disabled={updateProperty.isPending}>
              {updateProperty.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Property Dialog */}
      <Dialog open={creatingProperty} onOpenChange={(open) => {
        setCreatingProperty(open);
        if (!open) { setNewPropertyImages([]); setNewPropertyPreviews([]); }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Property</DialogTitle>
            <DialogDescription>Add a new property listing with all details</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <Label>Property Name *</Label>
              <Input
                value={newProperty.title}
                onChange={(e) => setNewProperty({ ...newProperty, title: e.target.value })}
                placeholder="e.g., Modern Mountain Villa"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>City *</Label>
                <Select
                  value={newProperty.city}
                  onValueChange={(value) => setNewProperty({ ...newProperty, city: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border z-50">
                    {(getSetting("locations_list", [
                      { name: "Erbil", region: "Kurdistan" },
                      { name: "Sulaymaniyah", region: "Kurdistan" },
                      { name: "Duhok", region: "Kurdistan" },
                    ]) as { name: string; region: string }[]).map((loc) => (
                      <SelectItem key={loc.name} value={loc.name}>
                        {loc.name} ({loc.region})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Address/Location *</Label>
                <Input
                  value={newProperty.location}
                  onChange={(e) => setNewProperty({ ...newProperty, location: e.target.value })}
                  placeholder="e.g., Dream City, Street 10"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Price per Night (USD) *</Label>
              <Input
                type="number"
                value={newProperty.price_per_night}
                onChange={(e) => setNewProperty({ ...newProperty, price_per_night: parseFloat(e.target.value) || 0 })}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Bedrooms</Label>
                <Input type="number" value={newProperty.bedrooms} className="mt-1"
                  onChange={(e) => setNewProperty({ ...newProperty, bedrooms: parseInt(e.target.value) || 1 })} />
              </div>
              <div>
                <Label>Bathrooms</Label>
                <Input type="number" value={newProperty.bathrooms} className="mt-1"
                  onChange={(e) => setNewProperty({ ...newProperty, bathrooms: parseInt(e.target.value) || 1 })} />
              </div>
              <div>
                <Label>Max Guests</Label>
                <Input type="number" value={newProperty.max_guests} className="mt-1"
                  onChange={(e) => setNewProperty({ ...newProperty, max_guests: parseInt(e.target.value) || 2 })} />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={newProperty.description}
                onChange={(e) => setNewProperty({ ...newProperty, description: e.target.value })}
                rows={4}
                placeholder="Describe the property, its features, and what makes it special..."
                className="mt-1"
              />
            </div>

            {/* Map Location Picker */}
            <div>
              <Label className="mb-2 block text-base font-semibold">Pin Location on Map</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Click the map, drag the pin, or search to set the exact spot guests will see.
              </p>
              <LocationPicker
                value={
                  newProperty.latitude != null && newProperty.longitude != null
                    ? { lat: newProperty.latitude, lng: newProperty.longitude }
                    : null
                }
                onChange={(c) =>
                  setNewProperty({ ...newProperty, latitude: c.lat, longitude: c.lng })
                }
                height="380px"
              />
            </div>

            {/* Amenities */}
            <div>
              <Label className="mb-2 block text-base font-semibold">What This Place Offers</Label>
              <p className="text-sm text-muted-foreground mb-3">Select the amenities available</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {normalizeAmenities(
                  getSetting("amenities_list", DEFAULT_AMENITIES)
                ).map((amenity) => (
                  <div key={amenity.name} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-muted/50 transition-colors">
                    <Checkbox
                      id={`new-prop-${amenity.name}`}
                      checked={newProperty.amenities.includes(amenity.name)}
                      onCheckedChange={(checked) => {
                        setNewProperty(prev => ({
                          ...prev,
                          amenities: checked
                            ? [...prev.amenities, amenity.name]
                            : prev.amenities.filter(a => a !== amenity.name)
                        }));
                      }}
                    />
                    {amenity.icon && (
                      <img src={amenity.icon} alt="" className="h-5 w-5 object-contain flex-shrink-0" />
                    )}
                    <Label htmlFor={`new-prop-${amenity.name}`} className="text-sm font-normal cursor-pointer flex-1">
                      {amenity.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <Label className="mb-2 block text-base font-semibold">Property Images</Label>
              <input
                ref={newPropertyFileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files;
                  if (!files) return;
                  const newFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
                  setNewPropertyImages(prev => [...prev, ...newFiles]);
                  newFiles.forEach(file => {
                    const reader = new FileReader();
                    reader.onloadend = () => setNewPropertyPreviews(prev => [...prev, reader.result as string]);
                    reader.readAsDataURL(file);
                  });
                }}
              />
              <div
                className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer"
                onClick={() => newPropertyFileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const files = e.dataTransfer.files;
                  const newFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
                  setNewPropertyImages(prev => [...prev, ...newFiles]);
                  newFiles.forEach(file => {
                    const reader = new FileReader();
                    reader.onloadend = () => setNewPropertyPreviews(prev => [...prev, reader.result as string]);
                    reader.readAsDataURL(file);
                  });
                }}
              >
                <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drag and drop images here, or click to browse
                </p>
              </div>

              {newPropertyPreviews.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                  {newPropertyPreviews.map((preview, index) => (
                    <div key={index} className="relative group rounded-lg overflow-hidden aspect-video">
                      <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setNewPropertyImages(prev => prev.filter((_, i) => i !== index));
                          setNewPropertyPreviews(prev => prev.filter((_, i) => i !== index));
                        }}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={newProperty.is_featured}
                  onCheckedChange={(checked) => setNewProperty({ ...newProperty, is_featured: checked })}
                />
                <Label>Featured</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={newProperty.is_active}
                  onCheckedChange={(checked) => setNewProperty({ ...newProperty, is_active: checked })}
                />
                <Label>Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreatingProperty(false)}>Cancel</Button>
            <Button
              variant="outline"
              onClick={() => {
                setNewProperty(prev => ({ ...prev, is_active: false }));
                handlePropertyCreate();
              }}
              disabled={createProperty.isPending || newPropertyUploading || !newProperty.title || !newProperty.city || !newProperty.location}
            >
              Save as Draft
            </Button>
            <Button
              onClick={handlePropertyCreate}
              disabled={createProperty.isPending || newPropertyUploading || !newProperty.title || !newProperty.city || !newProperty.location}
            >
              {newPropertyUploading ? "Uploading images..." : createProperty.isPending ? "Creating..." : "Publish Property"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Roles</DialogTitle>
            <DialogDescription>Manage roles for {editingUser?.email}</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Admin</Label>
                  <p className="text-sm text-muted-foreground">Full access to all features</p>
                </div>
                <Switch
                  checked={editingUser.roles.includes("admin")}
                  onCheckedChange={() => handleRoleChange(editingUser.id, "admin", editingUser.roles.includes("admin"))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Moderator</Label>
                  <p className="text-sm text-muted-foreground">Can moderate content</p>
                </div>
                <Switch
                  checked={editingUser.roles.includes("moderator")}
                  onCheckedChange={() => handleRoleChange(editingUser.id, "moderator", editingUser.roles.includes("moderator"))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">User</Label>
                  <p className="text-sm text-muted-foreground">Standard user access</p>
                </div>
                <Switch
                  checked={editingUser.roles.includes("user")}
                  onCheckedChange={() => handleRoleChange(editingUser.id, "user", editingUser.roles.includes("user"))}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setEditingUser(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {deleteConfirm?.type}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Region Dialog */}
      <Dialog open={!!editingRegion} onOpenChange={() => setEditingRegion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Region</DialogTitle>
            <DialogDescription>Update the region details</DialogDescription>
          </DialogHeader>
          {editingRegion && (
            <div className="space-y-4">
              <div>
                <Label>Region Name</Label>
                <Input
                  value={editingRegion.name}
                  onChange={(e) => setEditingRegion({ ...editingRegion, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editingRegion.description}
                  onChange={(e) => setEditingRegion({ ...editingRegion, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label>Image URL (optional)</Label>
                <Input
                  value={editingRegion.image}
                  onChange={(e) => setEditingRegion({ ...editingRegion, image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRegion(null)}>Cancel</Button>
            <Button 
              disabled={updateSiteSetting.isPending}
              onClick={async () => {
                if (editingRegion) {
                  const currentRegions = getSetting("regions_list", []) as { name: string; description: string; image: string }[];
                  const updatedRegions = currentRegions.map(r => 
                    r.name === editingRegion.name ? editingRegion : r
                  );
                  await updateSiteSetting.mutateAsync({ key: "regions_list", value: updatedRegions });
                  toast.success("Region updated");
                  setEditingRegion(null);
                }
              }}
            >
              {updateSiteSetting.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </AppLayout>
  );
};

export default AdminDashboard;
