const fs = require('fs');
const path = 'src/i18n/translations.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/searchStays: "Search stays or areas\.\.\.",/g, 'searchStays: "Search stays or areas...",\n    comingSoon: "Coming Soon",\n    perNight: "/ night",');
code = code.replace(/searchStays: "ابحث عن أماكن إقامة أو مناطق\.\.\.",/g, 'searchStays: "ابحث عن أماكن إقامة أو مناطق...",\n    comingSoon: "قريباً",\n    perNight: "/ ليلة",');
code = code.replace(/searchStays: "بگەڕێ بۆ شوێنی مانەوە یان ناوچەکان\.\.\.",/g, 'searchStays: "بگەڕێ بۆ شوێنی مانەوە یان ناوچەکان...",\n    comingSoon: "بەمنزیکانە",\n    perNight: "/ شەو",');
fs.writeFileSync(path, code);

const cardPath = 'src/components/PreLaunchPropertyCard.tsx';
let cardCode = fs.readFileSync(cardPath, 'utf8');

if (!cardCode.includes('import { useTranslation }')) {
    cardCode = cardCode.replace('import { MapPin, Users, Bath, BedDouble, Lock, Info, Star } from "lucide-react";', 'import { MapPin, Users, Bath, BedDouble, Lock, Info, Star } from "lucide-react";\nimport { useTranslation } from "@/hooks/useTranslation";');
    cardCode = cardCode.replace('export const PreLaunchPropertyCard = ({ property, onClick }: PreLaunchPropertyCardProps) => {', 'export const PreLaunchPropertyCard = ({ property, onClick }: PreLaunchPropertyCardProps) => {\n  const { t } = useTranslation();');
}

cardCode = cardCode.replace(/<span>Coming Soon<\/span>/g, '<span>{t("comingSoon")}</span>');
cardCode = cardCode.replace(/<span className="text-\[11px\] text-muted-foreground">\/ night<\/span>/g, '<span className="text-[11px] text-muted-foreground">{t("perNight")}</span>');

// For the button:
cardCode = cardCode.replace(/<Lock className="h-3 w-3" \/>\s*Coming Soon/g, '<Lock className="h-3 w-3" />\n            {t("comingSoon")}');

fs.writeFileSync(cardPath, cardCode);
