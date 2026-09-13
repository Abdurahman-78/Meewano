import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { usePreLaunch } from "@/contexts/PreLaunchContext";

const Footer = () => {
  const { isPreLaunch } = usePreLaunch();
  const { t } = useTranslation();

  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-between">
          {/* Column 1: About */}
          <div>
            <h3 className="text-lg font-semibold text-primary mb-4">{t("footerAboutTitle")}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("footerAboutText")}
            </p>
          </div>

          {/* Column 2: Links */}
          
          {/* Column 3: Social Media */}
          <div>
            <h3 className="text-lg font-semibold text-primary mb-4">{t("footerSocialTitle")}</h3>
            <div className="flex gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Meewano. {t("footerRights")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
