const fs = require('fs');
let content = fs.readFileSync('src/pages/Messages.tsx', 'utf8');
content = content.replace('import AppLayout from "@/components/AppLayout";', 'import AppLayout from "@/components/AppLayout";\nimport HostLayout from "@/components/HostLayout";\nimport { useLocation } from "react-router-dom";');
content = content.replace('const navigate = useNavigate();', 'const navigate = useNavigate();\n  const location = useLocation();\n  const isHostMode = location.pathname.startsWith("/host");\n  const Layout = isHostMode ? HostLayout : AppLayout;');
content = content.replace(/<AppLayout>/g, '<Layout>');
content = content.replace(/<\/AppLayout>/g, '</Layout>');
fs.writeFileSync('src/pages/Messages.tsx', content);
