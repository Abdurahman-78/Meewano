import { Globe, User, LogIn, Home, MessageSquare, Settings, Heart, LogOut, Shield, Building2, Info, Map, Compass } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import meewanoLogo from "@/assets/meewano-logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { ThemeToggle } from "@/components/ThemeToggle";
import NotificationBell from "@/components/NotificationBell";
import MobileMenu from "@/components/MobileMenu";

const Header = () => {
  const { language, setLanguage } = useLanguage();
  
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const languageNames = {
    en: "English",
    ar: "العربية",
    ku: "کوردی",
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card shadow-sm">
      <div className="w-full px-0 py-2 md:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-6">
          <MobileMenu />
          <Link to="/" className="flex items-center">
            <img 
              src={meewanoLogo} 
              alt="Meewano" 
              className="h-8 md:h-12 w-auto object-contain" 
            />
          </Link>
          
          {/* Navigation Links */}
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
        </div>
        
        <div className="flex items-center gap-1 md:gap-3">
          <Link to={user ? "/become-host" : "/auth?redirect=%2Fbecome-host"} className="hidden md:block">
            <Button variant="ghost" size="sm" className="rounded-full font-semibold hover:bg-accent">
              <Home className="h-4 w-4 mr-1.5" />
              List your property
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Globe className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem 
                onClick={() => setLanguage("en")}
                className={language === "en" ? "bg-accent" : ""}
              >
                English
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setLanguage("ar")}
                className={language === "ar" ? "bg-accent" : ""}
              >
                العربية
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setLanguage("ku")}
                className={language === "ku" ? "bg-accent" : ""}
              >
                کوردی
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>


          <div className="hidden md:block"><ThemeToggle /></div>

          {user && <NotificationBell />}
          {user ? (
            <Link to="/auth" className="hidden md:block">
              <Button variant="ghost" size="sm" className="rounded-full">
                {user.email}
              </Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button variant="ghost" size="icon" className="rounded-full">
                <LogIn className="h-5 w-5" />
              </Button>
            </Link>
          )}
          
          <div className="hidden md:block">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {user && (
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
                </>
              )}
              <DropdownMenuItem asChild>
                <Link to="/guest" className="cursor-pointer">
                  <User className="h-4 w-4 mr-2" />
                  {t("guestDashboard")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/host" className="cursor-pointer">
                  <Home className="h-4 w-4 mr-2" />
                  {t("hostDashboard")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/messages" className="cursor-pointer">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {t("messages")}
                </Link>
              </DropdownMenuItem>
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
              {user && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    {t("logOut")}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
