import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSignalFlowStore } from "@/store/signalFlowStore";
import { useAuthStore } from "@/store/authStore";

interface SaveProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaveProjectDialog({
  open,
  onOpenChange,
}: SaveProjectDialogProps) {
  const { isAuthenticated } = useAuthStore();
  const { currentProjectName, currentProjectId, saveProject } =
    useSignalFlowStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with current project name
  useEffect(() => {
    if (open) {
      setName(currentProjectName);
      setDescription("");
      setError(null);
    }
  }, [open, currentProjectName]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setError("You must be logged in to save projects");
      return;
    }

    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await saveProject(name.trim(), description.trim() || undefined);
      onOpenChange(false);
      setName("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save project");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setError(null);
      setName("");
      setDescription("");
    }
    onOpenChange(open);
  };

  const isUpdate = currentProjectId !== null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isUpdate ? "Update Project" : "Save Project"}
          </DialogTitle>
          <DialogDescription>
            {isUpdate
              ? "Update your project with the current state."
              : "Save your signal processing project to the cloud."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              type="text"
              placeholder="My Signal Project"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description for your project..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isUpdate ? (
                "Update"
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
