import os
import re

for root, _, files in os.walk("src"):
    for file in files:
        if file.endswith(".tsx") or file.endswith(".ts"):
            path = os.path.join(root, file)
            with open(path, "r") as f:
                text = f.read()
            
            # fix ", Building2 }"
            text = text.replace(", Building2 } from", "Building2 } from")
            text = text.replace(",  HelpCircle", ", HelpCircle")
            text = text.replace("Home ,", "Home,")
            text = text.replace("Info ,", "Info,")
            text = text.replace("ArrowRightLeft ,", "ArrowRightLeft,")
            
            # fix empty commas
            text = text.replace(", ,", ",")
            text = text.replace("{ ,", "{")
            
            with open(path, "w") as f:
                f.write(text)
