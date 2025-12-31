import { useCallback, useRef, useState } from "react";
import type { BlockConfig } from "@/types/blocks";

interface CrossfaderControlProps {
  config: BlockConfig;
  onPositionChange: (position: number) => void;
}

type CurveType = "linear" | "equal-power" | "cut";

/**
 * Calculate gain values for A and B channels based on crossfader position and curve type
 */
export function calculateCrossfadeGains(
  position: number,
  curveType: CurveType
): { gainA: number; gainB: number } {
  const pos = Math.max(0, Math.min(1, position));

  switch (curveType) {
    case "linear":
      // Simple linear crossfade
      return {
        gainA: 1 - pos,
        gainB: pos,
      };

    case "equal-power":
      // Equal-power crossfade (constant total power)
      // Uses sine/cosine curves for smooth transition
      return {
        gainA: Math.cos(pos * Math.PI * 0.5),
        gainB: Math.sin(pos * Math.PI * 0.5),
      };

    case "cut":
      // DJ-style cut crossfade (sharp transition at edges)
      // Full A until 45%, transition 45-55%, full B after 55%
      if (pos < 0.45) {
        return { gainA: 1, gainB: 0 };
      } else if (pos > 0.55) {
        return { gainA: 0, gainB: 1 };
      } else {
        const t = (pos - 0.45) / 0.1;
        return {
          gainA: 1 - t,
          gainB: t,
        };
      }

    default:
      return { gainA: 0.5, gainB: 0.5 };
  }
}

/**
 * Crossfader control block - DJ-style mixer slider
 * Mixes two inputs based on slider position
 */
export function CrossfaderControl({
  config,
  onPositionChange,
}: CrossfaderControlProps) {
  const position = (config.position as number) ?? 0.5;
  const curveType = (config.curveType as CurveType) ?? "equal-power";

  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate current gains for display
  const { gainA, gainB } = calculateCrossfadeGains(position, curveType);

  const updatePosition = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;

      const rect = trackRef.current.getBoundingClientRect();
      const relativeX = (clientX - rect.left) / rect.width;
      const newPosition = Math.max(0, Math.min(1, relativeX));
      onPositionChange(newPosition);
    },
    [onPositionChange]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setIsDragging(true);
      updatePosition(e.clientX);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        updatePosition(moveEvent.clientX);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [updatePosition]
  );

  // Visual indicator width based on fader position
  const knobPosition = position * 100;

  return (
    <div className="mb-2 nodrag nowheel">
      {/* Labels */}
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span className={gainA > 0.5 ? "text-primary font-medium" : ""}>
          A: {(gainA * 100).toFixed(0)}%
        </span>
        <span className="text-center">{curveType}</span>
        <span className={gainB > 0.5 ? "text-primary font-medium" : ""}>
          B: {(gainB * 100).toFixed(0)}%
        </span>
      </div>

      {/* Crossfader track */}
      <div
        ref={trackRef}
        className="relative h-8 bg-zinc-800 rounded-full cursor-pointer"
        style={{
          width: "200px",
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.4)",
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Track markers */}
        <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
          <div className="w-1 h-3 bg-zinc-600 rounded-full" />
          <div className="w-1 h-4 bg-zinc-500 rounded-full" />
          <div className="w-1 h-3 bg-zinc-600 rounded-full" />
        </div>

        {/* Channel A indicator */}
        <div
          className="absolute left-0 top-0 bottom-0 rounded-l-full transition-opacity duration-100"
          style={{
            width: `${Math.max(0, 50 - knobPosition / 2)}%`,
            background: `linear-gradient(to right, rgba(59, 130, 246, ${gainA * 0.6}), transparent)`,
          }}
        />

        {/* Channel B indicator */}
        <div
          className="absolute right-0 top-0 bottom-0 rounded-r-full transition-opacity duration-100"
          style={{
            width: `${Math.max(0, knobPosition / 2 - 50 + 50)}%`,
            background: `linear-gradient(to left, rgba(239, 68, 68, ${gainB * 0.6}), transparent)`,
          }}
        />

        {/* Fader knob */}
        <div
          className={`
            absolute top-1/2 -translate-y-1/2 -translate-x-1/2
            w-10 h-6 rounded-md
            transition-shadow duration-100
            ${isDragging ? "shadow-lg" : "shadow-md"}
          `}
          style={{
            left: `${knobPosition}%`,
            background: isDragging
              ? "linear-gradient(to bottom, #f5f5f5, #d4d4d4)"
              : "linear-gradient(to bottom, #e5e5e5, #a3a3a3)",
            border: "1px solid #737373",
            boxShadow: isDragging
              ? "0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)"
              : "0 2px 6px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.5)",
          }}
        >
          {/* Knob grip lines */}
          <div className="absolute inset-0 flex items-center justify-center gap-0.5">
            <div className="w-0.5 h-3 bg-zinc-500 rounded-full" />
            <div className="w-0.5 h-3 bg-zinc-500 rounded-full" />
            <div className="w-0.5 h-3 bg-zinc-500 rounded-full" />
          </div>
        </div>
      </div>

      {/* Position indicator */}
      <div className="text-xs text-center text-muted-foreground mt-1">
        {position < 0.45
          ? "A"
          : position > 0.55
            ? "B"
            : position < 0.48
              ? "A+"
              : position > 0.52
                ? "B+"
                : "Center"}
      </div>
    </div>
  );
}
