import AppLayout from "@/components/AppLayout";
import MarkdownLite from "@/components/MarkdownLite";
import { Card, CardContent } from "@/components/ui/card";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { DEFAULT_CANCELLATION } from "@/lib/defaultContent";

const CancellationPolicy = () => {
  const { data: settings } = useSiteSettings();
  const stored: any = (settings as any)?.cancellation_content;
  const text = typeof stored === "string" ? stored : stored?.text || DEFAULT_CANCELLATION;

  return (
    <AppLayout>
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-2">Cancellation & Refund Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          <Card>
            <CardContent className="p-6 md:p-8">
              <MarkdownLite text={text} />
            </CardContent>
          </Card>
        </div>
      </main>
    </AppLayout>
  );
};

export default CancellationPolicy;
