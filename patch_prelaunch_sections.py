import re

with open("src/components/PreLaunchSections.tsx", "r") as f:
    text = f.read()

# I will replace the entire file content, so let's just write to it using a node script.
