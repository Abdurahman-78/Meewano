import { Home, Search, Map, Heart, User, Sparkles, HelpCircle, Info } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { usePreLaunch } from "@/contexts/PreLaunchContext";

const MobileBottomNav = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { mode, openAddPropertyModal } = usePreLaunch();
  const isPreLaunch = mode === "pre-launch";

  if (isPreLaunch) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border md:hidden safe-area-bottom shadow-lg">
        <div className="flex items-center justify-around h-16 px-2">
          <Link
            to="/"
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
              location.pathname === "/" && !location.hash
                ? "text-primary font-semibold"
                : "text-muted-foreground"
            )}
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px]">Home</span>
          </Link>

          <button
            onClick={openAddPropertyModal}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-primary font-bold"
          >
            <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-[10px]">List Space</span>
          </button>

          <a
            href="#what-is-meewano"
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-muted-foreground hover:text-foreground transition-colors"
          >
            <Info className="h-5 w-5" />
            <span className="text-[10px]">About</span>
          </a>

          <a
            href="#host-faq"
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-muted-foreground hover:text-foreground transition-colors"
          >
            <HelpCircle className="h-5 w-5" />
            <span className="text-[10px]">FAQ</span>
          </a>
        </div>
      </nav>
    );
  }

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Search, label: t("navProperties"), path: "/search" },
    { icon: Map, label: t("navMap"), path: "/map" },
    { icon: Heart, label: t("favorites"), path: "/favorites" },
    { icon: User, label: "Profile", path: user ? "/guest" : "/auth" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "fill-primary/20")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
