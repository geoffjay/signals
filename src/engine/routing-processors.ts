// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./audioworklet.d.ts" />

// AudioWorklet processors for routing operations
// - SwitchProcessor: Pass/block signal based on control input
// - ABSwitchProcessor: Switch between two inputs based on control
// - SampleHoldProcessor: Sample and hold signal on trigger
// - ComparatorProcessor: Compare signals and output high/low
// - PannerProcessor: Mono to stereo panning
// - Logic gates: AND, OR, XOR, NOT

/**
 * Switch/Gate - Pass or block signal based on control input
 * When control > threshold, signal passes through; otherwise output is 0
 */
class SwitchProcessor extends AudioWorkletProcessor {
  private threshold: number;
  private invert: boolean;

  constructor(options?: AudioWorkletNodeOptions) {
    super();
    const procOpts = options?.processorOptions;
    this.threshold = procOpts?.threshold ?? 0.5;
    this.invert = procOpts?.invert ?? false;

    this.port.onmessage = (event) => {
      if (event.data.type === "setThreshold") {
        this.threshold = event.data.value;
      } else if (event.data.type === "setInvert") {
        this.invert = event.data.value;
      }
    };
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const signalInput = inputs[0]?.[0];
    const controlInput = inputs[1]?.[0];
    const output = outputs[0]?.[0];

    if (!output) return true;

    for (let i = 0; i < output.length; i++) {
      const signal = signalInput?.[i] ?? 0;
      const control = controlInput?.[i] ?? 0;

      let isOpen = control >= this.threshold;
      if (this.invert) isOpen = !isOpen;

      output[i] = isOpen ? signal : 0;
    }

    return true;
  }
}

/**
 * A/B Switch - Switch between two inputs based on control
 * When control < threshold, output is A; otherwise output is B
 */
class ABSwitchProcessor extends AudioWorkletProcessor {
  private threshold: number;

  constructor(options?: AudioWorkletNodeOptions) {
    super();
    const procOpts = options?.processorOptions;
    this.threshold = procOpts?.threshold ?? 0.5;

    this.port.onmessage = (event) => {
      if (event.data.type === "setThreshold") {
        this.threshold = event.data.value;
      }
    };
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const inputA = inputs[0]?.[0];
    const inputB = inputs[1]?.[0];
    const controlInput = inputs[2]?.[0];
    const output = outputs[0]?.[0];

    if (!output) return true;

    for (let i = 0; i < output.length; i++) {
      const a = inputA?.[i] ?? 0;
      const b = inputB?.[i] ?? 0;
      const control = controlInput?.[i] ?? 0;

      output[i] = control < this.threshold ? a : b;
    }

    return true;
  }
}

/**
 * Sample & Hold - Capture and hold input value when triggered
 */
class SampleHoldProcessor extends AudioWorkletProcessor {
  private heldValue: number = 0;
  private prevTrigger: number = 0;
  private threshold: number;

  constructor(options?: AudioWorkletNodeOptions) {
    super();
    const procOpts = options?.processorOptions;
    this.threshold = procOpts?.threshold ?? 0.5;

    this.port.onmessage = (event) => {
      if (event.data.type === "setThreshold") {
        this.threshold = event.data.value;
      }
    };
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const signalInput = inputs[0]?.[0];
    const triggerInput = inputs[1]?.[0];
    const output = outputs[0]?.[0];

    if (!output) return true;

    for (let i = 0; i < output.length; i++) {
      const signal = signalInput?.[i] ?? 0;
      const trigger = triggerInput?.[i] ?? 0;

      // Detect rising edge of trigger
      const triggerHigh = trigger >= this.threshold;
      const prevTriggerHigh = this.prevTrigger >= this.threshold;

      if (triggerHigh && !prevTriggerHigh) {
        // Rising edge - sample the input
        this.heldValue = signal;
      }

      this.prevTrigger = trigger;
      output[i] = this.heldValue;
    }

    return true;
  }
}

/**
 * Comparator - Compare two signals and output high/low
 */
class ComparatorProcessor extends AudioWorkletProcessor {
  private mode: string;
  private threshold: number;
  private useThreshold: boolean;
  private outputHigh: number;
  private outputLow: number;

