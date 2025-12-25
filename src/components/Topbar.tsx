import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopbarMenu } from "@/components/TopbarMenu";

interface TopbarProps {
  isPlaying: boolean;
  onTogglePlayback: () => void;
}

export function Topbar({ isPlaying, onTogglePlayback }: TopbarProps) {
  return (
    <div className="h-12 flex items-center justify-end px-4 gap-2">
      <Button
        onClick={onTogglePlayback}
        size="sm"
        variant={isPlaying ? "destructive" : "default"}
        className="h-8 w-8 p-0"
      >
        {isPlaying ? (
          <Square className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </Button>
      <TopbarMenu />
    </div>
  );
}
