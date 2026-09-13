const fs = require('fs');
const footerPath = 'src/components/Footer.tsx';
let code = fs.readFileSync(footerPath, 'utf8');

// Change grid-cols-3 to grid-cols-1 md:grid-cols-2
code = code.replace('grid-cols-1 md:grid-cols-3 gap-8', 'grid-cols-1 md:grid-cols-2 gap-8 justify-between');

// Remove Column 2
const col2Start = code.indexOf('{!isPreLaunch && (<div>');
const col2End = code.indexOf('</div>)}', col2Start) + 8;

if(col2Start !== -1 && col2End > 8) {
  code = code.substring(0, col2Start) + code.substring(col2End);
}

fs.writeFileSync(footerPath, code);
