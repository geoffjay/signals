import { useState, useEffect } from "react";
import { FolderOpen, Loader2, Trash2, Search } from "lucide-react";
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
import { useSignalFlowStore } from "@/store/signalFlowStore";
import { useAuthStore } from "@/store/authStore";
import type { ProjectMetadata } from "@/lib/projectApi";

interface LoadProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoadProjectDialog({ open, onOpenChange }: LoadProjectDialogProps) {
  const { isAuthenticated } = useAuthStore();
  const { loadProject, deleteProject, listUserProjects, currentProjectId, isDirty } =
    useSignalFlowStore();

  const [projects, setProjects] = useState<ProjectMetadata[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ProjectMetadata[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmProject, setDeleteConfirmProject] = useState<ProjectMetadata | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Load projects when dialog opens
  useEffect(() => {
    if (open && isAuthenticated) {
      loadProjects();
    }
  }, [open, isAuthenticated]);

  // Filter projects based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredProjects(
        projects.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query),
        ),
      );
    } else {
      setFilteredProjects(projects);
    }
  }, [searchQuery, projects]);

  const loadProjects = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const projectList = await listUserProjects();
      setProjects(projectList);
      setFilteredProjects(projectList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadProject = async (project: ProjectMetadata) => {
    if (isDirty) {
      const confirmLoad = window.confirm(
        "You have unsaved changes. Loading a project will discard them. Continue?",
      );
      if (!confirmLoad) return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await loadProject(project.id);
      onOpenChange(false);
      setSearchQuery("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteConfirmProject) return;

    setIsDeleting(true);

    try {
      await deleteProject(deleteConfirmProject.id);
      setProjects((prev) => prev.filter((p) => p.id !== deleteConfirmProject.id));
      setDeleteConfirmProject(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project");
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
            <DialogTitle>Load Project</DialogTitle>
            <DialogDescription>
              Select a project to load from your saved projects.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive text-destructive px-3 py-2 rounded-md text-sm">
                {error}
              </div>
            )}

            {!isAuthenticated ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  You must be logged in to load projects
                </p>
              </div>
            ) : isLoading && projects.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No projects yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Save your first project to see it here
                </p>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>

                <ScrollArea className="h-[400px] rounded-md border">
                  {filteredProjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Search className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No projects found</p>
                    </div>
                  ) : (
                    <div className="p-4 space-y-2">
                      {filteredProjects.map((project) => (
                        <div
                          key={project.id}
                          className={`group flex items-start justify-between p-3 rounded-lg border transition-colors ${
                            currentProjectId === project.id
                              ? "bg-accent border-primary"
                              : "hover:bg-accent/50"
                          }`}
                        >
                          <button
                            className="flex-1 text-left min-w-0"
                            onClick={() => handleLoadProject(project)}
                            disabled={isLoading}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm truncate">
                                {project.name}
                              </h4>
                              {currentProjectId === project.id && (
                                <span className="text-xs text-primary">(Current)</span>
                              )}
                            </div>
                            {project.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                                {project.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Updated {formatDate(project.updatedAt)}
                            </p>
                          </button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmProject(project);
                            }}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteConfirmProject !== null}
        onOpenChange={(open) => !open && setDeleteConfirmProject(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirmProject?.name}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
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
