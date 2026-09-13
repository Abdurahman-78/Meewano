const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const triggerString = '<TabsTrigger value="properties">\n              <Building className="h-4 w-4 mr-2" />\n              Properties\n            </TabsTrigger>';

const demoTrigger = `            <TabsTrigger value="demo-properties">
              <Building className="h-4 w-4 mr-2" />
              Demo Properties
            </TabsTrigger>
`;

code = code.replace(triggerString, triggerString + '\n' + demoTrigger);

const contentString = `          <TabsContent value="newsletters">
            <AdminNewsletters />
          </TabsContent>`;

const demoContent = `
          <TabsContent value="demo-properties">
            <AdminDemoProperties />
          </TabsContent>`;

code = code.replace(contentString, contentString + demoContent);

fs.writeFileSync('src/pages/AdminDashboard.tsx', code);
