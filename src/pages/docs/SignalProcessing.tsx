import { DocumentationLayout } from "./DocumentationLayout";
import {
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyP,
  TypographyLead,
  TypographyList,
} from "@/components/ui/typography";

export function SignalProcessing() {
  return (
    <DocumentationLayout>
      <article>
        <TypographyH1>Signal Processing</TypographyH1>
        <TypographyLead>
          Processor blocks modify audio signals as they pass through. Use them to shape
          the frequency content, amplitude, and character of your sounds.
        </TypographyLead>

        <TypographyH2>Gain</TypographyH2>
        <TypographyP>
          The Gain block amplifies or attenuates the signal by a specified factor.
        </TypographyP>
        <TypographyList>
          <li><span className="font-semibold">Gain Value:</span> Multiplication factor for the signal</li>
          <li><span className="font-semibold">Range:</span> 0 (silence) to 2+ (amplification)</li>
          <li><span className="font-semibold">1.0:</span> Unity gain (no change)</li>
        </TypographyList>

        <TypographyH2>Filters</TypographyH2>
        <TypographyP>
          Filters selectively remove or attenuate certain frequencies while allowing
          others to pass through.
        </TypographyP>

        <TypographyH3>Low-Pass Filter</TypographyH3>
        <TypographyP>
          Allows frequencies below the cutoff to pass while attenuating higher frequencies.
          Useful for removing harshness or creating "muffled" sounds.
        </TypographyP>

        <TypographyH3>High-Pass Filter</TypographyH3>
        <TypographyP>
          Allows frequencies above the cutoff to pass while attenuating lower frequencies.
          Useful for removing rumble or mud from a signal.
        </TypographyP>

        <TypographyH3>Band-Pass Filter</TypographyH3>
        <TypographyP>
          Allows a range of frequencies around the cutoff to pass while attenuating both
          higher and lower frequencies. Creates a focused, resonant sound.
        </TypographyP>

        <TypographyH2>Filter Parameters</TypographyH2>

        <TypographyH3>Cutoff Frequency</TypographyH3>
        <TypographyP>
          The frequency at which the filter begins to attenuate. For band-pass filters,
          this is the center frequency of the pass band.
        </TypographyP>

        <TypographyH3>Q Factor (Resonance)</TypographyH3>
        <TypographyP>
          Controls the sharpness or "resonance" of the filter. Higher Q values create
          a sharper cutoff with a peak at the cutoff frequency.
        </TypographyP>
        <TypographyList>
          <li><span className="font-semibold">Low Q (0.5-1):</span> Gentle, gradual rolloff</li>
          <li><span className="font-semibold">Medium Q (1-5):</span> Moderate resonance</li>
          <li><span className="font-semibold">High Q (5+):</span> Sharp cutoff, strong resonance</li>
        </TypographyList>

        <TypographyH2>Processing Chains</TypographyH2>
        <TypographyP>
          Multiple processors can be chained together for complex sound shaping.
          The order matters - a gain before a filter will affect the filter's response
          differently than a gain after the filter.
        </TypographyP>
      </article>
    </DocumentationLayout>
  );
}
