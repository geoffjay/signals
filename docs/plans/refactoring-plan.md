# Signals Codebase Refactoring Plan

## Executive Summary

This plan outlines opportunities to improve the codebase through decomposition, better design patterns, and improved
testability. The refactoring is organized into phases by priority and risk level.

---

## Current State Analysis

### Files by Complexity (candidates for decomposition)

| File                        | Lines | Severity | Key Issues                                                |
| --------------------------- | ----- | -------- | --------------------------------------------------------- |
| `SignalProcessingEngine.ts` | 1,327 | CRITICAL | 31 methods, 5 responsibilities, massive switch statements |
| `ConfigDrawer.tsx`          | 745   | HIGH     | 10+ render methods, 15 block types, repetitive patterns   |
| `blocks.ts`                 | 646   | MODERATE | 43 block definitions, monolithic BlockConfig              |
| `SignalFlowApp.tsx`         | 472   | MODERATE | 11 hooks, 6+ useEffects, dual state management            |
| `SignalBlock.tsx`           | 372   | MODERATE | 7 block type variants, 150+ lines conditionals            |

### Key Anti-Patterns Identified

1. **Dual State Management** - SignalFlowApp maintains parallel state in Zustand AND ReactFlow
2. **No Custom Hooks** - Repeated patterns not extracted
3. **Business Logic in UI** - State transitions, engine sync embedded in components
4. **Ref-Based Synchronization** - `isInternalNodeUpdate` pattern is a code smell
5. **Missing Abstractions** - No audio engine interface, no service layer

### Test Coverage Gaps

- `SignalFlowApp.tsx` - NOT tested (critical orchestration)
- `ConfigDrawer.tsx` - NOT tested
- `SignalBlock.tsx` - NOT tested
- `signalFlowStore.ts` - NOT tested

---

## Phase 1: Extract Utilities & Custom Hooks (Low Risk)

### 1.1 Create Utility Functions

**New file: `src/utils/graph.ts`**

```typescript
// Extract from SignalFlowApp.tsx
export function detectTopologyChange(
  prevNodes: Node[],
  newNodes: Node[],
  prevEdges: Edge[],
  newEdges: Edge[],
): boolean;

export function isInputConnected(
  nodeId: string,
  handleId: string,
  edges: Edge[],
): boolean;

export function getNodeIds(nodes: Node[]): string;

export function getEdgeKeys(edges: Edge[]): string;
```

**New file: `src/utils/blocks.ts`**

```typescript
// Extract from various files
export function isInputControlBlock(blockType: BlockType): boolean;
export function isGeneratorBlock(blockType: BlockType): boolean;
export function isFilterBlock(blockType: BlockType): boolean;
export function isOutputBlock(blockType: BlockType): boolean;
export function isMathBlock(blockType: BlockType): boolean;
```

### 1.2 Create Custom Hooks

**New file: `src/hooks/usePrevious.ts`**

```typescript
// Replace all prevXxxRef patterns
export function usePrevious<T>(value: T): T | undefined;
```

**New file: `src/hooks/useConnectionCheck.ts`**

```typescript
// Extract from ConfigDrawer
export function useConnectionCheck(nodeId: string, edges: Edge[]) {
  return {
    isInputConnected: (handleId: string) => boolean,
  };
}
```

**New file: `src/hooks/useNodeUpdater.ts`**

```typescript
// Extract repetitive node update pattern from SignalBlock
export function useNodeUpdater(nodeId: string) {
  const { setNodes } = useReactFlow()
  return {
    updateData: (updater: (data: SignalBlockData) => SignalBlockData) => void
  }
}
```

### 1.3 Files to Modify

- `src/components/SignalFlowApp.tsx` - Use new utilities/hooks
- `src/components/ConfigDrawer.tsx` - Use `useConnectionCheck`
- `src/components/SignalBlock.tsx` - Use `useNodeUpdater`

---

## Phase 2: Decompose ConfigDrawer (Medium Risk)

### 2.1 Extract Config Components

**New directory: `src/components/config/`**

