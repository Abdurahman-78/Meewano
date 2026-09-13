import os
import re

for root, _, files in os.walk("src/components"):
    for file in files:
        if file.endswith(".tsx"):
            path = os.path.join(root, file)
            with open(path, "r") as f:
                text = f.read()
            if "Sparkles" in text:
                text = text.replace("Sparkles className", "Building2 className")
                text = text.replace("import {", "import { Building2,")
                with open(path, "w") as f:
                    f.write(text)
