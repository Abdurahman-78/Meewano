import re

with open("src/components/PreLaunchView.tsx", "r") as f:
    text = f.read()

# Remove Add Property Button
btn_pattern = r'<Link to=\{user \? "/host/add-listing" : "/become-host"\}>.*?<\/Link>'
text = re.sub(btn_pattern, '', text, flags=re.DOTALL)

# Remove Gift Badge
badge_pattern = r'<div className="flex items-center gap-2 mb-2">.*?<\/div>'
text = re.sub(badge_pattern, '', text, flags=re.DOTALL)

# Swap Pills and Search
filter_section = """        {/* City Filter Pills & Quick Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-8 bg-muted/40 p-2.5 rounded-2xl border border-border">
          {/* Search Input */}
          <div className="relative min-w-[200px] sm:max-w-xs">
            <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search stays or areas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 text-xs rounded-full bg-background border-border/80"
            />
          </div>

          {/* City Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {CITIES.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCity === city
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "bg-background text-muted-foreground hover:text-foreground hover:bg-card border border-border/70"
                }`}
              >
                {city === "All" ? "All Locations" : city}
              </button>
            ))}
          </div>
        </div>"""

text = re.sub(r'\{\/\* City Filter Pills & Quick Search \*\/\}.*?<\/div>\s*<\/div>', filter_section, text, flags=re.DOTALL)

with open("src/components/PreLaunchView.tsx", "w") as f:
    f.write(text)
