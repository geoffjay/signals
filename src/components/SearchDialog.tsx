import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";
import { Search, FileText, CornerDownLeft } from "lucide-react";
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";

interface DocPage {
  id: string;
  title: string;
  description: string;
  path: string;
  keywords: string[];
}

const DOC_PAGES: DocPage[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Introduction to Signals and how to use it",
    path: "/docs/getting-started",
    keywords: ["intro", "introduction", "start", "begin", "tutorial"],
  },
  {
    id: "blocks",
    title: "Blocks",
    description: "Overview of all available signal blocks",
    path: "/docs/blocks",
    keywords: ["nodes", "components", "types", "generators", "processors"],
  },
  {
    id: "signal-generation",
    title: "Signal Generation",
    description: "Creating waveforms with generator blocks",
    path: "/docs/signal-generation",
    keywords: ["oscillator", "sine", "square", "triangle", "sawtooth", "noise", "waveform"],
  },
  {
    id: "signal-processing",
    title: "Signal Processing",
    description: "Filtering and modifying signals",
    path: "/docs/signal-processing",
    keywords: ["filter", "gain", "lowpass", "highpass", "bandpass", "effects"],
  },
  {
    id: "routing",
    title: "Routing",
    description: "Combining and splitting signal paths",
    path: "/docs/routing",
    keywords: ["multiplexer", "splitter", "merge", "split", "combine"],
  },
  {
    id: "visualization",
    title: "Visualization",
    description: "Displaying and analyzing signals",
    path: "/docs/visualization",
    keywords: ["oscilloscope", "visualizer", "display", "waveform", "view"],
  },
  {
    id: "external-connections",
    title: "External Connections",
    description: "Connecting signals to external destinations",
    path: "/docs/external-connections",
    keywords: ["external", "output", "connection", "export"],
  },
  {
    id: "keyboard-shortcuts",
    title: "Keyboard Shortcuts",
    description: "Quick reference for keyboard shortcuts",
    path: "/docs/keyboard-shortcuts",
    keywords: ["hotkeys", "keys", "shortcuts", "commands"],
  },
];

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const handleSelect = useCallback(
    (path: string) => {
      onOpenChange(false);
      setSearch("");
      navigate(path);
    },
    [navigate, onOpenChange]
  );

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  // Handle Escape key to close dialog
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          onClick={() => onOpenChange(false)}
        />
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] pointer-events-none"
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-lg border border-border bg-popover shadow-lg pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
          <Command
            className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
            shouldFilter={true}
          >
            <div className="flex items-center border-b border-border px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <Command.Input
                autoFocus
                placeholder="Search documentation..."
                value={search}
                onValueChange={setSearch}
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                No results found.
              </Command.Empty>
              <Command.Group heading="Pages" className="[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:py-1.5">
                {DOC_PAGES.map((page) => (
                  <Command.Item
                    key={page.id}
                    value={`${page.title} ${page.description} ${page.keywords.join(" ")}`}
                    onSelect={() => handleSelect(page.path)}
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50"
                  >
                    <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span>{page.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {page.description}
                      </span>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
            <div className="flex items-center justify-end border-t border-border px-3 py-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Kbd>
                  <CornerDownLeft className="h-3 w-3" />
                </Kbd>
                <span>Go to page</span>
              </div>
            </div>
          </Command>
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  );
}

export function useSearchDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { open, setOpen };
}
