# Signal Processor Implementation Guide

This document provides guidance for implementing new signal processors in the Signals application. It covers the architecture, implementation patterns, and step-by-step instructions for adding new processor types.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Implementation Approaches](#implementation-approaches)
3. [Decision Matrix: Native vs AudioWorklet](#decision-matrix-native-vs-audioworklet)
4. [Step-by-Step Implementation Guide](#step-by-step-implementation-guide)
5. [File Modification Checklist](#file-modification-checklist)
6. [Code Examples](#code-examples)
7. [Best Practices](#best-practices)
8. [Testing Guidelines](#testing-guidelines)

---

## Architecture Overview

### Signal Flow

The application uses the Web Audio API to process audio signals in real-time. The architecture consists of:

```
ReactFlow Graph (UI) → SignalProcessingEngine → Web Audio API Nodes
```

1. **ReactFlow Graph**: Visual representation of the signal processing chain
2. **SignalProcessingEngine**: Translates the graph into Web Audio API node connections
3. **Web Audio API**: Performs actual signal processing at sample rate (typically 44.1kHz)

### Key Components

| Component               | Location                               | Purpose                                        |
| ----------------------- | -------------------------------------- | ---------------------------------------------- |
| Block Definitions       | `src/types/blocks/*.ts`                | Define block types, ports, and default configs |
| Signal Engine           | `src/engine/SignalProcessingEngine.ts` | Creates and connects Web Audio nodes           |
| Config Components       | `src/components/config/*.tsx`          | UI for block configuration                     |
| AudioWorklet Processors | `src/engine/*.ts` → `public/*.js`      | Custom DSP for complex operations              |

### Node Tracking Maps

The `SignalProcessingEngine` maintains several maps for node management:

```typescript
private nodes: Map<string, AudioNode>;           // All audio nodes
private oscillators: Map<string, OscillatorNode>; // Oscillators (special lifecycle)
private analysers: Map<string, AnalyserNode>;     // Analysers (for visualization)
private constantSources: Map<string, ConstantSourceNode>; // Constant value sources
```

---

## Implementation Approaches

There are two primary approaches for implementing processors:

### Approach 1: Native Web Audio Nodes

Use native Web Audio API nodes when the operation can be expressed using built-in node types.

**Available Native Nodes:**

| Node Type                | Use Cases                                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| `GainNode`               | Amplitude control, mixing, inversion                                                         |
| `BiquadFilterNode`       | All filter types (lowpass, highpass, bandpass, notch, allpass, peaking, lowshelf, highshelf) |
| `DelayNode`              | Time delays, feedback loops                                                                  |
| `DynamicsCompressorNode` | Compression, limiting                                                                        |
| `WaveShaperNode`         | Distortion, saturation, clipping                                                             |
| `ConvolverNode`          | Reverb, convolution effects                                                                  |
| `OscillatorNode`         | Signal generation                                                                            |
| `ConstantSourceNode`     | DC offset, control signals                                                                   |
| `AnalyserNode`           | Visualization, metering                                                                      |

**Advantages:**

- Lower CPU usage (optimized native implementation)
- Simpler implementation (no custom DSP code)
- Better browser compatibility
- Automatic parameter smoothing via `AudioParam`

**Limitations:**

- Limited to operations expressible with native nodes
- Some operations require creative node combinations

### Approach 2: AudioWorklet Processors

Use `AudioWorkletProcessor` when native nodes cannot express the required operation.

**When to Use AudioWorklet:**

- Mathematical operations on sample values (division, modulo, trigonometric functions)
- Operations requiring access to multiple input samples simultaneously
- Custom algorithms not available in native nodes
- Sample-accurate timing requirements
- Operations with complex state management

**Advantages:**

- Complete control over DSP algorithm
- Can implement any mathematical operation
- Access to raw sample data
- Can maintain complex internal state

**Limitations:**

- Higher implementation complexity
- Potential performance concerns if not optimized
- Requires separate JavaScript file in `public/`
- Must handle edge cases (division by zero, NaN, etc.)

---

## Decision Matrix: Native vs AudioWorklet

Use this decision matrix to choose the appropriate implementation approach:

| Operation Type                    | Recommended Approach              | Rationale                              |
| --------------------------------- | --------------------------------- | -------------------------------------- |
| **Filters** (LP, HP, BP, etc.)    | Native `BiquadFilterNode`         | All 8 filter types supported natively  |
| **Gain/Amplitude**                | Native `GainNode`                 | Simple, efficient, supports modulation |
| **Addition**                      | Native `GainNode` (mixing)        | Web Audio naturally sums inputs        |
| **Subtraction**                   | Native `GainNode` chain           | A + (-1 × B) using inverter pattern    |
| **Multiplication**                | Native `GainNode`                 | Connect signal to `gain` AudioParam    |
| **Division**                      | AudioWorklet                      | No native division operation           |
| **Trigonometric** (sin, cos)      | AudioWorklet                      | No native trig functions               |
| **Rounding** (ceil, floor, round) | AudioWorklet                      | No native rounding                     |
| **Min/Max**                       | AudioWorklet                      | No native comparison                   |
| **Delay**                         | Native `DelayNode`                | Direct support                         |
| **Compression**                   | Native `DynamicsCompressorNode`   | Direct support                         |
| **Distortion**                    | Native `WaveShaperNode`           | Transfer curves for saturation         |
| **Reverb**                        | Native `ConvolverNode`            | Impulse response convolution           |
| **Modulation** (LFO)              | Native `OscillatorNode` + routing | Internal oscillator pattern            |
| **Envelope Following**            | AudioWorklet                      | Requires RMS calculation               |
| **Bit Crushing**                  | AudioWorklet                      | Sample-level bit manipulation          |

---

## Step-by-Step Implementation Guide

### Adding a Native Node Processor

#### Step 1: Define the Block Type

**File:** `src/types/blocks/<category>.ts`

Add the block type to the appropriate category type union:

```typescript
// Example: Adding to filters.ts
export type FilterBlockType =
  | "low-pass-filter"
  | "high-pass-filter"
  // ... existing types
  | "new-filter-type"; // Add new type
```

Add the block definition:

```typescript
export const FILTER_DEFINITIONS: Record<FilterBlockType, BlockDefinition> = {
  // ... existing definitions
  "new-filter-type": {
    type: "new-filter-type",
    label: "New Filter",
    inputs: [
      { id: "in", label: "In" },
      { id: "cutoff", label: "Cutoff" }, // Optional modulation input
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      cutoffFrequency: 1000,
      qFactor: 1.0,
    },
  },
};
```

#### Step 2: Add Config Properties (if needed)

**File:** `src/types/blocks/common.ts`

Add any new configuration properties to `BlockConfig`:

```typescript
export interface BlockConfig {
  // ... existing properties
  newProperty?: number; // Add new config property
}
```

#### Step 3: Implement the Audio Node Creation

**File:** `src/engine/SignalProcessingEngine.ts`

Add a case in `createAudioNode()`:

```typescript
private createAudioNode(nodeId: string, blockType: BlockType, config: BlockConfig) {
  // ...existing switch cases
  case "new-filter-type":
    this.createFilter(nodeId, "lowpass", config);  // Or create new method
    break;
}
```

If needed, add a new creation method:

```typescript
private createNewProcessor(nodeId: string, config: BlockConfig) {
  if (!this.audioContext) return;

  const node = this.audioContext.createBiquadFilter();
  node.type = "lowpass";
  node.frequency.value = config.cutoffFrequency || 1000;
  node.Q.value = config.qFactor || 1.0;

  this.nodes.set(nodeId, node);
}
```

#### Step 4: Handle Connections (if custom routing needed)

**File:** `src/engine/SignalProcessingEngine.ts`

Add connection handling in `connectNodes()` if the processor has special input routing:

```typescript
private connectNodes(sourceId: string, sourceHandle: string, targetId: string, targetHandle: string) {
  // ...
  switch (blockType) {
    case "new-filter-type":
      if (targetHandle === "in") {
        sourceNode.connect(targetNode);
      } else if (targetHandle === "cutoff") {
        if (targetNode instanceof BiquadFilterNode) {
          sourceNode.connect(targetNode.frequency);
        }
      }
      break;
  }
}
```

#### Step 5: Handle Parameter Updates

**File:** `src/engine/SignalProcessingEngine.ts`

Add config update handling in `updateNodeConfig()`:

```typescript
updateNodeConfig(nodeId: string, blockType: BlockType, config: BlockConfig) {
  // ...
  case "new-filter-type": {
    if (node instanceof BiquadFilterNode) {
      node.frequency.value = config.cutoffFrequency || 1000;
      node.Q.value = config.qFactor || 1.0;
    }
    break;
  }
}
```

#### Step 6: Create Config UI Component (if needed)

**File:** `src/components/config/NewProcessorConfig.tsx`

```typescript
import { ConfigField, NumberInput } from "./shared";
import type { ConfigComponentProps } from "./types";

export function NewProcessorConfig({
  config,
  onConfigChange,
  isInputConnected,
}: ConfigComponentProps) {
  const cutoffConnected = isInputConnected("cutoff");

  return (
    <>
      <ConfigField
        label="Cutoff Frequency (Hz)"
        htmlFor="cutoffFrequency"
        isConnected={cutoffConnected}
      >
        <NumberInput
          id="cutoffFrequency"
          min={20}
          max={20000}
          step={1}
          value={config.cutoffFrequency || 1000}
          onChange={(value) => onConfigChange({ cutoffFrequency: value })}
          disabled={cutoffConnected}
        />
      </ConfigField>
    </>
  );
}
```

#### Step 7: Register Config Component

**File:** `src/components/config/index.ts`

```typescript
import { NewProcessorConfig } from "./NewProcessorConfig";

export const configComponentMap: Record<
  BlockType,
  React.ComponentType<ConfigComponentProps> | null
> = {
  // ...existing mappings
  "new-filter-type": NewProcessorConfig,
};
```

---

### Adding an AudioWorklet Processor

#### Step 1: Define the Block Type

Same as native node approach - add to type definitions in `src/types/blocks/`.

#### Step 2: Create the AudioWorklet Processor

**File:** `src/engine/new-processor.ts`

```typescript
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./audioworklet.d.ts" />

class NewProcessor extends AudioWorkletProcessor {
  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !output || input.length === 0) return true;

    const inputChannel = input[0];
    const outputChannel = output[0];

    if (!inputChannel || !outputChannel) return true;

    for (let i = 0; i < outputChannel.length; i++) {
      const value = inputChannel[i] || 0;
      // Apply your DSP operation here
      outputChannel[i] = yourOperation(value);
    }

    return true; // Keep processor alive
  }
}

registerProcessor("new-processor", NewProcessor);
```

**Important AudioWorklet Patterns:**

```typescript
// For two-input operations:
class TwoInputProcessor extends AudioWorkletProcessor {
  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !output || input.length < 2) return true;

    const inputA = input[0]; // First channel
    const inputB = input[1]; // Second channel
    const outputChannel = output[0];

    if (!inputA || !inputB || !outputChannel) return true;

    for (let i = 0; i < outputChannel.length; i++) {
      const a = inputA[i] || 0;
      const b = inputB[i] || 0;
      outputChannel[i] = operation(a, b);
    }

    return true;
  }
}

// For processors with state/configuration:
class StatefulProcessor extends AudioWorkletProcessor {
  private configValue: number;

  constructor(options?: AudioWorkletNodeOptions) {
    super();
    const opts = options?.processorOptions;
    this.configValue = opts?.configValue ?? 0;

    // Listen for config updates from main thread
    this.port.onmessage = (event) => {
      if (event.data.type === "setConfig") {
        this.configValue = event.data.value;
      }
    };
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    // Use this.configValue in processing
    return true;
  }
}
```

#### Step 3: Configure Vite Build

**File:** `vite.config.ts`

Ensure the processor is compiled and copied to `public/`:

```typescript
// In vite.config.ts build configuration
build: {
  rollupOptions: {
    input: {
      main: resolve(__dirname, 'index.html'),
      'new-processor': resolve(__dirname, 'src/engine/new-processor.ts'),
    },
    output: {
      entryFileNames: (chunkInfo) => {
        if (chunkInfo.name.includes('processor')) {
          return '[name].js';
        }
        return 'assets/[name]-[hash].js';
      },
    },
  },
},
```

#### Step 4: Register the AudioWorklet

**File:** `src/engine/SignalProcessingEngine.ts`

In the `start()` method:

```typescript
async start() {
  // ...existing registration

  try {
    const basePath = import.meta.env.BASE_URL || "/";
    await this.audioContext.audioWorklet.addModule(
      `${basePath}new-processor.js`,
    );
  } catch (e) {
    console.error("Failed to load new-processor AudioWorklet:", e);
  }
}
```

#### Step 5: Create the AudioWorkletNode

**File:** `src/engine/SignalProcessingEngine.ts`

Add creation method:

```typescript
private createNewProcessor(nodeId: string) {
  if (!this.audioContext) return;

  try {
    const workletNode = new AudioWorkletNode(
      this.audioContext,
      "new-processor",
      {
        numberOfInputs: 1,      // Or 2 for two-input ops
        numberOfOutputs: 1,
        outputChannelCount: [1],
      },
    );

    this.nodes.set(nodeId, workletNode);
  } catch (e) {
    console.error("Failed to create new-processor AudioWorkletNode:", e);
    // Fallback to gain node
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 1.0;
    this.nodes.set(nodeId, gainNode);
  }
}
```

#### Step 6: Handle Connections for Multi-Input AudioWorklets

For processors with multiple inputs, route connections to specific input channels:

```typescript
private connectNodes(...) {
  // ...
  case "new-processor":
    if (targetHandle === "inputA") {
      sourceNode.connect(targetNode, 0, 0);  // Connect to input 0, channel 0
    } else if (targetHandle === "inputB") {
      sourceNode.connect(targetNode, 0, 1);  // Connect to input 0, channel 1
    }
    break;
}
```

---

## File Modification Checklist

When adding a new processor, ensure you modify these files:

### Required Files

- [ ] `src/types/blocks/<category>.ts` - Add block type and definition
- [ ] `src/types/blocks/index.ts` - Export new type (if new category)
- [ ] `src/engine/SignalProcessingEngine.ts`:
  - [ ] `createAudioNode()` switch case
  - [ ] Creation method (new or existing)
  - [ ] `connectNodes()` if custom routing needed
  - [ ] `updateNodeConfig()` if configurable
  - [ ] `updateGraph()` parameter reset if modulatable inputs

### Optional Files (if processor has configuration)

- [ ] `src/types/blocks/common.ts` - Add config properties to `BlockConfig`
- [ ] `src/components/config/<Name>Config.tsx` - Create config component
- [ ] `src/components/config/index.ts` - Register in `configComponentMap`

### AudioWorklet-Specific Files

- [ ] `src/engine/<name>-processor.ts` - AudioWorklet processor implementation
- [ ] `vite.config.ts` - Add to build inputs (if separate file)
- [ ] `src/engine/SignalProcessingEngine.ts` - Register in `start()` method

---

## Code Examples

### Example 1: Simple Native Filter (Notch Filter)

Already implemented in the codebase. See `src/types/blocks/filters.ts` and `createFilter()` in the engine.

### Example 2: Native Node Combination (Subtraction)

```typescript
// Subtraction: A - B = A + (-1 × B)
private createSubtractNode(nodeId: string) {
  if (!this.audioContext) return;

  // Summer node (main output)
  const summer = this.audioContext.createGain();
  summer.gain.value = 1.0;

  // Inverter for input B
  const inverter = this.audioContext.createGain();
  inverter.gain.value = -1.0;
  inverter.connect(summer);

  this.nodes.set(nodeId, summer);
  this.nodes.set(`${nodeId}-inverter`, inverter);
}
```

### Example 3: AudioWorklet with Edge Case Handling

```typescript
// Division with zero protection
class DivideProcessor extends AudioWorkletProcessor {
  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    // ... input validation

    for (let i = 0; i < outputChannel.length; i++) {
      const a = inputA[i] || 0;
      const b = inputB[i] || 0;

      // Protect against division by zero
      const EPSILON = 0.0001;
      const divisor = Math.abs(b) < EPSILON ? (b >= 0 ? EPSILON : -EPSILON) : b;

      outputChannel[i] = a / divisor;
    }

    return true;
  }
}
```

### Example 4: Multiplication via Gain Modulation

```typescript
// Multiply: inputA × inputB using gain node
private createMultiplyNode(nodeId: string) {
  if (!this.audioContext) return;

  const gainNode = this.audioContext.createGain();
  gainNode.gain.value = 0;  // Will be modulated by inputB

  this.nodes.set(nodeId, gainNode);
}

// In connectNodes:
case "multiply":
  if (targetHandle === "inputA") {
    sourceNode.connect(targetNode);  // Signal through gain
  } else if (targetHandle === "inputB") {
    sourceNode.connect((targetNode as GainNode).gain);  // Modulate gain
  }
  break;
```

---

## Best Practices

### 1. Always Return `true` from AudioWorklet `process()`

```typescript
process(...) {
  // ... processing
  return true;  // Keeps processor alive
}
```

### 2. Handle Missing/Empty Inputs Gracefully

```typescript
if (!input || !output || input.length === 0) return true;
const inputChannel = input[0];
if (!inputChannel || !outputChannel) return true;
```

### 3. Protect Against Mathematical Edge Cases

```typescript
// Division by zero
const EPSILON = 0.0001;
const divisor = Math.abs(b) < EPSILON ? EPSILON : b;

// Square root of negative
outputChannel[i] = value >= 0 ? Math.sqrt(value) : 0;

// Clamp extreme values
const result = Math.pow(a, b);
outputChannel[i] = isFinite(result) ? Math.max(-100, Math.min(100, result)) : 0;
```

### 4. Reset AudioParams When Connected

When an input is connected to an AudioParam, reset the base value to 0 so the signal controls it directly:

```typescript
// In updateGraph():
if (isInputConnected("cutoff")) {
  filter.frequency.value = 0; // Signal directly controls
} else {
  filter.frequency.value = config.cutoffFrequency || 1000;
}
```

### 5. Provide Fallbacks for AudioWorklet Failures

```typescript
try {
  const workletNode = new AudioWorkletNode(...);
  this.nodes.set(nodeId, workletNode);
} catch (e) {
  console.error("AudioWorklet failed:", e);
  // Fallback to passthrough
  const gainNode = this.audioContext.createGain();
  gainNode.gain.value = 1.0;
  this.nodes.set(nodeId, gainNode);
}
```

### 6. Use Consistent Naming Conventions

- Block types: `kebab-case` (e.g., `"low-pass-filter"`)
- Processor classes: `PascalCase` (e.g., `DivideProcessor`)
- Processor names: `kebab-case` (e.g., `"divide-processor"`)
- Config properties: `camelCase` (e.g., `cutoffFrequency`)

### 7. Document Connection Behavior

When implementing custom connection routing, add clear comments explaining the signal flow.

---

## Testing Guidelines

### Manual Testing Checklist

1. **Block Creation**
   - [ ] Block appears in toolbar under correct category
   - [ ] Block can be dragged onto canvas
   - [ ] Default configuration is applied

2. **Configuration**
   - [ ] Config drawer opens when block selected
   - [ ] All parameters can be modified
   - [ ] Parameter changes update audio in real-time
   - [ ] Connected inputs disable corresponding config fields

3. **Connections**
   - [ ] Can connect to input ports
   - [ ] Can connect from output ports
   - [ ] Multi-input processors receive correct signals
   - [ ] Modulation inputs work correctly

4. **Audio Processing**
   - [ ] Signal passes through when playback started
   - [ ] Processing is audibly correct (compare with reference)
   - [ ] No clicks, pops, or artifacts
   - [ ] Works at different sample rates

5. **Edge Cases**
   - [ ] Block handles disconnected inputs
   - [ ] Block survives rapid config changes
   - [ ] Block handles extreme parameter values
   - [ ] Topology changes during playback work correctly

### Performance Considerations

- Test with multiple instances of the processor
- Monitor CPU usage in browser dev tools
- Check for memory leaks on repeated start/stop cycles
- Verify AudioWorklet doesn't cause audio dropouts

---

## Appendix: Web Audio API Reference

### BiquadFilterNode Types

| Type        | Description                | Parameters         |
| ----------- | -------------------------- | ------------------ |
| `lowpass`   | Low-pass filter            | frequency, Q       |
| `highpass`  | High-pass filter           | frequency, Q       |
| `bandpass`  | Band-pass filter           | frequency, Q       |
| `notch`     | Notch (band-reject) filter | frequency, Q       |
| `allpass`   | All-pass filter            | frequency, Q       |
| `peaking`   | Peaking EQ                 | frequency, Q, gain |
| `lowshelf`  | Low-shelf filter           | frequency, gain    |
| `highshelf` | High-shelf filter          | frequency, gain    |

### DynamicsCompressorNode Parameters

| Parameter | Range        | Default | Description                          |
| --------- | ------------ | ------- | ------------------------------------ |
| threshold | -100 to 0 dB | -24     | Level above which compression starts |
| knee      | 0 to 40 dB   | 30      | Transition width                     |
| ratio     | 1 to 20      | 12      | Compression ratio                    |
| attack    | 0 to 1 sec   | 0.003   | Attack time                          |
| release   | 0 to 1 sec   | 0.25    | Release time                         |

### WaveShaperNode Curve Generation

```typescript
// Soft clip (tanh)
function makeSoftClipCurve(amount: number): Float32Array {
  const samples = 1024;
  const curve = new Float32Array(samples);
  const k = amount * 10;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = Math.tanh(k * x);
  }
  return curve;
}

// Hard clip
function makeHardClipCurve(threshold: number): Float32Array {
  const samples = 1024;
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = Math.max(-threshold, Math.min(threshold, x));
  }
  return curve;
}
```

---

## Related Documentation

- [Signal Processors Plan](../plans/signal-processors.md) - Recommended processors to implement
- [CLAUDE.md](../../CLAUDE.md) - Project overview and architecture
