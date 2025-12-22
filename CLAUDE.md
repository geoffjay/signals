# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **demonstration application** for visual signal processing and waveform generation. It is NOT a component library - it's a standalone demo showcasing how a future React component library for signal processing would work.

The application allows users to visually build signal processing chains using a node-based interface with **real signal data** flowing through the system using the Web Audio API. It's capable of producing actual usable signals for audio production.

## Commands

```bash
# Development
bun run dev          # Start dev server on http://localhost:5173

# Build
bun run build        # TypeScript check + Vite production build

# Linting
bun run lint         # Run ESLint

# Preview
bun run preview      # Preview production build
```

## Architecture

### Three-Panel Layout

1. **Left Toolbar** (`Toolbar.tsx`) - Draggable block buttons organized by category (Generators, Processors, Routing, Outputs) with Start/Stop playback controls
2. **Center Canvas** (ReactFlow) - Empty canvas for placing and connecting blocks
3. **Right Configuration Drawer** (`ConfigDrawer.tsx`) - Slides in when a block is selected, showing block-specific configuration options

### Core Architecture Components

#### 1. Block System (`src/types/blocks.ts`)

Defines 13 block types in `BLOCK_DEFINITIONS`:

- **Generators**: sine-wave, square-wave, triangle-wave, sawtooth-wave, noise
- **Processors**: gain, low-pass-filter, high-pass-filter, band-pass-filter
- **Routing**: multiplexer, splitter
- **Outputs**: oscilloscope, audio-output

Key functions:

- `getBlockInputs()` - Dynamically generates input ports (handles multiplexer with 2/4/8 inputs)
- `getBlockOutputs()` - Dynamically generates output ports (handles splitter with 2/4/8 outputs)

#### 2. Signal Processing Engine (`src/engine/SignalProcessingEngine.ts`)

Manages Web Audio API nodes and signal flow. **Critical implementation details:**

- **Incremental Updates**: `updateGraph()` uses diff-based updates to avoid stopping running oscillators. It only creates/removes nodes that actually changed in the graph topology.
- **Oscillator Lifecycle**: Web Audio API oscillators cannot be restarted once stopped. The engine must keep oscillators running continuously during playback.
- **Node Tracking**: Maintains three maps:
  - `nodes` - All Web Audio nodes
  - `oscillators` - Oscillator nodes (need special handling)
  - `analysers` - AnalyserNode references for oscilloscopes

#### 3. State Management (`src/store/signalFlowStore.ts`)

Uses Zustand with localStorage persistence for state management:

- **Persisted State**: Nodes, edges, play state, selected node, and node ID counter
- **Smart Serialization**: Removes non-serializable analyser references before persisting to localStorage
- **Auto-Restore**: On page refresh, state is restored and audio engine is restarted if isPlaying was true
- **Bidirectional Sync**: ReactFlow state syncs to Zustand store, which persists to localStorage

#### 4. Main Application (`src/components/SignalFlowApp.tsx`)

Coordinates ReactFlow with the signal processing engine. **Critical state management:**

- **Effect Synchronization**: Uses `isInternalNodeUpdate` ref to prevent infinite loops when attaching analyser references to oscilloscope nodes
- **Topology Tracking**: Monitors node IDs and edge connections to determine when `updateGraph` should be called (only for actual topology changes, not position/config changes)
- **Analyser Attachment**: When new oscilloscope blocks are added during playback, automatically retrieves and attaches AnalyserNode references so they can display waveforms immediately
- **State Persistence**: Syncs ReactFlow state changes to Zustand store, which automatically persists to localStorage
- **Restore on Mount**: On initial mount, checks if store has existing state and restores it, including restarting the audio engine if previously playing

### Signal Flow Behavior

**Connection Rules** (enforced in `onConnect`):

- Input ports accept only ONE incoming connection (replaces existing)
- Output ports can connect to multiple inputs (up to 8)
- Connections animate when playback is active

**Configuration Updates**:

- Handled by `updateNodeConfig()` which directly updates Web Audio node parameters without stopping oscillators
- Changes are applied in real-time during playback

**Playback States**:

- **Start**: Creates all audio nodes, starts oscillators, attaches analysers to oscilloscopes
- **Stop**: Stops all oscillators, clears all nodes and analysers
- **During Playback**: Topology changes (add/remove blocks or connections) trigger incremental `updateGraph`, preserving running oscillators

### Oscilloscope Rendering (`src/components/OscilloscopeDisplay.tsx`)

Uses Canvas API for real-time waveform visualization:

- `getByteTimeDomainData()` returns values 0-255 where 128 = zero crossing
- Y-coordinate formula: `height / 2 - ((value - 128) / 128.0 * height / 2)` centers waveform
- Uses `requestAnimationFrame` for smooth 60fps rendering

## Critical Implementation Notes

### Avoiding Infinite Loops

The app uses a ref-based flag system to prevent React effect infinite loops:

- `isInternalNodeUpdate` - Set when internally updating node data (e.g., attaching analysers)
- Effects check this flag before calling `updateGraph` to avoid re-triggering

### Web Audio API Constraints

- Oscillators are **one-shot**: Once stopped, they cannot be restarted
- Must create new oscillator instances if playback is stopped and restarted
- Analyser nodes need to be created before they can be attached to React component data

### TypeScript Type Workarounds

- `SignalBlockData` extends `Record<string, unknown>` to satisfy ReactFlow's Node type constraints
- Uses type assertions (`as`) when accessing block data from ReactFlow nodes
- Effects use `eslint-disable-next-line` for intentional dependency omissions

## Block Configuration

Each block type has specific configuration options in `BlockConfig`:

- Wave generators: frequency (Hz), amplitude (0-1), phase (0-360°)
- Filters: cutoffFrequency (Hz), qFactor
- Multiplexer: numInputs (2/4/8), selectorValue
- Splitter: numOutputs (2/4/8)
- Oscilloscope: timeWindow (seconds), refreshRate (Hz)
- Audio Output: volume (0-1), muted (boolean)

## Key Files

- `src/types/blocks.ts` - Block type definitions and configurations
- `src/engine/SignalProcessingEngine.ts` - Web Audio API integration
- `src/store/signalFlowStore.ts` - Zustand state management with localStorage persistence
- `src/components/SignalFlowApp.tsx` - Main app coordinator
- `src/components/SignalBlock.tsx` - ReactFlow custom node component
- `src/components/OscilloscopeDisplay.tsx` - Waveform visualization
- `src/components/Toolbar.tsx` - Block palette with drag source
- `src/components/ConfigDrawer.tsx` - Block configuration UI
- `PLAN.md` - Original implementation specification
