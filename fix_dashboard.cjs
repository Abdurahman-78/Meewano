const fs = require('fs');

let content = fs.readFileSync('src/pages/HostDashboard.tsx', 'utf8');

// Remove the "You are in Host Mode" banner
content = content.replace(
  /<div className="bg-emerald-100[^>]*>\s*<Home[^>]*\/> You are in Host Mode\s*<\/div>/g,
  ''
);

// Enhance the header section
const newHeader = `
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-semibold mb-1">Your listings</h1>
            <p className="text-muted-foreground text-sm">Manage your properties, pricing, and availability</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="h-10 rounded-full px-5"
              onClick={() => navigate("/host/analytics")}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Insights
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 rounded-full px-5 font-semibold"
              disabled={!isVerified}
              onClick={() => isVerified ? navigate("/host/add-listing") : toast.error("Complete verification first")}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create listing
            </Button>
          </div>
        </div>
`;
content = content.replace(
  /<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">[\s\S]*?<\/div>\s*<\/div>/,
  newHeader
);

fs.writeFileSync('src/pages/HostDashboard.tsx', content);
