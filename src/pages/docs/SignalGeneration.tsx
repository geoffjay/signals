import { DocumentationLayout } from "./DocumentationLayout";
import {
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyP,
  TypographyLead,
  TypographyList,
} from "@/components/ui/typography";

export function SignalGeneration() {
  return (
    <DocumentationLayout>
      <article>
        <TypographyH1>Signal Generation</TypographyH1>
        <TypographyLead>
          Generator blocks create audio waveforms using the Web Audio API oscillator nodes.
          Each waveform type has unique characteristics useful for different purposes.
        </TypographyLead>

        <TypographyH2>Waveform Types</TypographyH2>

        <TypographyH3>Sine Wave</TypographyH3>
        <TypographyP>
          The purest waveform containing only the fundamental frequency with no harmonics.
          Produces a smooth, mellow tone often described as "pure" or "clean."
        </TypographyP>
        <TypographyList>
          <li><span className="font-semibold">Use cases:</span> Testing, sub-bass, smooth pads</li>
          <li><span className="font-semibold">Harmonics:</span> None (fundamental only)</li>
        </TypographyList>

        <TypographyH3>Square Wave</TypographyH3>
        <TypographyP>
          Alternates between high and low values with instant transitions. Creates a
          harsh, buzzy tone rich in odd harmonics.
        </TypographyP>
        <TypographyList>
          <li><span className="font-semibold">Use cases:</span> Chiptune sounds, harsh leads, clock signals</li>
          <li><span className="font-semibold">Harmonics:</span> Odd harmonics (1, 3, 5, 7...)</li>
        </TypographyList>

        <TypographyH3>Triangle Wave</TypographyH3>
        <TypographyP>
          Ramps linearly up and down, creating a softer sound than square waves but
          brighter than sine waves.
        </TypographyP>
        <TypographyList>
          <li><span className="font-semibold">Use cases:</span> Soft leads, woodwind-like tones</li>
          <li><span className="font-semibold">Harmonics:</span> Odd harmonics at lower amplitudes</li>
        </TypographyList>

        <TypographyH3>Sawtooth Wave</TypographyH3>
        <TypographyP>
          Rises linearly then drops instantly, containing both odd and even harmonics.
          Produces a bright, rich, buzzy sound.
        </TypographyP>
        <TypographyList>
          <li><span className="font-semibold">Use cases:</span> Brass sounds, strings, leads, basses</li>
          <li><span className="font-semibold">Harmonics:</span> All harmonics (odd and even)</li>
        </TypographyList>

        <TypographyH3>Noise</TypographyH3>
        <TypographyP>
          Random signal containing all frequencies at equal amplitude (white noise).
          Useful for percussion and special effects.
        </TypographyP>
        <TypographyList>
          <li><span className="font-semibold">Use cases:</span> Hi-hats, snares, wind effects, transitions</li>
          <li><span className="font-semibold">Harmonics:</span> All frequencies (random)</li>
        </TypographyList>

        <TypographyH2>Generator Parameters</TypographyH2>

        <TypographyH3>Frequency</TypographyH3>
        <TypographyP>
          The fundamental frequency in Hertz (Hz). Determines the pitch of the sound.
          Human hearing ranges from approximately 20 Hz to 20,000 Hz.
        </TypographyP>

        <TypographyH3>Amplitude</TypographyH3>
        <TypographyP>
          The volume or loudness of the signal, ranging from 0 (silent) to 1 (full volume).
        </TypographyP>

        <TypographyH3>Phase</TypographyH3>
        <TypographyP>
          The starting point of the waveform cycle, from 0 to 360 degrees. Useful when
          combining multiple oscillators to control phase relationships.
        </TypographyP>
      </article>
    </DocumentationLayout>
  );
}
