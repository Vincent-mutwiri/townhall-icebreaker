// src/components/courses/module-editors/TextModuleEditor.tsx
"use client";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type TextModuleEditorProps = {
  content: string;
  onContentChange: (newContent: string) => void;
};

export function TextModuleEditor({ content, onContentChange }: TextModuleEditorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="text-content">Module Content (Markdown supported)</Label>
      <Textarea
        id="text-content"
        value={content || ''}
        onChange={(e) => onContentChange(e.target.value)}
        rows={10}
        placeholder="Write your module content here... You can use Markdown formatting:

# Heading 1
## Heading 2
**Bold text**
*Italic text*
- Bullet points
1. Numbered lists
[Links](https://example.com)

```code blocks```"
        className="font-mono text-sm"
      />
      <p className="text-xs text-muted-foreground">
        Tip: Use Markdown syntax for rich formatting. Students will see the rendered version.
      </p>
    </div>
  );
}
