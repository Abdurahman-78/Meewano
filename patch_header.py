import re

with open("src/components/Header.tsx", "r") as f:
    text = f.read()

guest_dash = """                      <DropdownMenuItem asChild>
                        <Link to="/guest" className="cursor-pointer">
                          <User className="h-4 w-4 mr-2" />
                          {t("guestDashboard")}
                        </Link>
                      </DropdownMenuItem>"""
# Only show guest dashboard if not a verified host
guest_dash_new = """                      {!isVerifiedHost && (
                        <DropdownMenuItem asChild>
                          <Link to="/guest" className="cursor-pointer">
                            <User className="h-4 w-4 mr-2" />
                            {t("guestDashboard")}
                          </Link>
                        </DropdownMenuItem>
                      )}"""
text = text.replace(guest_dash, guest_dash_new)

with open("src/components/Header.tsx", "w") as f:
    f.write(text)
