import { X, Trash2 } from "lucide-react";
import { type Node, type Edge } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type BlockConfig } from "@/types/blocks";
import { type SignalBlockData } from "./SignalBlock";

interface ConfigDrawerProps {
  node: Node<SignalBlockData> | undefined;
  edges: Edge[];
  onConfigChange: (config: BlockConfig) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function ConfigDrawer({
  node,
  edges,
  onConfigChange,
  onDelete,
  onClose,
}: ConfigDrawerProps) {
  if (!node) {
    return (
      <div className="w-80 h-full bg-card border border-border rounded-3xl shadow-lg flex flex-col transition-transform duration-300 ease-in-out transform translate-x-full pointer-events-auto" />
    );
  }

  const { blockType, label, config } = node.data;

  const updateConfig = (updates: Partial<BlockConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  // Helper function to check if a specific input handle is connected
  const isInputConnected = (handleId: string): boolean => {
    return edges.some(
      (edge) => edge.target === node.id && edge.targetHandle === handleId,
    );
  };

  const renderWaveGeneratorConfig = () => {
    const freqConnected = isInputConnected("freq");
    const ampConnected = isInputConnected("amp");
    const phaseConnected = isInputConnected("phase");

    return (
      <>
        <div className="space-y-2">
          <Label
            htmlFor="frequency"
            className={freqConnected ? "text-muted-foreground" : ""}
          >
            Frequency (Hz) {freqConnected && "(Connected)"}
          </Label>
          <Input
            id="frequency"
            type="number"
            min="20"
            max="20000"
            step="1"
            value={config.frequency || 440}
            onChange={(e) =>
              updateConfig({ frequency: parseFloat(e.target.value) })
            }
            disabled={freqConnected}
            className={freqConnected ? "opacity-50 cursor-not-allowed" : ""}
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="amplitude"
            className={ampConnected ? "text-muted-foreground" : ""}
          >
            Amplitude {ampConnected && "(Connected)"}
          </Label>
          <Input
            id="amplitude"
            type="number"
            min="0"
            max="1"
            step="0.01"
            value={config.amplitude || 0.5}
            onChange={(e) =>
              updateConfig({ amplitude: parseFloat(e.target.value) })
            }
            disabled={ampConnected}
            className={ampConnected ? "opacity-50 cursor-not-allowed" : ""}
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="phase"
            className={phaseConnected ? "text-muted-foreground" : ""}
          >
            Phase (degrees) {phaseConnected && "(Connected)"}
          </Label>
          <Input
            id="phase"
            type="number"
            min="0"
            max="360"
            step="1"
            value={config.phase || 0}
            onChange={(e) =>
              updateConfig({ phase: parseFloat(e.target.value) })
            }
            disabled={phaseConnected}
            className={phaseConnected ? "opacity-50 cursor-not-allowed" : ""}
          />
        </div>
      </>
    );
  };

  const renderNoiseConfig = () => {
    const ampConnected = isInputConnected("amp");

    return (
      <div className="space-y-2">
        <Label
          htmlFor="amplitude"
          className={ampConnected ? "text-muted-foreground" : ""}
        >
          Amplitude {ampConnected && "(Connected)"}
        </Label>
        <Input
          id="amplitude"
          type="number"
          min="0"
          max="1"
          step="0.01"
          value={config.amplitude || 0.5}
          onChange={(e) =>
            updateConfig({ amplitude: parseFloat(e.target.value) })
          }
          disabled={ampConnected}
          className={ampConnected ? "opacity-50 cursor-not-allowed" : ""}
        />
      </div>
    );
  };

  const renderGainConfig = () => (
    <div className="space-y-2">
      <Label htmlFor="gain">Gain (multiplier)</Label>
      <Input
        id="gain"
        type="number"
        min="0"
        max="10"
        step="0.1"
        value={config.gain || 1.0}
        onChange={(e) => updateConfig({ gain: parseFloat(e.target.value) })}
      />
    </div>
  );

  const renderFilterConfig = () => {
    const cutoffConnected = isInputConnected("cutoff");

    return (
      <>
        <div className="space-y-2">
          <Label
            htmlFor="cutoffFrequency"
            className={cutoffConnected ? "text-muted-foreground" : ""}
          >
            Cutoff Frequency (Hz) {cutoffConnected && "(Connected)"}
          </Label>
          <Input
            id="cutoffFrequency"
            type="number"
            min="20"
            max="20000"
            step="1"
            value={config.cutoffFrequency || 1000}
            onChange={(e) =>
              updateConfig({ cutoffFrequency: parseFloat(e.target.value) })
            }
            disabled={cutoffConnected}
            className={cutoffConnected ? "opacity-50 cursor-not-allowed" : ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="qFactor">Q Factor</Label>
          <Input
            id="qFactor"
            type="number"
            min="0.1"
            max="20"
            step="0.1"
            value={config.qFactor || 1.0}
            onChange={(e) =>
              updateConfig({ qFactor: parseFloat(e.target.value) })
            }
          />
        </div>
      </>
    );
  };

  const renderEQFilterConfig = () => {
    const frequencyConnected =
      isInputConnected("frequency") || isInputConnected("cutoff");
    const showQFactor = blockType === "peaking-eq";

    return (
      <>
        <div className="space-y-2">
          <Label
            htmlFor="cutoffFrequency"
            className={frequencyConnected ? "text-muted-foreground" : ""}
          >
            Frequency (Hz) {frequencyConnected && "(Connected)"}
          </Label>
          <Input
            id="cutoffFrequency"
            type="number"
            min="20"
            max="20000"
            step="1"
            value={config.cutoffFrequency || 1000}
            onChange={(e) =>
              updateConfig({ cutoffFrequency: parseFloat(e.target.value) })
            }
            disabled={frequencyConnected}
            className={
              frequencyConnected ? "opacity-50 cursor-not-allowed" : ""
            }
          />
        </div>
        {showQFactor && (
          <div className="space-y-2">
            <Label htmlFor="qFactor">Q Factor</Label>
            <Input
              id="qFactor"
              type="number"
              min="0.1"
              max="20"
              step="0.1"
              value={config.qFactor || 1.0}
              onChange={(e) =>
                updateConfig({ qFactor: parseFloat(e.target.value) })
              }
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="filterGain">Gain (dB)</Label>
          <Input
            id="filterGain"
            type="number"
            min="-40"
            max="40"
            step="0.5"
            value={config.filterGain || 0}
            onChange={(e) =>
              updateConfig({ filterGain: parseFloat(e.target.value) })
            }
          />
        </div>
      </>
    );
  };

  const renderMultiplexerConfig = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="numInputs">Number of Inputs</Label>
        <Select
          value={String(config.numInputs || 2)}
          onValueChange={(value) =>
            value && updateConfig({ numInputs: parseInt(value) })
          }
        >
          <SelectTrigger id="numInputs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2</SelectItem>
            <SelectItem value="4">4</SelectItem>
            <SelectItem value="8">8</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="selectorValue">Default Selector Value</Label>
        <Input
          id="selectorValue"
          type="number"
          min="0"
          max={(config.numInputs || 2) - 1}
          step="1"
          value={config.selectorValue || 0}
          onChange={(e) =>
            updateConfig({ selectorValue: parseInt(e.target.value) })
          }
        />
      </div>
    </>
  );

  const renderSplitterConfig = () => (
    <div className="space-y-2">
      <Label htmlFor="numOutputs">Number of Outputs</Label>
      <Select
        value={String(config.numOutputs || 2)}
        onValueChange={(value) =>
          value && updateConfig({ numOutputs: parseInt(value) })
        }
      >
        <SelectTrigger id="numOutputs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="2">2</SelectItem>
          <SelectItem value="4">4</SelectItem>
          <SelectItem value="8">8</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const renderOscilloscopeConfig = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="timeWindow">Time Window (seconds)</Label>
        <Input
          id="timeWindow"
          type="number"
          min="0.001"
          max="1"
          step="0.001"
          value={config.timeWindow || 0.05}
          onChange={(e) =>
            updateConfig({ timeWindow: parseFloat(e.target.value) })
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="refreshRate">Refresh Rate (Hz)</Label>
        <Input
          id="refreshRate"
          type="number"
          min="10"
          max="120"
          step="1"
          value={config.refreshRate || 60}
          onChange={(e) =>
            updateConfig({ refreshRate: parseFloat(e.target.value) })
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="minAmplitude">Min Amplitude</Label>
        <Input
          id="minAmplitude"
          type="number"
          min="-10"
          max="0"
          step="0.1"
          value={config.minAmplitude ?? -1}
          onChange={(e) =>
            updateConfig({ minAmplitude: parseFloat(e.target.value) })
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="maxAmplitude">Max Amplitude</Label>
        <Input
          id="maxAmplitude"
          type="number"
          min="0"
          max="10"
          step="0.1"
          value={config.maxAmplitude ?? 1}
          onChange={(e) =>
            updateConfig({ maxAmplitude: parseFloat(e.target.value) })
          }
        />
      </div>
    </>
  );

  const renderAudioOutputConfig = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="volume">Volume</Label>
        <Input
          id="volume"
          type="number"
          min="0"
          max="1"
          step="0.01"
          value={config.volume || 0.5}
          onChange={(e) => updateConfig({ volume: parseFloat(e.target.value) })}
        />
      </div>
      <div className="flex items-center space-x-2">
        <input
          id="muted"
          type="checkbox"
          checked={config.muted || false}
          onChange={(e) => updateConfig({ muted: e.target.checked })}
          className="w-4 h-4"
        />
        <Label htmlFor="muted">Muted</Label>
      </div>
    </>
  );

  const renderSliderConfig = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="min">Minimum</Label>
        <Input
          id="min"
          type="number"
          step="0.01"
          value={config.min ?? 0}
          onChange={(e) => updateConfig({ min: parseFloat(e.target.value) })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="max">Maximum</Label>
        <Input
          id="max"
          type="number"
          step="0.01"
          value={config.max ?? 1}
          onChange={(e) => updateConfig({ max: parseFloat(e.target.value) })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="step">Step</Label>
        <Input
          id="step"
          type="number"
          min="0.001"
          step="0.001"
          value={config.step ?? 0.01}
          onChange={(e) => updateConfig({ step: parseFloat(e.target.value) })}
        />
      </div>
    </>
  );

  const renderButtonConfig = () => (
    <div className="space-y-2">
      <Label htmlFor="outputValue">Output Value</Label>
      <Input
        id="outputValue"
        type="number"
        step="0.01"
        value={config.outputValue ?? 1.0}
        onChange={(e) =>
          updateConfig({ outputValue: parseFloat(e.target.value) })
        }
      />
    </div>
  );

  const renderToggleConfig = () => (
    <div className="space-y-2">
      <Label htmlFor="outputValue">Output Value</Label>
      <Input
        id="outputValue"
        type="number"
        step="0.01"
        value={config.outputValue ?? 1.0}
        onChange={(e) =>
          updateConfig({ outputValue: parseFloat(e.target.value) })
        }
      />
    </div>
  );

  const renderPulseConfig = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="pulseValue">Pulse Value</Label>
        <Input
          id="pulseValue"
          type="number"
          step="0.01"
          value={config.pulseValue ?? 1.0}
          onChange={(e) =>
            updateConfig({ pulseValue: parseFloat(e.target.value) })
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pulseDuration">Duration (ms)</Label>
        <Input
          id="pulseDuration"
          type="number"
          min="10"
          max="5000"
          step="10"
          value={config.pulseDuration ?? 100}
          onChange={(e) =>
            updateConfig({ pulseDuration: parseInt(e.target.value) })
          }
        />
      </div>
    </>
  );

  const renderNumericMeterConfig = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="decimals">Decimal Places</Label>
        <Input
          id="decimals"
          type="number"
          min="0"
          max="10"
          step="1"
          value={config.decimals ?? 3}
          onChange={(e) => updateConfig({ decimals: parseInt(e.target.value) })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="unit">Unit (optional)</Label>
        <Input
          id="unit"
          type="text"
          placeholder="V, Hz, etc."
          value={config.unit ?? ""}
          onChange={(e) => updateConfig({ unit: e.target.value })}
        />
      </div>
    </>
  );

  const renderFFTAnalyzerConfig = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="fftMode">Mode</Label>
        <Select
          value={config.fftMode || "spectrum"}
          onValueChange={(value) =>
            value &&
            updateConfig({
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
            value && updateConfig({ fftSize: parseInt(value) })
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

      {/* Mode-specific settings */}
      {(config.fftMode === "spectrum" ||
        config.fftMode === "peak-detection" ||
        !config.fftMode) && (
        <>
          <div className="space-y-2">
            <Label htmlFor="smoothingTimeConstant">Smoothing (0-1)</Label>
            <Input
              id="smoothingTimeConstant"
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={config.smoothingTimeConstant ?? 0.8}
              onChange={(e) =>
                updateConfig({
                  smoothingTimeConstant: parseFloat(e.target.value),
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minDecibels">Min Decibels</Label>
            <Input
              id="minDecibels"
              type="number"
              min="-100"
              max="-30"
              step="1"
              value={config.minDecibels ?? -90}
              onChange={(e) =>
                updateConfig({ minDecibels: parseFloat(e.target.value) })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxDecibels">Max Decibels</Label>
            <Input
              id="maxDecibels"
              type="number"
              min="-30"
              max="0"
              step="1"
              value={config.maxDecibels ?? -10}
              onChange={(e) =>
                updateConfig({ maxDecibels: parseFloat(e.target.value) })
              }
            />
          </div>
        </>
      )}

      {config.fftMode === "frequency-output" && (
        <div className="space-y-2">
          <Label htmlFor="numFrequencyOutputs">Number of Outputs</Label>
          <Select
            value={String(config.numFrequencyOutputs || 4)}
            onValueChange={(value) =>
              value && updateConfig({ numFrequencyOutputs: parseInt(value) })
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

  const renderConfig = () => {
    switch (blockType) {
      case "sine-wave":
      case "square-wave":
      case "triangle-wave":
      case "sawtooth-wave":
        return renderWaveGeneratorConfig();
      case "noise":
        return renderNoiseConfig();
      case "gain":
        return renderGainConfig();
      case "low-pass-filter":
      case "high-pass-filter":
      case "band-pass-filter":
      case "notch-filter":
      case "allpass-filter":
        return renderFilterConfig();
      case "peaking-eq":
      case "lowshelf-filter":
      case "highshelf-filter":
        return renderEQFilterConfig();
      case "multiplexer":
        return renderMultiplexerConfig();
      case "splitter":
        return renderSplitterConfig();
      case "oscilloscope":
        return renderOscilloscopeConfig();
      case "audio-output":
        return renderAudioOutputConfig();
      case "slider":
        return renderSliderConfig();
      case "button":
        return renderButtonConfig();
      case "toggle":
        return renderToggleConfig();
      case "pulse":
        return renderPulseConfig();
      case "numeric-meter":
        return renderNumericMeterConfig();
      case "fft-analyzer":
        return renderFFTAnalyzerConfig();
      default:
        return null;
    }
  };

  return (
    <div className="w-80 h-full bg-card border border-border rounded-3xl shadow-lg flex flex-col transition-transform duration-300 ease-in-out transform translate-x-0 pointer-events-auto">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border">
        <h2 className="text-lg font-semibold">{label}</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Configuration Options */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {renderConfig()}
      </div>

      <Separator />

      {/* Delete Button */}
      <div className="p-4">
        <Button variant="destructive" className="w-full" onClick={onDelete}>
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Block
        </Button>
      </div>
    </div>
  );
}