  constructor(options?: AudioWorkletNodeOptions) {
    super();
    const procOpts = options?.processorOptions;
    this.mode = procOpts?.mode ?? "greater";
    this.threshold = procOpts?.threshold ?? 0;
    this.useThreshold = procOpts?.useThreshold ?? false;
    this.outputHigh = procOpts?.outputHigh ?? 1.0;
    this.outputLow = procOpts?.outputLow ?? 0.0;

    this.port.onmessage = (event) => {
      switch (event.data.type) {
        case "setMode":
          this.mode = event.data.value;
          break;
        case "setThreshold":
          this.threshold = event.data.value;
          break;
        case "setUseThreshold":
          this.useThreshold = event.data.value;
          break;
        case "setOutputHigh":
          this.outputHigh = event.data.value;
          break;
        case "setOutputLow":
          this.outputLow = event.data.value;
          break;
      }
    };
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const inputA = inputs[0]?.[0];
    const inputB = inputs[1]?.[0];
    const output = outputs[0]?.[0];

    if (!output) return true;

    for (let i = 0; i < output.length; i++) {
      const a = inputA?.[i] ?? 0;
      const b = this.useThreshold ? this.threshold : (inputB?.[i] ?? 0);

      let result = false;
      switch (this.mode) {
        case "greater":
          result = a > b;
          break;
        case "less":
          result = a < b;
          break;
        case "equal":
          result = Math.abs(a - b) < 0.0001;
          break;
        case "notEqual":
          result = Math.abs(a - b) >= 0.0001;
          break;
      }

      output[i] = result ? this.outputHigh : this.outputLow;
    }

    return true;
  }
}

/**
 * Panner - Mono to stereo panning with pan law
 */
class PannerProcessor extends AudioWorkletProcessor {
  private position: number;
  private law: string;

  constructor(options?: AudioWorkletNodeOptions) {
    super();
    const procOpts = options?.processorOptions;
    this.position = procOpts?.position ?? 0;
    this.law = procOpts?.law ?? "equal-power";

    this.port.onmessage = (event) => {
      if (event.data.type === "setPosition") {
        this.position = event.data.value;
      } else if (event.data.type === "setLaw") {
        this.law = event.data.value;
      }
    };
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const signalInput = inputs[0]?.[0];
    const panInput = inputs[1]?.[0]; // Optional pan CV input
    const leftOutput = outputs[0]?.[0];
    const rightOutput = outputs[1]?.[0];

    if (!leftOutput || !rightOutput) return true;

    for (let i = 0; i < leftOutput.length; i++) {
      const signal = signalInput?.[i] ?? 0;
      // Use pan CV if connected, otherwise use static position
      const pan = panInput?.[i] !== undefined ? panInput[i] : this.position;

      // Clamp pan to -1 to 1 range
      const clampedPan = Math.max(-1, Math.min(1, pan));

      let leftGain: number;
      let rightGain: number;

      if (this.law === "linear") {
        // Linear panning
        leftGain = (1 - clampedPan) / 2;
        rightGain = (1 + clampedPan) / 2;
      } else {
        // Equal-power panning (constant power)
        const angle = (clampedPan + 1) * Math.PI / 4; // 0 to PI/2
        leftGain = Math.cos(angle);
        rightGain = Math.sin(angle);
      }

      leftOutput[i] = signal * leftGain;
      rightOutput[i] = signal * rightGain;
    }

    return true;
  }
}

/**
 * AND Gate - Output high when both inputs are above threshold
 */
class AndGateProcessor extends AudioWorkletProcessor {
  private threshold: number;
  private outputHigh: number;
  private outputLow: number;

  constructor(options?: AudioWorkletNodeOptions) {
    super();
    const procOpts = options?.processorOptions;
    this.threshold = procOpts?.threshold ?? 0.5;
    this.outputHigh = procOpts?.outputHigh ?? 1.0;
    this.outputLow = procOpts?.outputLow ?? 0.0;

    this.port.onmessage = (event) => {
      switch (event.data.type) {
        case "setThreshold":
          this.threshold = event.data.value;
          break;
        case "setOutputHigh":
          this.outputHigh = event.data.value;
          break;
        case "setOutputLow":
          this.outputLow = event.data.value;
          break;
      }
    };
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const inputA = inputs[0]?.[0];
    const inputB = inputs[1]?.[0];
    const output = outputs[0]?.[0];

    if (!output) return true;

    for (let i = 0; i < output.length; i++) {
      const a = (inputA?.[i] ?? 0) >= this.threshold;
      const b = (inputB?.[i] ?? 0) >= this.threshold;
      output[i] = (a && b) ? this.outputHigh : this.outputLow;
    }

    return true;
  }
}

