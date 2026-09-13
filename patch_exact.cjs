const fs = require('fs');

function replaceStr(file, findStr, repStr) {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');
    code = code.replace(findStr, repStr);
    fs.writeFileSync(file, code);
}

replaceStr('src/pages/AddListing.tsx', 
  '<p className="font-semibold text-foreground">Nightly Pricing & Launch Verification</p>\n                    <p className="text-xs mt-0.5 leading-relaxed">\n                      After Meewano is launched, we verify to set the official price of properties with you. No payment methods or financial accounts are required during pre-registration.\n                    </p>',
  '');

replaceStr('src/pages/EditListing.tsx', 
  '<p className="font-semibold text-foreground">Launch Verification</p>\n                        <p className="text-xs mt-0.5 leading-relaxed">\n                        After Meewano is launched, we verify to set the official price of properties with you.\n                        </p>',
  '');
  
replaceStr('src/pages/HostDashboard.tsx',
  '<p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">\n                After Meewano is launched, our team will verify and finalize the official pricing of your properties with you. No payment methods, calendar setup, or guest bookings are required during the pre-launch phase.\n              </p>',
  '');
  
replaceStr('src/pages/HostDashboard.tsx',
  '<p className="text-[11px] text-muted-foreground/80 mt-2 italic">\n                          After Meewano is launched, we verify to set price of properties.\n                        </p>',
  '');

replaceStr('src/pages/HostWelcome.tsx',
  'desc: "After Meewano is launched, we verify to set the official price of properties with you.",',
  'desc: "List your property quickly.",');

