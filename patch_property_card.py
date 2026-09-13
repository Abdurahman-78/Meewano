import re

with open("src/components/PreLaunchPropertyCard.tsx", "r") as f:
    text = f.read()

# Remove host name from the card
text = re.sub(r'<p className="text-\[10px\] text-primary font-medium">\s*Host: \{property\.host_name \|\| "Host"\}\s*<\/p>', '', text)

with open("src/components/PreLaunchPropertyCard.tsx", "w") as f:
    f.write(text)
