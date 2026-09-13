const fs = require('fs');
let code = fs.readFileSync('src/components/PreLaunchHostModal.tsx', 'utf8');

// 1. Remove Pre-Launch Host Onboarding badge
code = code.replace(/<div className="flex items-center gap-2 mb-1">[\s\S]*?<\/div>/, '');

// 2. Remove After Meewano is launched note
code = code.replace(/<div className="rounded-lg border border-primary\/20 bg-primary\/5 p-2\.5 text-xs text-muted-foreground flex items-start gap-2 mt-2">[\s\S]*?<\/div>/, '');

// 3. Remove Preset Image Options
code = code.replace(/\{\/\* Preset Image Options \*\/\}[\s\S]*?\{\/\* Upload or URL custom image \*\/\}/, '{/* Upload or URL custom image */}');

// 4. Remove Pre-Launch Registration Active note
code = code.replace(/\{\/\* Pre-launch Note \*\/\}[\s\S]*?<DialogFooter/, '<DialogFooter');

fs.writeFileSync('src/components/PreLaunchHostModal.tsx', code);