| New File                  | Responsibility           | Blocks Covered                                 |
| ------------------------- | ------------------------ | ---------------------------------------------- |
| `WaveGeneratorConfig.tsx` | Wave generator settings  | sine, square, triangle, sawtooth               |
| `NoiseConfig.tsx`         | Noise generator settings | noise                                          |
| `FilterConfig.tsx`        | Filter settings          | low-pass, high-pass, band-pass, notch, allpass |
| `EQFilterConfig.tsx`      | EQ filter settings       | peaking, lowshelf, highshelf                   |
| `GainConfig.tsx`          | Gain settings            | gain                                           |
| `MathConfig.tsx`          | Math operation settings  | add, subtract, multiply, divide, etc.          |
| `FFTAnalyzerConfig.tsx`   | FFT analyzer settings    | fft-analyzer                                   |
| `OscilloscopeConfig.tsx`  | Oscilloscope settings    | oscilloscope                                   |
| `AudioOutputConfig.tsx`   | Audio output settings    | audio-output                                   |
| `NumericMeterConfig.tsx`  | Numeric meter settings   | numeric-meter                                  |
| `InputControlConfig.tsx`  | Input control settings   | slider, button, toggle, pulse                  |
| `RoutingConfig.tsx`       | Routing settings         | multiplexer, splitter                          |

### 2.2 Create Shared Components

**New file: `src/components/config/shared/ConfigField.tsx`**

```typescript
// Reusable field wrapper with connection status
interface ConfigFieldProps {
  label: string;
  htmlFor: string;
  isConnected?: boolean;
  children: React.ReactNode;
}
```

**New file: `src/components/config/shared/NumberInput.tsx`**

```typescript
// Standardized number input with min/max/step
interface NumberInputProps {
  id: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}
```

### 2.3 Refactored ConfigDrawer

```typescript
// src/components/ConfigDrawer.tsx (simplified)
import { configComponentMap } from './config'

export function ConfigDrawer({ node, edges, onConfigChange, ... }) {
  const ConfigComponent = configComponentMap[node.data.blockType]

  return (
    <Sheet>
      <SheetContent>
        <ConfigComponent
          config={node.data.config}
          edges={edges}
          nodeId={node.id}
          onChange={onConfigChange}
        />
      </SheetContent>
    </Sheet>
  )
}
```

---

## Phase 3: Decompose SignalBlock (Medium Risk)

### 3.1 Extract Control Components

**New directory: `src/components/blocks/controls/`**

| New File            | Responsibility                          |
| ------------------- | --------------------------------------- |
| `SliderControl.tsx` | Slider input rendering and interaction  |
| `ButtonControl.tsx` | Button input rendering and interaction  |
| `ToggleControl.tsx` | Toggle switch rendering and interaction |
| `PulseControl.tsx`  | Pulse button rendering and interaction  |

### 3.2 Extract Visualization Components

**New directory: `src/components/blocks/visualizations/`**

| New File                | Responsibility               |
| ----------------------- | ---------------------------- |
| `OscilloscopeBlock.tsx` | Oscilloscope display wrapper |
| `FFTAnalyzerBlock.tsx`  | FFT analyzer display wrapper |
| `NumericMeterBlock.tsx` | Numeric meter display        |

### 3.3 Create Block Renderer

**New file: `src/components/blocks/BlockContent.tsx`**

```typescript
// Dispatches to appropriate control/visualization
export function BlockContent({ blockType, data, nodeId, ... }) {
  switch (blockType) {
    case 'slider': return <SliderControl {...} />
    case 'oscilloscope': return <OscilloscopeBlock {...} />
    // ...
  }
}
```

---

## Phase 4: Decompose SignalProcessingEngine (High Risk)

### 4.1 Extract Node Factory

**New file: `src/engine/NodeFactory.ts`**

```typescript
export class NodeFactory {
  constructor(private audioContext: AudioContext) {}

  createNode(blockType: BlockType, config: BlockConfig): AudioNode | null;

  // Private methods for each category
  private createGeneratorNode(type, config): OscillatorNode;
  private createFilterNode(type, config): BiquadFilterNode;
  private createMathNode(type): AudioWorkletNode;
  private createFFTNode(type, config): AnalyserNode;
  // ...
}
```

