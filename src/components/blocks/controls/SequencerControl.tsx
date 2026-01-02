import { useCallback, useMemo } from "react";
import type { BlockConfig } from "@/types/blocks";

interface SequencerControlProps {
  config: BlockConfig;
  onCellToggle: (row: number, step: number) => void;
}

// Colors for each row (trigger/note rows)
const ROW_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
];

interface CellProps {
  row: number;
  step: number;
  isActive: boolean;
  isPlayhead: boolean;
  color: string;
  size: number;
  onClick: () => void;
}

function Cell({
  isActive,
  isPlayhead,
  color,
  size,
  onClick,
}: CellProps) {
  return (
    <button
      className={`
        cursor-pointer select-none
        transition-all duration-75
        border border-zinc-600
        ${isPlayhead ? "ring-2 ring-white ring-opacity-60" : ""}
      `}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "3px",
        backgroundColor: isActive
          ? color
          : isPlayhead
            ? "rgba(255, 255, 255, 0.15)"
            : "rgba(0, 0, 0, 0.3)",
        boxShadow: isActive
          ? `inset 0 1px 4px rgba(0,0,0,0.3), 0 0 6px ${color}60`
          : "inset 0 1px 2px rgba(0,0,0,0.2)",
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    />
  );
}

/**
 * Sequencer control block - step sequencer grid with playhead
 * Outputs triggers per row (or single trigger + note) and step index
 */
export function SequencerControl({
  config,
  onCellToggle,
}: SequencerControlProps) {
  const steps = config.seqSteps || 16;
  const rows = config.seqRows || 4;
  const currentStep = config.seqCurrentStep ?? -1;
  const grid = config.seqGrid || [];

  // Cell size depends on number of steps
  const cellSize = steps === 16 ? 16 : 22;
  const gap = 2;

  // Ensure grid has correct dimensions
  const normalizedGrid = useMemo(() => {
    const result: boolean[][] = [];
    for (let r = 0; r < rows; r++) {
      const rowData = grid[r] || [];
      result[r] = [];
      for (let s = 0; s < steps; s++) {
        result[r][s] = rowData[s] || false;
      }
    }
    return result;
  }, [grid, rows, steps]);

  const handleCellClick = useCallback(
    (row: number, step: number) => {
      onCellToggle(row, step);
    },
    [onCellToggle],
  );

  // Calculate total width
  const totalWidth = steps * cellSize + (steps - 1) * gap;

  return (
    <div className="mb-2 nodrag nowheel">
      {/* BPM and step display */}
      <div className="flex justify-between text-xs text-muted-foreground mb-2">
        <span>{config.seqBpm || 120} BPM</span>
        <span>
          Step {currentStep >= 0 ? currentStep + 1 : "-"}/{steps}
        </span>
      </div>

      {/* Sequencer grid container */}
      <div
        className="bg-zinc-900 p-2 rounded-lg"
        style={{
          width: `${totalWidth + 16}px`,
        }}
      >
        {/* Step numbers */}
        <div
          className="flex mb-1"
          style={{ gap: `${gap}px`, marginLeft: "0px" }}
        >
          {Array.from({ length: steps }, (_, i) => (
            <div
              key={i}
              className={`text-center text-[8px] ${
                currentStep === i
                  ? "text-white font-bold"
                  : "text-zinc-500"
              }`}
              style={{ width: `${cellSize}px` }}
            >
              {(i % 4 === 0) ? i + 1 : ""}
            </div>
          ))}
        </div>

        {/* Grid rows */}
        <div className="flex flex-col" style={{ gap: `${gap}px` }}>
          {Array.from({ length: rows }, (_, rowIndex) => (
            <div key={rowIndex} className="flex" style={{ gap: `${gap}px` }}>
              {Array.from({ length: steps }, (_, stepIndex) => (
                <Cell
                  key={stepIndex}
                  row={rowIndex}
                  step={stepIndex}
                  isActive={normalizedGrid[rowIndex][stepIndex]}
                  isPlayhead={currentStep === stepIndex}
                  color={ROW_COLORS[rowIndex % ROW_COLORS.length]}
                  size={cellSize}
                  onClick={() => handleCellClick(rowIndex, stepIndex)}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Row labels */}
        <div
          className="flex mt-1"
          style={{ gap: `${gap}px` }}
        >
          {Array.from({ length: rows }, (_, i) => (
            <div
              key={i}
              className="text-[8px] text-zinc-500"
              style={{
                width: `${(steps * cellSize + (steps - 1) * gap) / rows - gap}px`,
                textAlign: "center",
              }}
            >
              T{i}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
