/// <reference path="./audioworklet.d.ts" />

// AudioWorklet processors for math operations
// Single-input operations: ceil, floor, round, abs, sign, sqrt, sin, cos
// Two-input operations: min, max, pow, mod
// Three-input operation: clamp

// Ceil - Round up to nearest integer
class CeilProcessor extends AudioWorkletProcessor {
  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !output || input.length === 0) return true;

    const inputChannel = input[0];
    const outputChannel = output[0];

    if (!inputChannel || !outputChannel) return true;

    for (let i = 0; i < outputChannel.length; i++) {
      outputChannel[i] = Math.ceil(inputChannel[i] || 0);
    }

    return true;
  }
}

// Floor - Round down to nearest integer
class FloorProcessor extends AudioWorkletProcessor {
  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !output || input.length === 0) return true;

    const inputChannel = input[0];
    const outputChannel = output[0];

    if (!inputChannel || !outputChannel) return true;

    for (let i = 0; i < outputChannel.length; i++) {
      outputChannel[i] = Math.floor(inputChannel[i] || 0);
    }

    return true;
  }
}

// Round - Round to nearest integer
class RoundProcessor extends AudioWorkletProcessor {
  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !output || input.length === 0) return true;

    const inputChannel = input[0];
    const outputChannel = output[0];

    if (!inputChannel || !outputChannel) return true;

    for (let i = 0; i < outputChannel.length; i++) {
      outputChannel[i] = Math.round(inputChannel[i] || 0);
    }

    return true;
  }
}

// Abs - Absolute value
class AbsProcessor extends AudioWorkletProcessor {
  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !output || input.length === 0) return true;

    const inputChannel = input[0];
    const outputChannel = output[0];

    if (!inputChannel || !outputChannel) return true;

    for (let i = 0; i < outputChannel.length; i++) {
      outputChannel[i] = Math.abs(inputChannel[i] || 0);
    }

    return true;
  }
}

// Sign - Return -1, 0, or 1 based on sign
class SignProcessor extends AudioWorkletProcessor {
  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !output || input.length === 0) return true;

    const inputChannel = input[0];
    const outputChannel = output[0];

    if (!inputChannel || !outputChannel) return true;

    for (let i = 0; i < outputChannel.length; i++) {
      outputChannel[i] = Math.sign(inputChannel[i] || 0);
    }

    return true;
  }
}

// Sqrt - Square root
class SqrtProcessor extends AudioWorkletProcessor {
  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !output || input.length === 0) return true;

    const inputChannel = input[0];
    const outputChannel = output[0];

    if (!inputChannel || !outputChannel) return true;

    for (let i = 0; i < outputChannel.length; i++) {
      const value = inputChannel[i] || 0;
      // Only take sqrt of positive values, return 0 for negative
      outputChannel[i] = value >= 0 ? Math.sqrt(value) : 0;
    }

    return true;
  }
}

// Sin - Sine function
class SinProcessor extends AudioWorkletProcessor {
  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !output || input.length === 0) return true;

    const inputChannel = input[0];
    const outputChannel = output[0];

    if (!inputChannel || !outputChannel) return true;

    for (let i = 0; i < outputChannel.length; i++) {
      outputChannel[i] = Math.sin(inputChannel[i] || 0);
    }

    return true;
  }
}

// Cos - Cosine function
class CosProcessor extends AudioWorkletProcessor {
  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !output || input.length === 0) return true;

    const inputChannel = input[0];
    const outputChannel = output[0];

    if (!inputChannel || !outputChannel) return true;

    for (let i = 0; i < outputChannel.length; i++) {
      outputChannel[i] = Math.cos(inputChannel[i] || 0);
    }

    return true;
  }
}

// Min - Minimum of two inputs
class MinProcessor extends AudioWorkletProcessor {
  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !output || input.length < 2) return true;

    const inputA = input[0];
    const inputB = input[1];
    const outputChannel = output[0];

    if (!inputA || !inputB || !outputChannel) return true;

    for (let i = 0; i < outputChannel.length; i++) {
      const a = inputA[i] || 0;
      const b = inputB[i] || 0;
      outputChannel[i] = Math.min(a, b);
    }

    return true;
  }
}

// Max - Maximum of two inputs
class MaxProcessor extends AudioWorkletProcessor {
  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !output || input.length < 2) return true;

    const inputA = input[0];
    const inputB = input[1];
    const outputChannel = output[0];

    if (!inputA || !inputB || !outputChannel) return true;

    for (let i = 0; i < outputChannel.length; i++) {
      const a = inputA[i] || 0;
      const b = inputB[i] || 0;
      outputChannel[i] = Math.max(a, b);
    }

    return true;
  }
}

// Pow - Raise A to power B
class PowProcessor extends AudioWorkletProcessor {
  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !output || input.length < 2) return true;

    const inputA = input[0];
    const inputB = input[1];
    const outputChannel = output[0];

    if (!inputA || !inputB || !outputChannel) return true;

    for (let i = 0; i < outputChannel.length; i++) {
      const a = inputA[i] || 0;
      const b = inputB[i] || 0;
      // Clamp output to prevent extreme values
      const result = Math.pow(a, b);
      outputChannel[i] = isFinite(result)
        ? Math.max(-100, Math.min(100, result))
        : 0;
    }

    return true;
  }
}

