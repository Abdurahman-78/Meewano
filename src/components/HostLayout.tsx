import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "@/components/NotificationBell";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface HostLayoutProps {
  children: React.ReactNode;
}

const HostLayout = ({ children }: HostLayoutProps) => {
  const { user, signOut } = useAuth();
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
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center">
              <img src="/favicon.png" alt="Meewano" className="h-8 w-auto" />
            </Link>
          </div>
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
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
            {user && <NotificationBell />}
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
                  <Link to="/guest">Switch to guest</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
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
