const fs = require('fs');
const path = 'src/i18n/translations.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace('becomeHostToday: "Become a host today.",', 'becomeHostToday: "Become a host today.",\n    becomeHost: "Become a Host",');
code = code.replace('becomeHostToday: "كن مضيفاً اليوم.",', 'becomeHostToday: "كن مضيفاً اليوم.",\n    becomeHost: "كن مضيفاً",');
code = code.replace('becomeHostToday: "ئەمڕۆ ببە بە خانەخوێ.",', 'becomeHostToday: "ئەمڕۆ ببە بە خانەخوێ.",\n    becomeHost: "ببە بە خانەخوێ",');

fs.writeFileSync(path, code);
