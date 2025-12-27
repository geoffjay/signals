import { Button } from "@/components/ui/button";
import type { BlockConfig } from "@/types/blocks";

interface ToggleControlProps {
  config: BlockConfig;
  onToggle: (e: React.MouseEvent) => void;
}

/**
 * Toggle control block - outputs value when on, 0 when off
 */
export function ToggleControl({ config, onToggle }: ToggleControlProps) {
  const isOn = (config.value ?? 0) !== 0;

  return (
    <div className="mb-2 nodrag nowheel">
      <Button
        onClick={onToggle}
        variant={isOn ? "default" : "outline"}
        className="w-full"
        size="sm"
      >
        {isOn ? "On" : "Off"}
      </Button>
      <div className="text-xs text-center text-muted-foreground mt-1">
        {(config.value ?? 0).toFixed(2)}
      </div>
    </div>
  );
}
