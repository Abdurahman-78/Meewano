const fs = require('fs');

let file = fs.readFileSync('src/pages/SearchResults.tsx', 'utf8');

file = file.replace(
  /import \{ useSearchParams \} from "react-router-dom";/,
  'import { useSearchParams, Link } from "react-router-dom";'
);

file = file.replace(
  /import \{ RotateCcw, Loader2, Home, ChevronDown, ChevronUp, CalendarIcon \} from "lucide-react";/,
  'import { RotateCcw, Loader2, Home, ChevronDown, ChevronUp, CalendarIcon, MapPin } from "lucide-react";'
);

file = file.replace(
  /<div className="flex items-center gap-3">\n\s*\{\/\* Sort Dropdown \*\/\}/,
  `<div className="flex items-center gap-3">
                  {/* Map Button */}
                  <Button variant="outline" asChild className="gap-2">
                    <Link to="/map">
                      <MapPin className="h-4 w-4" />
                      Map View
                    </Link>
                  </Button>
                  
                  {/* Sort Dropdown */}`
);

fs.writeFileSync('src/pages/SearchResults.tsx', file);
console.log("Updated SearchResults");
