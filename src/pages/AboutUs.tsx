import AppLayout from "@/components/AppLayout";
import { useTranslation } from "@/hooks/useTranslation";
import { Building2, Users, Heart, Shield } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const AboutUs = () => {
  const { t } = useTranslation();
  const { data: siteSettings } = useSiteSettings();

  const getSetting = (key: string, defaultValue: string) => {
    return (siteSettings?.[key] as string) || defaultValue;
  };

  return (
    <AppLayout>
      
      <main className="flex-1">
        <section className="bg-primary/10 py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">{t("aboutMeewano")}</h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">{t("aboutDesc")}</p>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-foreground mb-6">{t("ourMission")}</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                {getSetting("about_mission", "Meewano was founded with a simple goal: to make finding and booking accommodations in Kurdistan easier than ever. We connect travelers with local hosts, offering authentic experiences while supporting local communities and the tourism industry in the region.")}
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">{t("ourValues")}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{t("qualityProperties")}</h3>
                <p className="text-muted-foreground">
                  {getSetting("about_value_1", "We ensure all listed properties meet our quality standards for your comfort.")}
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{t("communityFirst")}</h3>
                <p className="text-muted-foreground">
                  {getSetting("about_value_2", "We support local hosts and communities by promoting sustainable tourism.")}
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{t("hospitality")}</h3>
                <p className="text-muted-foreground">
                  {getSetting("about_value_3", "Experience the renowned Kurdish hospitality through our trusted hosts.")}
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{t("trustSafety")}</h3>
                <p className="text-muted-foreground">
                  {getSetting("about_value_4", "Your security is our priority with verified hosts and secure payments.")}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-foreground text-center mb-6">{t("ourStory")}</h2>
              <div className="space-y-4 text-muted-foreground text-lg leading-relaxed">
                <p>
                  {getSetting("about_story", "Meewano began as a vision to showcase the beauty and hospitality of Kurdistan to the world. Our founders recognized the need for a dedicated platform that understands the unique needs of both travelers and local property owners. Today, we're proud to serve thousands of guests and hosts across Erbil, Sulaymaniyah, Duhok, and beyond.")}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">{t("haveQuestions")}</h2>
            <p className="text-lg mb-6 opacity-90">{t("loveToHear")}</p>
            <a 
              href="/contact" 
              className="inline-block bg-background text-foreground px-8 py-3 rounded-lg font-semibold hover:bg-background/90 transition-colors"
            >
              {t("contactUs")}
            </a>
          </div>
        </section>
      </main>

    </AppLayout>
  );
};

export default AboutUs;
