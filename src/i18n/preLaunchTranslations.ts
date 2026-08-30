export interface PreLaunchTranslations {
  // Top Header & Nav
  badgeText: string;
  preLaunchTag: string;
  navAbout: string;
  navShowcase: string;
  navPerks: string;
  navCalculator: string;
  navFaq: string;
  liveApp: string;
  preRegisterHostBtn: string;
  switchLanguage: string;

  // Hero Section
  heroTitle: string;
  heroSubtitle: string;
  preRegisterCta: string;
  exploreShowcaseCta: string;
  countdownTitle: string;
  days: string;
  hours: string;
  minutes: string;
  seconds: string;

  // Stats Ribbon
  statHostsCount: string;
  statHostsLabel: string;
  statCitiesCount: string;
  statCitiesLabel: string;
  statCommissionValue: string;
  statCommissionLabel: string;
  statPayoutValue: string;
  statPayoutLabel: string;

  // About Section (What is Meewan?)
  aboutBadge: string;
  aboutTitle: string;
  aboutTagline: string;
  aboutParagraph1: string;
  aboutParagraph2: string;
  aboutPillar1: string;
  aboutPillar2: string;
  aboutPillar3: string;
  aboutPillar4: string;
  showcaseCardTag: string;
  showcaseCardTitle: string;
  showcaseCardSub: string;
  showcaseCardBadge: string;

  // Kurdistan Showcase Demo Properties
  showcaseBadge: string;
  showcaseTitle: string;
  showcaseSubtitle: string;
  regionAll: string;
  regionErbil: string;
  regionSulaymaniyah: string;
  regionDuhok: string;
  regionRawanduz: string;
  regionShaqlawa: string;
  regionSoran: string;
  regionHalabja: string;
  demoListingBadge: string;
  bedsLabel: string;
  bathsLabel: string;
  guestsLabel: string;
  estNightlyRate: string;
  inspectDemoBtn: string;
  havePropertyBannerTitle: string;
  havePropertyBannerSub: string;
  havePropertyBannerBtn: string;

  // Perks / Benefits
  perksBadge: string;
  perksTitle: string;
  perksSubtitle: string;
  perk1Title: string;
  perk1Desc: string;
  perk2Title: string;
  perk2Desc: string;
  perk3Title: string;
  perk3Desc: string;
  perk4Title: string;
  perk4Desc: string;
  perk5Title: string;
  perk5Desc: string;
  perk6Title: string;
  perk6Desc: string;

  // Calculator
  calcBadge: string;
  calcTitle: string;
  calcSubtitle: string;
  calcRateLabel: string;
  calcNightsLabel: string;
  calcMonthlyTitle: string;
  calcMonthlyNote: string;
  calcYearlyTitle: string;
  calcYearlyNote: string;
  nightsUnit: string;

  // Pre-Registration Form
  formBadge: string;
  formTitle: string;
  formSubtitle: string;
  formFullName: string;
  formFullNamePlaceholder: string;
  formPhone: string;
  formPhonePlaceholder: string;
  formEmail: string;
  formEmailPlaceholder: string;
  formCity: string;
  formCityPlaceholder: string;
  formPropType: string;
  formPropTypePlaceholder: string;
  formBedrooms: string;
  formGuests: string;
  formExperience: string;
  formNotes: string;
  formNotesPlaceholder: string;
  formSubmitBtn: string;
  formSubmittingBtn: string;
  formPrivacyNote: string;

  // Property types & options
  typeChalet: string;
  typeApartment: string;
  typeFarmhouse: string;
  typeHeritage: string;
  typeGuesthouse: string;

  expNew: string;
  expExisting: string;
  expPro: string;

  // Success Dialog
  successTitle: string;
  successDesc: string;
  successHostName: string;
  successCity: string;
  successPropType: string;
  successStatus: string;
  successStatusValue: string;
  successWhatsAppBtn: string;
  successCloseBtn: string;

  // Demo Property Modal
  modalDemoBadge: string;
  modalSimulatedPrice: string;
  modalHostContact: string;
  modalListSimilarBtn: string;
  modalCloseBtn: string;

  // FAQs
  faqBadge: string;
  faqTitle: string;
  faq1Q: string;
  faq1A: string;
  faq2Q: string;
  faq2A: string;
  faq3Q: string;
  faq3A: string;
  faq4Q: string;
  faq4A: string;
  faq5Q: string;
  faq5A: string;

  // Footer
  footerSlogan: string;
  footerRights: string;
}

