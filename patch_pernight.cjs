const fs = require('fs');

const path = 'src/i18n/translations.ts';
let code = fs.readFileSync(path, 'utf8');

// I will just put it at the very top of each language block
code = code.replace('en: {', 'en: {\n    perNight: "/ night",');
code = code.replace('ar: {', 'ar: {\n    perNight: "/ ليلة",');
code = code.replace('ku: {', 'ku: {\n    perNight: "/ شەو",');

fs.writeFileSync(path, code);
