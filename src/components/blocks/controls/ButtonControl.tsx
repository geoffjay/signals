import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import type { BlockConfig } from "@/types/blocks";

interface ButtonControlProps {
  config: BlockConfig;
  onPress: () => void;
  onRelease: () => void;
}

/**
 * Button control block - outputs value while pressed, 0 when released
 */
export function ButtonControl({
  config,
  onPress,
  onRelease,
}: ButtonControlProps) {
  // Prevent node selection when clicking on interactive controls
  const stopPropagation = useCallback(
    (e: React.MouseEvent | React.PointerEvent) => {
      e.stopPropagation();
    },
    [],
  );

  return (
    <div className="mb-2 nodrag nowheel">
      <Button
        onMouseDown={onPress}
        onMouseUp={onRelease}
        onMouseLeave={onRelease}
        onPointerDown={stopPropagation}
        onClick={stopPropagation}
        className="w-full"
        size="sm"
      >
        Press
      </Button>
      <div className="text-xs text-center text-muted-foreground mt-1">
        {(config.value ?? 0).toFixed(2)}
      </div>
    </div>
  );
}
