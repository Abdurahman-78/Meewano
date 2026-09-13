import re

with open("src/components/Footer.tsx", "r") as f:
    text = f.read()

promo = """              <li>
                <a href="https://kurdistanhouse.com/visit-kurdistan" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-1.5">
                  Visit Kurdistan
                </a>
              </li>"""

text = text.replace('              <li>\n                <Link to="/about"', promo + '\n              <li>\n                <Link to="/about"')

with open("src/components/Footer.tsx", "w") as f:
    f.write(text)
