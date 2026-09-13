const fs = require('fs');
const path = 'src/i18n/translations.ts';
let code = fs.readFileSync(path, 'utf8');

const enKeys = `
    comingSoonPioneer: "Coming Soon • Kurdistan Pioneer Pre-Launch",
    launchingSoon: "Meewano is launching soon!",
    becomeHostToday: "Become a host today.",
    preLaunchHeroSubtitle: "Kurdistan’s dedicated vacation rental platform. Pre-register your villa, chalet, or modern apartment across Erbil, Sulaymaniyah, Duhok, Rawanduz, and beyond.",
    previewDemoStays: "Preview Demo Stays",
    hostDashboardMyProps: "Host Dashboard (My Properties)",
    visitKurdistan: "Visit Kurdistan",
    blog: "Blog",
    navWhatIsMeewano: "What is Meewano?",
    navHostFaq: "Host FAQ",
`;

const arKeys = `
    comingSoonPioneer: "قريباً • إطلاق تجريبي لرواد كردستان",
    launchingSoon: "ميوانو سينطلق قريباً!",
    becomeHostToday: "كن مضيفاً اليوم.",
    preLaunchHeroSubtitle: "منصة تأجير العطلات المخصصة في كردستان. سجل مسبقاً فيلتك، شاليهك، أو شقتك الحديثة في أربيل، السليمانية، دهوك، رواندز وما بعدها.",
    previewDemoStays: "استعرض العقارات التجريبية",
    hostDashboardMyProps: "لوحة تحكم المضيف (عقاراتي)",
    visitKurdistan: "زوروا كردستان",
    blog: "المدونة",
    navWhatIsMeewano: "ما هو ميوانو؟",
    navHostFaq: "أسئلة المضيف",
`;

const kuKeys = `
    comingSoonPioneer: "بەمنزیکانە • قۆناغی پێش-کردنەوەی پێشەنگانی کوردستان",
    launchingSoon: "میوانۆ بەمنزیکانە دەکرێتەوە!",
    becomeHostToday: "ئەمڕۆ ببە بە خانەخوێ.",
    preLaunchHeroSubtitle: "پلاتفۆرمی تایبەتی کرێی پشووەکان لە کوردستان. پێشوەختە ڤێلا، کۆخ، یان شوقە مۆدێرنەکەت تۆمار بکە لە هەولێر، سلێمانی، دهۆک، ڕواندز، و زیاتریش.",
    previewDemoStays: "پێشاندانی موڵکە تاقیکارییەکان",
    hostDashboardMyProps: "داشبۆردی خانەخوێ (موڵکەکانم)",
    visitKurdistan: "سەردانی کوردستان بکە",
    blog: "بلۆگ",
    navWhatIsMeewano: "میوانۆ چییە؟",
    navHostFaq: "پرسیارەکانی خانەخوێ",
`;

code = code.replace('en: {', 'en: {' + enKeys);
code = code.replace('ar: {', 'ar: {' + arKeys);
code = code.replace('ku: {', 'ku: {' + kuKeys);

fs.writeFileSync(path, code);
