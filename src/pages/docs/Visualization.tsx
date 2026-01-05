import { DocumentationLayout } from "./DocumentationLayout";

export function Visualization() {
  return (
    <DocumentationLayout>
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Visualization</h1>
        <p className="lead">
          Visualization features let you see and analyze your audio signals in real-time,
          both as waveforms and as artistic visual displays.
        </p>

        <h2>Oscilloscope</h2>
        <p>
          The Oscilloscope block displays the waveform of the incoming signal in real-time.
          It's essential for understanding what your signal looks like.
        </p>

        <h3>Configuration</h3>
        <ul>
          <li><strong>Time Window:</strong> How much time is displayed (seconds)</li>
          <li><strong>Refresh Rate:</strong> How often the display updates (Hz)</li>
        </ul>

        <h3>Reading the Display</h3>
        <ul>
          <li><strong>X-axis:</strong> Time (left to right)</li>
          <li><strong>Y-axis:</strong> Amplitude (center = 0)</li>
          <li><strong>Center line:</strong> Zero crossing point</li>
        </ul>

        <h2>Visualizer Mode</h2>
        <p>
          Switch to Visualizer mode using the mode toggle in the header to see an
          artistic 3D visualization of your audio. The visualizer responds to the
          audio frequency and amplitude in real-time.
        </p>

        <h3>Effects</h3>
        <p>
          The visualizer includes various post-processing effects that can be controlled
          via the toolbar:
        </p>
        <ul>
          <li><strong>Bloom:</strong> Glowing highlights around bright areas</li>
          <li><strong>Chromatic Aberration:</strong> Color fringing effect</li>
          <li><strong>Glitch:</strong> Digital distortion effects</li>
          <li><strong>Noise:</strong> Film grain/noise overlay</li>
          <li><strong>Vignette:</strong> Darkened corners</li>
          <li><strong>Scanlines:</strong> CRT monitor effect</li>
          <li><strong>Dot Screen:</strong> Halftone pattern</li>
          <li><strong>Pixelate:</strong> Reduced resolution effect</li>
          <li><strong>Color Shift:</strong> Hue rotation</li>
          <li><strong>Kaleidoscope:</strong> Symmetrical reflection</li>
          <li><strong>Film Grain:</strong> Analog film texture</li>
        </ul>

        <h3>External Control</h3>
        <p>
          Each effect can be controlled manually via sliders, or connected to an
          External Connection to be controlled by signal data from your audio flow.
          This allows for reactive, audio-driven visuals.
        </p>

        <h2>Audio Output</h2>
        <p>
          The Audio Output block plays your signal through the system speakers or
          headphones. Use the volume control and mute button to manage output levels.
        </p>
      </article>
    </DocumentationLayout>
  );
}
