import { DocumentationLayout } from "./DocumentationLayout";
import {
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyP,
  TypographyLead,
  TypographyList,
} from "@/components/ui/typography";

export function ExternalConnections() {
  return (
    <DocumentationLayout>
      <article>
        <TypographyH1>External Connections</TypographyH1>
        <TypographyLead>
          External Connections allow you to route audio signals from your signal flow
          to control visualizer effects, creating audio-reactive visual experiences.
        </TypographyLead>

        <TypographyH2>Overview</TypographyH2>
        <TypographyP>
          The External Connections block acts as a bridge between your signal processing
          canvas and the visualizer. It captures audio data and makes it available as
          control signals for visualizer effects.
        </TypographyP>

        <TypographyH2>Setting Up External Connections</TypographyH2>

        <TypographyH3>Step 1: Add the Block</TypographyH3>
        <TypographyP>
          Drag an External Connections block from the Outputs section of the toolbar
          onto your canvas.
        </TypographyP>

        <TypographyH3>Step 2: Configure Inputs</TypographyH3>
        <TypographyP>
          In the config drawer, set the number of connections (1-8) and give each
          connection a descriptive name.
        </TypographyP>

        <TypographyH3>Step 3: Connect Signals</TypographyH3>
        <TypographyP>
          Connect audio signals to each input. These signals will be analyzed and
          their RMS (root mean square) values will be extracted.
        </TypographyP>

        <TypographyH3>Step 4: Use in Visualizer</TypographyH3>
        <TypographyP>
          Switch to Visualizer mode and use the link button next to any effect slider
          to connect it to an external source.
        </TypographyP>

        <TypographyH2>Signal Processing</TypographyH2>
        <TypographyP>
          External connections analyze the incoming audio and extract useful data:
        </TypographyP>
        <TypographyList>
          <li><span className="font-semibold">RMS Level:</span> The average signal level (0-1 range)</li>
          <li><span className="font-semibold">Smoothing:</span> Values are smoothed to prevent jittery visuals</li>
        </TypographyList>

        <TypographyH2>Use Cases</TypographyH2>

        <TypographyH3>Audio-Reactive Bloom</TypographyH3>
        <TypographyP>
          Connect a bass-heavy signal to the bloom effect to make highlights pulse
          with the beat.
        </TypographyP>

        <TypographyH3>Frequency-Based Effects</TypographyH3>
        <TypographyP>
          Use multiple connections with different frequency bands (via filters) to
          drive different effects. For example, bass to bloom, mids to chromatic
          aberration, highs to glitch.
        </TypographyP>

        <TypographyH3>Dynamic Visuals</TypographyH3>
        <TypographyP>
          Create complex, responsive visuals by connecting different parts of your
          audio to different visual effects.
        </TypographyP>

        <TypographyH2>Tips</TypographyH2>
        <TypographyList>
          <li>
            <span className="font-semibold">Playback Required:</span> External connections only work during
            playback. Start playback to see real-time values.
          </li>
          <li>
            <span className="font-semibold">Named Connections:</span> Give your connections descriptive names
            like "Bass" or "Lead" to easily identify them in the visualizer.
          </li>
          <li>
            <span className="font-semibold">Signal Conditioning:</span> Use gain blocks to adjust signal
            levels for optimal visual response.
          </li>
        </TypographyList>
      </article>
    </DocumentationLayout>
  );
}
