import { XCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";

const PaymentFailure = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <AppLayout>
      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
              <CardTitle className="text-3xl">{t("paymentFailed")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">{t("paymentFailedDesc")}</p>

              <div className="bg-secondary/50 rounded-lg p-6 text-left">
                <p className="text-sm font-semibold mb-2">{t("commonReasons")}</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>{t("insufficientFunds")}</li>
                  <li>{t("incorrectCardDetails")}</li>
                  <li>{t("cardExpired")}</li>
                  <li>{t("paymentDeclined")}</li>
                </ul>
              </div>

              <div className="space-y-3 pt-4">
                <Button onClick={() => navigate(-1)} className="w-full">
                  {t("tryAgain")}
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/">{t("backToHome")}</Link>
                </Button>
              </div>

              <p className="text-sm text-muted-foreground pt-4">
                {t("havingTrouble")}{" "}
                <Link to="/contact" className="text-primary hover:underline">
                  {t("contactSupportTeam")}
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </AppLayout>
  );
};

export default PaymentFailure;
