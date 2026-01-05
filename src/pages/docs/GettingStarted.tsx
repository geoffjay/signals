import { DocumentationLayout } from "./DocumentationLayout";

export function GettingStarted() {
  return (
    <DocumentationLayout>
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Getting Started</h1>
        <p className="lead">
          Welcome to Signals, a visual signal processing application for creating and
          manipulating audio waveforms using a node-based interface.
        </p>

        <h2>Overview</h2>
        <p>
          Signals allows you to build signal processing chains by connecting blocks together
          on a canvas. Each block represents a signal processing unit - generators create
          waveforms, processors modify them, and outputs display or play the results.
        </p>

        <h2>Quick Start</h2>
        <ol>
          <li>
            <strong>Add a Generator</strong> - Drag a waveform generator (Sine, Square, Triangle,
            Sawtooth, or Noise) from the toolbar onto the canvas.
          </li>
          <li>
            <strong>Add an Output</strong> - Add an Oscilloscope to visualize your signal, or
            an Audio Output to hear it.
          </li>
          <li>
            <strong>Connect Blocks</strong> - Click and drag from an output port to an input
            port to create a connection.
          </li>
          <li>
            <strong>Start Playback</strong> - Click the play button in the header to start
            the audio engine.
          </li>
        </ol>

        <h2>Interface Layout</h2>
        <h3>Header</h3>
        <p>
          The header contains playback controls, mode switching (Signal/Visualizer), and the
          application menu.
        </p>

        <h3>Toolbar</h3>
        <p>
          The left toolbar contains draggable blocks organized by category: Generators,
          Processors, Routing, and Outputs.
        </p>

        <h3>Canvas</h3>
        <p>
          The center canvas is where you build your signal flow by placing and connecting blocks.
          Use the mouse wheel to zoom and drag to pan.
        </p>

        <h3>Config Drawer</h3>
        <p>
          When you select a block, a configuration drawer slides in from the right showing
          adjustable parameters for that block.
        </p>

        <h2>Saving and Loading</h2>
        <p>
          Your signal flow is automatically saved to local storage. Use the menu to save
          projects to the cloud or load existing projects.
        </p>
      </article>
    </DocumentationLayout>
  );
}