/**
 * OR Gate - Output high when either input is above threshold
 */
class OrGateProcessor extends AudioWorkletProcessor {
  private threshold: number;
  private outputHigh: number;
  private outputLow: number;

  constructor(options?: AudioWorkletNodeOptions) {
    super();
    const procOpts = options?.processorOptions;
    this.threshold = procOpts?.threshold ?? 0.5;
    this.outputHigh = procOpts?.outputHigh ?? 1.0;
    this.outputLow = procOpts?.outputLow ?? 0.0;

    this.port.onmessage = (event) => {
      switch (event.data.type) {
        case "setThreshold":
          this.threshold = event.data.value;
          break;
        case "setOutputHigh":
          this.outputHigh = event.data.value;
          break;
        case "setOutputLow":
          this.outputLow = event.data.value;
          break;
      }
    };
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const inputA = inputs[0]?.[0];
    const inputB = inputs[1]?.[0];
    const output = outputs[0]?.[0];

    if (!output) return true;

    for (let i = 0; i < output.length; i++) {
      const a = (inputA?.[i] ?? 0) >= this.threshold;
      const b = (inputB?.[i] ?? 0) >= this.threshold;
      output[i] = (a || b) ? this.outputHigh : this.outputLow;
    }

    return true;
  }
}

/**
 * XOR Gate - Output high when exactly one input is above threshold
 */
class XorGateProcessor extends AudioWorkletProcessor {
  private threshold: number;
  private outputHigh: number;
  private outputLow: number;

  constructor(options?: AudioWorkletNodeOptions) {
    super();
    const procOpts = options?.processorOptions;
    this.threshold = procOpts?.threshold ?? 0.5;
    this.outputHigh = procOpts?.outputHigh ?? 1.0;
    this.outputLow = procOpts?.outputLow ?? 0.0;

    this.port.onmessage = (event) => {
      switch (event.data.type) {
        case "setThreshold":
          this.threshold = event.data.value;
          break;
        case "setOutputHigh":
          this.outputHigh = event.data.value;
          break;
        case "setOutputLow":
          this.outputLow = event.data.value;
          break;
      }
    };
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const inputA = inputs[0]?.[0];
    const inputB = inputs[1]?.[0];
    const output = outputs[0]?.[0];

    if (!output) return true;

    for (let i = 0; i < output.length; i++) {
      const a = (inputA?.[i] ?? 0) >= this.threshold;
      const b = (inputB?.[i] ?? 0) >= this.threshold;
      output[i] = (a !== b) ? this.outputHigh : this.outputLow;
    }

    return true;
  }
}

/**
 * NOT Gate - Invert signal (output high when input is below threshold)
 */
class NotGateProcessor extends AudioWorkletProcessor {
  private threshold: number;
  private outputHigh: number;
  private outputLow: number;

  constructor(options?: AudioWorkletNodeOptions) {
    super();
    const procOpts = options?.processorOptions;
    this.threshold = procOpts?.threshold ?? 0.5;
    this.outputHigh = procOpts?.outputHigh ?? 1.0;
    this.outputLow = procOpts?.outputLow ?? 0.0;

    this.port.onmessage = (event) => {
      switch (event.data.type) {
        case "setThreshold":
          this.threshold = event.data.value;
          break;
        case "setOutputHigh":
          this.outputHigh = event.data.value;
          break;
        case "setOutputLow":
          this.outputLow = event.data.value;
          break;
      }
    };
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const input = inputs[0]?.[0];
    const output = outputs[0]?.[0];

    if (!output) return true;

    for (let i = 0; i < output.length; i++) {
      const a = (input?.[i] ?? 0) >= this.threshold;
      output[i] = a ? this.outputLow : this.outputHigh;
    }

    return true;
  }
}

// Register all processors
registerProcessor("switch-processor", SwitchProcessor);
registerProcessor("ab-switch-processor", ABSwitchProcessor);
registerProcessor("sample-hold-processor", SampleHoldProcessor);
registerProcessor("comparator-processor", ComparatorProcessor);
registerProcessor("panner-processor", PannerProcessor);
registerProcessor("and-gate-processor", AndGateProcessor);
registerProcessor("or-gate-processor", OrGateProcessor);
registerProcessor("xor-gate-processor", XorGateProcessor);
registerProcessor("not-gate-processor", NotGateProcessor);
