import re

with open("src/i18n/translations.ts", "r") as f:
    text = f.read()

# I will just write a new file or inject into translations.ts. Since translations.ts is a js object, it's easier to just use node to parse/modify it, but let's just append keys manually.