// Mod - Modulo operation
class ModProcessor extends AudioWorkletProcessor {
  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !output || input.length < 2) return true;

    const inputA = input[0];
    const inputB = input[1];
    const outputChannel = output[0];

    if (!inputA || !inputB || !outputChannel) return true;

    for (let i = 0; i < outputChannel.length; i++) {
      const a = inputA[i] || 0;
      const b = inputB[i] || 0;
      // Handle mod by zero
      const EPSILON = 0.0001;
      const divisor = Math.abs(b) < EPSILON ? (b >= 0 ? EPSILON : -EPSILON) : b;
      outputChannel[i] = a % divisor;
    }

    return true;
  }
}

// Clamp - Constrain value between min and max (3 inputs)
class ClampProcessor extends AudioWorkletProcessor {
  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !output || input.length < 3) return true;

    const inputValue = input[0];
    const inputMin = input[1];
    const inputMax = input[2];
    const outputChannel = output[0];

    if (!inputValue || !inputMin || !inputMax || !outputChannel) return true;

    for (let i = 0; i < outputChannel.length; i++) {
      const value = inputValue[i] || 0;
      const min = inputMin[i] || 0;
      const max = inputMax[i] || 0;
      outputChannel[i] = Math.max(min, Math.min(max, value));
    }

    return true;
  }
}

// Multiplexer - Select one of N inputs based on selector signal or config value
// Input 0: selector signal (optional - if not connected, uses config value)
// Inputs 1 to N: signal inputs
class MultiplexerProcessor extends AudioWorkletProcessor {
  private numInputs: number;
  private configSelector: number;

  constructor(options?: AudioWorkletNodeOptions) {
    super();
    // Number of signal inputs (excluding selector) from processor options
    const procOpts = options && options.processorOptions;
    this.numInputs = (procOpts && procOpts.numInputs) || 2;
    this.configSelector =
      procOpts && procOpts.selectorValue !== undefined
        ? procOpts.selectorValue
        : 0;

    // Listen for config updates
    this.port.onmessage = (event) => {
      if (event.data.type === "setSelector") {
        this.configSelector = event.data.value;
      }
    };
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    const output = outputs[0];
    if (!output || output.length === 0) return true;

    const outputChannel = output[0];
    if (!outputChannel) return true;

    // Input 0 is selector signal, inputs 1+ are signal inputs
    const selectorInputArr = inputs[0];
    const selectorInput = selectorInputArr && selectorInputArr[0];
    const hasSelectorSignal =
      selectorInput &&
      selectorInput.length > 0 &&
      selectorInput.some((v) => v !== 0);
    const numSignalInputs = this.numInputs;

    for (let i = 0; i < outputChannel.length; i++) {
      // Use signal selector if connected, otherwise use config value
      const selectorValue = hasSelectorSignal
        ? selectorInput[i]
        : this.configSelector;

      // Clamp selector to valid range [0, numInputs-1]
      const clampedSelector = Math.max(
        0,
        Math.min(numSignalInputs - 1, selectorValue),
      );

      // Get integer and fractional parts for blending
      const lowerIndex = Math.floor(clampedSelector);
      const upperIndex = Math.min(lowerIndex + 1, numSignalInputs - 1);
      const blend = clampedSelector - lowerIndex;

      // Get values from the two nearest inputs (offset by 1 since input 0 is selector)
      const lowerInputArr = inputs[lowerIndex + 1];
      const lowerInputChannel = lowerInputArr && lowerInputArr[0];
      const upperInputArr = inputs[upperIndex + 1];
      const upperInputChannel = upperInputArr && upperInputArr[0];

      const lowerValue =
        lowerInputChannel && lowerInputChannel[i] !== undefined
          ? lowerInputChannel[i]
          : 0;
      const upperValue =
        upperInputChannel && upperInputChannel[i] !== undefined
          ? upperInputChannel[i]
          : 0;

      // Linear interpolation between inputs
      outputChannel[i] = lowerValue * (1 - blend) + upperValue * blend;
    }

    return true;
  }
}

// Register all processors
registerProcessor("ceil-processor", CeilProcessor);
registerProcessor("floor-processor", FloorProcessor);
registerProcessor("round-processor", RoundProcessor);
registerProcessor("abs-processor", AbsProcessor);
registerProcessor("sign-processor", SignProcessor);
registerProcessor("sqrt-processor", SqrtProcessor);
registerProcessor("sin-processor", SinProcessor);
registerProcessor("cos-processor", CosProcessor);
registerProcessor("min-processor", MinProcessor);
registerProcessor("max-processor", MaxProcessor);
registerProcessor("pow-processor", PowProcessor);
registerProcessor("mod-processor", ModProcessor);
registerProcessor("clamp-processor", ClampProcessor);
registerProcessor("multiplexer-processor", MultiplexerProcessor);
