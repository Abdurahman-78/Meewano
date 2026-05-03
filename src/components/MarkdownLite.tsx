import { useMemo } from "react";

interface MarkdownLiteProps {
  text: string;
}

/**
 * Tiny markdown-ish renderer used for admin-edited site content.
 * Supports:
 *   ## Heading
 *   - bullet
 *   blank line = paragraph break
 */
const MarkdownLite = ({ text }: MarkdownLiteProps) => {
  const blocks = useMemo(() => {
    const lines = (text || "").split(/\r?\n/);
    const out: Array<
      | { type: "heading"; content: string; key: number }
      | { type: "list"; items: string[]; key: number }
      | { type: "paragraph"; content: string; key: number }
    > = [];
    let i = 0;
    let key = 0;
    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();
      if (!trimmed) { i++; continue; }

      if (trimmed.startsWith("## ")) {
        out.push({ type: "heading", content: trimmed.slice(3), key: key++ });
        i++;
      } else if (trimmed.startsWith("- ")) {
        const items: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith("- ")) {
          items.push(lines[i].trim().slice(2));
          i++;
        }
        out.push({ type: "list", items, key: key++ });
      } else {
        // collect consecutive non-empty, non-special lines into a paragraph
        const paraLines: string[] = [];
        while (
          i < lines.length &&
          lines[i].trim() &&
          !lines[i].trim().startsWith("## ") &&
          !lines[i].trim().startsWith("- ")
        ) {
          paraLines.push(lines[i].trim());
          i++;
        }
        out.push({ type: "paragraph", content: paraLines.join(" "), key: key++ });
      }
    }
    return out;
  }, [text]);

  return (
    <div className="space-y-4">
      {blocks.map((b) => {
        if (b.type === "heading") {
          return (
            <h2 key={b.key} className="text-xl md:text-2xl font-bold text-foreground mt-6 first:mt-0">
              {b.content}
            </h2>
          );
        }
        if (b.type === "list") {
          return (
            <ul key={b.key} className="list-disc list-inside text-muted-foreground space-y-2">
              {b.items.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={b.key} className="text-muted-foreground leading-relaxed">
            {b.content}
          </p>
        );
      })}
    </div>
  );
};

export default MarkdownLite;
