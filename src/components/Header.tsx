import {
  Globe,
  User,
  LogIn,
  Home,
  MessageSquare,
  Settings,
  Heart,
  LogOut,
  Shield,
  Building2,
  Info,
  Map,
  Compass,
  Sparkles,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useMyHostVerification } from "@/hooks/useHostVerification";
import { usePreLaunch } from "@/contexts/PreLaunchContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import NotificationBell from "@/components/NotificationBell";
import MobileMenu from "@/components/MobileMenu";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Header = () => {
  const { language, setLanguage } = useLanguage();
  const { mode, openAddPropertyModal } = usePreLaunch();

  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const { data: hostVerification } = useMyHostVerification();
  const isVerifiedHost = !!user && hostVerification?.status === "approved";
  const hostCtaTo = !user ? "/become-host" : isVerifiedHost ? "/host/add-listing" : "/host/verification";
  const navigate = useNavigate();

  const isPreLaunch = mode === "pre-launch";

  const { data: hostPropertiesCount = 0 } = useQuery({
    queryKey: ["host-property-count", user?.id],
    enabled: !!user && isVerifiedHost && !isPreLaunch,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("properties")
        .select("*", { count: "exact", head: true })
        .eq("host_id", user!.id);
      if (error) throw error;
      return count ?? 0;
    },
  });
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const showListingDot = isVerifiedHost && hostPropertiesCount === 0;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card shadow-xs">
      <div className="w-full px-4 md:px-8 py-2 md:py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-6">
          <MobileMenu />
          <Link to="/" className="flex items-center gap-2">
            <img src="/favicon.png" alt="Meewano" className="h-8 w-auto md:h-9" />
            {isPreLaunch && (
              <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <Sparkles className="h-3 w-3" />
                Pre-Launch
              </span>
            )}
          </Link>

          {/* Navigation Links: HIDE in Pre-Launch Mode */}
          {!isPreLaunch && (
            <nav className="hidden md:flex items-center gap-4">
              <Link
                to="/search"
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                <Building2 className="h-4 w-4" />
                {t("navProperties")}
              </Link>
              <Link
                to="/discover"
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                <Compass className="h-4 w-4" />
                {t("navDiscover")}
              </Link>
              <Link
                to="/map"
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                <Map className="h-4 w-4" />
                {t("navMap")}
              </Link>
            </nav>
          )}

          {/* In Pre-Launch Mode, quick anchor links to informational sections */}
          {isPreLaunch && (
            <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-muted-foreground">
              <a
                href="#what-is-meewano"
                className="hover:text-primary transition-colors"
              >
                What is Meewano?
              </a>
              <a
                href="#about-us"
                className="hover:text-primary transition-colors"
              >
                About Us
              </a>
              <a
                href="#host-faq"
                className="hover:text-primary transition-colors"
              >
                Host FAQ
              </a>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-1 md:gap-3">
          {/* Highlighted Call-To-Action Button in Pre-Launch vs Live */}
          {isPreLaunch ? (
            <Link to={user ? "/host" : "/become-host"}>
              <Button
                id="header-prelaunch-become-host-btn"
                size="sm"
                className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 py-1.5 text-xs sm:text-sm shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 border border-primary/20"
              >
                <Sparkles className="h-4 w-4" />
                <span>{user ? "Host Dashboard" : "Become a Host"}</span>
              </Button>
            </Link>
          ) : (
            <Link to={hostCtaTo} className="hidden md:block relative">
              <Button variant="ghost" size="sm" className="rounded-full font-semibold hover:bg-accent relative">
                <Home className="h-4 w-4 mr-1.5" />
                {isVerifiedHost ? "List your property" : "Become host"}
                {showListingDot && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
                )}
              </Button>
            </Link>
          )}

          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Globe className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => setLanguage("en")} className={language === "en" ? "bg-accent" : ""}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("ar")} className={language === "ar" ? "bg-accent" : ""}>
                العربية
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("ku")} className={language === "ku" ? "bg-accent" : ""}>
                کوردی
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="hidden md:block">
            <ThemeToggle />
          </div>

          {!isPreLaunch && user && <NotificationBell />}

          {/* Auth Button or User Profile */}
          {user ? (
            <Link to="/host" className="hidden md:block">
              <Button variant="ghost" size="sm" className="rounded-full font-medium">
                {profile?.full_name || user.email?.split("@")[0] || "Host"}
              </Button>
            </Link>
          ) : (
            <Link to="/auth" className="flex items-center">
              <Button variant="ghost" size="sm" className="rounded-full gap-1.5 px-3">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline text-xs font-semibold">Log in</span>
              </Button>
            </Link>
          )}

          {/* User Dropdown Menu */}
          {user && (
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none truncate">{profile?.full_name || "Host"}</p>
                      <p className="text-xs leading-none text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {isPreLaunch ? (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/host" className="cursor-pointer font-semibold text-primary">
                          <Home className="h-4 w-4 mr-2 text-primary" />
                          Host Dashboard (My Properties)
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/host/add-listing" className="cursor-pointer">
                          <Sparkles className="h-4 w-4 mr-2" />
                          Add a New Property
                        </Link>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/account-settings" className="cursor-pointer">
                          <Settings className="h-4 w-4 mr-2" />
                          {t("accountSettings")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/favorites" className="cursor-pointer">
                          <Heart className="h-4 w-4 mr-2" />
                          {t("favorites")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/guest" className="cursor-pointer">
                          <User className="h-4 w-4 mr-2" />
                          {t("guestDashboard")}
                        </Link>
                      </DropdownMenuItem>
                      {isVerifiedHost ? (
                        <DropdownMenuItem asChild>
                          <Link to="/host" className="cursor-pointer">
                            <Home className="h-4 w-4 mr-2" />
                            {t("hostDashboard")}
                          </Link>
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem asChild>
                          <Link to="/become-host" className="cursor-pointer flex justify-between items-center w-full group">
                            <div className="flex items-center text-muted-foreground group-hover:text-foreground">
                              <Home className="h-4 w-4 mr-2" />
                              {t("hostDashboard")}
                            </div>
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full ml-2 whitespace-nowrap">Become Host</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link to="/messages" className="cursor-pointer">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          {t("messages")}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer">
                          <Shield className="h-4 w-4 mr-2" />
                          {t("adminDashboard")}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    {t("logOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
