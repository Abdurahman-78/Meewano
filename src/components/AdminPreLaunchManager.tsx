import { useState } from "react";
import {
  Sparkles,
  Home,
  Users,
  Settings,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Download,
  Search,
  ExternalLink,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  MapPin,
  Save,
  Loader2,
  FileText,
  HelpCircle,
  Eye,
  Building,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  usePreLaunchSettings,
  useUpdatePreLaunchSettings,
  usePreLaunchDemoProperties,
  useUpdatePreLaunchDemoProperties,
  usePreLaunchHostSubmissions,
  useUpdatePreLaunchHostStatus,
} from "@/hooks/usePreLaunch";
import { PreLaunchDemoProperty, PreLaunchHostSubmission } from "@/types/preLaunch";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "sonner";
import kurdish1 from "@/assets/property-kurdish-1.jpg";
import kurdish2 from "@/assets/property-kurdish-2.jpg";
import kurdish3 from "@/assets/property-kurdish-3.jpg";
import kurdish4 from "@/assets/property-kurdish-4.jpg";
import kurdish5 from "@/assets/property-kurdish-5.jpg";
import kurdish6 from "@/assets/property-kurdish-6.jpg";
import kurdish7 from "@/assets/property-kurdish-7.jpg";
import kurdish8 from "@/assets/property-kurdish-8.jpg";

