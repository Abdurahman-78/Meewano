const fs = require('fs');

// Fix HostLayout.tsx
let hl = fs.readFileSync('src/components/HostLayout.tsx', 'utf8');
hl = hl.replace(
  /<Link to="\/host" className=\{`text-sm font-medium transition-colors hover:text-primary \$\{isActive\("\/host"\) \? "text-primary border-b-2 border-primary py-5" : "text-muted-foreground"}`\}>\n              Listings\n            <\/Link>/g,
  `<Link to="/host" className={\`text-sm font-medium transition-colors hover:text-primary \${isActive("/host") ? "text-primary border-b-2 border-primary py-5" : "text-muted-foreground"}\`}>
              Listings
            </Link>
            <Link to="/host/refund-requests" className={\`text-sm font-medium transition-colors hover:text-primary \${isActive("/host/refund-requests") ? "text-primary border-b-2 border-primary py-5" : "text-muted-foreground"}\`}>
              Refund requests
            </Link>`
);
fs.writeFileSync('src/components/HostLayout.tsx', hl);

// Fix HostRefundRequests.tsx
let hr = fs.readFileSync('src/pages/HostRefundRequests.tsx', 'utf8');
hr = hr.replace(/import AppLayout from "@\/components\/AppLayout";/g, 'import HostLayout from "@/components/HostLayout";');
hr = hr.replace(/<AppLayout>/g, '<HostLayout>');
hr = hr.replace(/<\/AppLayout>/g, '</HostLayout>');
hr = hr.replace(/<Link to="\/host" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">\s*<ArrowLeft className="h-4 w-4" \/> Back to dashboard\s*<\/Link>/g, '');
fs.writeFileSync('src/pages/HostRefundRequests.tsx', hr);

