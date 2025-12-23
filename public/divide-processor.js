// AudioWorklet processor for division operation
// This processor receives two input channels (A and B) and outputs A / B

class DivideProcessor extends AudioWorkletProcessor {
  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    // Check if we have valid inputs and outputs
    if (!input || !output || input.length < 2) {
      return true;
    }

    const inputA = input[0]; // First input channel (A)
    const inputB = input[1]; // Second input channel (B)
    const outputChannel = output[0];

    // If we don't have both inputs or output, return
    if (!inputA || !inputB || !outputChannel) {
      return true;
    }

    // Process each sample
    for (let i = 0; i < outputChannel.length; i++) {
      const a = inputA[i] || 0;
      const b = inputB[i] || 0;

      // Handle division by zero by adding a small offset
      // This prevents NaN and Infinity values
      const EPSILON = 0.0001;
      const divisor = Math.abs(b) < EPSILON ? (b >= 0 ? EPSILON : -EPSILON) : b;

      outputChannel[i] = a / divisor;
    }

    // Return true to keep the processor alive
    return true;
  }
}

// Register the processor
registerProcessor('divide-processor', DivideProcessor);