export const preLaunchContent: Record<"en" | "ku" | "ar", PreLaunchTranslations> = {
  en: {
    badgeText: "Exclusive Pre-Launch • Become a Pioneer Founding Host",
    preLaunchTag: "Pre-Launch",
    navAbout: "What is Meewano?",
    navShowcase: "Kurdistan Showcase",
    navPerks: "Host Benefits",
    navCalculator: "Earnings",
    navFaq: "FAQ",
    liveApp: "Live Platform",
    preRegisterHostBtn: "Pre-Register Host",
    switchLanguage: "Language",

    heroTitle: "Empowering Kurdistan's Hosts to Welcome the World",
    heroSubtitle:
      "Meewano is Kurdistan's premier vacation rental and boutique stay platform. Turn your home, mountain chalet, or villa into a high-earning hospitality destination.",
    preRegisterCta: "Pre-Register Your Property",
    exploreShowcaseCta: "Explore Kurdistan Showcase",
    countdownTitle: "Official Kurdistan Public Launch In",
    days: "Days",
    hours: "Hours",
    minutes: "Minutes",
    seconds: "Seconds",

    statHostsCount: "340+",
    statHostsLabel: "Pre-Registered Hosts",
    statCitiesCount: "16",
    statCitiesLabel: "Cities & Mountain Towns",
    statCommissionValue: "100%",
    statCommissionLabel: "Direct Control Over Bookings",
    statPayoutValue: "IQD & USD",
    statPayoutLabel: "Direct Payouts & Transparent Pricing",

    aboutBadge: "Our Story & Heritage",
    aboutTitle: "What is Meewano? (میوانۆ)",
    aboutTagline: "Rooted in Kurdish Generosity. Built for Modern Hospitality.",
    aboutParagraph1:
      "Meewano (from the Kurdish word 'میوانۆ' meaning 'Beloved Guest') is Iraqi Kurdistan's dedicated home rental and boutique stay platform. We connect local homeowners in Erbil, Sulaymaniyah, Duhok, Rawanduz, and beyond with travelers seeking authentic Kurdish stays.",
    aboutParagraph2:
      "Meewano is tailored specifically for Kurdistan with direct payouts, local language support, and hands-on host assistance.",
    aboutPillar1: "Kurdish Identity & Trust Verification",
    aboutPillar2: "Seamless Local Payment Methods",
    aboutPillar3: "Full Calendar & Pricing Independence",
    aboutPillar4: "24/7 Dedicated Host Support in Sorani, Badini, Arabic & English",
    showcaseCardTag: "Featured Stay",
    showcaseCardTitle: "Rawanduz Canyon Overlook Chalet",
    showcaseCardSub: "Listed by Kak Shwan • 180,000 IQD / night",
    showcaseCardBadge: "Pre-Launch Verified",

    showcaseBadge: "Live Prototype Listings",
    showcaseTitle: "Explore Kurdistan Demo Properties",
    showcaseSubtitle:
      "See how properties in Erbil, Sulaymaniyah, Duhok, Rawanduz, and Shaqlawa will appear to verified travelers on Meewano.",
    regionAll: "All Regions",
    regionErbil: "Erbil",
    regionSulaymaniyah: "Sulaymaniyah",
    regionDuhok: "Duhok & Amedi",
    regionRawanduz: "Rawanduz & Soran",
    regionShaqlawa: "Shaqlawa",
    regionSoran: "Soran",
    regionHalabja: "Halabja",
    demoListingBadge: "Demo Listing",
    bedsLabel: "Beds",
    bathsLabel: "Baths",
    guestsLabel: "Guests",
    estNightlyRate: "Est. Nightly Rate",
    inspectDemoBtn: "Inspect Demo →",
    havePropertyBannerTitle: "Have a property in Kurdistan like these?",
    havePropertyBannerSub:
      "Join 340+ local homeowners pre-registering their villas, chalets, and city flats today.",
    havePropertyBannerBtn: "Pre-Register Now →",

    perksBadge: "Host Privileges",
    perksTitle: "Why Pre-Register as a Host?",
    perksSubtitle:
      "Early hosts receive dedicated marketing promotion and hands-on onboarding across Kurdistan.",
    perk1Title: "Direct Guest Bookings",
    perk1Desc:
      "Connect with travelers seeking quality stays in Kurdistan with full transparency.",
    perk2Title: "High-Quality Presentation",
    perk2Desc:
      "Showcase your property with rich descriptions, verified details, and high-resolution galleries.",
    perk3Title: "Verified Host Status",
    perk3Desc:
      "Your listing will display verified authenticity badges, building instant credibility and trust with guests.",
    perk4Title: "Flexible Payment Options",
    perk4Desc:
      "Convenient settlement options in IQD or USD immediately upon guest check-in.",
    perk5Title: "Dedicated Local Account Manager",
    perk5Desc:
      "Get direct assistance with your dedicated Meewano onboarding concierge in Kurdistan.",
    perk6Title: "Priority Search Ranking",
    perk6Desc:
      "Pre-registered properties receive top placement across search results during our public launch.",

    calcBadge: "Live Revenue Estimator",
    calcTitle: "How Much Could Your Property Earn on Meewano?",
    calcSubtitle:
      "Adjust nightly rate and occupancy to estimate your earnings in Iraqi Dinar (IQD).",
    calcRateLabel: "Expected Price per Night",
    calcNightsLabel: "Estimated Nights Booked / Month",
    calcMonthlyTitle: "Est. Monthly Earnings",
    calcMonthlyNote: "Estimated gross hosting revenue",
    calcYearlyTitle: "Est. Annual Revenue",
    calcYearlyNote: "Based on 12 months average projection",
    nightsUnit: "Nights",

    formBadge: "Join as a Host",
    formTitle: "Pre-Register as a Meewano Host",
    formSubtitle:
      "Takes less than 2 minutes. Our Kurdish host onboarding team will reach out to verify your listing.",
    formFullName: "Full Name *",
    formFullNamePlaceholder: "e.g. Dana H. Ahmad",
    formPhone: "Phone Number (WhatsApp) *",
    formPhonePlaceholder: "e.g. 0750 000 0000",
    formEmail: "Email Address *",
    formEmailPlaceholder: "e.g. dana@example.com",
    formCity: "City / Governorate in Kurdistan *",
    formCityPlaceholder: "Select city",
    formPropType: "Property Type",
    formPropTypePlaceholder: "Select property type",
    formBedrooms: "Bedrooms",
    formGuests: "Max Guests",
    formExperience: "Hosting Experience",
    formNotes: "Tell us about your property (Optional)",
    formNotesPlaceholder:
      "e.g. Mountain views, private pool, stone fireplace, fast internet, peaceful neighborhood...",
    formSubmitBtn: "Confirm My Host Pre-Registration →",
    formSubmittingBtn: "Submitting Pre-Registration...",
    formPrivacyNote:
      "🔒 Your contact information is kept strictly confidential and used only by our onboarding concierge.",

    typeChalet: "Chalet / Mountain Villa",
    typeApartment: "Apartment / Modern Flat",
    typeFarmhouse: "Farmhouse / Resort Villa",
    typeHeritage: "Traditional Heritage House",
    typeGuesthouse: "Private Guesthouse / Room",

    expNew: "New to hosting (First time)",
    expExisting: "Currently hosting on other platforms",
    expPro: "Professional property manager / Real estate",

    successTitle: "Welcome, Founding Host! 🎉",
    successDesc:
      "Your host pre-registration has been successfully recorded. Our Kurdish onboarding manager will contact you within 24-48 hours.",
    successHostName: "Host Name:",
    successCity: "Location:",
    successPropType: "Property Type:",
    successStatus: "Pioneer Status:",
    successStatusValue: "0% Fees Guaranteed",
    successWhatsAppBtn: "Contact Host Concierge on WhatsApp",
    successCloseBtn: "Close",

    modalDemoBadge: "Demo Prototype",
    modalSimulatedPrice: "Simulated Price",
    modalHostContact: "Host Contact",
    modalListSimilarBtn: "List a Similar Property on Meewano →",
    modalCloseBtn: "Close",

    faqBadge: "Frequently Asked Questions",
    faqTitle: "Got Questions About Meewano?",
    faq1Q: "Does it cost anything to pre-register as a host on Meewano?",
    faq1A:
      "No, pre-registration is free with zero upfront commitments.",
    faq2Q: "How and when do I get paid for bookings?",
    faq2A:
      "Payouts are processed securely upon guest check-in via your preferred payment method in IQD or USD.",
    faq3Q: "How is my listing verified?",
    faq3A:
      "Once your listing is pre-registered, our team in Kurdistan will review and verify your property details.",
    faq4Q: "Can I manage my own house rules and calendar?",
    faq4A:
      "Absolutely. You have 100% control over your nightly pricing, minimum stays, check-in rules, and availability calendar.",
    faq5Q: "What if I need help managing my property?",
    faq5A:
      "Meewano provides a dedicated Kurdish and Arabic account manager on WhatsApp and phone to assist you with pricing, calendar sync, and guest communications.",

    footerSlogan: "Kurdistan's Dedicated Vacation Rental & Boutique Stay Platform",
    footerRights: "Meewano Inc. All rights reserved.",
  },

  ku: {
    badgeText: "پێش-دەستپێکردنی تایبەت • ببە بە یەکەمین خانەخوێی دەستپێکەر لە کوردستان",
    preLaunchTag: "پێش-دەستپێکردن",
    navAbout: "میوانۆ چییە؟",
    navShowcase: "موڵکەکانی کوردستان",
    navPerks: "سوودەکانی خانەخوێ",
    navCalculator: "داهات",
    navFaq: "پرسیارە باوەکان",
    liveApp: "پلاتفۆرمی زیندوو",
    preRegisterHostBtn: "تۆمارکردن وەک خانەخوێ",
    switchLanguage: "زمان",

    heroTitle: "بەهێزکردنی خانەخوێکانی کوردستان بۆ پێشوازیکردن لە جیهان",
    heroSubtitle:
      "میوانۆ یەکەمین و پێشکەوتووترین پلاتفۆرمی ڤێلا، باخ، مەنزەڵ و خانووە لە هەرێمی کوردستان. موڵکەکەت بکە بە سەرچاوەی داهاتێکی بەرز بە ٠٪ ڕسومات لە ماوەی دەستپێکردندا.",
    preRegisterCta: "تۆمارکردنی موڵکەکەم",
    exploreShowcaseCta: "سەیرکردنی موڵکە نموونەییەکان",
    countdownTitle: "دەستپێکردنی فەرمی و گشتی لە کوردستان پاش",
    days: "ڕۆژ",
    hours: "کاتژمێر",
    minutes: "خولەک",
    seconds: "چرکە",

    statHostsCount: "٣٤٠+",
    statHostsLabel: "خانەخوێی پێش-تۆمارکراو",
    statCitiesCount: "١٦",
    statCitiesLabel: "شار و ناوچەی کوردستان",
    statCommissionValue: "٠٪",
    statCommissionLabel: "ڕسومات بۆ دەستپێکەران (٦ مانگ)",
    statPayoutValue: "دینار و دۆلار",
    statPayoutLabel: "پارەدان بە FastPay و FIB و کاش",

    aboutBadge: "چیرۆک و کلتووری ئێمە",
    aboutTitle: "میوانۆ (Meewano) چییە؟",
    aboutTagline: "ڕیشە لە میواندۆستی کوردی، دروستکراو بە تەکنەلۆژیای سەردەم.",
    aboutParagraph1:
      "میوانۆ (لە وشەی کوردی 'میوانۆ' و میواندارییەوە وەرگیراوە) یەکەمین پلاتفۆرمی دیجیتاڵیی تایبەت بە هەرێمی کوردستانە بۆ بەکرێدانی ڕۆژانەی ڤێلا، باخ، مەنزەڵی شاخاوی و خانووە گەشتیارییەکان. ئێمە خاوەن موڵکە خۆماڵییەکان دەبەستینەوە بە گەشتیارانی هەرێم، عێراق و سەرتاسەری جیهان.",
    aboutParagraph2:
      "بە پێچەوانەی ئەپڵیکەیشنە جیهانییەکان کە شێوازی پارەدانی خۆماڵی و پشتیوانیی ناوخۆییان نییە، میوانۆ بە تایبەتی بۆ کوردستان دروستکراوە بە پارەدانی خێرا و ڕاستەوخۆ بە دینار و دۆلار، پشتیوانی بە زمانی کوردی، و خزمەتگوزاریی بەردەوام بۆ خانەخوێیەکان.",
    aboutPillar1: "ناسنامە و دڵنیایی کوردی (پشتڕاستکردنەوەی خاوەن موڵک و میوان)",
    aboutPillar2: "وەرگرتنی ڕاستەوخۆی پارە بە FastPay, FIB, ZainCash و کاش",
    aboutPillar3: "کۆنترۆڵی تەواوی نرخ و ڕۆژمێری مانگانە",
    aboutPillar4: "تیم و پشتیوانیی خۆماڵی بەردەوام بە کوردی (سۆرانی، بادینی)، عەرەبی و ئینگلیزی",
    showcaseCardTag: "نموونەی دەستپێکەر",
    showcaseCardTitle: "مەنزەڵی بەرزاییەکانی دۆڵی ڕەواندز",
    showcaseCardSub: "تۆمارکراوە لەلایەن کاک شوان • ١٨٠,٠٠٠ دینار / شەو",
    showcaseCardBadge: "پشتڕاستکراوەی میوانۆ",

    showcaseBadge: "نموونەی موڵکەکان",
    showcaseTitle: "موڵکە نموونەییەکانی کوردستان بپشکنە",
    showcaseSubtitle:
      "سەیر بکە چۆن ڤێلا، مەنزەڵ و باخەکانی هەولێر، سلێمانی، دهۆک، ڕەواندز و شەقڵاوە لەسەر میوانۆ دەردەکەون بۆ گەشتیاران.",
    regionAll: "هەموو ناوچەکان",
    regionErbil: "هەولێر",
    regionSulaymaniyah: "سلێمانی",
    regionDuhok: "دهۆک و ئامێدی",
    regionRawanduz: "ڕەواندز و سۆران",
    regionShaqlawa: "شەقڵاوە",
    regionSoran: "سۆران",
    regionHalabja: "هەڵەبجە",
    demoListingBadge: "نموونەی موڵک",
    bedsLabel: "نوستن",
    bathsLabel: "گەرماو",
    guestsLabel: "میوان",
    estNightlyRate: "نرخی خەمڵێنراو بۆ شەوێک",
    inspectDemoBtn: "بینینی وردەکاری ←",
    havePropertyBannerTitle: "موڵکێکت هەیە لە کوردستان هاوشێوەی ئەمانە؟",
    havePropertyBannerSub:
      "پەیوەندی بکە بە زیاتر لە ٣٤٠ خاوەن موڵک کە پێشوەختە ڤێلا و باخەکانیان تۆمار دەکەن.",
    havePropertyBannerBtn: "تۆمارکردنی موڵکەکەم ئێستا ←",

    perksBadge: "تایبەتمەندییەکانی خانەخوێی دەستپێکەر",
    perksTitle: "بۆچی پێشوەختە وەک خانەخوێ تۆمار بکەیت؟",
    perksSubtitle:
      "خانەخوێیە سەرەتاییەکان دەستکەوتی بێوێنە و ٠٪ ڕسومات و ڕیکلامی تایبەت لە سەرتاسەری کوردستان بەدەست دەهێنن.",
    perk1Title: "٠٪ ڕسوومات بۆ ماوەی ٦ مانگ",
    perk1Desc:
      "١٠٠٪ی داهاتی بەکرێدانی موڵکەکەت بۆ خۆت بهێڵەرەوە. خانەخوێیە دەستپێکەرەکان هیچ بڕە پارەیەک وەک ڕسوومات نادەن لە شەش مانگی یەکەمدا.",
    perk2Title: "فۆتۆگرافەری پرۆفیشناڵ بە بێبەرامبەر",
    perk2Desc:
      "تیمی وێنەگرتنی میوانۆ سەردانی موڵکەکەت دەکات لە کوردستان و بە جوانترین کوالیتی وێنەی دەگرێت بێ هیچ تێچوویەک.",
    perk3Title: "باجی خانەخوێی دەستپێکەری VIP",
    perk3Desc:
      "موڵکەکەت باجی تایبەتی 'خانەخوێی دەستپێکەر'ی پێدەبەخشرێت، کە متمانە و سەرنجڕاکێشیی خێرا لای گەشتیاران دروست دەکات.",
    perk4Title: "وەرگرتنی خێرای داهات بە FIB و فاستپەی",
    perk4Desc:
      "داهاتەکەت ڕاستەوخۆ دەگاتە دەستت بە FIB، FastPay، ZainCash یان کاش بە دینار یان دۆلار دەستبەجێ لە کاتی گەیشتنی میواندا.",
    perk5Title: "بەڕێوەبەری تایبەتی ئەکاونت لە کوردستان",
    perk5Desc:
      "پەیوەندیی ڕاستەوخۆ بە مۆبایل و واتسئاپ لەگەڵ ڕاوێژکاری تایبەتی خۆت لە میوانۆ بۆ هاوکاری لە هەموو کاتێکدا.",
    perk6Title: "دەرکەوتن لە پلەی یەکەمی گەڕانەکان",
    perk6Desc:
      "موڵکە پێش-تۆمارکراوەکان لە ڕیزی پێشەوەی ئەنجامەکانی گەڕاندا پیشان دەدرێن لە کاتی دەستپێکردنی گشتی پلاتفۆرمەکەدا.",

    calcBadge: "خەمڵێنەری زیندووی داهات",
    calcTitle: "چەند دەتوانیت قازانج بکەیت لە ڕێگەی میوانۆ؟",
    calcSubtitle:
      "نرخی شەوانە و ڕۆژانی بەکرێدان دیاری بکە بۆ زانینی داهاتی مانگانە و ساڵانەت بە دیناری عێراقی.",
    calcRateLabel: "نرخی چاوەڕوانکراو بۆ هەر شەوێک",
    calcNightsLabel: "شەوانی بەکرێدراو لە مانگێکدا",
    calcMonthlyTitle: "داهاتی خەمڵێنراوی مانگانە",
    calcMonthlyNote: "٠٪ ڕسومات لە ماوەی دەستپێکردنی میوانۆدا",
    calcYearlyTitle: "داهاتی خەمڵێنراوی ساڵانە",
    calcYearlyNote: "بەپێی تێکڕای ١٢ مانگی ساڵ",
    nightsUnit: "شەو",

    formBadge: "ببە بە خانەخوێی دەستپێکەر",
    formTitle: "پێش-تۆمارکردن وەک خانەخوێی میوانۆ",
    formSubtitle:
      "کەمتر لە ٢ خولەکی پێدەچێت. هیچ پارەیەکی پێشوەختە نییە. تیمی میوانۆ لە کوردستان پەیوەندیت پێوە دەکات بۆ سەردان و وێنەگرتنی موڵکەکەت.",
    formFullName: "ناوی سیانی *",
    formFullNamePlaceholder: "وەک: دانا حەمە ئەحمەد",
    formPhone: "ژمارەی مۆبایل (واتسئاپ) *",
    formPhonePlaceholder: "وەک: 0750 000 0000",
    formEmail: "ئیمەیڵ *",
    formEmailPlaceholder: "وەک: dana@example.com",
    formCity: "شار / پارێزگا لە کوردستان *",
    formCityPlaceholder: "شار هەڵبژێرە",
    formPropType: "جۆری موڵک",
    formPropTypePlaceholder: "جۆری موڵک دیاری بکە",
    formBedrooms: "ژووری نوستن",
    formGuests: "ئەوپەڕی میوان",
    formExperience: "ئەزموونی خانەخوێیەتی",
    formNotes: "دەربارەی تایبەتمەندییەکانی موڵکەکەت (ئارەزوومەندانە)",
    formNotesPlaceholder:
      "وەک: دیمەنی شاخ، مەلەوانگەی تایبەت، ئاگردان، ئینتەرنێتی خێرا، گەڕەکی ئارام...",
    formSubmitBtn: "تەواوکردنی پێش-تۆمارکردن ←",
    formSubmittingBtn: "تۆمارکردنی زانیارییەکان...",
    formPrivacyNote:
      "🔒 زانیارییەکانت پارێزراوە و تەنها بۆ پەیوەندیکردنی تیمی میوانۆ لە کوردستان بەکاردێت.",

    typeChalet: "مەنزەڵی شاخاوی / ڤێلا",
    typeApartment: "شوقە / فلات",
    typeFarmhouse: "باخ / مەنزەڵی گەشتیاری",
    typeHeritage: "خانووی کەلەپووری و دێرین",
    typeGuesthouse: "میوانخانە / ژووری تایبەت",

    expNew: "تازەم لە خانەخوێیەتی (یەکەمجارمە)",
    expExisting: "لە پلاتفۆرمی تر موڵکم هەیە",
    expPro: "بەڕێوەبەری پرۆفیشناڵی موڵک / نووسینگەی خانوبەرە",

    successTitle: "پیرۆزە، بەخێربێیت بۆ میوانۆ! 🎉",
    successDesc:
      "زانیارییەکانی موڵکەکەت بە سەرکەوتوویی تۆمارکران. نوێنەری میوانۆ لە ماوەی ٢٤ بۆ ٤٨ کاتژمێردا لە ڕێگەی واتسئاپەوە پەیوەندیت پێوە دەکات.",
    successHostName: "ناوی خانەخوێ:",
    successCity: "شوێن:",
    successPropType: "جۆری موڵک:",
    successStatus: "پێگەی دەستپێکەر:",
    successStatusValue: "٠٪ ڕسومات گەرەنتی کراوە",
    successWhatsAppBtn: "پەیوەندیکردن بە واتسئاپ لەگەڵ تیمی میوانۆ",
    successCloseBtn: "داخستن",

    modalDemoBadge: "نموونەی تاقیکاری",
    modalSimulatedPrice: "نرخی خەمڵێنراو",
    modalHostContact: "خانەخوێ",
    modalListSimilarBtn: "موڵکێکی هاوشێوە لەسەر میوانۆ تۆمار بکە ←",
    modalCloseBtn: "داخستن",

    faqBadge: "پرسیارە باوەکان",
    faqTitle: "پرسیارت هەیە دەربارەی میوانۆ؟",
    faq1Q: "ئایا پێش-تۆمارکردن وەک خانەخوێ پارەی تێدەچێت؟",
    faq1A:
      "نەخێر! پێش-تۆمارکردن ١٠٠٪ بێبەرامبەرە و هیچ مەرجێکی پارەدان نییە. خانەخوێیە دەستپێکەرەکان بۆ ماوەی ٦ مانگ لە ٠٪ ڕسومات سوودمەند دەبن.",
    faq2Q: "چۆن و کەی پارەی حجزکردنەکان وەردەگرم؟",
    faq2A:
      "داهاتەکەت دەستبەجێ لە کاتی هاتنی میوان لە ڕێگەی FastPay, First Iraqi Bank (FIB), ZainCash یان کاش بە دینار یان دۆلار دەدرێت بە دەستت.",
    faq3Q: "ئایا وێنەگرتنی پرۆفیشناڵ بەڕاستی بێبەرامبەرە؟",
    faq3A:
      "بەڵێ! تیمی فۆتۆگرافەری پرۆفیشناڵی میوانۆ سەردانی موڵکەکەت دەکات لە هەر ناوچەیەکی کوردستان بێت و وێنەی کوالیتی بەرز دەگرێت بەبێ هیچ تێچوویەک.",
    faq4Q: "ئایا دەتوانم نرخ و یاساکانی موڵکەکەم خۆم دیاری بکەم؟",
    faq4A:
      "بەڵێ بە دڵنیاییەوە. تۆ کۆنترۆڵی ١٠٠٪ت هەیە لەسەر دیاریکردنی نرخ، ڕۆژەکانی بەردەستبوون، و یاساکانی ناو ماڵەکەت.",
    faq5Q: "ئەگەر پێویستم بە یارمەتی بێت لە بەڕێوەبردنی موڵکەکەمدا؟",
    faq5A:
      "میوانۆ بەڕێوەبەری تایبەت بە زمانەکانی کوردی و عەرەبی بە مۆبایل و واتسئاپ دابین دەکات بۆ یارمەتیدانت لە هەموو هەنگاوێکدا.",

    footerSlogan: "پلاتفۆرمی تایبەتی گەشتیاری و میوانداری لە هەرێمی کوردستان",
    footerRights: "کۆمپانیای میوانۆ. هەموو مافەکان پارێزراون.",
  },

  ar: {
    badgeText: "إطلاق تمهيدي حصري • كن من أوائل المضيفين الرواد في كوردستان",
    preLaunchTag: "الإطلاق التجريبي",
    navAbout: "ما هو میوانۆ؟",
    navShowcase: "إقامات كوردستان",
    navPerks: "مزايا المضيف",
    navCalculator: "الأرباح",
    navFaq: "الأسئلة الشائعة",
    liveApp: "المنصة المباشرة",
    preRegisterHostBtn: "تسجيل كمضيف",
    switchLanguage: "اللغة",

    heroTitle: "تمكين مضيفي كوردستان لاستقبال العالم بأعلى معايير الضيافة",
    heroSubtitle:
      "میوانۆ (Meewano) هي المنصة الرائدة لحجز الشاليهات، الفلل، والمنازل السياحية في إقليم كوردستان. حوّل عقارك إلى مصدر دخل مجزٍ بعمولة ٠٪ طوال فترة الإطلاق.",
    preRegisterCta: "سجّل عقارك كمضيف رائد",
    exploreShowcaseCta: "استكشف نماذج الإقامات",
    countdownTitle: "موعد الإطلاق الرسمي العام في كوردستان",
    days: "أيام",
    hours: "ساعات",
    minutes: "دقائق",
    seconds: "ثواني",

    statHostsCount: "٣٤٠+",
    statHostsLabel: "مضيف مسجّل مسبقاً",
    statCitiesCount: "١٦",
    statCitiesLabel: "مدينة ومصيف في كوردستان",
    statCommissionValue: "٠٪",
    statCommissionLabel: "رسوم المضيفين الرواد (٦ أشهر)",
    statPayoutValue: "دينار ودولار",
    statPayoutLabel: "دفع فوري عبر FIB و FastPay ونقداً",

    aboutBadge: "أصالتنا وتاريخنا",
    aboutTitle: "ما هو میوانۆ؟ (Meewano)",
    aboutTagline: "أصالة الضيافة الكوردية العريقة بتقنيات عصرية مبتكرة.",
    aboutParagraph1:
      "میوانۆ (المشتقة من الكلمة الكوردية 'میوانۆ' وتعني 'الضيف العزيز') هي المنصة الرقمية المتخصصة الأولى في إقليم كوردستان لحجز الشاليهات الجبلية، الفلل، المزارع والمنازل التراثية بنظام الإيجار اليومي. نربط المضيفين المحليين بالمسافرين من الإقليم والعراق والعالم.",
    aboutParagraph2:
      "بخلاف المنصات العالمية التي تفتقر لطرق الدفع المحلية والدعم الإقليمي المباشر، صُممت میوانۆ خصيصاً لواقع كوردستان من خلال التحويلات النقدية السريعة بالدينار والدولار، والدعم الفني باللغات الكوردية والعربية والإنجليزية.",
    aboutPillar1: "التحقق من الهوية والأمان الموثوق للطرفين",
    aboutPillar2: "تحويلات مالية سريعة عبر FastPay و FIB و ZainCash ونقداً",
    aboutPillar3: "تحكم كامل بالأسعار وتقويم الحجوزات والشروط",
    aboutPillar4: "فريق دعم محلي متواجد 24/7 بالكوردية (السورانية والبادينية) والعربية والإنجليزية",
    showcaseCardTag: "نموذج رائد",
    showcaseCardTitle: "شاليه إطلالة وادي ورواندز الجبلي",
    showcaseCardSub: "مقدم من كاك شوان • ١٨٠,٠٠٠ دينار / ليلة",
    showcaseCardBadge: "تم التحقق مسبقاً",

    showcaseBadge: "نماذج الإقامات التجريبية",
    showcaseTitle: "استكشف نماذج العقارات في كوردستان",
    showcaseSubtitle:
      "شاهد كيف ستظهر شاليهات وفلل ومنازل أربيل، السليمانية، دهوك، رواندز وشقلاوة للمسافرين عبر منصة میوانۆ.",
    regionAll: "جميع المناطق",
    regionErbil: "أربيل",
    regionSulaymaniyah: "السليمانية",
    regionDuhok: "دهوك والعمادية",
    regionRawanduz: "رواندز وسوران",
    regionShaqlawa: "شقلاوة",
    regionSoran: "سوران",
    regionHalabja: "حلبجة",
    demoListingBadge: "نموذج تجريبي",
    bedsLabel: "غرف نوم",
    bathsLabel: "حمامات",
    guestsLabel: "ضيوف",
    estNightlyRate: "السعر المتوقع لليلة",
    inspectDemoBtn: "استعراض النموذج ←",
    havePropertyBannerTitle: "هل تمتلك عقاراً مشابهاً في كوردستان؟",
    havePropertyBannerSub:
      "انضم إلى أكثر من ٣٤٠ مالك عقار يسجلون فللهم وشاليهاتهم اليوم لبدء جني الأرباح.",
    havePropertyBannerBtn: "سجّل عقارك الآن ←",

    perksBadge: "مزايا المضيفين الرواد",
    perksTitle: "لماذا التسجيل المسبق كمضيف في میوانۆ؟",
    perksSubtitle:
      "يحصل المضيفون الأوائل على مزايا حصرية وعمولة صفرية وحملات ترويجية مخصصة في كافة أنحاء كوردستان والعراق.",
    perk1Title: "٠٪ عمولة طوال أول ٦ أشهر",
    perk1Desc:
      "احتفظ بكامل أرباحك بنسبة ١٠٠٪. لا يدفع المضيفون المؤسسون أي عمولة للمنصة طوال أول ستة أشهر من الإطلاق على میوانۆ.",
    perk2Title: "جلسة تصوير احترافية مجانية",
    perk2Desc:
      "سيرسل فريقنا مصوراً عقارياً محترفاً لتوثيق وتصوير عقارك في كوردستان بأعلى جودة مجاناً تماماً.",
    perk3Title: "شارة مضيف مؤسس VIP",
    perk3Desc:
      "يحصل عقارك على شارة 'مضيف مؤسس' الحصرية، مما يمنح إقامتك ثقة فورية وأولوية لدى النزلاء.",
    perk4Title: "استلام سريع للأرباح عبر FIB و FastPay",
    perk4Desc:
      "تصلك مستحقاتك مباشرة عبر FIB أو FastPay أو ZainCash أو نقداً بالدينار أو الدولار فور تسجيل وصول الضيف.",
    perk5Title: "مدير حسابات مخصص في كوردستان",
    perk5Desc:
      "تواصل مباشر عبر الهاتف والواتساب مع مدير الحساب المخصص لمساعدتك في ضبط الأسعار وتنسيق الحجوزات.",
    perk6Title: "أولوية الظهور في نتائج البحث الأولى",
    perk6Desc:
      "تظهر العقارات المسجلة مسبقاً في صدارة نتائج البحث عند إطلاق المنصة رسمياً للجمهور.",

    calcBadge: "حاسبة الأرباح التقديرية",
    calcTitle: "كم يمكنك أن تجني من عقارك عبر میوانۆ؟",
    calcSubtitle:
      "اضبط السعر التقديري لليلة وعدد ليالي الإشغال لحساب دخلك الشهري والسنوي المتوقع بالدينار العراقي.",
    calcRateLabel: "السعر المتوقع لليلة الواحدة",
    calcNightsLabel: "الليالي المحجوزة شهرياً",
    calcMonthlyTitle: "الدخل الشهري المتوقع",
    calcMonthlyNote: "٠٪ عمولة منصة خلال فترة الإطلاق",
    calcYearlyTitle: "الدخل السنوي المتوقع",
    calcYearlyNote: "بناءً على متوسط إشغال ١٢ شهراً",
    nightsUnit: "ليالي",

    formBadge: "انضم إلى نخبة المضيفين الرواد",
    formTitle: "استمارة التسجيل المسبق كمضيف في میوانۆ",
    formSubtitle:
      "يستغرق التسجيل أقل من دقيقتين وبدون أي رسوم. سيتواصل معك فريق الاستضافة في كوردستان لتوثيق العقار وتنسيق التصوير المجاني.",
    formFullName: "الاسم الكامل *",
    formFullNamePlaceholder: "مثال: دانا حامد أحمد",
    formPhone: "رقم الهاتف (واتساب) *",
    formPhonePlaceholder: "مثال: 0750 000 0000",
    formEmail: "البريد الإلكتروني *",
    formEmailPlaceholder: "مثال: dana@example.com",
    formCity: "المدينة / المحافظة في كوردستان *",
    formCityPlaceholder: "اختر المدينة",
    formPropType: "نوع العقار",
    formPropTypePlaceholder: "اختر نوع العقار",
    formBedrooms: "عدد غرف النوم",
    formGuests: "أقصى عدد للضيوف",
    formExperience: "الخبرة في الاستضافة",
    formNotes: "أخبرنا عن مميزات عقارك (اختياري)",
    formNotesPlaceholder:
      "مثال: إطلالة جبلية، مسبح خاص، مدفأة حطب، إنترنت سريع، حي هادئ...",
    formSubmitBtn: "تأكيد التسجيل المسبق كمضيف ←",
    formSubmittingBtn: "جاري إرسال الطلب...",
    formPrivacyNote:
      "🔒 معلومات الاتصال الخاصة بك سرية تماماً وتُستخدم فقط للتواصل من قِبل فريق العمل.",

    typeChalet: "شاليه جبلي / فيلا فاخرة",
    typeApartment: "شقة حديثة / فلات",
    typeFarmhouse: "مزرعة / منتجع سياحي",
    typeHeritage: "بيت تراثي أصيل",
    typeGuesthouse: "دار ضيافة / غرفة خاصة",

    expNew: "جديد في مجال الاستضافة (المرة الأولى)",
    expExisting: "أستضيف حالياً عبر منصات أخرى",
    expPro: "مدير عقارات محترف / مكتب عقاري",

    successTitle: "أهلاً بك في میوانۆ كأحد المضيفين المؤسسين! 🎉",
    successDesc:
      "تم تسجيل بيانات عقارك بنجاح. سيتواصل معك مدير الاستضافة في كوردستان خلال 24-48 ساعة عبر الواتساب.",
    successHostName: "اسم المضيف:",
    successCity: "الموقع:",
    successPropType: "نوع العقار:",
    successStatus: "صفة المضيف:",
    successStatusValue: "٠٪ عمولة مضمونة",
    successWhatsAppBtn: "التواصل مع فريق الاستضافة عبر واتساب",
    successCloseBtn: "إغلاق",

    modalDemoBadge: "نموذج تجريبي",
    modalSimulatedPrice: "السعر التقديري",
    modalHostContact: "المضيف",
    modalListSimilarBtn: "سجّل عقاراً مشابهاً على میوانۆ ←",
    modalCloseBtn: "إغلاق",

    faqBadge: "الأسئلة الشائعة",
    faqTitle: "لديك استفسارات عن میوانۆ؟",
    faq1Q: "هل يترتب علي أي دفع للتسجيل المسبق في میوانۆ؟",
    faq1A:
      "كلا، التسجيل المسبق مجاني بنسبة 100% وبدون أي التزام مالي. ويستفيد المضيفون الرواد من عمولة 0% طوال أول ستة أشهر.",
    faq2Q: "كيف ومتى أستلم أرباح الحجوزات؟",
    faq2A:
      "يتم تحويل الأرباح فور تسجيل وصول الضيف مباشرة عبر FastPay أو FIB أو ZainCash أو نقداً بالدينار أو الدولار حسب رغبتك.",
    faq3Q: "هل جلسة التصوير الاحترافي مجانية حقاً؟",
    faq3A:
      "نعم! يزور مصورنا المحترف عقارك في أي مكان داخل إقليم كوردستان لالتقاط صور عالية الدقة بدون أي تكلفة عليك.",
    faq4Q: "هل أتحكم بالأسعار وشروط إقامتي بنفسي؟",
    faq4A:
      "بالتأكيد، لديك تحكم كامل بنسبة 100% في تحديد الأسعار، شروط الإقامة، وتقويم الأيام المتاحة والمغلقة.",
    faq5Q: "ماذا لو احتجت للمساعدة في إدارة الحجوزات؟",
    faq5A:
      "توفر میوانۆ مدير حساب مخصص يتحدث الكوردية والعربية والإنجليزية لمساعدتك عبر الهاتف والواتساب في كل خطوة.",

    footerSlogan: "المنصة المخصصة لإيجار الإقامات السياحية الفاخرة في إقليم كوردستان",
    footerRights: "شركة میوانۆ. جميع الحقوق محفوظة.",
  },
};
