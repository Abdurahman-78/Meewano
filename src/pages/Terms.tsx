import AppLayout from "@/components/AppLayout";
import MarkdownLite from "@/components/MarkdownLite";
import { Card, CardContent } from "@/components/ui/card";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { DEFAULT_TERMS } from "@/lib/defaultContent";

const Terms = () => {
  const { data: settings } = useSiteSettings();
  const stored: any = (settings as any)?.terms_content;
  const text = typeof stored === "string" ? stored : stored?.text || DEFAULT_TERMS;

  return (
    <AppLayout>
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-2">Terms and Conditions</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          <Card>
            <CardContent className="p-6 md:p-8">
              <MarkdownLite text={text} />
            </CardContent>
          </Card>
          <div className="mt-8 p-6 bg-secondary/50 rounded-lg text-center">
            <p className="text-muted-foreground">
              Questions about our terms?{" "}
              <a href="/contact" className="text-primary hover:underline">Contact us</a>
            </p>
          </div>
        </div>
      </main>
    </AppLayout>
  );
};

export default Terms;
