const fs = require('fs');

const path = 'src/components/PreLaunchSections.tsx';
let code = fs.readFileSync(path, 'utf8');

// Replace "Our Story & Vision" 
code = code.replace(/Our Story & Vision/g, '{t("ourStory")}');
code = code.replace(/About Us/g, '{t("aboutUs")}');
code = code.replace(/An Easier Way to Explore Kurdistan/g, '{t("aboutUsSubtitle")}');

const p1Text = "Meewano was created from a simple observation: exploring Kurdistan should be easier, and finding a place to stay should not be a source of uncertainty or frustration.";
code = code.replace(p1Text, '{t("aboutUsP1")}');

const p2Text = "The idea was inspired by the experience of travellers struggling to find reliable holiday accommodation through personal recommendations, social media and informal networks. Prices often required lengthy negotiation, availability was unpredictable, and it was difficult to know whether a property would truly match its description.";
code = code.replace(p2Text, '{t("aboutUsP2")}');

const p3Text = "There was also a lack of clear information for guests — from property instructions and local guidance to what they could expect on arrival — while hosts could be hesitant to accept guests due to a lack of trust and reliable information.";
code = code.replace(p3Text, '{t("aboutUsP3")}');

const p4Text = "Meewano brings hosts and guests together through a dedicated accommodation marketplace, Meewano is creating a simpler, clearer and more trusted way to stay in Kurdistan.";
code = code.replace(p4Text, '{t("aboutUsP4")}');

const p5Text = "Our vision is simple: make hosting easier, and help people explore Kurdistan with confidence.";
code = code.replace(p5Text, '{t("aboutUsP5")}');


code = code.replace(/Host Knowledge Base/g, '{t("hostKb")}');
code = code.replace(/Frequently Asked Questions/g, '{t("faqs")}');
code = code.replace(/Everything you need to know about adding your property during pre-launch\./g, '{t("faqDesc")}');


// Replace FAQ mapping
const oldFaqMap = `            {settings.faqs.map((faq, index) => (
              <AccordionItem
                key={faq.id || index}
                value={\`faq-\${index}\`}
                className="border border-border/70 rounded-xl px-4 py-1 data-[state=open]:border-primary/40 data-[state=open]:bg-muted/20"
              >
                <AccordionTrigger className="text-left font-semibold text-sm sm:text-base text-foreground hover:text-primary transition-colors py-3.5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pt-1 pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}`;

const newFaqMap = `            {[1, 2, 3, 4, 5].map((num) => (
              <AccordionItem
                key={num}
                value={\`faq-\${num}\`}
                className="border border-border/70 rounded-xl px-4 py-1 data-[state=open]:border-primary/40 data-[state=open]:bg-muted/20"
              >
                <AccordionTrigger className="text-left font-semibold text-sm sm:text-base text-foreground hover:text-primary transition-colors py-3.5">
                  {t(\`faq\${num}q\` as any)}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pt-1 pb-4">
                  {t(\`faq\${num}a\` as any)}
                </AccordionContent>
              </AccordionItem>
            ))}`;

code = code.replace(oldFaqMap, newFaqMap);

fs.writeFileSync(path, code);
