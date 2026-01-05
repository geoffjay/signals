import { DocumentationLayout } from "./DocumentationLayout";

export function SignalProcessing() {
  return (
    <DocumentationLayout>
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Signal Processing</h1>
        <p className="lead">
          Processor blocks modify audio signals as they pass through. Use them to shape
          the frequency content, amplitude, and character of your sounds.
        </p>

        <h2>Gain</h2>
        <p>
          The Gain block amplifies or attenuates the signal by a specified factor.
        </p>
        <ul>
          <li><strong>Gain Value:</strong> Multiplication factor for the signal</li>
          <li><strong>Range:</strong> 0 (silence) to 2+ (amplification)</li>
          <li><strong>1.0:</strong> Unity gain (no change)</li>
        </ul>

        <h2>Filters</h2>
        <p>
          Filters selectively remove or attenuate certain frequencies while allowing
          others to pass through.
        </p>

        <h3>Low-Pass Filter</h3>
        <p>
          Allows frequencies below the cutoff to pass while attenuating higher frequencies.
          Useful for removing harshness or creating "muffled" sounds.
        </p>

        <h3>High-Pass Filter</h3>
        <p>
          Allows frequencies above the cutoff to pass while attenuating lower frequencies.
          Useful for removing rumble or mud from a signal.
        </p>

        <h3>Band-Pass Filter</h3>
        <p>
          Allows a range of frequencies around the cutoff to pass while attenuating both
          higher and lower frequencies. Creates a focused, resonant sound.
        </p>

        <h2>Filter Parameters</h2>

        <h3>Cutoff Frequency</h3>
        <p>
          The frequency at which the filter begins to attenuate. For band-pass filters,
          this is the center frequency of the pass band.
        </p>

        <h3>Q Factor (Resonance)</h3>
        <p>
          Controls the sharpness or "resonance" of the filter. Higher Q values create
          a sharper cutoff with a peak at the cutoff frequency.
        </p>
        <ul>
          <li><strong>Low Q (0.5-1):</strong> Gentle, gradual rolloff</li>
          <li><strong>Medium Q (1-5):</strong> Moderate resonance</li>
          <li><strong>High Q (5+):</strong> Sharp cutoff, strong resonance</li>
        </ul>

        <h2>Processing Chains</h2>
        <p>
          Multiple processors can be chained together for complex sound shaping.
          The order matters - a gain before a filter will affect the filter's response
          differently than a gain after the filter.
        </p>
      </article>
    </DocumentationLayout>
  );
}
