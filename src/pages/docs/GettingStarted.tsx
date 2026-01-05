import { DocumentationLayout } from "./DocumentationLayout";
import {
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyP,
  TypographyLead,
  TypographyOrderedList,
} from "@/components/ui/typography";

export function GettingStarted() {
  return (
    <DocumentationLayout>
      <article>
        <TypographyH1>Getting Started</TypographyH1>
        <TypographyLead>
          Welcome to Signals, a visual signal processing application for creating and
          manipulating audio waveforms using a node-based interface.
        </TypographyLead>

        <TypographyH2>Overview</TypographyH2>
        <TypographyP>
          Signals allows you to build signal processing chains by connecting blocks together
          on a canvas. Each block represents a signal processing unit - generators create
          waveforms, processors modify them, and outputs display or play the results.
        </TypographyP>

        <TypographyH2>Quick Start</TypographyH2>
        <TypographyOrderedList>
          <li>
            <span className="font-semibold">Add a Generator</span> — Drag a waveform generator (Sine, Square, Triangle,
            Sawtooth, or Noise) from the toolbar onto the canvas.
          </li>
          <li>
            <span className="font-semibold">Add an Output</span> — Add an Oscilloscope to visualize your signal, or
            an Audio Output to hear it.
          </li>
          <li>
            <span className="font-semibold">Connect Blocks</span> — Click and drag from an output port to an input
            port to create a connection.
          </li>
          <li>
            <span className="font-semibold">Start Playback</span> — Click the play button in the header to start
            the audio engine.
          </li>
        </TypographyOrderedList>

        <TypographyH2>Interface Layout</TypographyH2>

        <TypographyH3>Header</TypographyH3>
        <TypographyP>
          The header contains playback controls, mode switching (Signal/Visualizer), and the
          application menu.
        </TypographyP>

        <TypographyH3>Toolbar</TypographyH3>
        <TypographyP>
          The left toolbar contains draggable blocks organized by category: Generators,
          Processors, Routing, and Outputs.
        </TypographyP>

        <TypographyH3>Canvas</TypographyH3>
        <TypographyP>
          The center canvas is where you build your signal flow by placing and connecting blocks.
          Use the mouse wheel to zoom and drag to pan.
        </TypographyP>

        <TypographyH3>Config Drawer</TypographyH3>
        <TypographyP>
          When you select a block, a configuration drawer slides in from the right showing
          adjustable parameters for that block.
        </TypographyP>

        <TypographyH2>Saving and Loading</TypographyH2>
        <TypographyP>
          Your signal flow is automatically saved to local storage. Use the menu to save
          projects to the cloud or load existing projects.
        </TypographyP>
      </article>
    </DocumentationLayout>
  );
}
