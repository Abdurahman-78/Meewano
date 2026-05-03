import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Shield, Lock, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();

  // Redirect if already logged in as admin
  useEffect(() => {
    if (user && !roleLoading && isAdmin) {
      navigate("/admin");
    }
  }, [user, isAdmin, roleLoading, navigate]);

  // Lock timer countdown
  useEffect(() => {
    if (isLocked && lockTimer > 0) {
      const timer = setInterval(() => {
        setLockTimer((prev) => {
          if (prev <= 1) {
            setIsLocked(false);
            setAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isLocked, lockTimer]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      toast({
        title: "Account Locked",
        description: `Too many failed attempts. Please wait ${lockTimer} seconds.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Sign in
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Authentication failed");
      }

      // Verify admin role from database
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id)
        .eq("role", "admin")
        .single();

      if (roleError || !roleData) {
        // Not an admin - sign out immediately
        await supabase.auth.signOut();
        
        setAttempts((prev) => {
          const newAttempts = prev + 1;
          if (newAttempts >= 3) {
            setIsLocked(true);
            setLockTimer(60); // Lock for 60 seconds
          }
          return newAttempts;
        });

        throw new Error("Access denied. Administrator privileges required.");
      }

      toast({
        title: "Access Granted",
        description: "Welcome to the Admin Control Panel.",
      });
      
      navigate("/admin");
    } catch (error: any) {
      setAttempts((prev) => {
        const newAttempts = prev + 1;
        if (newAttempts >= 3) {
          setIsLocked(true);
          setLockTimer(60);
        }
        return newAttempts;
      });

      toast({
        title: "Access Denied",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>
      </div>

      {/* Security grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Security badge */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative bg-slate-900 border-2 border-red-500/50 rounded-full p-6">
              <Shield className="w-12 h-12 text-red-500" />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
            RESTRICTED ACCESS
          </h1>
          <p className="text-slate-400 text-sm">
            Administrator Authentication Required
          </p>
        </div>

        {/* Warning badge */}
        {attempts > 0 && !isLocked && (
          <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <p className="text-amber-500 text-sm">
              Warning: {3 - attempts} attempt(s) remaining before lockout
            </p>
          </div>
        )}

        {/* Lockout warning */}
        {isLocked && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-red-500 font-medium">Account Temporarily Locked</p>
                <p className="text-red-400/70 text-sm">
                  Too many failed attempts. Retry in {lockTimer}s
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-slate-400 text-sm font-medium block">
              Administrator Email
            </label>
            <Input
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLocked}
              className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-red-500 focus:ring-red-500/20 h-12"
            />
          </div>

          <div className="space-y-2">
            <label className="text-slate-400 text-sm font-medium block">
              Security Key
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLocked}
                minLength={6}
                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-red-500 focus:ring-red-500/20 h-12 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                disabled={isLocked}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-medium mt-6 transition-all duration-200 disabled:opacity-50"
            disabled={loading || isLocked}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Authenticating...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Authenticate
              </div>
            )}
          </Button>
        </form>

        {/* Security notice */}
        <div className="mt-8 p-4 bg-slate-900/50 border border-slate-800 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-500 space-y-1">
              <p>This system is for authorized administrators only.</p>
              <p>Unauthorized access attempts are logged and monitored.</p>
            </div>
          </div>
        </div>

        {/* Back to main site */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/")}
            className="text-slate-500 hover:text-slate-400 text-sm transition-colors"
          >
            ← Return to main site
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
