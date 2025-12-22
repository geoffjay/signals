import { X, Trash2 } from 'lucide-react';
import { type Node } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type BlockConfig } from '@/types/blocks';
import { type SignalBlockData } from './SignalBlock';

interface ConfigDrawerProps {
  node: Node<SignalBlockData> | undefined;
  onConfigChange: (config: BlockConfig) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function ConfigDrawer({ node, onConfigChange, onDelete, onClose }: ConfigDrawerProps) {
  if (!node) return null;

  const { blockType, label, config } = node.data;

  const updateConfig = (updates: Partial<BlockConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  const renderWaveGeneratorConfig = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="frequency">Frequency (Hz)</Label>
        <Input
          id="frequency"
          type="number"
          min="20"
          max="20000"
          step="1"
          value={config.frequency || 440}
          onChange={(e) => updateConfig({ frequency: parseFloat(e.target.value) })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="amplitude">Amplitude</Label>
        <Input
          id="amplitude"
          type="number"
          min="0"
          max="1"
          step="0.01"
          value={config.amplitude || 0.5}
          onChange={(e) => updateConfig({ amplitude: parseFloat(e.target.value) })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phase">Phase (degrees)</Label>
        <Input
          id="phase"
          type="number"
          min="0"
          max="360"
          step="1"
          value={config.phase || 0}
          onChange={(e) => updateConfig({ phase: parseFloat(e.target.value) })}
        />
      </div>
    </>
  );

  const renderNoiseConfig = () => (
    <div className="space-y-2">
      <Label htmlFor="amplitude">Amplitude</Label>
      <Input
        id="amplitude"
        type="number"
        min="0"
        max="1"
        step="0.01"
        value={config.amplitude || 0.5}
        onChange={(e) => updateConfig({ amplitude: parseFloat(e.target.value) })}
      />
    </div>
  );

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

  const renderFilterConfig = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="cutoffFrequency">Cutoff Frequency (Hz)</Label>
        <Input
          id="cutoffFrequency"
          type="number"
          min="20"
          max="20000"
          step="1"
          value={config.cutoffFrequency || 1000}
          onChange={(e) => updateConfig({ cutoffFrequency: parseFloat(e.target.value) })}
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
          onChange={(e) => updateConfig({ qFactor: parseFloat(e.target.value) })}
        />
      </div>
    </>
  );

  const renderMultiplexerConfig = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="numInputs">Number of Inputs</Label>
        <Select
          value={String(config.numInputs || 2)}
          onValueChange={(value) => value && updateConfig({ numInputs: parseInt(value) })}
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
          onChange={(e) => updateConfig({ selectorValue: parseInt(e.target.value) })}
        />
      </div>
    </>
  );

  const renderSplitterConfig = () => (
    <div className="space-y-2">
      <Label htmlFor="numOutputs">Number of Outputs</Label>
      <Select
        value={String(config.numOutputs || 2)}
        onValueChange={(value) => value && updateConfig({ numOutputs: parseInt(value) })}
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
          min="0.01"
          max="1"
          step="0.01"
          value={config.timeWindow || 0.05}
          onChange={(e) => updateConfig({ timeWindow: parseFloat(e.target.value) })}
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
          onChange={(e) => updateConfig({ refreshRate: parseFloat(e.target.value) })}
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

  const renderConfig = () => {
    switch (blockType) {
      case 'sine-wave':
      case 'square-wave':
      case 'triangle-wave':
      case 'sawtooth-wave':
        return renderWaveGeneratorConfig();
      case 'noise':
        return renderNoiseConfig();
      case 'gain':
        return renderGainConfig();
      case 'low-pass-filter':
      case 'high-pass-filter':
      case 'band-pass-filter':
        return renderFilterConfig();
      case 'multiplexer':
        return renderMultiplexerConfig();
      case 'splitter':
        return renderSplitterConfig();
      case 'oscilloscope':
        return renderOscilloscopeConfig();
      case 'audio-output':
        return renderAudioOutputConfig();
      default:
        return null;
    }
  };

  return (
    <div className="w-80 bg-card border-l border-border flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border">
        <h2 className="text-lg font-semibold">{label}</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Configuration Options */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">{renderConfig()}</div>

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
