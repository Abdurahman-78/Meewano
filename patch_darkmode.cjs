const fs = require('fs');
const path = 'src/components/PreLaunchSections.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/<section id="why-list" className="bg-white py-16 md:py-24 border-y border-border">/g, '<section id="why-list" className="bg-background py-16 md:py-24 border-y border-border">');
code = code.replace(/text-\[#1e293b\]/g, 'text-foreground');
code = code.replace(/bg-pink-100 flex items-center justify-center text-\[#ec4899\]/g, 'bg-primary/10 flex items-center justify-center text-primary');
code = code.replace(/text-\[#64748b\]/g, 'text-muted-foreground');
code = code.replace(/bg-\[#ec4899\] hover:bg-\[#db2777\]/g, 'bg-primary hover:bg-primary/90');
// Instead of replacing all text-white (which might break other buttons), only replace in that specific section.
fs.writeFileSync(path, code);
