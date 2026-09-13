const fs = require('fs');

// 1. Header.tsx
const headerPath = 'src/components/Header.tsx';
let code = fs.readFileSync(headerPath, 'utf8');
code = code.replace(/>\s*About Us\s*<\/a>/g, '>{t("navAboutUs")}</a>');
fs.writeFileSync(headerPath, code);

// 2. MobileMenu.tsx
const mobilePath = 'src/components/MobileMenu.tsx';
code = fs.readFileSync(mobilePath, 'utf8');
code = code.replace(/>\s*About Us\s*<\/a>/g, '>{t("navAboutUs")}</a>');
fs.writeFileSync(mobilePath, code);

