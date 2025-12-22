# Signal Flow Demo Application - Implementation Prompt

## Purpose and Context

Build a demonstration application that showcases a future React component library for visual signal processing and waveform generation. This is NOT the component library itself - this is a standalone demo app that demonstrates how the library's components would work when integrated into an application.

The demo should allow users to visually build signal processing chains using a node-based interface, with real signal data flowing through the system. The application should be capable of producing actual usable signals for audio production or analog control systems.

## Technology Stack

- **React** - Base framework (already configured)
- **ReactFlow** - Node-based canvas for placing and connecting blocks
- **Web Audio API** - For generating real signal data and audio playback

## Application Layout

The application consists of three main areas:

1. **Left Toolbar** (~200-250px width)
   - Vertical list of draggable block buttons
   - Start/Stop playback buttons at the top or bottom
   - Each button represents a block type that can be dragged onto the canvas

2. **Center Canvas** (Remaining space, majority of interface)
   - ReactFlow container for placing and connecting blocks
   - Should start empty (no pre-placed blocks)
   - Grid background recommended for visual reference
   - Support pan and zoom

3. **Right Configuration Drawer** (Slides in when block selected, ~300-350px width)
   - Shows detailed configuration options for the selected block
   - Different options based on block type
   - Should close or show empty state when no block is selected

## Block Types and Specifications

### 1. Wave Generator Blocks

Four separate block types for different waveforms:
- **Sine Wave Generator**
- **Square Wave Generator**
- **Triangle Wave Generator**
- **Sawtooth Wave Generator**

**Outputs:**
- 1 output port: the generated waveform signal

**Inputs:**
- Frequency input (can override default frequency setting)
- Amplitude input (can override default amplitude setting)
- Phase input (can override default phase setting)

**Configuration Options:**
- Default Frequency (Hz)
- Default Amplitude (0-1 range)
- Default Phase (0-360 degrees)

**Notes:** When no input is connected to an input port, use the default configured value. When an input is connected, the incoming signal modulates that parameter in real-time.

### 2. Noise Generator Block

**Outputs:**
- 1 output port: noise signal

**Inputs:**
- Amplitude input (optional, can override default)

**Configuration Options:**
- Default Amplitude (0-1 range)
- Noise type (White noise initially; can be simple random values)

### 3. Gain Block

**Inputs:**
- 1 input port: signal input

**Outputs:**
- 1 output port: amplified/attenuated signal

**Configuration Options:**
- Gain amount (can be > 1 for amplification or < 1 for attenuation)
- Display as multiplier (e.g., 0.5x, 2x) or dB

### 4. Filter Blocks

Three separate block types:
- **Low-Pass Filter**
- **High-Pass Filter**
- **Band-Pass Filter**

**Inputs:**
- Signal input
- Frequency/Cutoff input (optional, can override default cutoff frequency)

**Outputs:**
- 1 output port: filtered signal

**Configuration Options:**
- Default cutoff frequency (Hz)
- Roll-off/Q factor (can start with reasonable defaults)

### 5. Multiplexer (Mux) Block

**Inputs:**
- 2, 4, or 8 signal inputs (configurable)
- 1 selector input (determines which input passes through)

**Outputs:**
- 1 output port: selected signal

**Configuration Options:**
- Number of inputs (2, 4, or 8)
- Default selector value (0 to N-1, used when no selector signal connected)

**Notes:** Selector input should map to input selection (e.g., value 0 = first input, 1 = second input, etc.)

### 6. Signal Splitter Block

**Inputs:**
- 1 input port: signal input

**Outputs:**
- 2, 4, or 8 output ports (configurable)

**Configuration Options:**
- Number of outputs (2, 4, or 8)

**Notes:** All outputs carry the exact same signal (fanout/distribution)

### 7. Waveform Display Block (Oscilloscope)

**Inputs:**
- 1 input port: signal input to visualize

**Outputs:**
- None (this is a visualization endpoint)

**Configuration Options:**
- Display refresh rate (optional)
- Time window/scale (optional)

**Visual Display:**
- Show real-time animated visualization of the signal waveform
- Single trace display (like an oscilloscope)
- No need for scales, grid, or frequency markers
- Just the waveform shape animating in real-time

