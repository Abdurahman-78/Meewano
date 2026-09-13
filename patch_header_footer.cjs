const fs = require('fs');
let code;

// 1. Header.tsx
const headerPath = 'src/components/Header.tsx';
code = fs.readFileSync(headerPath, 'utf8');

// Replace navigation items
code = code.replace(/>\s*What is Meewano\?\s*<\/a>/g, '>{t("navWhatIsMeewano")}</a>');
code = code.replace(/>\s*About Us\s*<\/Link>/g, '>{t("navAboutUs")}</Link>');
code = code.replace(/>\s*Host FAQ\s*<\/a>/g, '>{t("navHostFaq")}</a>');
code = code.replace(/>\{user \? "Host Dashboard" : "Become a Host"\}<\/span>/g, '>{user ? t("hostDashboard") : t("becomeHost")}</span>');

fs.writeFileSync(headerPath, code);

// 2. MobileMenu.tsx
const mobilePath = 'src/components/MobileMenu.tsx';
code = fs.readFileSync(mobilePath, 'utf8');

code = code.replace(/label="Host Dashboard \(My Properties\)"/g, 'label={t("hostDashboardMyProps")}');
code = code.replace(/>\s*What is Meewano\?\s*<\/a>/g, '>{t("navWhatIsMeewano")}</a>');
code = code.replace(/>\s*About Us\s*<\/Link>/g, '>{t("navAboutUs")}</Link>');
code = code.replace(/>\s*Host FAQ\s*<\/a>/g, '>{t("navHostFaq")}</a>');

fs.writeFileSync(mobilePath, code);

// 3. Footer.tsx
const footerPath = 'src/components/Footer.tsx';
code = fs.readFileSync(footerPath, 'utf8');

// Add usePreLaunch
if (!code.includes('import { usePreLaunch }')) {
    code = code.replace('import { useTranslation } from "@/hooks/useTranslation";', 'import { useTranslation } from "@/hooks/useTranslation";\nimport { usePreLaunch } from "@/contexts/PreLaunchContext";');
    code = code.replace('const Footer = () => {', 'const Footer = () => {\n  const { isPreLaunch } = usePreLaunch();');
}

// Remove Host Offer and update translations
code = code.replace(/<li[^>]*>\s*<Link to="\/become-host"[^>]*>\s*Host Offer: 10 Bookings Free\s*<\/Link>\s*<\/li>/g, '');
code = code.replace(/>\s*Visit Kurdistan\s*<\/a>/g, '>{t("visitKurdistan")}</a>');
code = code.replace(/>\s*Blog\s*<\/Link>/g, '>{t("blog")}</Link>');

// Hide Quick Links during Pre-Launch
code = code.replace(/<div>\s*<h3 className="text-lg font-semibold text-primary mb-4">\{t\("footerLinksTitle"\)\}<\/h3>/, '{!isPreLaunch && (<div>\n            <h3 className="text-lg font-semibold text-primary mb-4">{t("footerLinksTitle")}</h3>');
code = code.replace(/<\/ul>\s*<\/div>\s*\{\/\* Column 3: Social Media \*\/\}/, '</ul>\n          </div>)}\n          {/* Column 3: Social Media */}');

fs.writeFileSync(footerPath, code);

