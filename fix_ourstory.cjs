const fs = require('fs');
const path = 'src/i18n/translations.ts';
let code = fs.readFileSync(path, 'utf8');

// For English
code = code.replace(/ourStoryVision: "Our Story",/, 'ourStoryOld: "Our Story",');
// For Arabic
code = code.replace(/ourStoryVision: "قصتنا",/, 'ourStoryOld: "قصتنا",');
// For Kurdish
code = code.replace(/ourStoryVision: "چیرۆکمان",/, 'ourStoryOld: "چیرۆکمان",');

fs.writeFileSync(path, code);
