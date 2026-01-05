import { DocumentationLayout } from "./DocumentationLayout";
import {
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyP,
  TypographyLead,
  TypographyList,
} from "@/components/ui/typography";

export function Visualization() {
  return (
    <DocumentationLayout>
      <article>
        <TypographyH1>Visualization</TypographyH1>
        <TypographyLead>
          Visualization features let you see and analyze your audio signals in real-time,
          both as waveforms and as artistic visual displays.
        </TypographyLead>

        <TypographyH2>Oscilloscope</TypographyH2>
        <TypographyP>
          The Oscilloscope block displays the waveform of the incoming signal in real-time.
          It's essential for understanding what your signal looks like.
        </TypographyP>

        <TypographyH3>Configuration</TypographyH3>
        <TypographyList>
          <li><span className="font-semibold">Time Window:</span> How much time is displayed (seconds)</li>
          <li><span className="font-semibold">Refresh Rate:</span> How often the display updates (Hz)</li>
        </TypographyList>

        <TypographyH3>Reading the Display</TypographyH3>
        <TypographyList>
          <li><span className="font-semibold">X-axis:</span> Time (left to right)</li>
          <li><span className="font-semibold">Y-axis:</span> Amplitude (center = 0)</li>
          <li><span className="font-semibold">Center line:</span> Zero crossing point</li>
        </TypographyList>

        <TypographyH2>Visualizer Mode</TypographyH2>
        <TypographyP>
          Switch to Visualizer mode using the mode toggle in the header to see an
          artistic 3D visualization of your audio. The visualizer responds to the
          audio frequency and amplitude in real-time.
        </TypographyP>

        <TypographyH3>Effects</TypographyH3>
        <TypographyP>
          The visualizer includes various post-processing effects that can be controlled
          via the toolbar:
        </TypographyP>
        <TypographyList>
          <li><span className="font-semibold">Bloom:</span> Glowing highlights around bright areas</li>
          <li><span className="font-semibold">Chromatic Aberration:</span> Color fringing effect</li>
          <li><span className="font-semibold">Glitch:</span> Digital distortion effects</li>
          <li><span className="font-semibold">Noise:</span> Film grain/noise overlay</li>
          <li><span className="font-semibold">Vignette:</span> Darkened corners</li>
          <li><span className="font-semibold">Scanlines:</span> CRT monitor effect</li>
          <li><span className="font-semibold">Dot Screen:</span> Halftone pattern</li>
          <li><span className="font-semibold">Pixelate:</span> Reduced resolution effect</li>
          <li><span className="font-semibold">Color Shift:</span> Hue rotation</li>
          <li><span className="font-semibold">Kaleidoscope:</span> Symmetrical reflection</li>
          <li><span className="font-semibold">Film Grain:</span> Analog film texture</li>
        </TypographyList>

        <TypographyH3>External Control</TypographyH3>
        <TypographyP>
          Each effect can be controlled manually via sliders, or connected to an
          External Connection to be controlled by signal data from your audio flow.
          This allows for reactive, audio-driven visuals.
        </TypographyP>

        <TypographyH2>Audio Output</TypographyH2>
        <TypographyP>
          The Audio Output block plays your signal through the system speakers or
          headphones. Use the volume control and mute button to manage output levels.
        </TypographyP>
      </article>
    </DocumentationLayout>
  );
}
