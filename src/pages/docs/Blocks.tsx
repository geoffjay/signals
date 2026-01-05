import { DocumentationLayout } from "./DocumentationLayout";

export function Blocks() {
  return (
    <DocumentationLayout>
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Blocks</h1>
        <p className="lead">
          Blocks are the building units of your signal flow. Each block type serves a
          specific purpose in signal generation, processing, or output.
        </p>

        <h2>Block Categories</h2>

        <h3>Generators</h3>
        <p>
          Generator blocks create audio signals from scratch. They produce continuous
          waveforms at specified frequencies.
        </p>
        <ul>
          <li><strong>Sine Wave</strong> - Smooth, pure tone waveform</li>
          <li><strong>Square Wave</strong> - Alternating high/low signal, rich in harmonics</li>
          <li><strong>Triangle Wave</strong> - Linear ramps up and down</li>
          <li><strong>Sawtooth Wave</strong> - Sharp rise, gradual fall</li>
          <li><strong>Noise</strong> - Random signal (white noise)</li>
        </ul>

        <h3>Processors</h3>
        <p>
          Processor blocks modify signals passing through them.
        </p>
        <ul>
          <li><strong>Gain</strong> - Amplifies or attenuates the signal</li>
          <li><strong>Low-Pass Filter</strong> - Removes high frequencies</li>
          <li><strong>High-Pass Filter</strong> - Removes low frequencies</li>
          <li><strong>Band-Pass Filter</strong> - Allows only a range of frequencies</li>
        </ul>

        <h3>Routing</h3>
        <p>
          Routing blocks help manage complex signal flows.
        </p>
        <ul>
          <li><strong>Multiplexer</strong> - Combines multiple inputs into one output</li>
          <li><strong>Splitter</strong> - Splits one input to multiple outputs</li>
        </ul>

        <h3>Outputs</h3>
        <p>
          Output blocks display or play the final signal.
        </p>
        <ul>
          <li><strong>Oscilloscope</strong> - Visual display of the waveform</li>
          <li><strong>Audio Output</strong> - Plays the signal through speakers</li>
          <li><strong>External Connections</strong> - Routes signals to the visualizer</li>
        </ul>

        <h2>Block Configuration</h2>
        <p>
          Each block has configurable parameters accessible via the config drawer.
          Click on any block to select it and view its settings.
        </p>

        <h2>Connection Rules</h2>
        <ul>
          <li>Input ports accept only one incoming connection</li>
          <li>Output ports can connect to multiple inputs (up to 8)</li>
          <li>Connections animate when playback is active</li>
        </ul>
      </article>
    </DocumentationLayout>
  );
}
