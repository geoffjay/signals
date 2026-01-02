import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ConfigField, NumberInput } from "./shared";
import type { ConfigComponentProps } from "./types";

/**
 * Configuration for multiplexer block
 */
export function MultiplexerConfig({
  config,
  onConfigChange,
}: ConfigComponentProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="numInputs">Number of Inputs</Label>
        <Select
          value={String(config.numInputs || 2)}
          onValueChange={(value) =>
            value && onConfigChange({ numInputs: parseInt(value) })
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

      <ConfigField label="Default Selector Value" htmlFor="selectorValue">
        <NumberInput
          id="selectorValue"
          min={0}
          max={(config.numInputs || 2) - 1}
          step={1}
          value={config.selectorValue || 0}
          onChange={(value) => onConfigChange({ selectorValue: value })}
        />
      </ConfigField>
    </>
  );
}

/**
 * Configuration for splitter block
 */
export function SplitterConfig({
  config,
  onConfigChange,
}: ConfigComponentProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="numOutputs">Number of Outputs</Label>
      <Select
        value={String(config.numOutputs || 2)}
        onValueChange={(value) =>
          value && onConfigChange({ numOutputs: parseInt(value) })
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
}

/**
 * Configuration for mixer block
 */
export function MixerConfig({
  config,
  onConfigChange,
}: ConfigComponentProps) {
  const numChannels = config.mixerChannels || 2;
  const gains = config.mixerGains || Array(numChannels).fill(1.0);
  const masterGain = config.mixerMasterGain ?? 1.0;

  const handleChannelGainChange = (index: number, value: number) => {
    const newGains = [...gains];
    newGains[index] = value;
    onConfigChange({ mixerGains: newGains });
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="mixerChannels">Number of Channels</Label>
        <Select
          value={String(numChannels)}
          onValueChange={(value) => {
            if (!value) return;
            const newCount = parseInt(value);
            const newGains = Array(newCount).fill(1.0);
            // Preserve existing gain values
            for (let i = 0; i < Math.min(gains.length, newCount); i++) {
              newGains[i] = gains[i];
            }
            onConfigChange({ mixerChannels: newCount, mixerGains: newGains });
          }}
        >
          <SelectTrigger id="mixerChannels">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2</SelectItem>
            <SelectItem value="4">4</SelectItem>
            <SelectItem value="8">8</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label>Channel Gains</Label>
        {Array.from({ length: numChannels }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs w-8">Ch {i}</span>
            <Slider
              value={[gains[i] ?? 1.0]}
              min={0}
              max={2}
              step={0.01}
              onValueChange={(values) => handleChannelGainChange(i, Array.isArray(values) ? values[0] : values)}
              className="flex-1"
            />
            <span className="text-xs w-10 text-right">
              {(gains[i] ?? 1.0).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <ConfigField label="Master Gain" htmlFor="mixerMasterGain">
        <div className="flex items-center gap-2">
          <Slider
            value={[masterGain]}
            min={0}
            max={2}
            step={0.01}
            onValueChange={(values) => onConfigChange({ mixerMasterGain: Array.isArray(values) ? values[0] : values })}
            className="flex-1"
          />
          <span className="text-xs w-10 text-right">
            {masterGain.toFixed(2)}
          </span>
        </div>
      </ConfigField>
    </>
  );
}

/**
 * Configuration for merge block
 */
export function MergeConfig({
  config,
  onConfigChange,
}: ConfigComponentProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="mergeChannels">Number of Inputs</Label>
      <Select
        value={String(config.mergeChannels || 2)}
        onValueChange={(value) =>
          value && onConfigChange({ mergeChannels: parseInt(value) })
        }
      >
        <SelectTrigger id="mergeChannels">
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
}

/**
 * Configuration for switch/gate block
 */
export function SwitchConfig({
  config,
  onConfigChange,
}: ConfigComponentProps) {
  const threshold = config.switchThreshold ?? 0.5;
  const invert = config.switchInvert ?? false;

  return (
    <>
      <ConfigField label="Threshold" htmlFor="switchThreshold">
        <div className="flex items-center gap-2">
          <Slider
            value={[threshold]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(values) => onConfigChange({ switchThreshold: Array.isArray(values) ? values[0] : values })}
            className="flex-1"
          />
          <span className="text-xs w-10 text-right">
            {threshold.toFixed(2)}
          </span>
        </div>
      </ConfigField>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="switchInvert"
          checked={invert}
          onCheckedChange={(checked) =>
            onConfigChange({ switchInvert: checked === true })
          }
        />
        <Label htmlFor="switchInvert">Invert Gate</Label>
      </div>
    </>
  );
}

/**
 * Configuration for A/B switch block
 */
export function ABSwitchConfig({
  config,
  onConfigChange,
}: ConfigComponentProps) {
  const threshold = config.abThreshold ?? 0.5;

  return (
    <ConfigField label="Switch Threshold" htmlFor="abThreshold">
      <div className="flex items-center gap-2">
        <Slider
          value={[threshold]}
          min={0}
          max={1}
          step={0.01}
          onValueChange={(values) => onConfigChange({ abThreshold: Array.isArray(values) ? values[0] : values })}
          className="flex-1"
        />
        <span className="text-xs w-10 text-right">
          {threshold.toFixed(2)}
        </span>
      </div>
    </ConfigField>
  );
}

/**
 * Configuration for sample & hold block
 */
export function SampleHoldConfig({
  config,
  onConfigChange,
}: ConfigComponentProps) {
  const threshold = config.sampleHoldThreshold ?? 0.5;

  return (
    <ConfigField label="Trigger Threshold" htmlFor="sampleHoldThreshold">
      <div className="flex items-center gap-2">
        <Slider
          value={[threshold]}
          min={0}
          max={1}
          step={0.01}
          onValueChange={(values) => onConfigChange({ sampleHoldThreshold: Array.isArray(values) ? values[0] : values })}
          className="flex-1"
        />
        <span className="text-xs w-10 text-right">
          {threshold.toFixed(2)}
        </span>
      </div>
    </ConfigField>
  );
}

/**
 * Configuration for comparator block
 */
export function ComparatorConfig({
  config,
  onConfigChange,
}: ConfigComponentProps) {
  const mode = config.comparatorMode ?? "greater";
  const threshold = config.comparatorThreshold ?? 0;
  const useThreshold = config.comparatorUseThreshold ?? false;
  const outputHigh = config.comparatorOutputHigh ?? 1.0;
  const outputLow = config.comparatorOutputLow ?? 0.0;

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="comparatorMode">Comparison Mode</Label>
        <Select
          value={mode}
          onValueChange={(value) => onConfigChange({ comparatorMode: value as typeof mode })}
        >
          <SelectTrigger id="comparatorMode">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="greater">Greater Than (&gt;)</SelectItem>
            <SelectItem value="less">Less Than (&lt;)</SelectItem>
            <SelectItem value="equal">Equal (=)</SelectItem>
            <SelectItem value="notEqual">Not Equal (≠)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="comparatorUseThreshold"
          checked={useThreshold}
          onCheckedChange={(checked) =>
            onConfigChange({ comparatorUseThreshold: checked === true })
          }
        />
        <Label htmlFor="comparatorUseThreshold">Compare against fixed threshold</Label>
      </div>

      {useThreshold && (
        <ConfigField label="Threshold Value" htmlFor="comparatorThreshold">
          <NumberInput
            id="comparatorThreshold"
            min={-10}
            max={10}
            step={0.01}
            value={threshold}
            onChange={(value) => onConfigChange({ comparatorThreshold: value })}
          />
        </ConfigField>
      )}

      <ConfigField label="Output High" htmlFor="comparatorOutputHigh">
        <NumberInput
          id="comparatorOutputHigh"
          min={-10}
          max={10}
          step={0.01}
          value={outputHigh}
          onChange={(value) => onConfigChange({ comparatorOutputHigh: value })}
        />
      </ConfigField>

      <ConfigField label="Output Low" htmlFor="comparatorOutputLow">
        <NumberInput
          id="comparatorOutputLow"
          min={-10}
          max={10}
          step={0.01}
          value={outputLow}
          onChange={(value) => onConfigChange({ comparatorOutputLow: value })}
        />
      </ConfigField>
    </>
  );
}

/**
 * Configuration for panner block
 */
export function PannerConfig({
  config,
  onConfigChange,
}: ConfigComponentProps) {
  const position = config.panPosition ?? 0;
  const law = config.panLaw ?? "equal-power";

  return (
    <>
      <ConfigField label="Pan Position" htmlFor="panPosition">
        <div className="flex items-center gap-2">
          <span className="text-xs">L</span>
          <Slider
            value={[position]}
            min={-1}
            max={1}
            step={0.01}
            onValueChange={(values) => onConfigChange({ panPosition: Array.isArray(values) ? values[0] : values })}
            className="flex-1"
          />
          <span className="text-xs">R</span>
          <span className="text-xs w-10 text-right">
            {position.toFixed(2)}
          </span>
        </div>
      </ConfigField>

      <div className="space-y-2">
        <Label htmlFor="panLaw">Pan Law</Label>
        <Select
          value={law}
          onValueChange={(value) => onConfigChange({ panLaw: value as typeof law })}
        >
          <SelectTrigger id="panLaw">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="equal-power">Equal Power</SelectItem>
            <SelectItem value="linear">Linear</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

/**
 * Configuration for logic gate blocks (AND, OR, XOR, NOT)
 */
export function LogicGateConfig({
  config,
  onConfigChange,
}: ConfigComponentProps) {
  const threshold = config.gateThreshold ?? 0.5;
  const outputHigh = config.gateOutputHigh ?? 1.0;
  const outputLow = config.gateOutputLow ?? 0.0;

  return (
    <>
      <ConfigField label="Input Threshold" htmlFor="gateThreshold">
        <div className="flex items-center gap-2">
          <Slider
            value={[threshold]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(values) => onConfigChange({ gateThreshold: Array.isArray(values) ? values[0] : values })}
            className="flex-1"
          />
          <span className="text-xs w-10 text-right">
            {threshold.toFixed(2)}
          </span>
        </div>
      </ConfigField>

      <ConfigField label="Output High" htmlFor="gateOutputHigh">
        <NumberInput
          id="gateOutputHigh"
          min={-10}
          max={10}
          step={0.01}
          value={outputHigh}
          onChange={(value) => onConfigChange({ gateOutputHigh: value })}
        />
      </ConfigField>

      <ConfigField label="Output Low" htmlFor="gateOutputLow">
        <NumberInput
          id="gateOutputLow"
          min={-10}
          max={10}
          step={0.01}
          value={outputLow}
          onChange={(value) => onConfigChange({ gateOutputLow: value })}
        />
      </ConfigField>
    </>
  );
}

/**
 * Configuration for matrix router block
 */
export function MatrixRouterConfig({
  config,
  onConfigChange,
}: ConfigComponentProps) {
  const numInputs = config.matrixInputs || 2;
  const numOutputs = config.matrixOutputs || 2;
  const routing = config.matrixRouting || [];

  const handleRoutingChange = (inputIdx: number, outputIdx: number, value: boolean) => {
    const newRouting = routing.map((row) => [...row]);
    // Ensure the routing array has enough rows
    while (newRouting.length < numInputs) {
      newRouting.push(Array(numOutputs).fill(0));
    }
    // Ensure each row has enough columns
    for (let i = 0; i < newRouting.length; i++) {
      while (newRouting[i].length < numOutputs) {
        newRouting[i].push(0);
      }
    }
    newRouting[inputIdx][outputIdx] = value ? 1 : 0;
    onConfigChange({ matrixRouting: newRouting });
  };

  const handleSizeChange = (inputs: number, outputs: number) => {
    // Create new routing array with the new size
    const newRouting: number[][] = [];
    for (let i = 0; i < inputs; i++) {
      const row: number[] = [];
      for (let o = 0; o < outputs; o++) {
        // Preserve existing values where possible
        row.push(routing[i]?.[o] ?? 0);
      }
      newRouting.push(row);
    }
    onConfigChange({
      matrixInputs: inputs,
      matrixOutputs: outputs,
      matrixRouting: newRouting,
    });
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label htmlFor="matrixInputs">Inputs</Label>
          <Select
            value={String(numInputs)}
            onValueChange={(value) => {
              if (!value) return;
              handleSizeChange(parseInt(value), numOutputs);
            }}
          >
            <SelectTrigger id="matrixInputs">
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
          <Label htmlFor="matrixOutputs">Outputs</Label>
          <Select
            value={String(numOutputs)}
            onValueChange={(value) => {
              if (!value) return;
              handleSizeChange(numInputs, parseInt(value));
            }}
          >
            <SelectTrigger id="matrixOutputs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="8">8</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Routing Matrix</Label>
        <div className="grid gap-1" style={{ gridTemplateColumns: `auto repeat(${numOutputs}, 1fr)` }}>
          {/* Header row */}
          <div className="text-xs text-muted-foreground"></div>
          {Array.from({ length: numOutputs }).map((_, o) => (
            <div key={o} className="text-xs text-center text-muted-foreground">
              Out{o}
            </div>
          ))}

          {/* Matrix rows */}
          {Array.from({ length: numInputs }).map((_, i) => (
            <>
              <div key={`label-${i}`} className="text-xs text-muted-foreground pr-2">
                In{i}
              </div>
              {Array.from({ length: numOutputs }).map((_, o) => (
                <div key={`${i}-${o}`} className="flex justify-center">
                  <Checkbox
                    checked={(routing[i]?.[o] ?? 0) > 0}
                    onCheckedChange={(checked) =>
                      handleRoutingChange(i, o, checked === true)
                    }
                  />
                </div>
              ))}
            </>
          ))}
        </div>
      </div>
    </>
  );
}
