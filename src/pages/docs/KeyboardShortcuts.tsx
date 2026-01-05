import { DocumentationLayout } from "./DocumentationLayout";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import {
  TypographyH1,
  TypographyH2,
  TypographyLead,
} from "@/components/ui/typography";

function ShortcutRow({ shortcut, description }: { shortcut: React.ReactNode; description: string }) {
  return (
    <tr className="border-b border-border">
      <td className="py-3 pr-4">{shortcut}</td>
      <td className="py-3 text-muted-foreground">{description}</td>
    </tr>
  );
}

export function KeyboardShortcuts() {
  const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().includes("MAC");
  const mod = isMac ? "⌘" : "Ctrl";

  return (
    <DocumentationLayout>
      <article>
        <TypographyH1>Keyboard Shortcuts</TypographyH1>
        <TypographyLead>
          Quick reference for keyboard shortcuts to speed up your workflow.
        </TypographyLead>

        <TypographyH2>General</TypographyH2>
        <table className="w-full text-sm mt-4">
          <tbody>
            <ShortcutRow
              shortcut={<KbdGroup><Kbd>{mod}</Kbd><Kbd>K</Kbd></KbdGroup>}
              description="Open documentation search"
            />
            <ShortcutRow
              shortcut={<Kbd>Space</Kbd>}
              description="Toggle playback (when canvas focused)"
            />
            <ShortcutRow
              shortcut={<Kbd>Esc</Kbd>}
              description="Deselect current block / Close drawer"
            />
          </tbody>
        </table>

        <TypographyH2>Canvas Navigation</TypographyH2>
        <table className="w-full text-sm mt-4">
          <tbody>
            <ShortcutRow
              shortcut={<span className="text-xs text-muted-foreground">Scroll wheel</span>}
              description="Zoom in/out"
            />
            <ShortcutRow
              shortcut={<span className="text-xs text-muted-foreground">Click + drag on canvas</span>}
              description="Pan the view"
            />
            <ShortcutRow
              shortcut={<span className="text-xs text-muted-foreground">Double-click on canvas</span>}
              description="Reset zoom and position"
            />
          </tbody>
        </table>

        <TypographyH2>Block Operations</TypographyH2>
        <table className="w-full text-sm mt-4">
          <tbody>
            <ShortcutRow
              shortcut={<Kbd>Delete</Kbd>}
              description="Delete selected block(s)"
            />
            <ShortcutRow
              shortcut={<Kbd>Backspace</Kbd>}
              description="Delete selected block(s)"
            />
            <ShortcutRow
              shortcut={<KbdGroup><Kbd>{mod}</Kbd><Kbd>C</Kbd></KbdGroup>}
              description="Copy selected block"
            />
            <ShortcutRow
              shortcut={<KbdGroup><Kbd>{mod}</Kbd><Kbd>V</Kbd></KbdGroup>}
              description="Paste copied block"
            />
            <ShortcutRow
              shortcut={<KbdGroup><Kbd>{mod}</Kbd><Kbd>D</Kbd></KbdGroup>}
              description="Duplicate selected block"
            />
          </tbody>
        </table>

        <TypographyH2>Selection</TypographyH2>
        <table className="w-full text-sm mt-4">
          <tbody>
            <ShortcutRow
              shortcut={<KbdGroup><Kbd>{mod}</Kbd><Kbd>A</Kbd></KbdGroup>}
              description="Select all blocks"
            />
            <ShortcutRow
              shortcut={<span className="text-xs text-muted-foreground">Shift + click</span>}
              description="Add block to selection"
            />
            <ShortcutRow
              shortcut={<span className="text-xs text-muted-foreground">Drag selection box</span>}
              description="Select multiple blocks"
            />
          </tbody>
        </table>

        <TypographyH2>File Operations</TypographyH2>
        <table className="w-full text-sm mt-4">
          <tbody>
            <ShortcutRow
              shortcut={<KbdGroup><Kbd>{mod}</Kbd><Kbd>S</Kbd></KbdGroup>}
              description="Save project"
            />
            <ShortcutRow
              shortcut={<KbdGroup><Kbd>{mod}</Kbd><Kbd>O</Kbd></KbdGroup>}
              description="Open project"
            />
            <ShortcutRow
              shortcut={<KbdGroup><Kbd>{mod}</Kbd><Kbd>N</Kbd></KbdGroup>}
              description="New project"
            />
          </tbody>
        </table>
      </article>
    </DocumentationLayout>
  );
}
