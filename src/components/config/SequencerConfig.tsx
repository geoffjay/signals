import { ConfigField, NumberInput } from "./shared";
import type { ConfigComponentProps } from "./types";

/**
 * Configuration for sequencer block
 */
export function SequencerConfig({ config, onConfigChange }: ConfigComponentProps) {
  const bpm = config.seqBpm || 120;
  const steps = config.seqSteps || 16;
  const rows = config.seqRows || 4;
  const mode = config.seqMode || "triggers";
  const noteValues = config.seqNoteValues || [261.63, 293.66, 329.63, 349.23];
  const grid = config.seqGrid || [];

  // Handle steps change - need to resize grid
  const handleStepsChange = (newSteps: number) => {
    const newGrid: boolean[][] = [];
    for (let r = 0; r < rows; r++) {
      const rowData = grid[r] || [];
      newGrid[r] = [];
      for (let s = 0; s < newSteps; s++) {
        newGrid[r][s] = rowData[s] || false;
      }
    }
    onConfigChange({ seqSteps: newSteps, seqGrid: newGrid });
  };

  // Handle rows change - need to resize grid and note values
  const handleRowsChange = (newRows: number) => {
    const newGrid: boolean[][] = [];
    for (let r = 0; r < newRows; r++) {
      const rowData = grid[r] || [];
      newGrid[r] = [];
      for (let s = 0; s < steps; s++) {
        newGrid[r][s] = rowData[s] || false;
      }
    }
    // Ensure note values array has correct length
    const newNoteValues = Array.from({ length: newRows }, (_, i) =>
      noteValues[i] || 261.63 * Math.pow(2, i / 12)
    );
    onConfigChange({ seqRows: newRows, seqGrid: newGrid, seqNoteValues: newNoteValues });
  };

  // Handle note value change for a specific row
  const handleNoteValueChange = (rowIndex: number, value: number) => {
    const newNoteValues = [...noteValues];
    newNoteValues[rowIndex] = value;
    onConfigChange({ seqNoteValues: newNoteValues });
  };

  // Clear all cells in the grid
  const handleClearGrid = () => {
    const newGrid: boolean[][] = [];
    for (let r = 0; r < rows; r++) {
      newGrid[r] = Array(steps).fill(false);
    }
    onConfigChange({ seqGrid: newGrid });
  };

  return (
    <>
      <ConfigField label="BPM" htmlFor="seqBpm">
        <NumberInput
          id="seqBpm"
          min={20}
          max={300}
          step={1}
          value={bpm}
          onChange={(value: number) => onConfigChange({ seqBpm: value })}
        />
      </ConfigField>

      <ConfigField label="Steps" htmlFor="seqSteps">
        <select
          id="seqSteps"
          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          value={steps}
          onChange={(e) => handleStepsChange(Number(e.target.value))}
        >
          <option value={8}>8 Steps</option>
          <option value={16}>16 Steps</option>
        </select>
      </ConfigField>

      <ConfigField label="Rows" htmlFor="seqRows">
        <select
          id="seqRows"
          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          value={rows}
          onChange={(e) => handleRowsChange(Number(e.target.value))}
        >
          <option value={4}>4 Rows</option>
          <option value={8}>8 Rows</option>
        </select>
      </ConfigField>

      <ConfigField label="Output Mode" htmlFor="seqMode">
        <select
          id="seqMode"
          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          value={mode}
          onChange={(e) => onConfigChange({ seqMode: e.target.value as "triggers" | "note" })}
        >
          <option value="triggers">Triggers (one output per row)</option>
          <option value="note">Note (single trigger + pitch)</option>
        </select>
      </ConfigField>

      {mode === "note" && (
        <div className="mt-4 space-y-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Note Values (Hz)
          </div>
          {Array.from({ length: rows }).map((_, i) => {
            const noteValue = noteValues[i] || 261.63;
            return (
              <div key={i} className="flex items-center gap-2">
                <div className="text-xs w-12">Row {i}:</div>
                <NumberInput
                  id={`note-${i}`}
                  min={20}
                  max={20000}
                  step={0.01}
                  value={noteValue}
                  onChange={(value) => handleNoteValueChange(i, value)}
                />
                <span className="text-xs text-muted-foreground">Hz</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={handleClearGrid}
          className="w-full h-9 rounded-md bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors"
        >
          Clear Grid
        </button>
      </div>
    </>
  );
}
