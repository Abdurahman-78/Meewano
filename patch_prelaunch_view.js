const fs = require('fs');

const path = 'src/components/PreLaunchView.tsx';
let code = fs.readFileSync(path, 'utf8');

// replace title logic
const titleLogic = `
  const registeredCount = realProperties.length;

  let sectionTitle = "";
  if (registeredCount <= 30) {
    sectionTitle = "Our First Properties are now Joining Meewano";
  } else if (registeredCount <= 100) {
    sectionTitle = \`\${registeredCount}/100 Properties Registered\`;
  } else {
    sectionTitle = \`\${registeredCount} Properties Registered\`;
  }
`;

const newTitleLogic = `
  const { t } = useTranslation();
  const registeredCount = realProperties.length;

  let sectionTitle = "";
  if (registeredCount <= 30) {
    sectionTitle = t("preLaunchTitle");
  } else if (registeredCount <= 100) {
    sectionTitle = t("preLaunchTitleCount").replace("{{count}}", registeredCount.toString());
  } else {
    sectionTitle = t("preLaunchTitleFull").replace("{{count}}", registeredCount.toString());
  }
`;

code = code.replace(titleLogic, newTitleLogic);

// also we need to import useTranslation
if (!code.includes('import { useTranslation }')) {
    code = code.replace('import { useAuth }', 'import { useTranslation } from "@/hooks/useTranslation";\nimport { useAuth }');
}

// update the subtitle
const subtitleText = `All registered properties will be advertised during the main website launch. Be from the first 100 hosts to register your property and receive one time only special offer.`;
code = code.replace(subtitleText, '{t("preLaunchSubtitle").split("\\n").map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)}');
// wait, the string is just 'All registered...'. In the jsx, it's inside <p>.
// let's just do a regex replace
code = code.replace(/<p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-xl">\s*All registered properties will be advertised during the main website launch. Be from the first 100 hosts to register your property and receive one time only special offer.\s*<\/p>/, 
  \`<p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-xl">
    {t("preLaunchSubtitle").split("\\\\n").map((line, i) => <span key={i}>{line}<br/></span>)}
  </p>\`);


fs.writeFileSync(path, code);
