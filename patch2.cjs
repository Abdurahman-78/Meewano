const fs = require('fs');

function removeNote(file, regex) {
    if (!fs.existsSync(file)) return;
    let code = fs.readFileSync(file, 'utf8');
    code = code.replace(regex, '');
    fs.writeFileSync(file, code);
}

// AddListing.tsx
removeNote('src/pages/AddListing.tsx', /<div className="bg-primary\/5 border border-primary\/20 rounded-lg p-3 text-xs text-muted-foreground flex gap-2">[\s\S]*?<\/div>/g);

// EditListing.tsx
removeNote('src/pages/EditListing.tsx', /<div className="bg-primary\/5 border border-primary\/20 rounded-lg p-3 text-xs text-muted-foreground flex gap-2">[\s\S]*?<\/div>/g);

// HostDashboard.tsx
removeNote('src/pages/HostDashboard.tsx', /<div className="bg-primary\/10 border border-primary\/20 rounded-xl p-4 flex gap-3 text-sm text-foreground">[\s\S]*?<\/div>/g);
removeNote('src/pages/HostDashboard.tsx', /<div className="bg-primary\/5 border border-primary\/20 rounded-lg p-3 mt-4 text-xs text-muted-foreground flex gap-2">[\s\S]*?<\/div>/g);
removeNote('src/pages/HostDashboard.tsx', /<Alert className="mb-6 bg-primary\/10 border-primary\/20">[\s\S]*?<\/Alert>/g);

