// AudioWorklet processors for math operations
// Single-input operations: ceil, floor, round, abs, sign, sqrt, sin, cos
// Two-input operations: min, max, pow, mod
// Three-input operation: clamp

// Ceil - Round up to nearest integer
class CeilProcessor extends AudioWorkletProcessor {
  process(inputs, outputs) {
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
  process(inputs, outputs) {
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
  process(inputs, outputs) {
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
  process(inputs, outputs) {
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
  process(inputs, outputs) {
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
  process(inputs, outputs) {
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
  process(inputs, outputs) {
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
  process(inputs, outputs) {
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
  process(inputs, outputs) {
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
  process(inputs, outputs) {
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
  process(inputs, outputs) {
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
      outputChannel[i] = isFinite(result) ? Math.max(-100, Math.min(100, result)) : 0;
    }

    return true;
  }
}

// Mod - Modulo operation
class ModProcessor extends AudioWorkletProcessor {
  process(inputs, outputs) {
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
  process(inputs, outputs) {
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

// Register all processors
registerProcessor('ceil-processor', CeilProcessor);
registerProcessor('floor-processor', FloorProcessor);
registerProcessor('round-processor', RoundProcessor);
registerProcessor('abs-processor', AbsProcessor);
registerProcessor('sign-processor', SignProcessor);
registerProcessor('sqrt-processor', SqrtProcessor);
registerProcessor('sin-processor', SinProcessor);
registerProcessor('cos-processor', CosProcessor);
registerProcessor('min-processor', MinProcessor);
registerProcessor('max-processor', MaxProcessor);
registerProcessor('pow-processor', PowProcessor);
registerProcessor('mod-processor', ModProcessor);
registerProcessor('clamp-processor', ClampProcessor);
