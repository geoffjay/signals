import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfigField, NumberInput } from "./shared";
import type { ConfigComponentProps } from "./types";

/**
 * Configuration for FFT analyzer block
 */
export function FFTAnalyzerConfig({
  config,
  onConfigChange,
}: ConfigComponentProps) {
  const mode = config.fftMode || "spectrum";
  const showAnalyzerSettings =
    mode === "spectrum" || mode === "peak-detection" || !mode;

  return (
    <>
      {/* Mode Selection */}
      <div className="space-y-2">
        <Label htmlFor="fftMode">Mode</Label>
        <Select
          value={mode}
          onValueChange={(value) =>
            value &&
            onConfigChange({
              fftMode: value as
                | "spectrum"
                | "frequency-output"
                | "peak-detection"
                | "spectral-processing",
            })
          }
        >
          <SelectTrigger id="fftMode">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="spectrum">Spectrum Analyzer</SelectItem>
            <SelectItem value="frequency-output">Frequency Output</SelectItem>
            <SelectItem value="peak-detection">Peak Detection</SelectItem>
            <SelectItem value="spectral-processing">
              Spectral Processing
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Common FFT Settings */}
      <div className="space-y-2">
        <Label htmlFor="fftSize">FFT Size</Label>
        <Select
          value={String(config.fftSize || 2048)}
          onValueChange={(value) =>
            value && onConfigChange({ fftSize: parseInt(value) })
          }
        >
          <SelectTrigger id="fftSize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="256">256</SelectItem>
            <SelectItem value="512">512</SelectItem>
            <SelectItem value="1024">1024</SelectItem>
            <SelectItem value="2048">2048</SelectItem>
            <SelectItem value="4096">4096</SelectItem>
            <SelectItem value="8192">8192</SelectItem>
            <SelectItem value="16384">16384</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mode-specific settings: Spectrum & Peak Detection */}
      {showAnalyzerSettings && (
        <>
          <ConfigField label="Smoothing (0-1)" htmlFor="smoothingTimeConstant">
            <NumberInput
              id="smoothingTimeConstant"
              min={0}
              max={1}
              step={0.1}
              value={config.smoothingTimeConstant ?? 0.8}
              onChange={(value) =>
                onConfigChange({ smoothingTimeConstant: value })
              }
            />
          </ConfigField>

          <ConfigField label="Min Decibels" htmlFor="minDecibels">
            <NumberInput
              id="minDecibels"
              min={-100}
              max={-30}
              step={1}
              value={config.minDecibels ?? -90}
              onChange={(value) => onConfigChange({ minDecibels: value })}
            />
          </ConfigField>

          <ConfigField label="Max Decibels" htmlFor="maxDecibels">
            <NumberInput
              id="maxDecibels"
              min={-30}
              max={0}
              step={1}
              value={config.maxDecibels ?? -10}
              onChange={(value) => onConfigChange({ maxDecibels: value })}
            />
          </ConfigField>
        </>
      )}

      {/* Mode-specific settings: Frequency Output */}
      {mode === "frequency-output" && (
        <div className="space-y-2">
          <Label htmlFor="numFrequencyOutputs">Number of Outputs</Label>
          <Select
            value={String(config.numFrequencyOutputs || 4)}
            onValueChange={(value) =>
              value && onConfigChange({ numFrequencyOutputs: parseInt(value) })
            }
          >
            <SelectTrigger id="numFrequencyOutputs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="8">8</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </>
  );
}
