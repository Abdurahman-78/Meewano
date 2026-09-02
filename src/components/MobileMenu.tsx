import { Menu, Home, User, MessageSquare, Settings, Heart, LogOut, Shield, Building2, Info, Map, Compass, DollarSign, Sparkles, HelpCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useMyHostVerification } from "@/hooks/useHostVerification";
import { useCurrency } from "@/contexts/CurrencyContext";
import { usePreLaunch } from "@/contexts/PreLaunchContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

const MobileMenu = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const { data: hostVerification } = useMyHostVerification();
  const { mode, openAddPropertyModal } = usePreLaunch();
  const isPreLaunch = mode === "pre-launch";
  const isVerifiedHost = !!user && hostVerification?.status === "approved";
  
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) => (
    <Link
      to={to}
      onClick={close}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors"
    >
      <Icon className="h-5 w-5 text-muted-foreground" />
      {label}
    </Link>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden rounded-full">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="p-4 pb-2">
          <SheetTitle className="text-left flex items-center justify-between">
            <span>Menu</span>
            {isPreLaunch && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 font-semibold border border-amber-500/30">
                Pre-Launch
              </span>
            )}
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-1 px-2 py-2 overflow-y-auto">
          <NavItem to="/" icon={Home} label="Home" />

          {/* Pre-Launch Mode Navigation */}
          {isPreLaunch ? (
            <>
              {user ? (
                <>
                  <NavItem to="/host" icon={Home} label="Host Dashboard (My Properties)" />
                  <button
                    onClick={() => {
                      close();
                      navigate("/host/add-listing");
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-left"
                  >
                    <Sparkles className="h-5 w-5 text-primary" />
                    + Add New Property
                  </button>
                </>
              ) : (
                <>
                  <NavItem to="/auth" icon={User} label="Log In / Sign Up" />
                  <Link
                    to="/become-host"
                    onClick={close}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-left"
                  >
                    <Sparkles className="h-5 w-5 text-primary" />
                    Become a Host
                  </Link>
                </>
              )}

              <Separator className="my-2" />

              <a
                href="#what-is-meewano"
                onClick={close}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                <Info className="h-5 w-5 text-muted-foreground" />
                What is Meewano?
              </a>
              <a
                href="#about-us"
                onClick={close}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                <Home className="h-5 w-5 text-muted-foreground" />
                About Us
              </a>
              <a
                href="#host-faq"
                onClick={close}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
                Host FAQ
              </a>
            </>
          ) : (
            <>
              <NavItem to="/search" icon={Building2} label={t("navProperties")} />
              <NavItem to="/discover" icon={Compass} label={t("navDiscover")} />
              <NavItem to="/map" icon={Map} label={t("navMap")} />
              <NavItem to="/about" icon={Info} label={t("navAboutUs")} />

              <Separator className="my-2" />

              {user ? (
                <>
                  <NavItem to="/guest" icon={User} label={t("guestDashboard")} />
                  {isVerifiedHost ? (
                    <NavItem to="/host" icon={Home} label={t("hostDashboard")} />
                  ) : (
                    <Link
                      to="/become-host"
                      onClick={close}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Home className="h-5 w-5" />
                        {t("hostDashboard")}
                      </div>
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full ml-2 whitespace-nowrap">Become Host</span>
                    </Link>
                  )}
                </>
              ) : (
                <NavItem to="/guest" icon={User} label={t("guestDashboard")} />
              )}
              <NavItem to="/messages" icon={MessageSquare} label={t("messages")} />
              <NavItem to="/favorites" icon={Heart} label={t("favorites")} />

              {user && (
                <>
                  <Separator className="my-2" />
                  <NavItem to="/account-settings" icon={Settings} label={t("accountSettings")} />
                </>
              )}

              {isAdmin && (
                <>
                  <Separator className="my-2" />
                  <NavItem to="/admin" icon={Shield} label={t("adminDashboard")} />
                </>
              )}
            </>
          )}

          <Separator className="my-2" />

          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>

          {!isPreLaunch && user && (
            <>
              <Separator className="my-2" />
              <button
                onClick={() => { signOut(); close(); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full"
              >
                <LogOut className="h-5 w-5" />
                {t("logOut")}
              </button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;
