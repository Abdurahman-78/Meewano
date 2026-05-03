import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const PhoneVerification = () => {
  const { user } = useAuth();
  const [phone, setPhone] = useState("");
  const [verified, setVerified] = useState(false);
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"idle" | "code">("idle");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("phone, phone_verified").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) { setPhone(data.phone ?? ""); setVerified(!!data.phone_verified); }
    });
  }, [user]);

  const sendCode = async () => {
    if (!/^\+[1-9]\d{6,14}$/.test(phone)) { toast.error("Use international format, e.g. +9647501234567"); return; }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-phone-otp", { body: { phone } });
      if (error) throw error;
      if ((data as any)?.warning) toast.message("Twilio not connected", { description: `Dev code: ${(data as any).dev_code}` });
      else toast.success("Code sent via WhatsApp");
      setStep("code");
    } catch (e: any) { toast.error(e.message || "Failed to send code"); }
    finally { setSending(false); }
  };

  const verify = async () => {
    setVerifying(true);
    try {
      const { error } = await supabase.functions.invoke("verify-phone-otp", { body: { code, phone } });
      if (error) throw error;
      toast.success("Phone verified!");
      setVerified(true); setStep("idle"); setCode("");
    } catch (e: any) { toast.error(e.message || "Invalid code"); }
    finally { setVerifying(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" /> WhatsApp Verification
          {verified && <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" />Verified</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Phone number (international format)</Label>
          <div className="flex gap-2 mt-1">
            <Input value={phone} onChange={(e) => { setPhone(e.target.value); setVerified(false); }} placeholder="+9647501234567" />
            {!verified && (
              <Button onClick={sendCode} disabled={sending || !phone}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send code"}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">We send booking confirmations and verification codes via WhatsApp.</p>
        </div>

        {step === "code" && !verified && (
          <div>
            <Label>6-digit code from WhatsApp</Label>
            <div className="flex gap-2 mt-1">
              <Input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="123456" maxLength={6} />
              <Button onClick={verify} disabled={verifying || code.length !== 6}>
                {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PhoneVerification;
