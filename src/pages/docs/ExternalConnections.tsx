import { DocumentationLayout } from "./DocumentationLayout";

export function ExternalConnections() {
  return (
    <DocumentationLayout>
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>External Connections</h1>
        <p className="lead">
          External Connections allow you to route audio signals from your signal flow
          to control visualizer effects, creating audio-reactive visual experiences.
        </p>

        <h2>Overview</h2>
        <p>
          The External Connections block acts as a bridge between your signal processing
          canvas and the visualizer. It captures audio data and makes it available as
          control signals for visualizer effects.
        </p>

        <h2>Setting Up External Connections</h2>

        <h3>Step 1: Add the Block</h3>
        <p>
          Drag an External Connections block from the Outputs section of the toolbar
          onto your canvas.
        </p>

        <h3>Step 2: Configure Inputs</h3>
        <p>
          In the config drawer, set the number of connections (1-8) and give each
          connection a descriptive name.
        </p>

        <h3>Step 3: Connect Signals</h3>
        <p>
          Connect audio signals to each input. These signals will be analyzed and
          their RMS (root mean square) values will be extracted.
        </p>

        <h3>Step 4: Use in Visualizer</h3>
        <p>
          Switch to Visualizer mode and use the link button next to any effect slider
          to connect it to an external source.
        </p>

        <h2>Signal Processing</h2>
        <p>
          External connections analyze the incoming audio and extract useful data:
        </p>
        <ul>
          <li><strong>RMS Level:</strong> The average signal level (0-1 range)</li>
          <li><strong>Smoothing:</strong> Values are smoothed to prevent jittery visuals</li>
        </ul>

        <h2>Use Cases</h2>

        <h3>Audio-Reactive Bloom</h3>
        <p>
          Connect a bass-heavy signal to the bloom effect to make highlights pulse
          with the beat.
        </p>

        <h3>Frequency-Based Effects</h3>
        <p>
          Use multiple connections with different frequency bands (via filters) to
          drive different effects. For example, bass to bloom, mids to chromatic
          aberration, highs to glitch.
        </p>

        <h3>Dynamic Visuals</h3>
        <p>
          Create complex, responsive visuals by connecting different parts of your
          audio to different visual effects.
        </p>

        <h2>Tips</h2>
        <ul>
          <li>
            <strong>Playback Required:</strong> External connections only work during
            playback. Start playback to see real-time values.
          </li>
          <li>
            <strong>Named Connections:</strong> Give your connections descriptive names
            like "Bass" or "Lead" to easily identify them in the visualizer.
          </li>
          <li>
            <strong>Signal Conditioning:</strong> Use gain blocks to adjust signal
            levels for optimal visual response.
          </li>
        </ul>
      </article>
    </DocumentationLayout>
  );
}
