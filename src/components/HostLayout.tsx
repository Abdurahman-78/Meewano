import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePreLaunch } from "@/contexts/PreLaunchContext";
import NotificationBell from "@/components/NotificationBell";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, LogOut, Home, Building2, Calendar as CalendarIcon, ClipboardList, BarChart3, Settings, MessageSquare } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface HostLayoutProps {
  children: React.ReactNode;
}

const HostLayout = ({ children }: HostLayoutProps) => {
  const { user, signOut } = useAuth();
  const { mode } = usePreLaunch();
  const isPreLaunch = mode === "pre-launch";
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path || (path === "/host" && location.pathname === "/host/");

  const handleSignOut = () => {
    signOut();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950/20 flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-slate-900 text-slate-50 dark:bg-slate-950">
        <div className="flex h-16 items-center justify-between px-3 md:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <img src="/favicon.png" alt="Meewano" className="h-8 w-auto" />
            </Link>
          </div>

          {!isPreLaunch ? (
            <nav className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
              <Link to="/host" className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/host") ? "text-primary border-b-2 border-primary py-5" : "text-slate-400"}`}>
                Listings
              </Link>
              <Link to="/host/reservations" className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/host/reservations") || isActive("/host/bookings") ? "text-primary border-b-2 border-primary py-5" : "text-slate-400"}`}>
                Reservations
              </Link>
              <Link to="/host/calendar" className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/host/calendar") ? "text-primary border-b-2 border-primary py-5" : "text-slate-400"}`}>
                Calendar
              </Link>
              <Link to="/host/messages" className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/host/messages") ? "text-primary border-b-2 border-primary py-5" : "text-slate-400"}`}>
                Inbox
              </Link>
              <Link to="/host/analytics" className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/host/analytics") ? "text-primary border-b-2 border-primary py-5" : "text-slate-400"}`}>
                Insights
              </Link>
            </nav>
          ) : (
            <nav className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
              <Link to="/host" className={`text-sm font-semibold transition-colors hover:text-primary ${isActive("/host") ? "text-primary border-b-2 border-primary py-5" : "text-slate-400"}`}>
                Listings
              </Link>
              <Link to="/host/reservations" className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/host/reservations") || isActive("/host/bookings") ? "text-primary border-b-2 border-primary py-5" : "text-slate-400"}`}>
                Reservations
              </Link>
              <Link to="/host/calendar" className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/host/calendar") ? "text-primary border-b-2 border-primary py-5" : "text-slate-400"}`}>
                Calendar
              </Link>
              <Link to="/host/messages" className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/host/messages") ? "text-primary border-b-2 border-primary py-5" : "text-slate-400"}`}>
                Inbox
              </Link>
              <Link to="/host/analytics" className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/host/analytics") ? "text-primary border-b-2 border-primary py-5" : "text-slate-400"}`}>
                Insights
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
                <Building2 className="h-3.5 w-3.5" />
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
                        <p className="text-xs leading-none text-slate-400 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link to="/host">
                    <Home className="h-4 w-4 mr-2" />
                    Listings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/host/reservations">
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Reservations
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/host/analytics">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Insights
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/account-settings">
                    <User className="h-4 w-4 mr-2" />
                    Account details
                  </Link>
                </DropdownMenuItem>

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
