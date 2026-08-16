const fs = require('fs');

let file = fs.readFileSync('src/pages/PropertyDetail.tsx', 'utf8');

const galleryStart = file.indexOf('      {/* Desktop: Container image gallery */}');
const galleryEnd = file.indexOf('      {/* Fullscreen image viewer */}');

if (galleryStart === -1 || galleryEnd === -1) {
  console.log("Could not find gallery markers");
  process.exit(1);
}

const galleryCode = file.substring(galleryStart, galleryEnd);
file = file.substring(0, galleryStart) + file.substring(galleryEnd);

// Now, the gallery code has the wrapper `<div className="hidden md:block container mx-auto px-4 pt-8">`
// We'll strip that out so we can place the inner div directly.
let innerGallery = galleryCode.replace(/      \{\/\* Desktop: Container image gallery \*\/\}\n      <div className="hidden md:block container mx-auto px-4 pt-8">\n/, '');
// find the last '      </div>\n' before the end of innerGallery and remove it
const lastDiv = innerGallery.lastIndexOf('      </div>\n');
if (lastDiv !== -1) {
  innerGallery = innerGallery.substring(0, lastDiv) + innerGallery.substring(lastDiv + '      </div>\n'.length);
}

// Add `hidden md:block` to the first div in innerGallery, and change mb-8 to mb-2 or keep it as is.
innerGallery = innerGallery.replace(
  /<div className="rounded-2xl overflow-hidden mb-8 h-\[500px\] relative group">/,
  '<div className="hidden md:block rounded-2xl overflow-hidden h-[400px] lg:h-[500px] relative group">'
);

// We should also adjust the top main tag to have `md:pt-8`
file = file.replace(
  /<main className="container mx-auto px-4 pb-8 md:py-0">/,
  '<main className="container mx-auto px-4 pb-8 md:py-8">'
);

// Insert the inner gallery above `{/* Title & location */}`
const insertTarget = '          <div className="lg:col-span-2 space-y-5 md:space-y-6">\n            {/* Title & location */}';
file = file.replace(insertTarget, '          <div className="lg:col-span-2 space-y-5 md:space-y-6">\n      {/* Desktop: Image gallery */}\n' + innerGallery + '            {/* Title & location */}');

fs.writeFileSync('src/pages/PropertyDetail.tsx', file);
console.log("Updated");
