import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle, Mail } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type State = "validating" | "valid" | "already" | "invalid" | "submitting" | "done" | "error";

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>("validating");
  const [message, setMessage] = useState("");

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: anonKey } }
        );
        const data = await res.json();
        if (data.valid) setState("valid");
        else if (data.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      } catch {
        setState("error");
      }
    })();
  }, [token, supabaseUrl, anonKey]);

  const confirm = async () => {
    if (!token) return;
    setState("submitting");
    try {
      const res = await fetch(
        `${supabaseUrl}/functions/v1/handle-email-unsubscribe`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: anonKey },
          body: JSON.stringify({ token }),
        }
      );
      const data = await res.json();
      if (data.success || data.reason === "already_unsubscribed") setState("done");
      else { setMessage(data.error || "Couldn't process request"); setState("error"); }
    } catch {
      setState("error");
    }
  };

  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-16 max-w-lg">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
              <Mail className="h-7 w-7" />
            </div>
            {state === "validating" && (
              <>
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary mb-3" />
                <p className="text-muted-foreground">Checking your unsubscribe link…</p>
              </>
            )}
            {state === "valid" && (
              <>
                <h1 className="text-2xl font-bold mb-2">Unsubscribe from Meewano emails?</h1>
                <p className="text-muted-foreground mb-6">
                  You'll stop receiving marketing and notification emails. You'll still get critical account messages.
                </p>
                <Button size="lg" onClick={confirm}>Confirm unsubscribe</Button>
              </>
            )}
            {state === "submitting" && (
              <>
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary mb-3" />
                <p className="text-muted-foreground">Processing…</p>
              </>
            )}
            {state === "done" && (
              <>
                <CheckCircle2 className="h-10 w-10 mx-auto text-green-600 mb-3" />
                <h1 className="text-2xl font-bold mb-2">You're unsubscribed</h1>
                <p className="text-muted-foreground">You won't receive these emails again.</p>
              </>
            )}
            {state === "already" && (
              <>
                <CheckCircle2 className="h-10 w-10 mx-auto text-green-600 mb-3" />
                <h1 className="text-2xl font-bold mb-2">Already unsubscribed</h1>
                <p className="text-muted-foreground">This email is already removed from our list.</p>
              </>
            )}
            {state === "invalid" && (
              <>
                <XCircle className="h-10 w-10 mx-auto text-destructive mb-3" />
                <h1 className="text-2xl font-bold mb-2">Invalid link</h1>
                <p className="text-muted-foreground">This unsubscribe link is no longer valid.</p>
              </>
            )}
            {state === "error" && (
              <>
                <XCircle className="h-10 w-10 mx-auto text-destructive mb-3" />
                <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
                <p className="text-muted-foreground">{message || "Please try the link again later."}</p>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </AppLayout>
  );
};

export default Unsubscribe;
