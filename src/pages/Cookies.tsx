import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Cookies = () => {
  return (
    <AppLayout>
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-2">Cookie Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>What Are Cookies?</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p className="text-muted-foreground">
                Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our service.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Types of Cookies We Use</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Essential Cookies</h4>
                  <p className="text-muted-foreground">
                    These cookies are necessary for the website to function properly. They enable basic functions like page navigation, access to secure areas, and session management.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">Functional Cookies</h4>
                  <p className="text-muted-foreground">
                    These cookies remember your preferences such as language selection and currency choice, providing you with a more personalized experience.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">Analytics Cookies</h4>
                  <p className="text-muted-foreground">
                    We use analytics cookies to understand how visitors interact with our website. This helps us improve our service and identify any issues.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">Marketing Cookies</h4>
                  <p className="text-muted-foreground">
                    These cookies track your browsing habits to show you relevant advertisements and measure the effectiveness of our marketing campaigns.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Managing Cookies</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p className="text-muted-foreground mb-4">
                You can control and manage cookies in various ways:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Browser settings: Most browsers allow you to refuse or delete cookies</li>
                <li>Third-party tools: Use privacy extensions to manage tracking</li>
                <li>Opt-out links: Some cookies provide opt-out mechanisms</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                Please note that disabling certain cookies may affect the functionality of our website.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Third-Party Cookies</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p className="text-muted-foreground mb-4">
                We may use third-party services that set their own cookies, including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Google Analytics for website analytics</li>
                <li>Payment processors for secure transactions</li>
                <li>Social media platforms for sharing features</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                These third parties have their own privacy policies governing the use of cookies.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Cookie Duration</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p className="text-muted-foreground mb-4">
                We use both session and persistent cookies:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong>Session cookies:</strong> Temporary cookies that expire when you close your browser</li>
                <li><strong>Persistent cookies:</strong> Remain on your device for a set period or until you delete them</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Updates to This Policy</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p className="text-muted-foreground">
                We may update this Cookie Policy from time to time to reflect changes in our practices or for legal reasons. Check this page periodically for updates.
              </p>
            </CardContent>
          </Card>

          <div className="mt-8 p-6 bg-secondary/50 rounded-lg text-center">
            <p className="text-muted-foreground">
              Questions about cookies? <a href="/contact" className="text-primary hover:underline">Contact us</a>
            </p>
          </div>
        </div>
      </main>
    </AppLayout>
  );
};

export default Cookies;
