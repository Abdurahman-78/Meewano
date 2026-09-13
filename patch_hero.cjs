const fs = require('fs');
const path = 'src/components/PreLaunchHero.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('import { useTranslation }')) {
    code = code.replace('import { useAuth } from "@/contexts/AuthContext";', 'import { useAuth } from "@/contexts/AuthContext";\nimport { useTranslation } from "@/hooks/useTranslation";');
    code = code.replace('export const PreLaunchHero: React.FC = () => {', 'export const PreLaunchHero: React.FC = () => {\n  const { t } = useTranslation();');
}

code = code.replace('<span className="text-white">Coming Soon • Kurdistan Pioneer Pre-Launch</span>', '<span className="text-white">{t("comingSoonPioneer")}</span>');
code = code.replace('Meewano is launching soon!', '{t("launchingSoon")}');
code = code.replace('Become a host today.', '{t("becomeHostToday")}');
code = code.replace('Kurdistan’s dedicated vacation rental platform. Pre-register your villa, chalet, or modern apartment across Erbil, Sulaymaniyah, Duhok, Rawanduz, and beyond.', '{t("preLaunchHeroSubtitle")}');
code = code.replace('{user ? "Host Dashboard" : "Become a Host"}', '{user ? t("hostDashboard") : t("becomeHost")}');
code = code.replace('Preview Demo Stays', '{t("previewDemoStays")}');

fs.writeFileSync(path, code);
