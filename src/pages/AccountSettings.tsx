import { useState, useEffect, useRef } from "react";
import { Mail, Phone, Lock, Loader2, Upload, Image as ImageIcon, Smile } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AvatarIconPicker, { renderAvatarIcon, buildIconAvatarValue, isIconAvatar } from "@/components/AvatarIconPicker";
import PhoneVerification from "@/components/PhoneVerification";

interface Profile {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
}

const AccountSettings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile>({
    full_name: null,
    email: null,
    phone: null,
    avatar_url: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const isPhotoAvatar = !!profile.avatar_url && !isIconAvatar(profile.avatar_url);

  const handleAvatarFile = async (file: File | undefined) => {
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = urlData.publicUrl;
      const { error: updErr } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);
      if (updErr) throw updErr;
      setProfile((p) => ({ ...p, avatar_url: publicUrl }));
      toast.success("Profile photo updated");
    } catch (e: any) {
      console.error("Avatar upload failed:", e);
      toast.error(e.message || "Could not upload photo");
    } finally {
      setUploadingAvatar(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      fetchProfile();
    }
  }, [user, authLoading, navigate]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email, phone, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        // Default to icon avatar if none set
        setProfile({
          ...data,
          avatar_url: data.avatar_url ?? buildIconAvatarValue("user"),
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          phone: profile.phone,
          avatar_url: profile.avatar_url,
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwords.current) {
      toast.error("Please enter your current password");
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwords.new.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (passwords.new === passwords.current) {
      toast.error("New password must be different from your current one");
      return;
    }
    if (!user?.email) {
      toast.error("Missing user email");
      return;
    }

    setSaving(true);
    try {
      // Verify the current password by attempting a sign-in.
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwords.current,
      });
      if (verifyError) {
        toast.error("Current password is incorrect");
        setSaving(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: passwords.new,
      });

      if (error) throw error;
      toast.success("Password updated successfully");
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <AppLayout>
        <main className="flex-1 container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Account Settings</h1>

        <Tabs defaultValue="profile" className="w-full max-w-3xl">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Pick an avatar icon and update your contact details</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  {/* Avatar preview */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 border-2 border-primary">
                      {isPhotoAvatar && <AvatarImage src={profile.avatar_url!} alt="Profile" />}
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {renderAvatarIcon(profile.avatar_url, "h-9 w-9")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">Your avatar</p>
                      <p className="text-sm text-muted-foreground">Upload a photo or pick a fun icon</p>
                    </div>
                  </div>

                  {/* Avatar chooser: photo upload OR icon */}
                  <Tabs defaultValue={isPhotoAvatar ? "photo" : "icon"} className="w-full">
                    <TabsList className="grid w-full max-w-sm grid-cols-2">
                      <TabsTrigger value="photo">
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Upload Photo
                      </TabsTrigger>
                      <TabsTrigger value="icon">
                        <Smile className="h-4 w-4 mr-2" />
                        Choose Icon
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="photo" className="space-y-3 pt-3">
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleAvatarFile(e.target.files?.[0])}
                      />
                      <div
                        className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer"
                        onClick={() => avatarInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleAvatarFile(e.dataTransfer.files?.[0]);
                        }}
                      >
                        {uploadingAvatar ? (
                          <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
                        ) : (
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        )}
                        <p className="text-sm text-muted-foreground">
                          {uploadingAvatar ? "Uploading…" : "Click or drag to upload (max 5MB)"}
                        </p>
                      </div>
                      {isPhotoAvatar && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setProfile({ ...profile, avatar_url: buildIconAvatarValue("user") })
                          }
                        >
                          Remove photo & use an icon
                        </Button>
                      )}
                    </TabsContent>

                    <TabsContent value="icon" className="space-y-2 pt-3">
                      <Label>Choose Avatar Icon</Label>
                      <AvatarIconPicker
                        value={profile.avatar_url}
                        onChange={(newValue) => setProfile({ ...profile, avatar_url: newValue })}
                      />
                    </TabsContent>
                  </Tabs>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={user?.email || ""}
                        className="pl-10 bg-muted"
                        disabled
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        placeholder="+964 750 123 4567"
                        className="pl-10"
                        value={profile.phone || ""}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="mt-6">
              <PhoneVerification />
            </div>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Password & Security</CardTitle>
                <CardDescription>Confirm your current password before setting a new one</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="current-password"
                        type="password"
                        className="pl-10"
                        value={passwords.current}
                        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="new-password"
                        type="password"
                        className="pl-10"
                        value={passwords.new}
                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type="password"
                        className="pl-10"
                        value={passwords.confirm}
                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Update Password
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </AppLayout>
  );
};

export default AccountSettings;
