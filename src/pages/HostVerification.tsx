import { useState } from "react";
import { Upload, CheckCircle, XCircle, Clock } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

const HostVerification = () => {
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "verified" | "rejected">("pending");
  const { t } = useTranslation();

  const handleFileUpload = (documentType: string) => {
    toast.success(`${documentType} ${t("uploadedSuccessfully")}`);
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case "verified":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "rejected":
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Clock className="h-6 w-6 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    switch (verificationStatus) {
      case "verified":
        return t("verified");
      case "rejected":
        return t("rejected");
      default:
        return t("pendingReview");
    }
  };

  return (
    <AppLayout>
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-2">{t("hostVerification")}</h1>
          <p className="text-muted-foreground mb-8">{t("hostVerificationDesc")}</p>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {t("verificationStatus")}
                {getStatusIcon()}
              </CardTitle>
              <CardDescription>{getStatusText()}</CardDescription>
            </CardHeader>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t("identityVerification")}</CardTitle>
              <CardDescription>{t("identityVerificationDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <Label htmlFor="id-upload" className="cursor-pointer">
                    <span className="text-sm text-muted-foreground">{t("clickToUpload")}</span>
                    <Input
                      id="id-upload"
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={() => handleFileUpload("ID Document")}
                    />
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t("proofOfAddress")}</CardTitle>
              <CardDescription>{t("proofOfAddressDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <Label htmlFor="address-upload" className="cursor-pointer">
                    <span className="text-sm text-muted-foreground">{t("clickToUpload")}</span>
                    <Input
                      id="address-upload"
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={() => handleFileUpload("Proof of Address")}
                    />
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("additionalInfo")}</CardTitle>
              <CardDescription>{t("additionalInfoDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full-name">{t("fullNameOnId")}</Label>
                  <Input id="full-name" placeholder={t("enterFullName")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">{t("dateOfBirth")}</Label>
                  <Input id="dob" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">{t("currentAddress")}</Label>
                  <Input id="address" placeholder={t("enterCurrentAddress")} />
                </div>
                <Button className="w-full">{t("submitVerification")}</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </AppLayout>
  );
};

export default HostVerification;
