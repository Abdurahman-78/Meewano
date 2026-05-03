import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import AppLayout from "@/components/AppLayout";

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <AppLayout>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">{t("pageNotFound")}</h1>
          <p className="mb-4 text-xl text-muted-foreground">{t("pageNotFoundDesc")}</p>
          <a href="/" className="text-primary underline hover:text-primary/80">
            {t("returnToHome")}
          </a>
        </div>
      </div>
    </AppLayout>
  );
};

export default NotFound;
