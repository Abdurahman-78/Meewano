import { createContext, useContext, useEffect, useRef, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const welcomeCheckedRef = useRef(false);

  useEffect(() => {
    if (!user || !user.email_confirmed_at || welcomeCheckedRef.current) return;
    welcomeCheckedRef.current = true;

    const checkAndSendWelcome = async () => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("welcome_email_sent_at, full_name")
          .eq("id", user.id)
          .single();

        if (profile?.welcome_email_sent_at) return;

        const firstName = profile?.full_name?.split(" ")[0] || "";

        await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "customer-welcome",
            recipientEmail: user.email,
            idempotencyKey: `welcome-${user.id}`,
            templateData: {
              firstName,
              siteUrl: typeof window !== "undefined" ? window.location.origin : "",
            },
          },
        });

        await supabase
          .from("profiles")
          .update({ welcome_email_sent_at: new Date().toISOString() })
          .eq("id", user.id);
      } catch (e) {
        console.error("Welcome email failed:", e);
      }
    };

    checkAndSendWelcome();
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
