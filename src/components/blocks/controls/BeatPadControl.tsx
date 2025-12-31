import { useCallback, useMemo } from "react";
import type { BlockConfig } from "@/types/blocks";

interface BeatPadControlProps {
  config: BlockConfig;
  onPadPress: (padIndex: number, velocity: number) => void;
  onPadRelease: () => void;
}

// Default pad colors (can be overridden in config)
const DEFAULT_PAD_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f43f5e", // rose
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#a855f7", // purple
  "#f59e0b", // amber
  "#10b981", // emerald
  "#6366f1", // indigo
  "#d946ef", // fuchsia
];

interface PadProps {
  index: number;
  color: string;
  isActive: boolean;
  size: number;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
}

function Pad({
  index,
  color,
  isActive,
  size,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
}: PadProps) {
  return (
    <button
      className={`
        cursor-pointer select-none
        transition-all duration-75
        border-2 border-transparent
        ${isActive ? "scale-95" : "hover:scale-[1.02]"}
      `}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "6px",
        backgroundColor: isActive ? color : `${color}cc`,
        boxShadow: isActive
          ? `inset 0 2px 8px rgba(0,0,0,0.4), 0 0 12px ${color}80`
          : `0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)`,
        transform: isActive ? "translateY(2px)" : undefined,
      }}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      <span
        className="text-white font-bold opacity-50"
        style={{
          fontSize: `${Math.max(10, size / 4)}px`,
          textShadow: "0 1px 2px rgba(0,0,0,0.5)",
        }}
      >
        {index + 1}
      </span>
    </button>
  );
}

/**
 * Beat Pad control block - grid of trigger pads
 * Outputs trigger, pad index, and velocity signals
 */
export function BeatPadControl({
  config,
  onPadPress,
  onPadRelease,
}: BeatPadControlProps) {
  const columns = Math.min(8, Math.max(1, (config.columns as number) ?? 4));
  const rows = Math.min(8, Math.max(1, (config.rows as number) ?? 4));
  const padSize = Math.min(60, Math.max(24, (config.padSize as number) ?? 40));
  const gap = Math.min(12, Math.max(2, (config.gap as number) ?? 4));
  const activePad = (config.activePad as number) ?? -1;
  const customColors = (config.padColors as string[]) ?? [];

  // Generate pad data
  const pads = useMemo(() => {
    const result: Array<{ index: number; color: string }> = [];
    const totalPads = columns * rows;

    for (let i = 0; i < totalPads; i++) {
      result.push({
        index: i,
        color: customColors[i] || DEFAULT_PAD_COLORS[i % DEFAULT_PAD_COLORS.length],
      });
    }
    return result;
  }, [columns, rows, customColors]);

  // Calculate velocity based on where the pad was pressed
  const handleMouseDown = useCallback(
    (padIndex: number) => (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      // Velocity based on distance from center (center = max velocity)
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const dx = Math.abs(e.clientX - rect.left - centerX) / centerX;
      const dy = Math.abs(e.clientY - rect.top - centerY) / centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      // Velocity: 1.0 at center, 0.5 at edges
      const velocity = Math.max(0.5, 1 - distance * 0.5);
      onPadPress(padIndex, velocity);
    },
    [onPadPress]
  );

  const handleMouseUp = useCallback(() => {
    onPadRelease();
  }, [onPadRelease]);

  // Calculate total width/height
  const totalWidth = columns * padSize + (columns - 1) * gap;
  const totalHeight = rows * padSize + (rows - 1) * gap;

  return (
    <div className="mb-2 nodrag nowheel">
      {/* Display active pad info */}
      <div className="text-xs text-center text-muted-foreground mb-2">
        {activePad >= 0 ? `Pad ${activePad + 1}` : "Tap a pad"}
      </div>

      {/* Pad grid container */}
      <div
        className="bg-zinc-900 p-2 rounded-lg"
        style={{
          width: `${totalWidth + 16}px`,
        }}
      >
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${columns}, ${padSize}px)`,
            gridTemplateRows: `repeat(${rows}, ${padSize}px)`,
            gap: `${gap}px`,
            width: `${totalWidth}px`,
            height: `${totalHeight}px`,
          }}
        >
          {pads.map((pad) => (
            <Pad
              key={pad.index}
              index={pad.index}
              color={pad.color}
              isActive={activePad === pad.index}
              size={padSize}
              onMouseDown={handleMouseDown(pad.index)}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
