import { DocumentationLayout } from "./DocumentationLayout";

export function Routing() {
  return (
    <DocumentationLayout>
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>Routing</h1>
        <p className="lead">
          Routing blocks help manage complex signal flows by combining or splitting
          signal paths.
        </p>

        <h2>Multiplexer</h2>
        <p>
          The Multiplexer combines multiple input signals into a single output. This is
          useful for mixing signals together or selecting between different sources.
        </p>

        <h3>Configuration</h3>
        <ul>
          <li><strong>Number of Inputs:</strong> 2, 4, or 8 input channels</li>
          <li><strong>Selector Value:</strong> Determines input weighting or selection</li>
        </ul>

        <h3>Use Cases</h3>
        <ul>
          <li>Mixing multiple oscillators into one signal</li>
          <li>Creating layered sounds</li>
          <li>Combining processed and dry signals</li>
        </ul>

        <h2>Splitter</h2>
        <p>
          The Splitter takes a single input and routes it to multiple outputs. All
          outputs receive the same signal.
        </p>

        <h3>Configuration</h3>
        <ul>
          <li><strong>Number of Outputs:</strong> 2, 4, or 8 output channels</li>
        </ul>

        <h3>Use Cases</h3>
        <ul>
          <li>Sending one signal to multiple processors</li>
          <li>Parallel processing chains</li>
          <li>Monitoring a signal at multiple points</li>
        </ul>

        <h2>Routing Patterns</h2>

        <h3>Serial Processing</h3>
        <p>
          Connect blocks in a chain: Generator → Processor 1 → Processor 2 → Output.
          Each processor modifies the signal before passing it to the next.
        </p>

        <h3>Parallel Processing</h3>
        <p>
          Use a Splitter to send one signal to multiple processors, then use a
          Multiplexer to combine the results. This allows for complex sound design.
        </p>

        <h3>Monitoring</h3>
        <p>
          Use a Splitter to tap into a signal for monitoring while it continues to
          the main output path.
        </p>
      </article>
    </DocumentationLayout>
  );
}
