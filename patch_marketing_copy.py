import re

with open("src/components/PreLaunchSections.tsx", "r") as f:
    text = f.read()

what_is_replacement = """      {/* 1. What is MEEWANO? Section */}
      <section id="what-is-meewano" className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3 border border-primary/20">
            <Building2 className="h-3.5 w-3.5" />
            Platform Concept & Host Advantages
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            What is Meewano?
          </h2>
          <p className="mt-3 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Meewano is a digital accommodation marketplace connecting guests with hotels, holiday homes, apartments, villas and other short-stay properties across Kurdistan. We make it easier for guests to discover and book accommodation, while giving local hosts a simple way to showcase and manage their properties.
          </p>
        </div>"""
text = re.sub(r"      \{\/\* 1\. What is MEEWANO\? Section \*\/\}.*?<\/p>\s*<\/div>", what_is_replacement, text, flags=re.DOTALL)

how_it_works_replacement = """      {/* How it Works Grid */}
      <section id="how-it-works" className="container mx-auto px-4 py-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            How It Works
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {settings.perks.map((perk) => {
            const Icon = perkIconMap[perk.icon] || Building2;
            return (
              <div
                key={perk.id}
                className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/50 flex flex-col justify-between"
              >
                <div>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {perk.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {perk.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>"""
text = re.sub(r"      \{\/\* Perks Grid \*\/\}.*?<\/section>", how_it_works_replacement, text, flags=re.DOTALL)

about_us_replacement = """      {/* 2. About Us Section */}
      <section id="about-us" className="bg-muted/30 border-y border-border py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Mission & Values */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                <HeartHandshake className="h-3.5 w-3.5" />
                Our Story & Vision
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                About Us
              </h2>
              <h3 className="text-lg font-semibold text-primary">
                An Easier Way to Explore Kurdistan
              </h3>
              <div className="space-y-3.5 text-sm sm:text-base text-muted-foreground leading-relaxed">
                <p>Meewano was created from a simple observation: exploring Kurdistan should be easier, and finding a place to stay should not be a source of uncertainty or frustration.</p>
                <p>The idea was inspired by the experience of travellers struggling to find reliable holiday accommodation through personal recommendations, social media and informal networks. Prices often required lengthy negotiation, availability was unpredictable, and it was difficult to know whether a property would truly match its description.</p>
                <p>There was also a lack of clear information for guests — from property instructions and local guidance to what they could expect on arrival — while hosts could be hesitant to accept guests due to a lack of trust and reliable information.</p>
                <p>Meewano brings hosts and guests together through a dedicated accommodation marketplace, Meewano is creating a simpler, clearer and more trusted way to stay in Kurdistan.</p>
                <p>Our vision is simple: make hosting easier, and help people explore Kurdistan with confidence.</p>
              </div>
              <div className="pt-3">
                <Link to={user ? "/host" : "/become-host"}>
                  <Button className="rounded-full bg-primary hover:bg-primary/90 font-semibold px-6">
                    {user ? "Host Dashboard" : "Become a Founder Host"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column: Benefits */}
            <div className="lg:col-span-5 relative">
              <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-2xl -z-10" />
              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xl">
                <div className="mb-6 pb-6 border-b border-border">
                  <div>
                    <h4 className="font-bold text-xl text-primary mb-2">Benefits of Joining Meewano Today:</h4>
                  </div>
                </div>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground block">Greater Property Visibility</strong>
                      <span className="text-xs text-muted-foreground">Get your property seen by travelers actively looking to book.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground block">Reach More Guests</strong>
                      <span className="text-xs text-muted-foreground">Expand your customer base beyond personal networks.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground block">Set Your Own Price</strong>
                      <span className="text-xs text-muted-foreground">You are in full control of your pricing and availability.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>"""
text = re.sub(r"      \{\/\* 2\. About Us Section \*\/\}.*?<\/section>", about_us_replacement, text, flags=re.DOTALL)

text = text.replace("<Sparkles className=\"h-3.5 w-3.5\" />", "<Building2 className=\"h-3.5 w-3.5\" />")

with open("src/components/PreLaunchSections.tsx", "w") as f:
    f.write(text)
