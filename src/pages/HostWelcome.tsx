import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ShieldCheck, Home, Sparkles, ArrowRight, Mail } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { usePreLaunch } from "@/contexts/PreLaunchContext";

const HostWelcome = () => {
  const { user, loading } = useAuth();
  const { mode } = usePreLaunch();
  const navigate = useNavigate();

  const isPreLaunch = mode === "pre-launch";

  useEffect(() => {
    if (!loading && !user) navigate("/auth?redirect=/host/welcome");
  }, [user, loading, navigate]);

  const LIVE_STEPS = [
    {
      icon: ShieldCheck,
      title: "Verify your identity",
      desc: "Upload your ID, a selfie, and proof of property ownership.",
    },
    {
      icon: Home,
      title: "List your first property",
      desc: "Add photos, set your price, and submit your listing for review.",
    },
    {
      icon: Sparkles,
      title: "Start earning",
      desc: "Once approved, guests can book and you get paid.",
    },
  ];

  const PRE_LAUNCH_STEPS = [
    {
      icon: Home,
      title: "List your property",
      desc: "Add your property details and photos to join the pre-launch preview.",
    },
    {
      icon: Sparkles,
      title: "Prepare for launch",
      desc: "After Meewano is launched, we verify to set the official price of properties with you.",
    },
  ];

  const steps = isPreLaunch ? PRE_LAUNCH_STEPS : LIVE_STEPS;

  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-green-500/10 text-green-600 mb-4">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Welcome aboard!</h1>
          <p className="text-lg text-muted-foreground">
            Your host account is ready. Here's what to do next to get your property live.
          </p>
        </div>

        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="pt-6 flex items-start gap-3">
            <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold mb-1">A welcome email is on its way</p>
              <p className="text-sm text-muted-foreground">
                We've emailed you the next steps so you can find them anytime. Check your inbox (and spam folder just in case).
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <Card key={s.title} className="hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground">Step {i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold mb-1">{s.title}</h3>
                      <p className="text-sm text-muted-foreground">{s.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <Button 
            size="lg" 
            className="h-12 px-8" 
            onClick={() => navigate(isPreLaunch ? "/host" : "/host/verification")}
          >
            {isPreLaunch ? "Go to Host Dashboard" : "Start verification"}
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </main>
    </AppLayout>
  );
};

export default HostWelcome;
