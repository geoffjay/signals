import { DocumentationLayout } from "./DocumentationLayout";
import {
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyP,
  TypographyLead,
  TypographyList,
} from "@/components/ui/typography";

export function Blocks() {
  return (
    <DocumentationLayout>
      <article>
        <TypographyH1>Blocks</TypographyH1>
        <TypographyLead>
          Blocks are the building units of your signal flow. Each block type serves a
          specific purpose in signal generation, processing, or output.
        </TypographyLead>

        <TypographyH2>Generators</TypographyH2>
        <TypographyP>
          Generator blocks create audio signals from scratch. They produce continuous
          waveforms at specified frequencies.
        </TypographyP>
        <TypographyList>
          <li><span className="font-semibold">Sine Wave</span> — Smooth, pure tone waveform with no harmonics</li>
          <li><span className="font-semibold">Square Wave</span> — Alternating high/low signal, rich in odd harmonics</li>
          <li><span className="font-semibold">Triangle Wave</span> — Linear ramps up and down, softer than square</li>
          <li><span className="font-semibold">Sawtooth Wave</span> — Sharp rise, gradual fall, contains all harmonics</li>
          <li><span className="font-semibold">Noise</span> — Random signal (white noise) at all frequencies</li>
        </TypographyList>

        <TypographyH2>Inputs</TypographyH2>
        <TypographyP>
          Input blocks provide interactive controls for manual signal generation and modulation.
        </TypographyP>
        <TypographyList>
          <li><span className="font-semibold">Slider</span> — Continuous value control with configurable range</li>
          <li><span className="font-semibold">Multi-Slider</span> — Multiple independent sliders with separate outputs</li>
          <li><span className="font-semibold">Button</span> — Momentary switch that outputs a value while pressed</li>
          <li><span className="font-semibold">Toggle</span> — On/off switch that stays in its state</li>
          <li><span className="font-semibold">Pulse</span> — Generates a brief pulse when clicked</li>
          <li><span className="font-semibold">Keyboard</span> — Musical keyboard outputting frequency, gate, and velocity</li>
          <li><span className="font-semibold">Beat Pad</span> — Grid of pads for triggering with index and velocity outputs</li>
          <li><span className="font-semibold">Crossfader</span> — Blends between two input signals with curve options</li>
          <li><span className="font-semibold">Sequencer</span> — Step sequencer with configurable rows and steps</li>
        </TypographyList>

        <TypographyH2>Filters</TypographyH2>
        <TypographyP>
          Filters selectively remove or attenuate certain frequencies while allowing others to pass.
        </TypographyP>
        <TypographyList>
          <li><span className="font-semibold">Low-Pass Filter</span> — Removes frequencies above the cutoff</li>
          <li><span className="font-semibold">High-Pass Filter</span> — Removes frequencies below the cutoff</li>
          <li><span className="font-semibold">Band-Pass Filter</span> — Allows only frequencies around the cutoff</li>
          <li><span className="font-semibold">Notch Filter</span> — Removes a narrow band of frequencies</li>
          <li><span className="font-semibold">All-Pass Filter</span> — Shifts phase without changing amplitude</li>
          <li><span className="font-semibold">Peaking EQ</span> — Boosts or cuts frequencies at the center</li>
          <li><span className="font-semibold">Low-Shelf Filter</span> — Boosts or cuts all frequencies below the cutoff</li>
          <li><span className="font-semibold">High-Shelf Filter</span> — Boosts or cuts all frequencies above the cutoff</li>
        </TypographyList>

        <TypographyH2>Processors</TypographyH2>
        <TypographyP>
          Processor blocks modify signals in various ways, from simple gain to complex effects.
        </TypographyP>

        <TypographyH3>Basic</TypographyH3>
        <TypographyList>
          <li><span className="font-semibold">Gain</span> — Amplifies or attenuates the signal level</li>
        </TypographyList>

        <TypographyH3>Dynamics</TypographyH3>
        <TypographyList>
          <li><span className="font-semibold">Compressor</span> — Reduces dynamic range with threshold, ratio, attack, and release</li>
        </TypographyList>

        <TypographyH3>Distortion</TypographyH3>
        <TypographyList>
          <li><span className="font-semibold">Waveshaper</span> — Applies distortion curves (soft-clip, hard-clip, tanh, etc.)</li>
          <li><span className="font-semibold">Hard Clipper</span> — Clips signal at a threshold for harsh distortion</li>
          <li><span className="font-semibold">Soft Clipper</span> — Smooth saturation with configurable curve</li>
        </TypographyList>

        <TypographyH3>Time-Based Effects</TypographyH3>
        <TypographyList>
          <li><span className="font-semibold">Delay</span> — Echoes the signal with time, feedback, and mix controls</li>
          <li><span className="font-semibold">Tremolo</span> — Amplitude modulation at an LFO rate</li>
          <li><span className="font-semibold">Chorus</span> — Creates width through modulated delay voices</li>
          <li><span className="font-semibold">Flanger</span> — Short modulated delay with feedback for jet effect</li>
          <li><span className="font-semibold">Phaser</span> — All-pass filter stages creating sweeping notches</li>
          <li><span className="font-semibold">Vibrato</span> — Pitch modulation at an LFO rate</li>
          <li><span className="font-semibold">Reverb</span> — Simulates room acoustics with various presets</li>
        </TypographyList>

        <TypographyH3>Envelope</TypographyH3>
        <TypographyList>
          <li><span className="font-semibold">Envelope Follower</span> — Extracts amplitude envelope from audio</li>
          <li><span className="font-semibold">ADSR</span> — Attack-Decay-Sustain-Release envelope generator</li>
        </TypographyList>

        <TypographyH3>Lo-Fi</TypographyH3>
        <TypographyList>
          <li><span className="font-semibold">Bit Crusher</span> — Reduces bit depth for digital distortion</li>
          <li><span className="font-semibold">Sample Rate Reducer</span> — Reduces sample rate for aliasing effects</li>
        </TypographyList>

        <TypographyH3>Frequency</TypographyH3>
        <TypographyList>
          <li><span className="font-semibold">Ring Modulator</span> — Multiplies carrier and modulator for metallic tones</li>
        </TypographyList>

        <TypographyH2>Math</TypographyH2>
        <TypographyP>
          Math blocks perform mathematical operations on signals for precise control voltage manipulation.
        </TypographyP>

        <TypographyH3>Arithmetic</TypographyH3>
        <TypographyList>
          <li><span className="font-semibold">Add</span> — Adds two signals together (A + B)</li>
          <li><span className="font-semibold">Subtract</span> — Subtracts signal B from A (A - B)</li>
          <li><span className="font-semibold">Multiply</span> — Multiplies two signals (A × B)</li>
          <li><span className="font-semibold">Divide</span> — Divides signal A by B (A ÷ B)</li>
          <li><span className="font-semibold">Modulo</span> — Remainder of A divided by B (A mod B)</li>
          <li><span className="font-semibold">Power</span> — Raises base to exponent (A ^ B)</li>
        </TypographyList>

        <TypographyH3>Unary Operations</TypographyH3>
        <TypographyList>
          <li><span className="font-semibold">Abs</span> — Absolute value (removes sign)</li>
          <li><span className="font-semibold">Negate</span> — Inverts sign (× -1)</li>
          <li><span className="font-semibold">Sign</span> — Returns -1, 0, or 1 based on input sign</li>
          <li><span className="font-semibold">Sqrt</span> — Square root</li>
        </TypographyList>

        <TypographyH3>Rounding</TypographyH3>
        <TypographyList>
          <li><span className="font-semibold">Ceil</span> — Rounds up to nearest integer</li>
          <li><span className="font-semibold">Floor</span> — Rounds down to nearest integer</li>
          <li><span className="font-semibold">Round</span> — Rounds to nearest integer</li>
        </TypographyList>

        <TypographyH3>Trigonometry</TypographyH3>
        <TypographyList>
          <li><span className="font-semibold">Sin</span> — Sine function</li>
          <li><span className="font-semibold">Cos</span> — Cosine function</li>
        </TypographyList>

        <TypographyH3>Range</TypographyH3>
        <TypographyList>
          <li><span className="font-semibold">Min</span> — Returns the smaller of two inputs</li>
          <li><span className="font-semibold">Max</span> — Returns the larger of two inputs</li>
          <li><span className="font-semibold">Clamp</span> — Constrains value between min and max</li>
        </TypographyList>

        <TypographyH2>Routing</TypographyH2>
        <TypographyP>
          Routing blocks manage signal flow, combining, splitting, and switching between paths.
        </TypographyP>

        <TypographyH3>Signal Distribution</TypographyH3>
        <TypographyList>
          <li><span className="font-semibold">Splitter</span> — Duplicates one input to multiple outputs</li>
          <li><span className="font-semibold">Mixer</span> — Combines multiple inputs with individual gain controls</li>
          <li><span className="font-semibold">Merge</span> — Sums multiple inputs into one output</li>
          <li><span className="font-semibold">Matrix Router</span> — Configurable input-to-output routing matrix</li>
        </TypographyList>

        <TypographyH3>Switching</TypographyH3>
        <TypographyList>
          <li><span className="font-semibold">Multiplexer</span> — Selects between inputs based on selector value</li>
          <li><span className="font-semibold">Switch/Gate</span> — Passes or blocks signal based on control input</li>
          <li><span className="font-semibold">A/B Switch</span> — Selects between two inputs based on control</li>
        </TypographyList>

        <TypographyH3>Sample & Hold</TypographyH3>
        <TypographyList>
          <li><span className="font-semibold">Sample & Hold</span> — Captures input value on trigger and holds it</li>
          <li><span className="font-semibold">Comparator</span> — Outputs high/low based on comparing two signals</li>
        </TypographyList>

        <TypographyH3>Stereo</TypographyH3>
        <TypographyList>
          <li><span className="font-semibold">Panner</span> — Distributes mono signal across stereo field</li>
          <li><span className="font-semibold">Stereo Splitter</span> — Splits stereo signal into left and right</li>
          <li><span className="font-semibold">Stereo Merger</span> — Combines left and right into stereo signal</li>
        </TypographyList>

        <TypographyH3>Logic Gates</TypographyH3>
        <TypographyList>
          <li><span className="font-semibold">AND Gate</span> — Output high only when both inputs are high</li>
          <li><span className="font-semibold">OR Gate</span> — Output high when either input is high</li>
          <li><span className="font-semibold">XOR Gate</span> — Output high when inputs differ</li>
          <li><span className="font-semibold">NOT Gate</span> — Inverts the input signal</li>
        </TypographyList>

        <TypographyH2>Utility</TypographyH2>
        <TypographyP>
          Utility blocks provide helper functions for signal conversion and manipulation.
        </TypographyP>
        <TypographyList>
          <li><span className="font-semibold">Note to Freq</span> — Converts note triggers to frequency (monophonic)</li>
          <li><span className="font-semibold">Note to Freq (Poly)</span> — Converts note triggers to frequency per-note (polyphonic)</li>
        </TypographyList>

        <TypographyH2>Analysis</TypographyH2>
        <TypographyP>
          Analysis blocks provide frequency and spectrum visualization.
        </TypographyP>
        <TypographyList>
          <li><span className="font-semibold">FFT Analyzer</span> — Displays frequency spectrum, detects peaks, outputs frequency bands</li>
        </TypographyList>

        <TypographyH2>Outputs</TypographyH2>
        <TypographyP>
          Output blocks display, monitor, or play the final signal.
        </TypographyP>
        <TypographyList>
          <li><span className="font-semibold">Oscilloscope</span> — Visual waveform display in real-time</li>
          <li><span className="font-semibold">Numeric Meter</span> — Displays current signal value as a number</li>
          <li><span className="font-semibold">Audio Output</span> — Plays the signal through speakers (mono or stereo)</li>
          <li><span className="font-semibold">External Connections</span> — Routes signals to control visualizer effects</li>
        </TypographyList>

        <TypographyH2>Connection Rules</TypographyH2>
        <TypographyList>
          <li>Input ports accept only one incoming connection</li>
          <li>Output ports can connect to multiple inputs (up to 8)</li>
          <li>Connections animate when playback is active</li>
        </TypographyList>

        <TypographyH2>Block Configuration</TypographyH2>
        <TypographyP>
          Each block has configurable parameters accessible via the config drawer.
          Click on any block to select it and view its settings. All blocks support
          custom labels and background colors for visual organization.
        </TypographyP>
      </article>
    </DocumentationLayout>
  );
}
