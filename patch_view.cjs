const fs = require('fs');

const path = 'src/components/PreLaunchView.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/"Demo Properties"/g, '{t("demoProperties")}');
code = code.replace(/"Reset Filters"/g, '{t("resetFilters")}');
code = code.replace(/placeholder="Search stays or areas..."/g, 'placeholder={t("searchStays")}');

// For locations, let's map them to their t() equivalents inline.
const locationMap = `
  const getCityName = (city: string) => {
    switch(city) {
      case "All": return t("allLocations");
      case "Erbil": return t("erbil");
      case "Sulaymaniyah": return t("sulaymaniyah");
      case "Duhok": return t("duhok");
      case "Rawanduz": return t("rawanduz");
      case "Shaqlawa": return t("shaqlawa");
      case "Ranya": return t("ranya");
      case "Haji Omran": return t("hajiOmran");
      default: return city;
    }
  };
`;

code = code.replace('const CITIES = ["All", "Erbil", "Sulaymaniyah", "Duhok", "Rawanduz", "Shaqlawa", "Ranya", "Haji Omran"];', locationMap + '\n  const CITIES = ["All", "Erbil", "Sulaymaniyah", "Duhok", "Rawanduz", "Shaqlawa", "Ranya", "Haji Omran"];');

code = code.replace(/\{city === "All" \? "All Locations" : city\}/g, '{getCityName(city)}');

fs.writeFileSync(path, code);
