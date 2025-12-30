import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  LogIn,
  LogOut,
  Save,
  FolderOpen,
  Download,
  Upload,
  FilePlus,
  HelpCircle,
  Lightbulb,
  Bug,
  BookOpen,
  Github,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuthStore } from "@/store/authStore";
import { useSignalFlowStore } from "@/store/signalFlowStore";
import { LoginDialog } from "./LoginDialog";
import { SaveProjectDialog } from "./SaveProjectDialog";
import { LoadProjectDialog } from "./LoadProjectDialog";
import { ExportProjectDialog } from "./ExportProjectDialog";
import { ImportProjectDialog } from "./ImportProjectDialog";

export function TopbarMenu() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { isDirty, nodes, createNewProject } = useSignalFlowStore();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);

  const hasExistingProject = nodes.length > 0;

  const handleRequestFeature = () => {
    window.open(
      "https://github.com/geoffjay/signals/issues/new?template=FEATURE_REQUEST_TEMPLATE.md",
      "_blank",
    );
  };

  const handleReportBug = () => {
    window.open(
      "https://github.com/geoffjay/signals/issues/new?template=BUG_TEMPLATE.md",
      "_blank",
    );
  };

  const handleDocumentation = () => {
    navigate("/docs");
  };

  const handleViewSource = () => {
    window.open("https://github.com/geoffjay/signals", "_blank");
  };

  const handleLoginClick = () => {
    setShowLoginDialog(true);
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleNewProject = () => {
    if (hasExistingProject) {
      setShowNewProjectDialog(true);
    } else {
      createNewProject();
    }
  };

  const handleConfirmNewProject = () => {
    createNewProject();
    setShowNewProjectDialog(false);
  };

  // Get user initials for avatar fallback
  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 p-0 rounded-md hover:bg-accent hover:text-accent-foreground">
          <Menu className="w-4 h-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {isAuthenticated && user && (
            <>
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      {user.avatar && (
                        <AvatarImage src={user.avatar} alt={user.name} />
                      )}
                      <AvatarFallback>
                        {getUserInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem onClick={handleNewProject}>
            <FilePlus className="mr-2 h-4 w-4" />
            <span>New Project</span>
          </DropdownMenuItem>

          {isAuthenticated && (
            <>
              <DropdownMenuItem onClick={() => setShowSaveDialog(true)}>
                <Save className="mr-2 h-4 w-4" />
                <span>Save Project</span>
                {isDirty && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    •
                  </span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowLoadDialog(true)}>
                <FolderOpen className="mr-2 h-4 w-4" />
                <span>Load Project</span>
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setShowExportDialog(true)}>
            <Download className="mr-2 h-4 w-4" />
            <span>Export Project</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowImportDialog(true)}>
            <Upload className="mr-2 h-4 w-4" />
            <span>Import Project</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-xs">Theme</span>
            <ThemeToggle />
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Help</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={handleRequestFeature}>
                <Lightbulb className="mr-2 h-4 w-4" />
                <span>Request a Feature</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleReportBug}>
                <Bug className="mr-2 h-4 w-4" />
                <span>Report a Bug</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDocumentation}>
                <BookOpen className="mr-2 h-4 w-4" />
                <span>Documentation</span>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuItem onClick={handleViewSource}>
            <Github className="mr-2 h-4 w-4" />
            <span>View Source</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {isAuthenticated ? (
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={handleLoginClick}>
              <LogIn className="mr-2 h-4 w-4" />
              <span>Login</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />

      <SaveProjectDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
      />

      <LoadProjectDialog
        open={showLoadDialog}
        onOpenChange={setShowLoadDialog}
      />

      <ExportProjectDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
      />

      <ImportProjectDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
      />

      <AlertDialog
        open={showNewProjectDialog}
        onOpenChange={setShowNewProjectDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create New Project?</AlertDialogTitle>
            <AlertDialogDescription>
              You have an existing project with {nodes.length} block
              {nodes.length !== 1 ? "s" : ""}. Creating a new project will clear
              all current blocks and connections. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmNewProject}>
              Create New Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
