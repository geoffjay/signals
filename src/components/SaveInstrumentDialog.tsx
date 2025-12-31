/**
 * Save Instrument Dialog
 *
 * Dialog for saving an instrument to the cloud.
 * Requires authentication.
 */

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
import { useInstrumentBuilderStore } from "@/store/instrumentBuilderStore";
import { useAuthStore } from "@/store/authStore";

interface SaveInstrumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaveInstrumentDialog({
  open,
  onOpenChange,
}: SaveInstrumentDialogProps) {
  const { isAuthenticated } = useAuthStore();
  const {
    instrumentName,
    instrumentDescription,
    cloudRecordId,
    setInstrumentName,
    setInstrumentDescription,
    saveToCloud,
    updateInCloud,
    validateInstrument,
  } = useInstrumentBuilderStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with current instrument values
  useEffect(() => {
    if (open) {
      setName(instrumentName);
      setDescription(instrumentDescription);
      setError(null);
    }
  }, [open, instrumentName, instrumentDescription]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setError("You must be logged in to save instruments");
      return;
    }

    if (!name.trim()) {
      setError("Instrument name is required");
      return;
    }

    // Validate instrument
    const validationErrors = validateInstrument();
    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Update store with form values before saving
      setInstrumentName(name.trim());
      setInstrumentDescription(description.trim());

      if (cloudRecordId) {
        await updateInCloud();
      } else {
        await saveToCloud();
      }

      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save instrument",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setError(null);
    }
    onOpenChange(open);
  };

  const isUpdate = cloudRecordId !== null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isUpdate ? "Update Instrument" : "Save Instrument"}
          </DialogTitle>
          <DialogDescription>
            {isUpdate
              ? "Update your instrument with the current state."
              : "Save your instrument to the cloud for reuse."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-3 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Instrument Name *</Label>
            <Input
              id="name"
              type="text"
              placeholder="My Synth Bass"
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
              placeholder="Optional description of your instrument..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              id="public"
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              disabled={isLoading}
              className="h-4 w-4 rounded border-gray-300"
            />
            <div className="space-y-0.5">
              <Label htmlFor="public">Make Public</Label>
              <p className="text-xs text-muted-foreground">
                Allow others to use this instrument
              </p>
            </div>
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
