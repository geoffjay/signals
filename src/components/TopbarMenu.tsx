import { useState } from "react";
import { Menu, LogIn, LogOut, Save, FolderOpen } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuthStore } from "@/store/authStore";
import { useSignalFlowStore } from "@/store/signalFlowStore";
import { LoginDialog } from "./LoginDialog";
import { SaveProjectDialog } from "./SaveProjectDialog";
import { LoadProjectDialog } from "./LoadProjectDialog";

export function TopbarMenu() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { isDirty } = useSignalFlowStore();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);

  const handleLoginClick = () => {
    setShowLoginDialog(true);
  };

  const handleLogout = async () => {
    await logout();
  };

  // Get user initials for avatar fallback
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
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
                      <p className="text-sm font-medium leading-none">{user.name}</p>
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

          {isAuthenticated && (
            <>
              <DropdownMenuItem onClick={() => setShowSaveDialog(true)}>
                <Save className="mr-2 h-4 w-4" />
                <span>Save Project</span>
                {isDirty && <span className="ml-auto text-xs text-muted-foreground">•</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowLoadDialog(true)}>
                <FolderOpen className="mr-2 h-4 w-4" />
                <span>Load Project</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-xs">Theme</span>
            <ThemeToggle />
          </div>

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

      <LoginDialog
        open={showLoginDialog}
        onOpenChange={setShowLoginDialog}
      />

      <SaveProjectDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
      />

      <LoadProjectDialog
        open={showLoadDialog}
        onOpenChange={setShowLoadDialog}
      />
    </>
  );
}
