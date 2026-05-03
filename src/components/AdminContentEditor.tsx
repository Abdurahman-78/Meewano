import { useEffect, useState } from "react";
import { Loader2, Save, FileText, XCircle, HelpCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSiteSettings, useUpdateSiteSetting } from "@/hooks/useSiteSettings";
import { DEFAULT_TERMS, DEFAULT_CANCELLATION, DEFAULT_HELP } from "@/lib/defaultContent";
import { toast } from "sonner";

type ContentKey = "terms_content" | "cancellation_content" | "help_content";

const ITEMS: { key: ContentKey; label: string; icon: any; defaultValue: string; preview: string }[] = [
  { key: "terms_content", label: "Terms & Conditions", icon: FileText, defaultValue: DEFAULT_TERMS, preview: "/terms" },
  { key: "cancellation_content", label: "Cancellation Policy", icon: XCircle, defaultValue: DEFAULT_CANCELLATION, preview: "/cancellation-policy" },
  { key: "help_content", label: "Help", icon: HelpCircle, defaultValue: DEFAULT_HELP, preview: "/help" },
];

const Editor = ({ contentKey, defaultValue, preview }: { contentKey: ContentKey; defaultValue: string; preview: string }) => {
  const { data: settings, isLoading } = useSiteSettings();
  const update = useUpdateSiteSetting();
  const [value, setValue] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isLoading && !loaded) {
      const s: any = settings || {};
      const stored = s[contentKey];
      const initial =
        typeof stored === "string"
          ? stored
          : stored && typeof stored === "object" && typeof stored.text === "string"
            ? stored.text
            : defaultValue;
      setValue(initial);
      setLoaded(true);
    }
  }, [isLoading, settings, loaded, contentKey, defaultValue]);

  const handleSave = async () => {
    try {
      await update.mutateAsync({ key: contentKey, value: { text: value, updated_at: new Date().toISOString() } });
      toast.success("Saved");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
  };

  const handleReset = () => {
    if (confirm("Reset to the default content? Unsaved changes will be lost.")) {
      setValue(defaultValue);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm text-muted-foreground">
          Content supports plain text and line breaks. Use ## for section headings and - for bullet lists.
        </Label>
        <a href={preview} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
          Preview public page →
        </a>
      </div>

      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="min-h-[480px] font-mono text-sm"
        disabled={isLoading || !loaded}
        placeholder="Loading…"
      />

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleReset} disabled={!loaded}>
          Reset to default
        </Button>
        <Button onClick={handleSave} disabled={update.isPending || !loaded}>
          {update.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save changes
        </Button>
      </div>
    </div>
  );
};

const AdminContentEditor = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Site Pages Content</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={ITEMS[0].key}>
          <TabsList className="mb-4 flex-wrap">
            {ITEMS.map((it) => {
              const Icon = it.icon;
              return (
                <TabsTrigger key={it.key} value={it.key}>
                  <Icon className="h-4 w-4 mr-2" />
                  {it.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {ITEMS.map((it) => (
            <TabsContent key={it.key} value={it.key}>
              <Editor contentKey={it.key} defaultValue={it.defaultValue} preview={it.preview} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminContentEditor;
