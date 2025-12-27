import { useState, useEffect } from "react";
import { Upload } from "lucide-react";
import { type Node, type Edge } from "@xyflow/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSignalFlowStore } from "@/store/signalFlowStore";

interface ImportProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedProject {
  name: string;
  projectData: {
    nodes: Node[];
    edges: Edge[];
    nodeIdCounter: number;
    selectedNodeId: string | null;
  };
}

export function ImportProjectDialog({ open, onOpenChange }: ImportProjectDialogProps) {
  const { importProject, nodes } = useSignalFlowStore();
  const [jsonInput, setJsonInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingImport, setPendingImport] = useState<ParsedProject | null>(null);

  const hasExistingProject = nodes.length > 0;

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setJsonInput("");
      setError(null);
      setShowConfirmDialog(false);
      setPendingImport(null);
    }
  }, [open]);

  const validateAndParseJson = (input: string): ParsedProject => {
    if (!input.trim()) {
      throw new Error("Please paste project JSON to import");
    }

    let parsed;
    try {
      parsed = JSON.parse(input);
    } catch {
      throw new Error("Invalid JSON format. Please check your input.");
    }

    // Validate structure
    const projectData = parsed.projectData || parsed;

    if (!projectData.nodes || !Array.isArray(projectData.nodes)) {
      throw new Error("Invalid project format: missing or invalid 'nodes' array");
    }

    if (!projectData.edges || !Array.isArray(projectData.edges)) {
      throw new Error("Invalid project format: missing or invalid 'edges' array");
    }

    // Validate nodes have required fields
    for (const node of projectData.nodes) {
      if (!node.id || !node.position || !node.data) {
        throw new Error("Invalid project format: nodes missing required fields (id, position, data)");
      }
      if (!node.data.blockType) {
        throw new Error("Invalid project format: node data missing 'blockType'");
      }
    }

    // Validate edges have required fields
    for (const edge of projectData.edges) {
      if (!edge.id || !edge.source || !edge.target) {
        throw new Error("Invalid project format: edges missing required fields (id, source, target)");
      }
    }

    return {
      name: parsed.name || "Imported Project",
      projectData: {
        nodes: projectData.nodes as Node[],
        edges: projectData.edges as Edge[],
        nodeIdCounter: projectData.nodeIdCounter ?? projectData.nodes.length,
        selectedNodeId: projectData.selectedNodeId ?? null,
      },
    };
  };

  const handleImport = () => {
    try {
      const parsed = validateAndParseJson(jsonInput);

      // If there's an existing project, show confirmation dialog
      if (hasExistingProject) {
        setPendingImport(parsed);
        setShowConfirmDialog(true);
        return;
      }

      // No existing project, import directly
      doImport(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import project");
    }
  };

  const doImport = (parsed: ParsedProject) => {
    importProject(parsed.name, parsed.projectData);
    onOpenChange(false);
  };

  const handleConfirmImport = () => {
    if (pendingImport) {
      doImport(pendingImport);
    }
    setShowConfirmDialog(false);
    setPendingImport(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setError(null);
      setJsonInput("");
      setShowConfirmDialog(false);
      setPendingImport(null);
    }
    onOpenChange(open);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Import Project</DialogTitle>
            <DialogDescription>
              Paste project JSON below to import a project.
              {hasExistingProject && " This will replace your current work."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive text-destructive px-3 py-2 rounded-md text-sm">
                {error}
              </div>
            )}

            <Textarea
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                setError(null);
              }}
              placeholder="Paste project JSON here..."
              className="font-mono text-xs h-[300px] resize-none"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleImport}>
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace Current Project?</AlertDialogTitle>
            <AlertDialogDescription>
              You have an existing project with {nodes.length} block{nodes.length !== 1 ? "s" : ""}.
              Importing will create a new project and replace your current work.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingImport(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmImport}>
              Import Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
