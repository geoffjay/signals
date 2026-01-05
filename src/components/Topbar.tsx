import { Play, Square, Waves, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopbarMenu } from "@/components/TopbarMenu";
import { SearchTrigger } from "@/components/SearchTrigger";
import { SearchDialog, useSearchDialog } from "@/components/SearchDialog";
import { useSignalFlowStore, type AppMode } from "@/store/signalFlowStore";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TopbarProps {
  isPlaying: boolean;
  onTogglePlayback: () => void;
}

const MODE_CONFIG: Record<AppMode, { icon: typeof Waves; label: string; tooltip: string }> = {
  signal: {
    icon: Waves,
    label: "Signal",
    tooltip: "Signal Generation Mode - Click to switch to Visualizer",
  },
  visualizer: {
    icon: Eye,
    label: "Visualizer",
    tooltip: "Audio Visualizer Mode - Click to switch to Signal",
  },
};

export function Topbar({ isPlaying, onTogglePlayback }: TopbarProps) {
  const { appMode, toggleAppMode } = useSignalFlowStore();
  const ModeIcon = MODE_CONFIG[appMode].icon;
  const { open, setOpen } = useSearchDialog();

  return (
    <div className="h-12 flex items-center justify-end px-4 gap-2">
      <div className="flex-1" />
      <SearchTrigger onClick={() => setOpen(true)} />
      <div className="w-4" />
      <Button
        onClick={onTogglePlayback}
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0"
      >
        {isPlaying ? (
          <Square className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </Button>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            onClick={toggleAppMode}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 hover:bg-accent hover:text-accent-foreground h-8 w-8 rounded-md"
          >
            <ModeIcon className="w-4 h-4" />
          </TooltipTrigger>
          <TooltipContent>
            <p>{MODE_CONFIG[appMode].tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TopbarMenu />
      <SearchDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
