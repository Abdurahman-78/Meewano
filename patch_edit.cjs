const fs = require('fs');
let code = fs.readFileSync('src/pages/EditListing.tsx', 'utf8');
code = code.replace(/<p className="font-semibold text-foreground">Nightly Pricing & Launch Verification<\/p>[\s\S]*?<\/p>/, '');
fs.writeFileSync('src/pages/EditListing.tsx', code);
