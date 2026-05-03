import { useEffect, useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";

const PaymentSuccess = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const [loading, setLoading] = useState(!!bookingId);
  const [reference, setReference] = useState<string>("");

  useEffect(() => {
    if (!bookingId) {
      setReference("MEW" + Math.random().toString(36).substring(2, 11).toUpperCase());
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("bookings")
        .select("id")
        .eq("id", bookingId)
        .maybeSingle();
      if (data?.id) {
        setReference(`MW-${data.id.slice(0, 8).toUpperCase()}`);
      } else {
        setReference("MEW" + Math.random().toString(36).substring(2, 11).toUpperCase());
      }
      setLoading(false);
    })();
  }, [bookingId]);

  return (
    <AppLayout>
      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 w-16 h-16 bg-accent rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <CardTitle className="text-3xl">{t("paymentSuccessful")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">{t("paymentSuccessDesc")}</p>

              <div className="bg-secondary/50 rounded-lg p-6">
                <p className="text-sm text-muted-foreground mb-2">{t("bookingReference")}</p>
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{reference}</p>
                )}
              </div>

              <div className="space-y-3 pt-4">
                <Button asChild className="w-full">
                  <Link to="/guest/bookings">{t("viewMyBookings")}</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/">{t("backToHome")}</Link>
                </Button>
              </div>

              <p className="text-sm text-muted-foreground pt-4">
                {t("needHelp")}{" "}
                <Link to="/contact" className="text-primary hover:underline">
                  {t("contactUs")}
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </AppLayout>
  );
};

export default PaymentSuccess;
