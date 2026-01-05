import { DocumentationLayout } from "./DocumentationLayout";
import {
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyP,
  TypographyLead,
  TypographyList,
} from "@/components/ui/typography";

export function Routing() {
  return (
    <DocumentationLayout>
      <article>
        <TypographyH1>Routing</TypographyH1>
        <TypographyLead>
          Routing blocks help manage complex signal flows by combining or splitting
          signal paths.
        </TypographyLead>

        <TypographyH2>Multiplexer</TypographyH2>
        <TypographyP>
          The Multiplexer combines multiple input signals into a single output. This is
          useful for mixing signals together or selecting between different sources.
        </TypographyP>

        <TypographyH3>Configuration</TypographyH3>
        <TypographyList>
          <li><span className="font-semibold">Number of Inputs:</span> 2, 4, or 8 input channels</li>
          <li><span className="font-semibold">Selector Value:</span> Determines input weighting or selection</li>
        </TypographyList>

        <TypographyH3>Use Cases</TypographyH3>
        <TypographyList>
          <li>Mixing multiple oscillators into one signal</li>
          <li>Creating layered sounds</li>
          <li>Combining processed and dry signals</li>
        </TypographyList>

        <TypographyH2>Splitter</TypographyH2>
        <TypographyP>
          The Splitter takes a single input and routes it to multiple outputs. All
          outputs receive the same signal.
        </TypographyP>

        <TypographyH3>Configuration</TypographyH3>
        <TypographyList>
          <li><span className="font-semibold">Number of Outputs:</span> 2, 4, or 8 output channels</li>
        </TypographyList>

        <TypographyH3>Use Cases</TypographyH3>
        <TypographyList>
          <li>Sending one signal to multiple processors</li>
          <li>Parallel processing chains</li>
          <li>Monitoring a signal at multiple points</li>
        </TypographyList>

        <TypographyH2>Routing Patterns</TypographyH2>

        <TypographyH3>Serial Processing</TypographyH3>
        <TypographyP>
          Connect blocks in a chain: Generator → Processor 1 → Processor 2 → Output.
          Each processor modifies the signal before passing it to the next.
        </TypographyP>

        <TypographyH3>Parallel Processing</TypographyH3>
        <TypographyP>
          Use a Splitter to send one signal to multiple processors, then use a
          Multiplexer to combine the results. This allows for complex sound design.
        </TypographyP>

        <TypographyH3>Monitoring</TypographyH3>
        <TypographyP>
          Use a Splitter to tap into a signal for monitoring while it continues to
          the main output path.
        </TypographyP>
      </article>
    </DocumentationLayout>
  );
}
