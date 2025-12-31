import { useCallback, useMemo } from "react";
import type { BlockConfig } from "@/types/blocks";

interface KeyboardControlProps {
  config: BlockConfig;
  onKeyPress: (frequency: number, velocity: number) => void;
  onKeyRelease: () => void;
}

// Calculate frequency for a given MIDI note number
// A4 (MIDI 69) = 440 Hz
function midiToFrequency(midiNote: number): number {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

// Check if a note is a black key
function isBlackKey(noteIndex: number): boolean {
  return [1, 3, 6, 8, 10].includes(noteIndex % 12);
}

interface KeyProps {
  note: number;
  isBlack: boolean;
  isActive: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
}

function Key({
  note,
  isBlack,
  isActive,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
}: KeyProps) {
  const noteIndex = note % 12;
  const octave = Math.floor(note / 12) - 1;
  const isC = noteIndex === 0;

  if (isBlack) {
    return (
      <div
        className={`
          absolute z-10 cursor-pointer select-none
          transition-all duration-75
          ${isActive ? "bg-zinc-600" : "bg-zinc-900 hover:bg-zinc-800"}
        `}
        style={{
          width: "18px",
          height: "52px",
          borderRadius: "0 0 3px 3px",
          boxShadow: isActive
            ? "inset 0 -2px 4px rgba(0,0,0,0.3)"
            : "0 2px 4px rgba(0,0,0,0.5)",
        }}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      />
    );
  }

  return (
    <div
      className={`
        relative cursor-pointer select-none
        border-r border-zinc-300
        transition-all duration-75
        ${isActive ? "bg-zinc-300" : "bg-white hover:bg-zinc-100"}
      `}
      style={{
        width: "28px",
        height: "80px",
        borderRadius: "0 0 4px 4px",
        boxShadow: isActive
          ? "inset 0 2px 8px rgba(0,0,0,0.2)"
          : "0 2px 4px rgba(0,0,0,0.1)",
      }}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      {isC && (
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-zinc-400 font-medium">
          C{octave}
        </span>
      )}
    </div>
  );
}

/**
 * Keyboard control block - synthesizer-style keyboard
 * Outputs frequency, gate, and velocity signals
 */
export function KeyboardControl({
  config,
  onKeyPress,
  onKeyRelease,
}: KeyboardControlProps) {
  const octave = (config.octave as number) ?? 4;
  const numOctaves = Math.min(3, Math.max(1, (config.numOctaves as number) ?? 2));
  const activeFrequency = (config.frequency as number) ?? 0;

  // Generate keys for the specified octaves
  const keys = useMemo(() => {
    const result: Array<{ note: number; isBlack: boolean }> = [];
    const startNote = (octave + 1) * 12; // MIDI note for C of starting octave

    for (let i = 0; i < numOctaves * 12 + 1; i++) {
      // +1 for final C
      const note = startNote + i;
      result.push({
        note,
        isBlack: isBlackKey(note),
      });
    }
    return result;
  }, [octave, numOctaves]);

  // Calculate velocity based on vertical position within the key
  const handleMouseDown = useCallback(
    (note: number) => (e: React.MouseEvent) => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const relativeY = (e.clientY - rect.top) / rect.height;
      // Velocity: 0.3-1.0 based on how far down the key was pressed
      const velocity = 0.3 + relativeY * 0.7;
      const frequency = midiToFrequency(note);
      onKeyPress(frequency, velocity);
    },
    [onKeyPress]
  );

  const handleMouseUp = useCallback(() => {
    onKeyRelease();
  }, [onKeyRelease]);

  // Separate white and black keys for proper layering
  const whiteKeys = keys.filter((k) => !k.isBlack);
  const blackKeys = keys.filter((k) => k.isBlack);

  // Calculate black key positions relative to white keys
  const getBlackKeyOffset = (note: number): number => {
    const noteInOctave = note % 12;
    const octaveOffset = Math.floor(note / 12) - (octave + 1);
    const baseOffset = octaveOffset * 7 * 28; // 7 white keys per octave, 28px each

    // Black key positions within an octave (relative to C)
    const blackKeyPositions: Record<number, number> = {
      1: 0, // C#
      3: 1, // D#
      6: 3, // F#
      8: 4, // G#
      10: 5, // A#
    };

    const whiteKeyIndex = blackKeyPositions[noteInOctave];
    return baseOffset + whiteKeyIndex * 28 + 28 - 9; // Center on the boundary
  };

  return (
    <div className="mb-2 nodrag nowheel">
      {/* Display current note info */}
      <div className="text-xs text-center text-muted-foreground mb-2">
        {activeFrequency > 0
          ? `${activeFrequency.toFixed(1)} Hz`
          : "Press a key"}
      </div>

      {/* Keyboard container */}
      <div
        className="relative bg-zinc-800 p-1 rounded-md"
        style={{
          width: `${whiteKeys.length * 28 + 2}px`,
        }}
      >
        {/* White keys */}
        <div className="flex">
          {whiteKeys.map((key) => {
            const freq = midiToFrequency(key.note);
            const isActive = Math.abs(activeFrequency - freq) < 0.1;
            return (
              <Key
                key={key.note}
                note={key.note}
                isBlack={false}
                isActive={isActive}
                onMouseDown={handleMouseDown(key.note)}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            );
          })}
        </div>

        {/* Black keys (positioned absolutely) */}
        {blackKeys.map((key) => {
          const freq = midiToFrequency(key.note);
          const isActive = Math.abs(activeFrequency - freq) < 0.1;
          return (
            <div
              key={key.note}
              style={{
                position: "absolute",
                left: `${getBlackKeyOffset(key.note) + 1}px`,
                top: "4px",
              }}
            >
              <Key
                note={key.note}
                isBlack={true}
                isActive={isActive}
                onMouseDown={handleMouseDown(key.note)}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
