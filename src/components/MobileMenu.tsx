import { Menu, Home, User, MessageSquare, Settings, Heart, LogOut, Shield, Building2, Info, Map, Compass, DollarSign, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useMyHostVerification } from "@/hooks/useHostVerification";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

const MobileMenu = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const { data: hostVerification } = useMyHostVerification();
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
          <SheetTitle className="text-left">Menu</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-1 px-2 py-2 overflow-y-auto">
          <NavItem to="/" icon={Home} label="Home" />
          <NavItem to="/search" icon={Building2} label={t("navProperties")} />
          <NavItem to="/discover" icon={Compass} label={t("navDiscover")} />
          <NavItem to="/map" icon={Map} label={t("navMap")} />
          <NavItem to="/about" icon={Info} label={t("navAboutUs")} />
          <NavItem
            to="/pre-launch"
            icon={Sparkles}
            label={language === "ku" ? "پێش-دەستپێکردن" : language === "ar" ? "الإطلاق التجريبي" : "Pre-Launch"}
          />

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

          <Separator className="my-2" />


          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>

          {user && (
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
