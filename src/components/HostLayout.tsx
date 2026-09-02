import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePreLaunch } from "@/contexts/PreLaunchContext";
import NotificationBell from "@/components/NotificationBell";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, LogOut, Home, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface HostLayoutProps {
  children: React.ReactNode;
}

const HostLayout = ({ children }: HostLayoutProps) => {
  const { user, signOut } = useAuth();
  const { mode, openAddPropertyModal } = usePreLaunch();
  const isPreLaunch = mode === "pre-launch";
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path || (path === "/host" && location.pathname === "/host/");

  const handleSignOut = () => {
    signOut();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <img src="/favicon.png" alt="Meewano" className="h-8 w-auto" />
              <span className="font-bold text-lg hidden sm:inline">Meewano</span>
            </Link>
            {isPreLaunch && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25 font-semibold">
                Pre-Launch Host
              </span>
            )}
          </div>

          {!isPreLaunch ? (
            <nav className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
              <Link to="/host/calendar" className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/host/calendar") ? "text-primary border-b-2 border-primary py-5" : "text-muted-foreground"}`}>
                Calendar
              </Link>
              <Link to="/host" className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/host") ? "text-primary border-b-2 border-primary py-5" : "text-muted-foreground"}`}>
                Listings
              </Link>
              <Link to="/host/refund-requests" className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/host/refund-requests") ? "text-primary border-b-2 border-primary py-5" : "text-muted-foreground"}`}>
                Refund requests
              </Link>
              <Link to="/host/messages" className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/host/messages") ? "text-primary border-b-2 border-primary py-5" : "text-muted-foreground"}`}>
                Inbox
              </Link>
            </nav>
          ) : (
            <nav className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
              <Link to="/host" className={`text-sm font-semibold transition-colors hover:text-primary flex items-center gap-1.5 ${isActive("/host") ? "text-primary border-b-2 border-primary py-5" : "text-muted-foreground"}`}>
                <Home className="h-4 w-4" />
                My Properties
              </Link>
              <Link to="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                Pre-Launch Feed
              </Link>
            </nav>
          )}

          <div className="flex items-center gap-3">
            {isPreLaunch && (
              <Button
                size="sm"
                className="hidden sm:flex rounded-full gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                onClick={() => navigate("/host/add-listing")}
              >
                <Sparkles className="h-3.5 w-3.5" />
                + Add Property
              </Button>
            )}

            <div className="hidden md:block">
              <ThemeToggle />
            </div>

            {!isPreLaunch && user && <NotificationBell />}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72" align="end" forceMount>
                {user && (
                  <>
                    <div className="px-2 py-1.5 text-sm font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none truncate">Host</p>
                        <p className="text-xs leading-none text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link to={isPreLaunch ? "/host" : "/host"}>
                    <Home className="h-4 w-4 mr-2" />
                    My Properties
                  </Link>
                </DropdownMenuItem>
                {!isPreLaunch && (
                  <DropdownMenuItem asChild>
                    <Link to="/guest">Switch to guest</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
};
export default HostLayout;
