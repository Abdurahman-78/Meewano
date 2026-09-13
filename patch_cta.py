import re

with open("src/components/PreLaunchSections.tsx", "r") as f:
    text = f.read()

# Pattern to remove section 4
pattern = r'\s*\{\/\* 4\. Pre-Launch Final Call to Action Banner \*\/\}\s*<section className="container mx-auto px-4 max-w-5xl">.*?</section>'
new_text = re.sub(pattern, '', text, flags=re.DOTALL)

with open("src/components/PreLaunchSections.tsx", "w") as f:
    f.write(new_text)