### 4.2 Extract Connection Router

**New file: `src/engine/ConnectionRouter.ts`**

```typescript
export class ConnectionRouter {
  constructor(
    private audioContext: AudioContext,
    private nodes: Map<string, AudioNode>,
  ) {}

  connectNodes(
    sourceId: string,
    targetId: string,
    sourceHandle: string,
    targetHandle: string,
    sourceBlockType: BlockType,
    targetBlockType: BlockType,
  ): void;

  disconnectAll(nodeId: string): void;
}
```

### 4.3 Extract Config Updater

**New file: `src/engine/ConfigUpdater.ts`**

```typescript
export class ConfigUpdater {
  constructor(
    private audioContext: AudioContext,
    private nodes: Map<string, AudioNode>,
  ) {}

  updateConfig(nodeId: string, blockType: BlockType, config: BlockConfig): void;

  // Category-specific update methods
  private updateGeneratorConfig(node, config): void;
  private updateFilterConfig(node, config): void;
  private updateFFTConfig(node, config): void;
}
```

### 4.4 Extract FFT Manager

**New file: `src/engine/FFTManager.ts`**

```typescript
export class FFTManager {
  private fftNodes: Map<string, FFTNodeSet>;

  createFFTAnalyzer(nodeId: string, config: FFTConfig): void;
  updateFFTMode(nodeId: string, mode: FFTMode): void;
  getAnalyser(nodeId: string): AnalyserNode | null;
  cleanup(nodeId: string): void;
}
```

### 4.5 Refactored SignalProcessingEngine

```typescript
// Simplified orchestration layer
export class SignalProcessingEngine {
  private nodeFactory: NodeFactory;
  private connectionRouter: ConnectionRouter;
  private configUpdater: ConfigUpdater;
  private fftManager: FFTManager;

  async start(): Promise<void>;
  stop(): void;
  updateGraph(nodes: Node[], edges: Edge[]): void;
  updateNodeConfig(nodeId, blockType, config): void;
  getAnalyser(nodeId): AnalyserNode | null;
}
```

---

## Phase 5: Split Block Definitions (Medium Risk)

### 5.1 New File Structure

```
src/types/
├── blocks/
│   ├── index.ts           # Re-exports all + combined types
│   ├── generators.ts      # sine, square, triangle, sawtooth, noise
│   ├── filters.ts         # low-pass, high-pass, band-pass, notch, etc.
│   ├── processors.ts      # gain, math operations
│   ├── outputs.ts         # oscilloscope, audio-output, numeric-meter
│   ├── inputs.ts          # slider, button, toggle, pulse
│   ├── routing.ts         # multiplexer, splitter
│   └── fft.ts             # fft-analyzer
├── config.ts              # BlockConfig discriminated union
└── common.ts              # Shared types (BlockCategory, etc.)
```

### 5.2 Improved Type Safety

**New file: `src/types/config.ts`**

```typescript
// Discriminated union for type-safe configs
export type BlockConfig =
  | { type: 'generator'; frequency: number; amplitude: number; phase: number }
  | { type: 'filter'; cutoffFrequency: number; qFactor: number }
  | { type: 'fft'; fftSize: number; mode: FFTMode; ... }
  | { type: 'slider'; minValue: number; maxValue: number; ... }
  // ...
```

---

## Phase 6: Refactor SignalFlowApp State (High Risk)

### 6.1 Create Orchestration Hook

**New file: `src/hooks/useGraphOrchestrator.ts`**

```typescript
export function useGraphOrchestrator() {
  const store = useSignalFlowStore()
  const engineRef = useRef<SignalProcessingEngine>()

  // Consolidate all state management logic here
  return {
    nodes: store.nodes,
    edges: store.edges,
    isPlaying: store.isPlaying,

    // Actions
    addNode: (blockType, position) => void,
    removeNode: (nodeId) => void,
    updateNodeConfig: (nodeId, config) => void,
    togglePlayback: () => void,

    // Engine access
    getAnalyser: (nodeId) => AnalyserNode | null,
  }
}
```

