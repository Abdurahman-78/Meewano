import { useEffect, useState } from "react";
import { CreditCard, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type PayoutMethod = "" | "bank_transfer" | "fastpay" | "zaincash" | "qi_card" | "cash";

const HostPayoutCard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [method, setMethod] = useState<PayoutMethod>("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("payout_method, payout_details")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setMethod((data.payout_method as PayoutMethod) || "");
        const d = (data.payout_details as any) || {};
        setAccountName(d.account_name || "");
        setAccountNumber(d.account_number || "");
        setBankName(d.bank_name || "");
        setPhone(d.phone || "");
      }
      setLoading(false);
    })();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    if (!method) { toast.error("Select a payout method"); return; }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          payout_method: method,
          payout_details: { account_name: accountName, account_number: accountNumber, bank_name: bankName, phone },
        })
        .eq("id", user.id);
      if (error) throw error;
      toast.success("Payment details saved");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const needsBank = method === "bank_transfer";
  const needsPhone = method === "fastpay" || method === "zaincash";
  const configured = !!method;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Payment Details
          {configured && <CheckCircle2 className="h-4 w-4 text-green-600" />}
        </CardTitle>
        <CardDescription>How you'd like to receive payouts from bookings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : (
          <>
            <div>
              <Label htmlFor="payout-method">Payout method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PayoutMethod)}>
                <SelectTrigger id="payout-method" className="mt-2">
                  <SelectValue placeholder="Select a method" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border z-50">
                  <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                  <SelectItem value="fastpay">FastPay</SelectItem>
                  <SelectItem value="zaincash">ZainCash</SelectItem>
                  <SelectItem value="qi_card">Qi Card</SelectItem>
                  <SelectItem value="cash">Cash at check-in</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {method && method !== "cash" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="account-name">Account holder name</Label>
                  <Input id="account-name" className="mt-2" value={accountName}
                    onChange={(e) => setAccountName(e.target.value)} />
                </div>
                {needsBank && (
                  <>
                    <div>
                      <Label htmlFor="bank-name">Bank name</Label>
                      <Input id="bank-name" className="mt-2" value={bankName}
                        onChange={(e) => setBankName(e.target.value)} />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="account-number">IBAN / Account number</Label>
                      <Input id="account-number" className="mt-2" value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)} />
                    </div>
                  </>
                )}
                {needsPhone && (
                  <div className="md:col-span-2">
                    <Label htmlFor="payout-phone">Wallet phone number</Label>
                    <Input id="payout-phone" inputMode="tel" placeholder="+964 7XX XXX XXXX"
                      className="mt-2" value={phone}
                      onChange={(e) => setPhone(e.target.value)} />
                  </div>
                )}
                {method === "qi_card" && (
                  <div className="md:col-span-2">
                    <Label htmlFor="qi-number">Qi Card number</Label>
                    <Input id="qi-number" className="mt-2" value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)} />
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save payment details
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default HostPayoutCard;
