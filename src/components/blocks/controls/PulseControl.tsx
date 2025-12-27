import { Button } from "@/components/ui/button";
import type { BlockConfig } from "@/types/blocks";

interface PulseControlProps {
  config: BlockConfig;
  onPulse: (e: React.MouseEvent) => void;
}

/**
 * Pulse control block - outputs a pulse value for a configured duration
 */
export function PulseControl({ config, onPulse }: PulseControlProps) {
  return (
    <div className="mb-2 nodrag nowheel">
      <Button onClick={onPulse} className="w-full" size="sm">
        Pulse
      </Button>
      <div className="text-xs text-center text-muted-foreground mt-1">
        {(config.value ?? 0).toFixed(2)}
      </div>
    </div>
  );
}
