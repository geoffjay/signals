/**
 * Load Instrument Dialog
 *
 * Dialog for loading instruments from drafts or cloud storage.
 */

import { useState, useEffect } from "react";
import {
  FolderOpen,
  Loader2,
  Trash2,
  Search,
  FileDown,
  Cloud,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { useInstrumentBuilderStore } from "@/store/instrumentBuilderStore";
import { useAuthStore } from "@/store/authStore";
import { instrumentApi } from "@/lib/instrumentApi";
import type { InstrumentDraft, InstrumentSummary } from "@/types/instruments";

interface LoadInstrumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoadInstrumentDialog({
  open,
  onOpenChange,
}: LoadInstrumentDialogProps) {
  const { isAuthenticated } = useAuthStore();
  const {
    loadInstrument,
    loadDraft,
    deleteDraft,
    listDrafts,
    instrumentId,
    isDirty,
  } = useInstrumentBuilderStore();

  const [drafts, setDrafts] = useState<InstrumentDraft[]>([]);
  const [cloudInstruments, setCloudInstruments] = useState<InstrumentSummary[]>(
    [],
  );
  const [filteredDrafts, setFilteredDrafts] = useState<InstrumentDraft[]>([]);
  const [filteredCloud, setFilteredCloud] = useState<InstrumentSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmDraft, setDeleteConfirmDraft] =
    useState<InstrumentDraft | null>(null);
  const [deleteConfirmCloud, setDeleteConfirmCloud] =
    useState<InstrumentSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("drafts");

  // Load data when dialog opens
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  // Filter based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredDrafts(
        drafts.filter((d) =>
          d.definition.metadata.name.toLowerCase().includes(query),
        ),
      );
      setFilteredCloud(
        cloudInstruments.filter(
          (i) =>
            i.name.toLowerCase().includes(query) ||
            i.description.toLowerCase().includes(query),
        ),
      );
    } else {
      setFilteredDrafts(drafts);
      setFilteredCloud(cloudInstruments);
    }
  }, [searchQuery, drafts, cloudInstruments]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load local drafts
      const draftList = listDrafts();
      setDrafts(draftList);
      setFilteredDrafts(draftList);

      // Load cloud instruments if authenticated
      if (isAuthenticated) {
        const cloudList = await instrumentApi.listMine();
        setCloudInstruments(cloudList);
        setFilteredCloud(cloudList);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load instruments",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadDraft = (draft: InstrumentDraft) => {
    if (isDirty) {
      const confirmLoad = window.confirm(
        "You have unsaved changes. Loading will discard them. Continue?",
      );
      if (!confirmLoad) return;
    }

    loadDraft(draft.id);
    onOpenChange(false);
    setSearchQuery("");
  };

  const handleLoadCloud = async (instrument: InstrumentSummary) => {
    if (isDirty) {
      const confirmLoad = window.confirm(
        "You have unsaved changes. Loading will discard them. Continue?",
      );
      if (!confirmLoad) return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const definition = await instrumentApi.load(instrument.id);
      loadInstrument(definition, instrument.id);
      onOpenChange(false);
      setSearchQuery("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load instrument",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDraft = () => {
    if (!deleteConfirmDraft) return;

    deleteDraft(deleteConfirmDraft.id);
    setDrafts((prev) => prev.filter((d) => d.id !== deleteConfirmDraft.id));
    setDeleteConfirmDraft(null);
  };

  const handleDeleteCloud = async () => {
    if (!deleteConfirmCloud) return;

    setIsDeleting(true);

    try {
      await instrumentApi.delete(deleteConfirmCloud.id);
      setCloudInstruments((prev) =>
        prev.filter((i) => i.id !== deleteConfirmCloud.id),
      );
      setDeleteConfirmCloud(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete instrument",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Load Instrument</DialogTitle>
            <DialogDescription>
              Select an instrument from your drafts or saved instruments.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive text-destructive px-3 py-2 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search instruments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Tab buttons */}
            <div className="flex gap-2 border-b border-border pb-2">
              <Button
                variant={activeTab === "drafts" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("drafts")}
                className="gap-2"
              >
                <FileDown className="h-4 w-4" />
                Drafts ({filteredDrafts.length})
              </Button>
              <Button
                variant={activeTab === "cloud" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("cloud")}
                disabled={!isAuthenticated}
                className="gap-2"
              >
                <Cloud className="h-4 w-4" />
                Cloud ({filteredCloud.length})
              </Button>
            </div>

            {/* Drafts tab content */}
            {activeTab === "drafts" && (
              <>
                {isLoading && drafts.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredDrafts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      No drafts yet
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Save your work as a draft to see it here
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[350px] rounded-md border">
                    <div className="p-4 space-y-2">
                      {filteredDrafts.map((draft) => (
                        <div
                          key={draft.id}
                          className={`group flex items-start justify-between p-3 rounded-lg border transition-colors ${
                            instrumentId === draft.id
                              ? "bg-accent border-primary"
                              : "hover:bg-accent/50"
                          }`}
                        >
                          <button
                            className="flex-1 text-left min-w-0"
                            onClick={() => handleLoadDraft(draft)}
                            disabled={isLoading}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm truncate">
                                {draft.definition.metadata.name}
                              </h4>
                              {instrumentId === draft.id && (
                                <span className="text-xs text-primary">
                                  (Current)
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Modified {formatDate(draft.lastModified)}
                            </p>
                          </button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmDraft(draft);
                            }}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </>
            )}

            {/* Cloud tab content */}
            {activeTab === "cloud" && (
              <>
                {!isAuthenticated ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Cloud className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Log in to access cloud instruments
                    </p>
                  </div>
                ) : isLoading && cloudInstruments.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredCloud.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Cloud className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      No saved instruments yet
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Save an instrument to the cloud to see it here
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[350px] rounded-md border">
                    <div className="p-4 space-y-2">
                      {filteredCloud.map((instrument) => (
                        <div
                          key={instrument.id}
                          className="group flex items-start justify-between p-3 rounded-lg border transition-colors hover:bg-accent/50"
                        >
                          <button
                            className="flex-1 text-left min-w-0"
                            onClick={() => handleLoadCloud(instrument)}
                            disabled={isLoading}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm truncate">
                                {instrument.name}
                              </h4>
                              {instrument.isPublic && (
                                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                  Public
                                </span>
                              )}
                            </div>
                            {instrument.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                                {instrument.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>
                                {instrument.inputCount} inputs,{" "}
                                {instrument.outputCount} outputs
                              </span>
                              <span>
                                Updated {formatDate(instrument.updatedAt)}
                              </span>
                            </div>
                          </button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmCloud(instrument);
                            }}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Draft Confirmation */}
      <AlertDialog
        open={deleteConfirmDraft !== null}
        onOpenChange={(open) => !open && setDeleteConfirmDraft(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "
              {deleteConfirmDraft?.definition.metadata.name}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDraft}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Cloud Confirmation */}
      <AlertDialog
        open={deleteConfirmCloud !== null}
        onOpenChange={(open) => !open && setDeleteConfirmCloud(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Instrument</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirmCloud?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCloud}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
