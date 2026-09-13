import re

with open("src/components/HostLayout.tsx", "r") as f:
    text = f.read()

switch_guest = """                {!isPreLaunch && (
                  <DropdownMenuItem asChild>
                    <Link to="/guest">Switch to guest</Link>
                  </DropdownMenuItem>
                )}"""
text = text.replace(switch_guest, "")

with open("src/components/HostLayout.tsx", "w") as f:
    f.write(text)
