import { DocumentationLayout } from "./DocumentationLayout";

export function SignalGeneration() {
  return (
    <DocumentationLayout>
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Signal Generation</h1>
        <p className="lead">
          Generator blocks create audio waveforms using the Web Audio API oscillator nodes.
          Each waveform type has unique characteristics useful for different purposes.
        </p>

        <h2>Waveform Types</h2>

        <h3>Sine Wave</h3>
        <p>
          The purest waveform containing only the fundamental frequency with no harmonics.
          Produces a smooth, mellow tone often described as "pure" or "clean."
        </p>
        <ul>
          <li><strong>Use cases:</strong> Testing, sub-bass, smooth pads</li>
          <li><strong>Harmonics:</strong> None (fundamental only)</li>
        </ul>

        <h3>Square Wave</h3>
        <p>
          Alternates between high and low values with instant transitions. Creates a
          harsh, buzzy tone rich in odd harmonics.
        </p>
        <ul>
          <li><strong>Use cases:</strong> Chiptune sounds, harsh leads, clock signals</li>
          <li><strong>Harmonics:</strong> Odd harmonics (1, 3, 5, 7...)</li>
        </ul>

        <h3>Triangle Wave</h3>
        <p>
          Ramps linearly up and down, creating a softer sound than square waves but
          brighter than sine waves.
        </p>
        <ul>
          <li><strong>Use cases:</strong> Soft leads, woodwind-like tones</li>
          <li><strong>Harmonics:</strong> Odd harmonics at lower amplitudes</li>
        </ul>

        <h3>Sawtooth Wave</h3>
        <p>
          Rises linearly then drops instantly, containing both odd and even harmonics.
          Produces a bright, rich, buzzy sound.
        </p>
        <ul>
          <li><strong>Use cases:</strong> Brass sounds, strings, leads, basses</li>
          <li><strong>Harmonics:</strong> All harmonics (odd and even)</li>
        </ul>

        <h3>Noise</h3>
        <p>
          Random signal containing all frequencies at equal amplitude (white noise).
          Useful for percussion and special effects.
        </p>
        <ul>
          <li><strong>Use cases:</strong> Hi-hats, snares, wind effects, transitions</li>
          <li><strong>Harmonics:</strong> All frequencies (random)</li>
        </ul>

        <h2>Generator Parameters</h2>

        <h3>Frequency</h3>
        <p>
          The fundamental frequency in Hertz (Hz). Determines the pitch of the sound.
          Human hearing ranges from approximately 20 Hz to 20,000 Hz.
        </p>

        <h3>Amplitude</h3>
        <p>
          The volume or loudness of the signal, ranging from 0 (silent) to 1 (full volume).
        </p>

        <h3>Phase</h3>
        <p>
          The starting point of the waveform cycle, from 0 to 360 degrees. Useful when
          combining multiple oscillators to control phase relationships.
        </p>
      </article>
    </DocumentationLayout>
  );
}
