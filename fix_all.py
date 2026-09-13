import os
import re

for root, dirs, files in os.walk("src"):
    for file in files:
        if file.endswith(".tsx") or file.endswith(".ts"):
            path = os.path.join(root, file)
            with open(path, "r") as f:
                text = f.read()
            
            # Remove Sparkles completely
            if "Sparkles" in text:
                text = text.replace("Sparkles className", "Building2 className")
                text = text.replace("icon: Sparkles", "icon: Building2")
                text = text.replace("Sparkles,", "")
                text = text.replace(", Sparkles", "")
                text = text.replace("Sparkles", "Building2")
                
                # Make sure we don't have "Building2 Building2"
                text = text.replace("Building2 Building2", "Building2")
                
                # Fix syntax errors in imports
                text = text.replace("Building2 } from", ", Building2 } from")
                text = text.replace(", ,", ",")
                text = text.replace("{ ,", "{")
                
            with open(path, "w") as f:
                f.write(text)
