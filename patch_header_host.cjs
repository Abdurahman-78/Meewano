const fs = require('fs');
const headerPath = 'src/components/Header.tsx';
let code = fs.readFileSync(headerPath, 'utf8');
code = code.replace(/Host Dashboard \(My Properties\)/g, '{t("hostDashboardMyProps")}');
fs.writeFileSync(headerPath, code);
