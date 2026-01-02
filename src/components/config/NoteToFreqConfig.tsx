import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfigField } from "./shared";
import type { ConfigComponentProps } from "./types";

/**
 * Configuration for note-to-frequency converter block.
 * Allows selecting the octave (0-8) for the frequency output.
 */
export function NoteToFreqConfig({
  config,
  onConfigChange,
}: ConfigComponentProps) {
  const octave = config.noteToFreqOctave ?? 4;

  return (
    <ConfigField label="Octave" htmlFor="octave">
      <Select
        value={octave.toString()}
        onValueChange={(value) => {
          if (value) {
            onConfigChange({ noteToFreqOctave: parseInt(value, 10) });
          }
        }}
      >
        <SelectTrigger id="octave">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((oct) => (
            <SelectItem key={oct} value={oct.toString()}>
              Octave {oct} {oct === 4 ? "(A4 = 440 Hz)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </ConfigField>
  );
}
