import { useState, useEffect, type ReactNode } from "react";
import { LayoutGrid, LayoutList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

interface ToolbarShellProps {
  title: string;
  children: ReactNode;
}

export function ToolbarShell({ title, children }: ToolbarShellProps) {
  // Initialize from localStorage
  const [showLabels, setShowLabels] = useState(() => {
    const saved = localStorage.getItem("toolbar-show-labels");
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Save showLabels to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("toolbar-show-labels", JSON.stringify(showLabels));
  }, [showLabels]);

  return (
    <div className="w-64 flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-1 flex items-center justify-between">
        <span className="text-sm font-semibold text-muted-foreground">
          {title}
        </span>
        <Button
          onClick={() => setShowLabels(!showLabels)}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          data-tooltip-id="view-toggle-tooltip"
          data-tooltip-content={showLabels ? "Icons Only" : "Show Labels"}
        >
          {showLabels ? (
            <LayoutGrid className="w-4 h-4" />
          ) : (
            <LayoutList className="w-4 h-4" />
          )}
        </Button>
      </div>

      <Separator />

      {/* Content - pass showLabels to children via context or render props */}
      <ToolbarContext.Provider value={{ showLabels }}>
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {children}
        </div>
      </ToolbarContext.Provider>

      <Tooltip
        id="block-tooltip"
        place="top"
        delayShow={300}
        style={{
          fontSize: "11px",
          padding: "4px 8px",
          zIndex: 9999,
        }}
      />
      <Tooltip
        id="view-toggle-tooltip"
        place="bottom"
        delayShow={300}
        style={{
          fontSize: "11px",
          padding: "4px 8px",
          zIndex: 9999,
        }}
      />
    </div>
  );
}

// Context for sharing toolbar settings with children
import { createContext, useContext } from "react";

interface ToolbarContextValue {
  showLabels: boolean;
}

const ToolbarContext = createContext<ToolbarContextValue>({ showLabels: true });

export function useToolbarContext() {
  return useContext(ToolbarContext);
}