export default function AdminPreLaunchManager() {
  const { data: settings, isLoading: settingsLoading } = usePreLaunchSettings();
  const updateSettings = useUpdatePreLaunchSettings();

  const { data: demoProperties = [], isLoading: propsLoading } = usePreLaunchDemoProperties();
  const updateDemoProps = useUpdatePreLaunchDemoProperties();

  const { data: hostLeads = [], isLoading: leadsLoading } = usePreLaunchHostSubmissions();
  const updateHostStatus = useUpdatePreLaunchHostStatus();

  const { formatPrice } = useCurrency();

  // Settings local state
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [badgeText, setBadgeText] = useState("");
  const [targetLaunchDate, setTargetLaunchDate] = useState("");
  const [targetHosts, setTargetHosts] = useState("");
  const [registeredHosts, setRegisteredHosts] = useState("");
  const [citiesCount, setCitiesCount] = useState("");
  const [aboutTitle, setAboutTitle] = useState("");
  const [aboutTagline, setAboutTagline] = useState("");
  const [aboutParagraphs, setAboutParagraphs] = useState<string[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);

  // Sync settings when loaded
  const [isInitialized, setIsInitialized] = useState(false);
  if (settings && !isInitialized) {
    setHeroTitle(settings.hero_title || "");
    setHeroSubtitle(settings.hero_subtitle || "");
    setBadgeText(settings.badge_text || "");
    setTargetLaunchDate(settings.target_launch_date ? settings.target_launch_date.substring(0, 10) : "2026-10-15");
    setTargetHosts(settings.target_hosts_count?.toString() || "500");
    setRegisteredHosts(settings.registered_hosts_count?.toString() || "342");
    setCitiesCount(settings.cities_count?.toString() || "16");
    setAboutTitle(settings.about_title || "");
    setAboutTagline(settings.about_tagline || "");
    setAboutParagraphs(settings.about_paragraphs || []);
    setFaqs(settings.faqs || []);
    setIsInitialized(true);
  }

  // Demo Property Form Dialog state
  const [isPropDialogOpen, setIsPropDialogOpen] = useState(false);
  const [editingProp, setEditingProp] = useState<PreLaunchDemoProperty | null>(null);
  const [propTitle, setPropTitle] = useState("");
  const [propLocation, setPropLocation] = useState("");
  const [propCity, setPropCity] = useState("Erbil");
  const [propPrice, setPropPrice] = useState("180000");
  const [propBedrooms, setPropBedrooms] = useState("2");
  const [propBathrooms, setPropBathrooms] = useState("2");
  const [propGuests, setPropGuests] = useState("4");
  const [propRating, setPropRating] = useState("4.95");
  const [propReviews, setPropReviews] = useState("32");
  const [propBadges, setPropBadges] = useState("");
  const [propDesc, setPropDesc] = useState("");
  const [propImage, setPropImage] = useState(kurdish1);
  const [propHost, setPropHost] = useState("");
  const [propIsActive, setPropIsActive] = useState(true);

  // Host Lead Detail Dialog state
  const [selectedLead, setSelectedLead] = useState<PreLaunchHostSubmission | null>(null);
  const [leadStatus, setLeadStatus] = useState<PreLaunchHostSubmission["status"]>("pending");
  const [leadAdminNotes, setLeadAdminNotes] = useState("");

  // Search & Filters for host leads
  const [searchLeadQuery, setSearchLeadQuery] = useState("");
  const [filterCity, setFilterCity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const handleSaveSettings = async () => {
    try {
      await updateSettings.mutateAsync({
        hero_title: heroTitle,
        hero_subtitle: heroSubtitle,
        badge_text: badgeText,
        target_launch_date: targetLaunchDate ? new Date(targetLaunchDate).toISOString() : new Date().toISOString(),
        target_hosts_count: parseInt(targetHosts) || 500,
        registered_hosts_count: parseInt(registeredHosts) || 0,
        cities_count: parseInt(citiesCount) || 16,
        about_title: aboutTitle,
        about_tagline: aboutTagline,
        about_paragraphs: aboutParagraphs,
        faqs: faqs,
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleOpenAddPropDialog = () => {
    setEditingProp(null);
    setPropTitle("");
    setPropLocation("");
    setPropCity("Erbil");
    setPropPrice("180000");
    setPropBedrooms("2");
    setPropBathrooms("2");
    setPropGuests("4");
    setPropRating("4.95");
    setPropReviews("24");
    setPropBadges("Mountain View, Pool, 24/7 Power");
    setPropDesc("");
    setPropImage(kurdish1);
    setPropHost("Host Name");
    setPropIsActive(true);
    setIsPropDialogOpen(true);
  };

  const handleOpenEditPropDialog = (prop: PreLaunchDemoProperty) => {
    setEditingProp(prop);
    setPropTitle(prop.title);
    setPropLocation(prop.location);
    setPropCity(prop.city);
    setPropPrice(prop.price_per_night.toString());
    setPropBedrooms(prop.bedrooms.toString());
    setPropBathrooms(prop.bathrooms.toString());
    setPropGuests(prop.max_guests.toString());
    setPropRating(prop.rating?.toString() || "4.95");
    setPropReviews(prop.reviews_count?.toString() || "20");
    setPropBadges((prop.badges || []).join(", "));
    setPropDesc(prop.description);
    setPropImage(prop.image);
    setPropHost(prop.host_name);
    setPropIsActive(prop.is_active !== false);
    setIsPropDialogOpen(true);
  };

  const handleSaveDemoProp = async () => {
    if (!propTitle.trim() || !propLocation.trim()) {
      toast.error("Please provide title and location");
      return;
    }

    const badgeArray = propBadges
      .split(",")
      .map((b) => b.trim())
      .filter(Boolean);

    const propData: PreLaunchDemoProperty = {
      id: editingProp ? editingProp.id : `demo-${Date.now()}`,
      title: propTitle.trim(),
      location: propLocation.trim(),
      city: propCity,
      price_per_night: parseFloat(propPrice) || 150000,
      bedrooms: parseInt(propBedrooms) || 1,
      bathrooms: parseInt(propBathrooms) || 1,
      max_guests: parseInt(propGuests) || 2,
      rating: parseFloat(propRating) || 4.95,
      reviews_count: parseInt(propReviews) || 10,
      badges: badgeArray,
      description: propDesc.trim(),
      image: propImage,
      host_name: propHost.trim() || "Kurdish Host",
      is_active: propIsActive,
      order: editingProp?.order || demoProperties.length + 1,
    };

    let updatedList: PreLaunchDemoProperty[];
    if (editingProp) {
      updatedList = demoProperties.map((p) => (p.id === editingProp.id ? propData : p));
    } else {
      updatedList = [...demoProperties, propData];
    }

    await updateDemoProps.mutateAsync(updatedList);
    setIsPropDialogOpen(false);
  };

  const handleDeleteDemoProp = async (id: string) => {
    if (confirm("Are you sure you want to delete this Kurdistan demo property?")) {
      const updatedList = demoProperties.filter((p) => p.id !== id);
      await updateDemoProps.mutateAsync(updatedList);
    }
  };

  const handleTogglePropActive = async (prop: PreLaunchDemoProperty) => {
    const updatedList = demoProperties.map((p) =>
      p.id === prop.id ? { ...p, is_active: !p.is_active } : p
    );
    await updateDemoProps.mutateAsync(updatedList);
  };

  const handleOpenLeadDetails = (lead: PreLaunchHostSubmission) => {
    setSelectedLead(lead);
    setLeadStatus(lead.status || "pending");
    setLeadAdminNotes(lead.admin_notes || "");
  };

  const handleSaveLeadStatus = async () => {
    if (!selectedLead) return;
    await updateHostStatus.mutateAsync({
      id: selectedLead.id,
      status: leadStatus,
      admin_notes: leadAdminNotes,
    });
    setSelectedLead(null);
  };

  const exportLeadsCsv = () => {
    if (hostLeads.length === 0) {
      toast.error("No host leads to export");
      return;
    }

    const headers = [
      "ID",
      "Full Name",
      "Email",
      "Phone",
      "City",
      "Property Type",
      "Bedrooms",
      "Max Guests",
      "Experience",
      "Status",
      "Created At",
      "Notes",
      "Admin Notes",
    ];

    const rows = hostLeads.map((lead) => [
      lead.id,
      `"${lead.full_name?.replace(/"/g, '""')}"`,
      `"${lead.email}"`,
      `"${lead.phone}"`,
      `"${lead.city}"`,
      `"${lead.property_type}"`,
      lead.bedrooms,
      lead.max_guests,
      `"${lead.experience}"`,
      lead.status,
      lead.created_at,
      `"${(lead.notes || "").replace(/"/g, '""')}"`,
      `"${(lead.admin_notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `meewan_prelaunch_hosts_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export downloaded");
  };

  // Filtered Leads
  const filteredLeads = hostLeads.filter((lead) => {
    const matchesSearch =
      searchLeadQuery === "" ||
      lead.full_name?.toLowerCase().includes(searchLeadQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchLeadQuery.toLowerCase()) ||
      lead.phone?.includes(searchLeadQuery);

    const matchesCity = filterCity === "all" || lead.city === filterCity;
    const matchesStatus = filterStatus === "all" || lead.status === filterStatus;

    return matchesSearch && matchesCity && matchesStatus;
  });

  const availableImages = [
    { label: "Mountain Chalet 1", value: kurdish1 },
    { label: "City Penthouse", value: kurdish4 },
    { label: "Lakefront Villa", value: kurdish3 },
    { label: "Historic Stone House", value: kurdish8 },
    { label: "Pine Cabin", value: kurdish5 },
    { label: "Resort Villa", value: kurdish2 },
    { label: "Skyline Villa", value: kurdish7 },
    { label: "Traditional Courtyard", value: kurdish6 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/10 via-card to-card">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl font-bold">
                Pre-Launch Control Center
              </CardTitle>
            </div>
            <CardDescription className="text-xs mt-1">
              Manage Kurdistan Pre-Launch landing page copy, Kurdistan showcase demo properties, and registered host leads.
            </CardDescription>
          </div>

          <a href="/pre-launch" target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm" className="gap-1.5 border-primary/30 text-primary">
              <Eye className="h-4 w-4" />
              View Pre-Launch Page
              <ExternalLink className="h-3 w-3" />
            </Button>
          </a>
        </CardHeader>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="leads" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full md:w-auto">
          <TabsTrigger value="leads" className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-primary" />
            <span>Pre-Registered Hosts ({hostLeads.length})</span>
          </TabsTrigger>
          <TabsTrigger value="properties" className="flex items-center gap-1.5">
            <Home className="h-4 w-4 text-amber-500" />
            <span>Kurdistan Demo Properties ({demoProperties.length})</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-1.5">
            <Settings className="h-4 w-4 text-sky-500" />
            <span>Page Content & Copy</span>
          </TabsTrigger>
        </TabsList>

        {/* 1. Pre-Registered Hosts Lead List Tab */}
        <TabsContent value="leads" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold">
                    Host Pre-Registrations
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Homeowners and hosts in Kurdistan who registered early during pre-launch.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportLeadsCsv}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export CSV
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search name, email, phone..."
                    value={searchLeadQuery}
                    onChange={(e) => setSearchLeadQuery(e.target.value)}
                    className="pl-8 text-xs h-9"
                  />
                </div>

                <Select value={filterCity} onValueChange={setFilterCity}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Kurdistan Cities</SelectItem>
                    <SelectItem value="Erbil">Erbil</SelectItem>
                    <SelectItem value="Sulaymaniyah">Sulaymaniyah</SelectItem>
                    <SelectItem value="Duhok">Duhok</SelectItem>
                    <SelectItem value="Rawanduz">Rawanduz</SelectItem>
                    <SelectItem value="Shaqlawa">Shaqlawa</SelectItem>
                    <SelectItem value="Soran">Soran</SelectItem>
                    <SelectItem value="Halabja">Halabja</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="approved">Approved / Verified</SelectItem>
                    <SelectItem value="rejected">Declined</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent>
              {filteredLeads.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-xl text-muted-foreground text-sm">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No host leads found matching your criteria.
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Host</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Experience</TableHead>
                        <TableHead>Registered</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeads.map((lead) => (
                        <TableRow key={lead.id} className="hover:bg-muted/40">
                          <TableCell>
                            <div className="font-semibold text-sm">{lead.full_name}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {lead.phone}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {lead.email}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge variant="outline" className="text-xs font-medium">
                              <MapPin className="h-3 w-3 mr-1 text-primary" />
                              {lead.city}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <div className="text-xs font-medium">{lead.property_type}</div>
                            <div className="text-[11px] text-muted-foreground">
                              {lead.bedrooms} bed(s) • {lead.max_guests} guests
                            </div>
                          </TableCell>

                          <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">
                            {lead.experience}
                          </TableCell>

                          <TableCell className="text-xs text-muted-foreground">
                            {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : "Recently"}
                          </TableCell>

                          <TableCell>
                            <Badge
                              className={`text-[11px] uppercase font-bold ${
                                lead.status === "approved"
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                  : lead.status === "contacted"
                                  ? "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30"
                                  : lead.status === "rejected"
                                  ? "bg-destructive/15 text-destructive border border-destructive/30"
                                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                              }`}
                            >
                              {lead.status || "pending"}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-8"
                              onClick={() => handleOpenLeadDetails(lead)}
                            >
                              Manage &rarr;
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. Demo Properties Management Tab */}
        <TabsContent value="properties" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg font-bold">
                  Kurdistan Showcase Properties
                </CardTitle>
                <CardDescription className="text-xs">
                  These demo prototype listings are displayed on the Pre-Launch landing page to inspire early hosts.
                </CardDescription>
              </div>

              <Button
                size="sm"
                onClick={handleOpenAddPropDialog}
                className="gap-1.5 bg-primary hover:bg-primary/90 text-white font-semibold shadow-sm shadow-primary/20"
              >
                <Plus className="h-4 w-4" />
                Add Demo Listing
              </Button>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {demoProperties.map((prop) => (
                  <Card key={prop.id} className="overflow-hidden border group">
                    <div className="relative aspect-video bg-muted overflow-hidden">
                      <img
                        src={prop.image}
                        alt={prop.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute top-2 left-2 flex gap-1">
                        <Badge className="bg-background/90 text-foreground text-[10px]">
                          {prop.city}
                        </Badge>
                        {prop.is_active === false && (
                          <Badge variant="destructive" className="text-[10px]">
                            Hidden
                          </Badge>
                        )}
                      </div>
                      <div className="absolute bottom-2 right-2 bg-background/90 px-2 py-0.5 rounded text-xs font-bold">
                        {formatPrice(prop.price_per_night)}/night
                      </div>
                    </div>

                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h4 className="font-bold text-sm line-clamp-1">{prop.title}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-primary" />
                          {prop.location}
                        </p>
                      </div>

                      <div className="text-xs text-muted-foreground flex items-center gap-3">
                        <span>{prop.bedrooms} beds</span>
                        <span>•</span>
                        <span>{prop.bathrooms} baths</span>
                        <span>•</span>
                        <span>{prop.max_guests} max guests</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={prop.is_active !== false}
                            onCheckedChange={() => handleTogglePropActive(prop)}
                          />
                          <span className="text-[11px] text-muted-foreground">
                            {prop.is_active !== false ? "Visible" : "Hidden"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenEditPropDialog(prop)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteDemoProp(prop.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Page Content & Copy Editor Tab */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg font-bold">
                  Pre-Launch Page Content Editor
                </CardTitle>
                <CardDescription className="text-xs">
                  Modify hero headlines, target launch dates, "What is Meewan" story, and FAQs.
                </CardDescription>
              </div>

              <Button
                onClick={handleSaveSettings}
                disabled={updateSettings.isPending}
                className="gap-2 bg-primary hover:bg-primary/90 text-white font-semibold shadow-sm shadow-primary/20"
              >
                {updateSettings.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save All Content
              </Button>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Hero Settings */}
              <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Hero Section Settings
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label className="text-xs">Badge Tag Text</Label>
                    <Input
                      value={badgeText}
                      onChange={(e) => setBadgeText(e.target.value)}
                      className="mt-1 text-xs"
                      placeholder="e.g. Exclusive Pre-Launch • Become a Pioneer Founding Host"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-xs">Hero Headline</Label>
                    <Input
                      value={heroTitle}
                      onChange={(e) => setHeroTitle(e.target.value)}
                      className="mt-1 font-semibold"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-xs">Hero Subtitle</Label>
                    <Textarea
                      value={heroSubtitle}
                      onChange={(e) => setHeroSubtitle(e.target.value)}
                      className="mt-1 text-xs min-h-[70px]"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Target Launch Date (Countdown)</Label>
                    <Input
                      type="date"
                      value={targetLaunchDate}
                      onChange={(e) => setTargetLaunchDate(e.target.value)}
                      className="mt-1 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Host Target</Label>
                      <Input
                        type="number"
                        value={targetHosts}
                        onChange={(e) => setTargetHosts(e.target.value)}
                        className="mt-1 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Pre-Registered</Label>
                      <Input
                        type="number"
                        value={registeredHosts}
                        onChange={(e) => setRegisteredHosts(e.target.value)}
                        className="mt-1 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Cities</Label>
                      <Input
                        type="number"
                        value={citiesCount}
                        onChange={(e) => setCitiesCount(e.target.value)}
                        className="mt-1 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* What is Meewan Section */}
              <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-sky-500" />
                  What is Meewan? (About Us Section)
                </h4>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Section Heading</Label>
                    <Input
                      value={aboutTitle}
                      onChange={(e) => setAboutTitle(e.target.value)}
                      className="mt-1 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Tagline / Mission</Label>
                    <Input
                      value={aboutTagline}
                      onChange={(e) => setAboutTagline(e.target.value)}
                      className="mt-1 text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Story Paragraphs</Label>
                    {aboutParagraphs.map((para, index) => (
                      <Textarea
                        key={index}
                        value={para}
                        onChange={(e) => {
                          const updated = [...aboutParagraphs];
                          updated[index] = e.target.value;
                          setAboutParagraphs(updated);
                        }}
                        className="text-xs min-h-[70px]"
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* FAQs Section */}
              <div className="space-y-4 p-4 rounded-xl border bg-muted/20">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-amber-500" />
                    Frequently Asked Questions
                  </h4>

                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    onClick={() =>
                      setFaqs([
                        ...faqs,
                        {
                          id: `faq-${Date.now()}`,
                          question: "New FAQ Question?",
                          answer: "Detailed answer explaining the policy.",
                        },
                      ])
                    }
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add FAQ
                  </Button>
                </div>

                <div className="space-y-3">
                  {faqs.map((faq, index) => (
                    <div key={faq.id || index} className="p-3 rounded-lg border bg-card space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Input
                          value={faq.question}
                          onChange={(e) => {
                            const updated = [...faqs];
                            updated[index].question = e.target.value;
                            setFaqs(updated);
                          }}
                          placeholder="Question"
                          className="text-xs font-semibold"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive shrink-0"
                          onClick={() => {
                            setFaqs(faqs.filter((_, i) => i !== index));
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Textarea
                        value={faq.answer}
                        onChange={(e) => {
                          const updated = [...faqs];
                          updated[index].answer = e.target.value;
                          setFaqs(updated);
                        }}
                        placeholder="Answer"
                        className="text-xs min-h-[60px]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  onClick={handleSaveSettings}
                  disabled={updateSettings.isPending}
                  className="gap-2 bg-primary hover:bg-primary/90 text-white font-semibold h-11 px-6 shadow-sm shadow-primary/20"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Demo Property Add/Edit Dialog */}
      <Dialog open={isPropDialogOpen} onOpenChange={setIsPropDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProp ? "Edit Kurdistan Demo Listing" : "Add Kurdistan Demo Listing"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure details, photos, and features for this pre-launch demo property.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label className="text-xs">Listing Title *</Label>
                <Input
                  value={propTitle}
                  onChange={(e) => setPropTitle(e.target.value)}
                  placeholder="e.g. Gali Ali Bag Alpine Valley Chalet"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">City / Region *</Label>
                <Select value={propCity} onValueChange={setPropCity}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Erbil">Erbil</SelectItem>
                    <SelectItem value="Sulaymaniyah">Sulaymaniyah</SelectItem>
                    <SelectItem value="Duhok">Duhok</SelectItem>
                    <SelectItem value="Rawanduz">Rawanduz</SelectItem>
                    <SelectItem value="Shaqlawa">Shaqlawa</SelectItem>
                    <SelectItem value="Soran">Soran</SelectItem>
                    <SelectItem value="Halabja">Halabja</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Exact Location / Neighborhood</Label>
                <Input
                  value={propLocation}
                  onChange={(e) => setPropLocation(e.target.value)}
                  placeholder="e.g. Rawanduz Canyon Overlook"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Nightly Rate (IQD)</Label>
                <Input
                  type="number"
                  value={propPrice}
                  onChange={(e) => setPropPrice(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Host Display Name</Label>
                <Input
                  value={propHost}
                  onChange={(e) => setPropHost(e.target.value)}
                  placeholder="e.g. Kak Shwan H."
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 md:col-span-2">
                <div>
                  <Label className="text-xs">Bedrooms</Label>
                  <Input
                    type="number"
                    value={propBedrooms}
                    onChange={(e) => setPropBedrooms(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Bathrooms</Label>
                  <Input
                    type="number"
                    value={propBathrooms}
                    onChange={(e) => setPropBathrooms(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Max Guests</Label>
                  <Input
                    type="number"
                    value={propGuests}
                    onChange={(e) => setPropGuests(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <Label className="text-xs">Badges / Feature Chips (Comma-separated)</Label>
                <Input
                  value={propBadges}
                  onChange={(e) => setPropBadges(e.target.value)}
                  placeholder="Mountain Panorama, Stone Fireplace, Private Pool"
                  className="mt-1"
                />
              </div>

              <div className="md:col-span-2">
                <Label className="text-xs">Listing Image</Label>
                <Select value={propImage} onValueChange={setPropImage}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableImages.map((img, idx) => (
                      <SelectItem key={idx} value={img.value}>
                        {img.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="mt-2 aspect-video rounded-lg overflow-hidden border max-h-40">
                  <img src={propImage} alt="Preview" className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="md:col-span-2">
                <Label className="text-xs">Description</Label>
                <Textarea
                  value={propDesc}
                  onChange={(e) => setPropDesc(e.target.value)}
                  placeholder="Describe the property ambiance, views, and amenities..."
                  className="mt-1 min-h-[80px]"
                />
              </div>

              <div className="flex items-center gap-2 md:col-span-2">
                <Switch
                  checked={propIsActive}
                  onCheckedChange={setPropIsActive}
                />
                <Label className="text-xs">Display on Pre-Launch landing page</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPropDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveDemoProp}
              className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-sm shadow-primary/20"
            >
              Save Demo Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Host Lead Detail & Action Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        {selectedLead && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                Host Lead: {selectedLead.full_name}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Pre-registered on{" "}
                {selectedLead.created_at
                  ? new Date(selectedLead.created_at).toLocaleString()
                  : "N/A"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 rounded-lg bg-muted/40 space-y-2 border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <a
                    href={`tel:${selectedLead.phone}`}
                    className="font-semibold text-primary hover:underline"
                  >
                    {selectedLead.phone}
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <a
                    href={`mailto:${selectedLead.email}`}
                    className="font-semibold text-primary hover:underline"
                  >
                    {selectedLead.email}
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">City:</span>
                  <span className="font-semibold">{selectedLead.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Property Type:</span>
                  <span className="font-semibold">{selectedLead.property_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Capacity:</span>
                  <span className="font-semibold">
                    {selectedLead.bedrooms} bed(s) • {selectedLead.max_guests} guests
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Experience:</span>
                  <span className="font-semibold">{selectedLead.experience}</span>
                </div>
              </div>

              {selectedLead.notes && (
                <div className="p-3 rounded-lg bg-muted/20 border">
                  <span className="font-semibold block mb-1">Host Notes:</span>
                  <p className="text-muted-foreground italic">"{selectedLead.notes}"</p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs">Update Status</Label>
                <Select
                  value={leadStatus}
                  onValueChange={(val: any) => setLeadStatus(val)}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending Review</SelectItem>
                    <SelectItem value="contacted">Contacted via WhatsApp/Phone</SelectItem>
                    <SelectItem value="approved">Approved & Verified</SelectItem>
                    <SelectItem value="rejected">Declined</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Internal Admin Notes</Label>
                <Textarea
                  value={leadAdminNotes}
                  onChange={(e) => setLeadAdminNotes(e.target.value)}
                  placeholder="e.g. Spoke on WhatsApp, photographer scheduled for Sunday..."
                  className="text-xs min-h-[70px]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <a
                  href={`https://wa.me/${selectedLead.phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" className="w-full text-xs font-semibold gap-1.5 border-primary/40 text-primary hover:bg-primary/10">
                    <Phone className="h-3.5 w-3.5" />
                    Open WhatsApp
                  </Button>
                </a>
                <Button
                  onClick={handleSaveLeadStatus}
                  className="flex-1 text-xs font-semibold bg-primary text-primary-foreground"
                >
                  Save Status
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