### 8. Audio Output Block

**Inputs:**
- 1 input port: signal input to play as audio

**Outputs:**
- None (this is an audio endpoint)

**Configuration Options:**
- Volume control (0-1 range)
- Mute toggle
- May need sample rate setting (44.1kHz standard)

**Notes:** When the system is playing and a signal is connected, output the signal as actual audio through the Web Audio API. Multiple audio output blocks can exist simultaneously.

## Block Visual Design

- Use simple rectangular or rounded rectangle nodes
- Do NOT color code by category (keep uniform appearance initially)
- Clearly show input ports on the left side and output ports on the right side of each block
- Display block name/type as text label
- Input/output ports should be visible connection points (circles or small squares)
- Ports should be labeled if space permits (especially for multi-input blocks)
- Maximum of 8 output ports per block

## Toolbar Functionality

**Playback Controls:**
- Start button - begins signal processing and animation
- Stop button - halts signal processing and animation

**Block Buttons:**
- One button for each block type listed above
- Draggable onto the canvas
- When dragged from toolbar and dropped onto canvas, create new instance of that block
- Should support creating unlimited instances of any block type

## ReactFlow Canvas Behavior

**Drag and Drop:**
- Blocks can be dragged from the toolbar and dropped onto the canvas
- Once on canvas, blocks can be repositioned by dragging
- Implement using ReactFlow's custom node system

**Block Deletion:**
- Support deleting blocks (via Delete/Backspace key when selected, or delete button in config drawer)
- When a block is deleted, remove all its connections

**Connections:**
- Click and drag from an output port to an input port to create a connection
- Connections should snap to ports (not free-form)
- Cannot connect output to output or input to input
- Cannot connect a port to itself
- An input port can only have one incoming connection
- An output port can connect to multiple input ports (up to 8 total)

**Connection Animation:**
- When the system is playing (Start button pressed), animate the connection lines
- Animation can be simple (e.g., dashed line with moving dashes, or dots/particles flowing along the line)
- Animation should indicate signal is flowing through the connection
- No animation when stopped

**Selection:**
- Clicking on a block selects it
- Selected block should show visual indication (highlight, border, etc.)
- Selecting a block opens the configuration drawer on the right

## Configuration Drawer

**Behavior:**
- Slides in from the right when a block is selected
- Shows configuration options specific to the selected block type
- Changes are applied immediately (live editing)
- Drawer should close or show empty state when clicking canvas background (deselecting)

**Content Structure:**
- Block type name as header
- Form controls for each configuration option
- Use appropriate input types (sliders, number inputs, dropdowns, etc.)
- Delete block button at bottom

## Signal Processing Implementation

**Real Signal Data:**
- Generate actual signal data using Web Audio API or custom signal generation
- Signals should be real numeric values representing amplitude over time
- When blocks are connected, data should actually flow through the system
- Each block should process incoming signals according to its function

**Sample Rate:**
- Use standard audio sample rate (44.1kHz recommended)
- Signals should be processed as continuous streams

**Processing Pipeline:**
- When Start is pressed, begin generating signals from source blocks (wave generators, noise)
- Process signals through connected blocks in the correct order
- Update visualization blocks (oscilloscope) with processed signals
- Output to audio blocks for playback

**Frequency Modulation:**
- When a signal is connected to a frequency input (or amplitude/phase), use the signal's value to modulate that parameter
- Signal values should map to reasonable ranges (this can be implementation-specific)

## Initial State

- Canvas should be empty (no blocks placed)
- System should be in stopped state
- No block selected (configuration drawer hidden or showing empty state)

## Visual Feedback

- Clear indication of selected block
- Visible input/output ports on all blocks
- Animated connections during playback
- Real-time waveform animation in oscilloscope blocks
- Visual state for Start/Stop buttons (active/inactive)

## Notes and Considerations

- Ensure performance is reasonable even with many blocks and connections
- Handle edge cases (disconnected blocks, circular connections if possible, etc.)
- Signal processing should be efficient enough for real-time operation
- Consider using Web Audio API's AudioWorklet or ScriptProcessor for signal generation and processing
- For oscilloscope display, use Canvas API for efficient real-time rendering