### 6.2 Eliminate Dual State

**Goal:** Use Zustand as single source of truth, remove parallel ReactFlow state.

```typescript
// BEFORE (current - problematic)
const { nodes: storeNodes } = useSignalFlowStore();
const [nodes, setNodes] = useNodesState(storeNodes); // Parallel!

// AFTER (proposed)
const { nodes, setNodes } = useGraphOrchestrator(); // Single source
```

### 6.3 Simplified SignalFlowApp

```typescript
export function SignalFlowApp() {
  const orchestrator = useGraphOrchestrator()

  return (
    <ReactFlowProvider>
      <ReactFlow
        nodes={orchestrator.nodes}
        edges={orchestrator.edges}
        onNodesChange={orchestrator.onNodesChange}
        onEdgesChange={orchestrator.onEdgesChange}
        // ...
      />
      <ConfigDrawer ... />
    </ReactFlowProvider>
  )
}
```

---

## Phase 7: Improve Testability (Ongoing)

### 7.1 Create Audio Engine Interface

**New file: `src/engine/types.ts`**

```typescript
export interface IAudioEngine {
  start(): Promise<void>;
  stop(): void;
  updateGraph(nodes: Node[], edges: Edge[]): void;
  updateNodeConfig(
    nodeId: string,
    blockType: BlockType,
    config: BlockConfig,
  ): void;
  updateConstantValue(nodeId: string, value: number): void;
  getAnalyser(nodeId: string): AnalyserNode | null;
}
```

### 7.2 Create Mock Engine for Tests

**New file: `src/test/mocks/MockAudioEngine.ts`**

```typescript
export class MockAudioEngine implements IAudioEngine {
  // Track method calls for assertions
  calls: { method: string; args: any[] }[] = [];

  async start() {
    this.calls.push({ method: "start", args: [] });
  }
  // ...
}
```

### 7.3 New Test Files to Create

| Test File                                   | Tests                   |
| ------------------------------------------- | ----------------------- |
| `src/test/utils/graph.test.ts`              | Graph utility functions |
| `src/test/utils/blocks.test.ts`             | Block type utilities    |
| `src/test/hooks/useConnectionCheck.test.ts` | Connection check hook   |
| `src/test/hooks/useNodeUpdater.test.ts`     | Node updater hook       |
| `src/test/store/signalFlowStore.test.ts`    | Store actions and state |
| `src/test/components/ConfigDrawer.test.tsx` | Config drawer rendering |
| `src/test/engine/NodeFactory.test.ts`       | Node creation           |
| `src/test/engine/ConnectionRouter.test.ts`  | Connection routing      |

---

## Implementation Order

### Recommended Sequence

1. **Phase 1** (Utilities/Hooks) - Foundation for other phases
2. **Phase 2** (ConfigDrawer) - High impact, medium risk
3. **Phase 3** (SignalBlock) - Medium impact, medium risk
4. **Phase 5** (Block Definitions) - Can be done in parallel
5. **Phase 4** (Engine) - High risk, do after patterns established
6. **Phase 6** (State) - Highest risk, do last
7. **Phase 7** (Testing) - Ongoing throughout

### Estimated Scope per Phase

| Phase | New Files | Modified Files | Risk   |
| ----- | --------- | -------------- | ------ |
| 1     | 5         | 3              | Low    |
| 2     | 14        | 1              | Medium |
| 3     | 8         | 1              | Medium |
| 4     | 5         | 1              | High   |
| 5     | 8         | 3              | Medium |
| 6     | 2         | 2              | High   |
| 7     | 8+        | 0              | Low    |

---

## Success Criteria

- [ ] No file exceeds 300 lines (except engine core)
- [ ] Each component has a single responsibility
- [ ] Custom hooks extract reusable patterns
- [ ] Business logic separated from UI components
- [ ] Test coverage > 80% for utilities and hooks
- [ ] No eslint-disable comments for hook dependencies
- [ ] Single source of truth for state (no dual state)
