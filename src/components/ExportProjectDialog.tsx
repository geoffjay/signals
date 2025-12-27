import { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSignalFlowStore } from "@/store/signalFlowStore";

interface ExportProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportProjectDialog({ open, onOpenChange }: ExportProjectDialogProps) {
  const { nodes, edges, nodeIdCounter, selectedNodeId, currentProjectName } = useSignalFlowStore();
  const [copied, setCopied] = useState(false);

  // Generate export JSON
  const exportData = {
    name: currentProjectName,
    exportedAt: new Date().toISOString(),
    projectData: {
      nodes: nodes.map((node) => ({
        ...node,
        // Remove analyser references as they can't be serialized
        data: {
          ...node.data,
          analyser: undefined,
        },
      })),
      edges,
      nodeIdCounter,
      selectedNodeId,
    },
  };

  const jsonString = JSON.stringify(exportData, null, 2);

  // Reset copied state when dialog opens
  useEffect(() => {
    if (open) {
      setCopied(false);
    }
  }, [open]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Export Project</DialogTitle>
          <DialogDescription>
            Copy the JSON below to save your project locally or share it with others.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Textarea
            value={jsonString}
            readOnly
            className="font-mono text-xs h-[300px] resize-none"
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy to Clipboard
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
