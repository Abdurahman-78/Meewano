const fs = require('fs');
let content = fs.readFileSync('src/pages/HostDashboard.tsx', 'utf8');

content = content.replace(
  /if \(authLoading \|\| loading\) \{\\n    return \(\\n      <HostLayout>\\n        <div className="container mx-auto px-4 py-16 flex items-center justify-center">\\n          <Loader2 className="h-8 w-8 animate-spin" \/>\\n        <\/div>\\n      <\/HostLayout>\\n    \);\\n  \}\\n\\n  return \(\\n    <HostLayout>\\n      <main className="container/g,
  `if (authLoading || loading) {
    return (
      <HostLayout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </HostLayout>
    );
  }

  return (
    <HostLayout>
      <main className="container`
);

fs.writeFileSync('src/pages/HostDashboard.tsx', content);
