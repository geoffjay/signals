import { type Node, type Edge } from "@xyflow/react";
import { type BlockType, type BlockConfig } from "@/types/blocks";
import type { InstrumentDefinition, PortMapping } from "@/types/instruments";

export class SignalProcessingEngine {
  private audioContext: AudioContext | null = null;
  private nodes: Map<
    string,
    AudioNode | OscillatorNode | GainNode | BiquadFilterNode
  > = new Map();
  private oscillators: Map<string, OscillatorNode> = new Map();
  private analysers: Map<string, AnalyserNode> = new Map();
  private constantSources: Map<string, ConstantSourceNode> = new Map();
  private reactFlowNodes: Node[] = [];
  private reactFlowEdges: Edge[] = [];
  private isRunning = false;
  // Track expanded instruments: instrumentNodeId -> { definition, internalNodeIds }
  private instrumentInstances: Map<
    string,
    { definition: InstrumentDefinition; internalNodeIds: string[] }
  > = new Map();

  async start() {
    if (this.isRunning) return;

    // Create audio context if it doesn't exist
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    // Resume audio context if suspended
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    // Register AudioWorklet processor for division
    try {
      // Use relative path to respect Vite's base configuration
      const basePath = import.meta.env.BASE_URL || "/";
      await this.audioContext.audioWorklet.addModule(
        `${basePath}divide-processor.js`,
      );
    } catch (e) {
      console.error("Failed to load divide-processor AudioWorklet:", e);
    }

    // Register AudioWorklet processors for math operations
    try {
      const basePath = import.meta.env.BASE_URL || "/";
      await this.audioContext.audioWorklet.addModule(
        `${basePath}math-processors.js`,
      );
    } catch (e) {
      console.error("Failed to load math-processors AudioWorklet:", e);
    }

    // Register AudioWorklet processors for envelope processing
    try {
      const basePath = import.meta.env.BASE_URL || "/";
      await this.audioContext.audioWorklet.addModule(
        `${basePath}envelope-processors.js`,
      );
    } catch (e) {
      console.error("Failed to load envelope-processors AudioWorklet:", e);
    }

    // Register AudioWorklet processors for lo-fi effects
    try {
      const basePath = import.meta.env.BASE_URL || "/";
      await this.audioContext.audioWorklet.addModule(
        `${basePath}lofi-processors.js`,
      );
    } catch (e) {
      console.error("Failed to load lofi-processors AudioWorklet:", e);
    }

    this.isRunning = true;
  }

  stop() {
    if (!this.isRunning) return;

    // Stop all oscillators
    this.oscillators.forEach((osc) => {
      try {
        osc.stop();
      } catch {
        // Oscillator might already be stopped
      }
    });

    // Stop all constant sources
    this.constantSources.forEach((source) => {
      try {
        source.stop();
      } catch {
        // Source might already be stopped
      }
    });

    this.oscillators.clear();
    this.constantSources.clear();
    this.nodes.clear();
    this.analysers.clear();
    this.instrumentInstances.clear();

    this.isRunning = false;
  }

  updateGraph(nodes: Node[], edges: Edge[]) {
    if (!this.isRunning || !this.audioContext) return;

    // Store nodes and edges for connection routing logic
    this.reactFlowNodes = nodes;
    this.reactFlowEdges = edges;

    // Get current node IDs
    const currentNodeIds = new Set(Array.from(this.nodes.keys()));
    const newNodeIds = new Set(nodes.map((n) => n.id));

    // Find nodes to remove (excluding internal helper nodes like FFT filters, inverters, effect sub-nodes, and instrument internal nodes)
    // Effect sub-node patterns: time-based effects store multiple internal nodes with suffixes
    const effectSubNodeSuffixes = [
      "-predelay", "-convolver", "-dry", "-wet", "-output", // reverb, delay, chorus, flanger
      "-delay", "-feedback", // delay, flanger, vibrato
      "-lfo", "-lfoGain", "-depth", // tremolo, chorus, flanger, phaser, vibrato
      "-allpass-", // phaser stages
      "-audio", "-envelope", // envelope follower outputs
    ];
    const isEffectSubNode = (id: string) =>
      effectSubNodeSuffixes.some((suffix) => id.includes(suffix));

    const nodesToRemove = Array.from(currentNodeIds).filter(
      (id) =>
        !newNodeIds.has(id) &&
        !id.includes("-freq_out") && // FFT filter sub-nodes
        !id.includes("-inverter") && // Subtraction inverter nodes
        !id.includes("::") && // Instrument internal nodes (use :: as namespace separator)
        !isEffectSubNode(id), // Effect internal sub-nodes
    );

    // Find nodes to add
    const nodesToAdd = nodes.filter((node) => !currentNodeIds.has(node.id));

    // Remove deleted nodes
    nodesToRemove.forEach((nodeId) => {
      // Check if this is an instrument node and clean up its internal nodes
      const instrumentInstance = this.instrumentInstances.get(nodeId);
      if (instrumentInstance) {
        this.cleanupInstrument(nodeId);
        return;
      }

      const node = this.nodes.get(nodeId);
      if (node) {
        try {
          node.disconnect();
        } catch {
          // Already disconnected
        }
      }

      // Stop and remove oscillator if it exists
      const oscillator = this.oscillators.get(nodeId);
      if (oscillator) {
        try {
          oscillator.stop();
        } catch {
          // Already stopped
        }
        this.oscillators.delete(nodeId);
      }

      // Stop and remove constant source if it exists
      const constantSource = this.constantSources.get(nodeId);
      if (constantSource) {
        try {
          constantSource.stop();
        } catch {
          // Already stopped
        }
        this.constantSources.delete(nodeId);
      }

      // Remove helper nodes (e.g., inverter for subtraction)
      const helperNode = this.nodes.get(`${nodeId}-inverter`);
      if (helperNode) {
        try {
          helperNode.disconnect();
        } catch {
          // Already disconnected
        }
        this.nodes.delete(`${nodeId}-inverter`);
      }

      // Clean up keyboard sub-nodes (freq, gate, velocity)
      const keyboardSuffixes = ["-freq", "-gate", "-velocity"];
      keyboardSuffixes.forEach((suffix) => {
        const subNode = this.nodes.get(`${nodeId}${suffix}`);
        if (subNode) {
          try {
            subNode.disconnect();
          } catch {
            // Already disconnected
          }
          this.nodes.delete(`${nodeId}${suffix}`);
        }
        const subSource = this.constantSources.get(`${nodeId}${suffix}`);
        if (subSource) {
          try {
            subSource.stop();
          } catch {
            // Already stopped
          }
          this.constantSources.delete(`${nodeId}${suffix}`);
        }
      });

      // Clean up beat-pad sub-nodes (trigger, padIndex, velocity)
      const beatPadSuffixes = ["-trigger", "-padIndex", "-velocity"];
      beatPadSuffixes.forEach((suffix) => {
        const subNode = this.nodes.get(`${nodeId}${suffix}`);
        if (subNode) {
          try {
            subNode.disconnect();
          } catch {
            // Already disconnected
          }
          this.nodes.delete(`${nodeId}${suffix}`);
        }
        const subSource = this.constantSources.get(`${nodeId}${suffix}`);
        if (subSource) {
          try {
            subSource.stop();
          } catch {
            // Already stopped
          }
          this.constantSources.delete(`${nodeId}${suffix}`);
        }
      });

      // Clean up crossfader sub-nodes (inputA, inputB, output)
      const crossfaderSuffixes = ["-inputA", "-inputB", "-output"];
      crossfaderSuffixes.forEach((suffix) => {
        const subNode = this.nodes.get(`${nodeId}${suffix}`);
        if (subNode) {
          try {
            subNode.disconnect();
          } catch {
            // Already disconnected
          }
          this.nodes.delete(`${nodeId}${suffix}`);
        }
      });

      this.nodes.delete(nodeId);
      this.analysers.delete(nodeId);
    });

    // Add new nodes
    nodesToAdd.forEach((node) => {
      const blockType = node.data.blockType as string;

      // Handle instrument blocks specially
      if (blockType === "instrument") {
        const definition = node.data
          .instrumentDefinition as InstrumentDefinition;
        if (definition) {
          this.expandInstrument(node.id, definition);
        }
        return;
      }

      const config = node.data.config as BlockConfig;
      this.createAudioNode(node.id, blockType as BlockType, config);
    });

    // Rebuild all connections (simpler than tracking connection changes)
    // First disconnect everything EXCEPT:
    // - FFT filter sub-nodes (preserve internal FFT structure)
    // - Instrument internal nodes (preserve internal instrument connections)
    // - Effect sub-nodes (preserve internal effect connections like reverb, delay, etc.)
    this.nodes.forEach((node, nodeId) => {
      // Skip FFT filter sub-nodes - they maintain internal connections
      if (nodeId.includes("-freq_out")) {
        return;
      }
      // Skip instrument internal nodes - they maintain internal connections
      // Internal nodes use :: as namespace separator (e.g., "instrument-1::node-2")
      if (nodeId.includes("::")) {
        return;
      }
      // Skip effect sub-nodes - they maintain internal connections
      if (isEffectSubNode(nodeId)) {
        return;
      }
      try {
        node.disconnect();
      } catch {
        // Already disconnected
      }
    });

    // Reset AudioParam values to configured values (before reconnecting)
    // Only reset params that are NOT connected (check edges first)
    nodes.forEach((node) => {
      const blockType = node.data.blockType as BlockType;
      const config = node.data.config as BlockConfig;
      const audioNode = this.nodes.get(node.id);

      if (!audioNode) return;

      // Helper to check if a specific input handle has an incoming connection
      const isInputConnected = (handleId: string): boolean => {
        return edges.some(
          (edge) => edge.target === node.id && edge.targetHandle === handleId,
        );
      };

      switch (blockType) {
        case "sine-wave":
        case "square-wave":
        case "triangle-wave":
        case "sawtooth-wave": {
          const oscillator = this.oscillators.get(node.id);
          // Only set frequency if NOT connected
          if (oscillator && !isInputConnected("freq")) {
            oscillator.frequency.value = config.frequency || 440;
          } else if (oscillator && isInputConnected("freq")) {
            // If connected, set base to 0 so signal directly controls it
            oscillator.frequency.value = 0;
          }

          // Only set amplitude if NOT connected
          if (audioNode instanceof GainNode && !isInputConnected("amp")) {
            audioNode.gain.value = config.amplitude || 0.5;
          } else if (audioNode instanceof GainNode && isInputConnected("amp")) {
            // If connected, set base to 0 so signal directly controls it
            audioNode.gain.value = 0;
          }
          break;
        }

        case "noise": {
          // Only set amplitude if NOT connected
          if (audioNode instanceof GainNode && !isInputConnected("amp")) {
            audioNode.gain.value = config.amplitude || 0.5;
          } else if (audioNode instanceof GainNode && isInputConnected("amp")) {
            // If connected, set base to 0 so signal directly controls it
            audioNode.gain.value = 0;
          }
          break;
        }

        case "low-pass-filter":
        case "high-pass-filter":
        case "band-pass-filter":
        case "notch-filter":
        case "allpass-filter": {
          // Only set cutoff if NOT connected
          if (
            audioNode instanceof BiquadFilterNode &&
            !isInputConnected("cutoff")
          ) {
            audioNode.frequency.value = config.cutoffFrequency || 1000;
          } else if (
            audioNode instanceof BiquadFilterNode &&
            isInputConnected("cutoff")
          ) {
            // If connected, set base to 0 so signal directly controls it
            audioNode.frequency.value = 0;
          }
          break;
        }

        case "peaking-eq": {
          // Only set frequency if NOT connected
          if (
            audioNode instanceof BiquadFilterNode &&
            !isInputConnected("frequency")
          ) {
            audioNode.frequency.value = config.cutoffFrequency || 1000;
          } else if (
            audioNode instanceof BiquadFilterNode &&
            isInputConnected("frequency")
          ) {
            // If connected, set base to 0 so signal directly controls it
            audioNode.frequency.value = 0;
          }
          break;
        }

        case "lowshelf-filter":
        case "highshelf-filter": {
          // Only set cutoff if NOT connected
          if (
            audioNode instanceof BiquadFilterNode &&
            !isInputConnected("cutoff")
          ) {
            audioNode.frequency.value = config.cutoffFrequency || 1000;
          } else if (
            audioNode instanceof BiquadFilterNode &&
            isInputConnected("cutoff")
          ) {
            // If connected, set base to 0 so signal directly controls it
            audioNode.frequency.value = 0;
          }
          break;
        }
      }
    });

    // Reconnect oscillators to their gain nodes
    this.oscillators.forEach((oscillator, nodeId) => {
      const gainNode = this.nodes.get(nodeId);
      if (gainNode && gainNode instanceof GainNode) {
        try {
          oscillator.disconnect();
          oscillator.connect(gainNode);
        } catch {
          // Connection failed
        }
      }
    });

    // Reconnect constant sources to their nodes
    this.constantSources.forEach((source, nodeId) => {
      const node = this.nodes.get(nodeId);
      if (node) {
        try {
          source.disconnect();
          source.connect(node);
        } catch {
          // Connection failed
        }
      }
    });

    // Reconnect audio outputs to destination
    // Audio output nodes need to stay connected to speakers
    nodes.forEach((node) => {
      if (node.data.blockType === "audio-output") {
        const audioOutputNode = this.nodes.get(node.id);
        if (audioOutputNode && this.audioContext) {
          try {
            audioOutputNode.connect(this.audioContext.destination);
          } catch {
            // Already connected
          }
        }
      }
    });

    // Reconnect reverb internal signal paths
    // These internal connections get broken by the disconnect loop
    nodes.forEach((node) => {
      if (node.data.blockType === "reverb") {
        const inputGain = this.nodes.get(node.id);
        const predelayNode = this.nodes.get(`${node.id}-predelay`);
        const convolver = this.nodes.get(`${node.id}-convolver`);
        const dryGain = this.nodes.get(`${node.id}-dry`);
        const wetGain = this.nodes.get(`${node.id}-wet`);
        const outputGain = this.nodes.get(`${node.id}-output`);

        if (inputGain && predelayNode && convolver && dryGain && wetGain && outputGain) {
          try {
            // Dry path: input -> dryGain -> output
            inputGain.connect(dryGain);
            dryGain.connect(outputGain);

            // Wet path: input -> predelay -> convolver -> wetGain -> output
            inputGain.connect(predelayNode);
            (predelayNode as DelayNode).connect(convolver);
            (convolver as ConvolverNode).connect(wetGain);
            wetGain.connect(outputGain);
          } catch {
            // Connection failed
          }
        }
      }
    });

    // Apply new connections from edges
    edges.forEach((edge) => {
      this.connectNodes(
        edge.source,
        edge.sourceHandle!,
        edge.target,
        edge.targetHandle!,
      );
    });

    // Reconnect FFT frequency-output internal connections (inputGain -> filters)
    // These are internal connections that need to be maintained after disconnection
    nodes.forEach((node) => {
      if (node.data.blockType === "fft-analyzer") {
        const config = node.data.config as BlockConfig;
        if (config.fftMode === "frequency-output") {
          const inputGain = this.nodes.get(node.id);
          const numOutputs = config.numFrequencyOutputs || 4;

          if (inputGain) {
            for (let i = 0; i < numOutputs; i++) {
              const filter = this.nodes.get(`${node.id}-freq_out${i}`);
              if (filter) {
                try {
                  inputGain.connect(filter);
                } catch {
                  // Already connected
                }
              }
            }
          }
        }
      }
    });
  }

  private createAudioNode(
    nodeId: string,
    blockType: BlockType,
    config: BlockConfig,
  ) {
    if (!this.audioContext) return;

    switch (blockType) {
      case "sine-wave":
      case "square-wave":
      case "triangle-wave":
      case "sawtooth-wave":
        this.createOscillator(nodeId, blockType, config);
        break;

      case "noise":
        this.createNoiseGenerator(nodeId, config);
        break;

      case "gain":
        this.createGainNode(nodeId, config);
        break;

      case "low-pass-filter":
        this.createFilter(nodeId, "lowpass", config);
        break;

      case "high-pass-filter":
        this.createFilter(nodeId, "highpass", config);
        break;

      case "band-pass-filter":
        this.createFilter(nodeId, "bandpass", config);
        break;

      case "notch-filter":
        this.createFilter(nodeId, "notch", config);
        break;

      case "allpass-filter":
        this.createFilter(nodeId, "allpass", config);
        break;

      case "peaking-eq":
        this.createFilter(nodeId, "peaking", config);
        break;

      case "lowshelf-filter":
        this.createFilter(nodeId, "lowshelf", config);
        break;

      case "highshelf-filter":
        this.createFilter(nodeId, "highshelf", config);
        break;

      case "compressor":
        this.createCompressor(nodeId, config);
        break;

      case "waveshaper":
        this.createWaveshaper(nodeId, config);
        break;

      case "hard-clip":
        this.createHardClip(nodeId, config);
        break;

      case "soft-clip":
        this.createSoftClip(nodeId, config);
        break;

      case "delay":
        this.createDelay(nodeId, config);
        break;

      case "tremolo":
        this.createTremolo(nodeId, config);
        break;

      case "chorus":
        this.createChorus(nodeId, config);
        break;

      case "flanger":
        this.createFlanger(nodeId, config);
        break;

      case "phaser":
        this.createPhaser(nodeId, config);
        break;

      case "vibrato":
        this.createVibrato(nodeId, config);
        break;

      case "reverb":
        this.createReverb(nodeId, config);
        break;

      case "splitter":
        this.createSplitter(nodeId);
        break;

      case "oscilloscope":
        this.createAnalyser(nodeId, config);
        break;

      case "audio-output":
        this.createAudioOutput(nodeId, config);
        break;

      case "slider":
      case "button":
      case "toggle":
      case "pulse":
        this.createConstantSource(nodeId, config);
        break;

      case "numeric-meter":
        this.createAnalyser(nodeId, config);
        break;

      case "add":
        this.createAddNode(nodeId);
        break;

      case "subtract":
        this.createSubtractNode(nodeId);
        break;

      case "multiply":
        this.createMultiplyNode(nodeId);
        break;

      case "divide":
        this.createDivideNode(nodeId);
        break;

      case "fft-analyzer": {
        const mode = config.fftMode || "spectrum";
        switch (mode) {
          case "spectrum":
          case "peak-detection":
            this.createFFTAnalyzer(nodeId, config);
            break;
          case "frequency-output":
            this.createFFTFrequencyOutput(nodeId, config);
            break;
          case "spectral-processing":
            this.createFFTSpectralProcessor(nodeId, config);
            break;
        }
        break;
      }

      case "ceil":
        this.createMathNode(nodeId, "ceil-processor");
        break;

      case "floor":
        this.createMathNode(nodeId, "floor-processor");
        break;

      case "round":
        this.createMathNode(nodeId, "round-processor");
        break;

      case "abs":
        this.createMathNode(nodeId, "abs-processor");
        break;

      case "sign":
        this.createMathNode(nodeId, "sign-processor");
        break;

      case "negate":
        this.createNegateNode(nodeId);
        break;

      case "sqrt":
        this.createMathNode(nodeId, "sqrt-processor");
        break;

      case "sin":
        this.createMathNode(nodeId, "sin-processor");
        break;

      case "cos":
        this.createMathNode(nodeId, "cos-processor");
        break;

      case "min":
        this.createTwoInputMathNode(nodeId, "min-processor");
        break;

      case "max":
        this.createTwoInputMathNode(nodeId, "max-processor");
        break;

      case "pow":
        this.createTwoInputMathNode(nodeId, "pow-processor");
        break;

      case "mod":
        this.createTwoInputMathNode(nodeId, "mod-processor");
        break;

      case "clamp":
        this.createThreeInputMathNode(nodeId, "clamp-processor");
        break;

      case "multiplexer":
        this.createMultiplexer(nodeId, config);
        break;

      case "keyboard":
        this.createKeyboard(nodeId, config);
        break;

      case "beat-pad":
        this.createBeatPad(nodeId, config);
        break;

      case "crossfader":
        this.createCrossfader(nodeId, config);
        break;

      case "envelope-follower":
        this.createEnvelopeFollower(nodeId, config);
        break;

      case "adsr":
        this.createADSR(nodeId, config);
        break;

      case "bit-crusher":
        this.createBitCrusher(nodeId, config);
        break;

      case "sample-rate-reducer":
        this.createSampleRateReducer(nodeId, config);
        break;
    }
  }

  private createOscillator(
    nodeId: string,
    blockType: BlockType,
    config: BlockConfig,
  ) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();

    // Set waveform type
    switch (blockType) {
      case "sine-wave":
        oscillator.type = "sine";
        break;
      case "square-wave":
        oscillator.type = "square";
        break;
      case "triangle-wave":
        oscillator.type = "triangle";
        break;
      case "sawtooth-wave":
        oscillator.type = "sawtooth";
        break;
    }

    oscillator.frequency.value = config.frequency || 440;

    // Create a gain node to control amplitude
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = config.amplitude || 0.5;

    oscillator.connect(gainNode);
    oscillator.start();

    this.oscillators.set(nodeId, oscillator);
    this.nodes.set(nodeId, gainNode); // Store the gain node as the output
  }

  private createNoiseGenerator(nodeId: string, config: BlockConfig) {
    if (!this.audioContext) return;

    // Create a noise generator using a buffer source
    const bufferSize = this.audioContext.sampleRate * 2; // 2 seconds of noise
    const buffer = this.audioContext.createBuffer(
      1,
      bufferSize,
      this.audioContext.sampleRate,
    );
    const data = buffer.getChannelData(0);

    // Fill with random noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = config.amplitude || 0.5;

    source.connect(gainNode);
    source.start();

    this.nodes.set(nodeId, gainNode);
  }

  private createGainNode(nodeId: string, config: BlockConfig) {
    if (!this.audioContext) return;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = config.gain || 1.0;

    this.nodes.set(nodeId, gainNode);
  }

  private createFilter(
    nodeId: string,
    type: BiquadFilterType,
    config: BlockConfig,
  ) {
    if (!this.audioContext) return;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = config.cutoffFrequency || 1000;
    filter.Q.value = config.qFactor || 1.0;

    // Set gain for peaking, lowshelf, and highshelf filters
    if (type === "peaking" || type === "lowshelf" || type === "highshelf") {
      filter.gain.value = config.filterGain || 0;
    }

    this.nodes.set(nodeId, filter);
  }

  private createCompressor(nodeId: string, config: BlockConfig) {
    if (!this.audioContext) return;

    const compressor = this.audioContext.createDynamicsCompressor();
    compressor.threshold.value = config.threshold ?? -24;
    compressor.knee.value = config.knee ?? 30;
    compressor.ratio.value = config.ratio ?? 12;
    compressor.attack.value = config.attack ?? 0.003;
    compressor.release.value = config.release ?? 0.25;

    this.nodes.set(nodeId, compressor);
  }

  /**
   * Generate a waveshaper curve based on curve type and amount
   */
  private generateWaveshaperCurve(
    curveType: string,
    amount: number,
  ): Float32Array {
    const samples = 1024;
    const curve = new Float32Array(samples);
    const k = amount * 10; // Scale amount for more noticeable effect

    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1; // Map to -1 to 1

      switch (curveType) {
        case "soft-clip":
        case "tanh":
          // Hyperbolic tangent - smooth saturation
          curve[i] = Math.tanh(k * x);
          break;

        case "hard-clip":
          // Hard clipping at threshold
          const threshold = Math.max(0.01, 1 - amount);
          curve[i] = Math.max(-threshold, Math.min(threshold, x));
          break;

        case "atan":
          // Arctangent - softer than tanh
          curve[i] = (2 / Math.PI) * Math.atan(k * x);
          break;

        case "sine":
          // Sine waveshaping - creates odd harmonics
          curve[i] = Math.sin((Math.PI / 2) * x * (1 + amount * 2));
          // Clamp to -1 to 1
          curve[i] = Math.max(-1, Math.min(1, curve[i]));
          break;

        case "cubic":
          // Cubic soft clipping
          if (Math.abs(x) < 0.5) {
            curve[i] = x - (x * x * x) / 3;
          } else {
            curve[i] = Math.sign(x) * (2 / 3);
          }
          // Apply amount as blend
          curve[i] = x * (1 - amount) + curve[i] * amount;
          break;

        default:
          // Linear (no distortion)
          curve[i] = x;
      }
    }

    return curve;
  }

  private createWaveshaper(nodeId: string, config: BlockConfig) {
    if (!this.audioContext) return;

    const waveshaper = this.audioContext.createWaveShaper();
    const amount = (config.distortionAmount ?? 50) / 100; // Convert 0-100 to 0-1
    const curveType = config.distortionCurve ?? "soft-clip";

    const curve = this.generateWaveshaperCurve(curveType, amount);
    // @ts-expect-error - Float32Array type compatibility with Web Audio API
    waveshaper.curve = curve;
    waveshaper.oversample = config.oversample ?? "none";

    this.nodes.set(nodeId, waveshaper);
  }

  private createHardClip(nodeId: string, config: BlockConfig) {
    if (!this.audioContext) return;

    const waveshaper = this.audioContext.createWaveShaper();
    const threshold = config.clipThreshold ?? 0.8;

    // Generate hard clip curve
    const samples = 1024;
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = Math.max(-threshold, Math.min(threshold, x));
    }

    waveshaper.curve = curve;
    waveshaper.oversample = config.oversample ?? "none";

    this.nodes.set(nodeId, waveshaper);
  }

  private createSoftClip(nodeId: string, config: BlockConfig) {
    if (!this.audioContext) return;

    const waveshaper = this.audioContext.createWaveShaper();
    const amount = config.softClipAmount ?? 0.5;
    const curveType = config.softClipCurve ?? "tanh";

    const curve = this.generateWaveshaperCurve(curveType, amount);
    // @ts-expect-error - Float32Array type compatibility with Web Audio API
    waveshaper.curve = curve;
    waveshaper.oversample = config.oversample ?? "none";

    this.nodes.set(nodeId, waveshaper);
  }

  private createDelay(nodeId: string, config: BlockConfig) {
    if (!this.audioContext) return;

    const delayTime = config.delayTime ?? 0.3;
    const feedback = config.delayFeedback ?? 0.3;
    const mix = config.delayMix ?? 0.5;

    // Create input gain node (main input)
    const inputGain = this.audioContext.createGain();
    inputGain.gain.value = 1.0;

    // Create delay node
    const delayNode = this.audioContext.createDelay(5.0); // Max 5 seconds
    delayNode.delayTime.value = delayTime;

    // Create feedback gain
    const feedbackGain = this.audioContext.createGain();
    feedbackGain.gain.value = Math.min(feedback, 0.95); // Cap to prevent runaway

    // Create dry/wet mixing
    const dryGain = this.audioContext.createGain();
    dryGain.gain.value = 1.0 - mix;

    const wetGain = this.audioContext.createGain();
    wetGain.gain.value = mix;

    // Create output mixer
    const outputGain = this.audioContext.createGain();
    outputGain.gain.value = 1.0;

    // Wire up the delay structure:
    // input -> dry -> output
    // input -> delay -> wet -> output
    // delay -> feedback -> delay
    inputGain.connect(dryGain);
    inputGain.connect(delayNode);
    delayNode.connect(wetGain);
    delayNode.connect(feedbackGain);
    feedbackGain.connect(delayNode);
    dryGain.connect(outputGain);
    wetGain.connect(outputGain);

    // Store all components for later updates
    this.nodes.set(nodeId, inputGain); // Main input node
    this.nodes.set(`${nodeId}-delay`, delayNode);
    this.nodes.set(`${nodeId}-feedback`, feedbackGain);
    this.nodes.set(`${nodeId}-dry`, dryGain);
    this.nodes.set(`${nodeId}-wet`, wetGain);
    this.nodes.set(`${nodeId}-output`, outputGain);
  }

  private createTremolo(nodeId: string, config: BlockConfig) {
    if (!this.audioContext) return;

    const rate = config.tremoloRate ?? 5;
    const depth = config.tremoloDepth ?? 0.5;
    const waveform = config.tremoloWaveform ?? "sine";

    // Create LFO oscillator
    const lfo = this.audioContext.createOscillator();
    lfo.type = waveform;
    lfo.frequency.value = rate;

    // Create depth gain (scales LFO amplitude)
    const depthGain = this.audioContext.createGain();
    depthGain.gain.value = depth * 0.5; // Scale depth to 0-0.5 range

    // Create main gain node for signal
    const signalGain = this.audioContext.createGain();
    signalGain.gain.value = 1.0 - depth * 0.5; // Center point of modulation

    // Connect LFO to modulate the signal gain
    lfo.connect(depthGain);
    depthGain.connect(signalGain.gain);

    // Start the LFO
    lfo.start();

    // Store components
    this.nodes.set(nodeId, signalGain); // Main signal node
    this.nodes.set(`${nodeId}-lfo`, lfo);
    this.nodes.set(`${nodeId}-depth`, depthGain);
    this.oscillators.set(`${nodeId}-lfo`, lfo);
  }

  private createChorus(nodeId: string, config: BlockConfig) {
    if (!this.audioContext) return;

    const rate = config.chorusRate ?? 1.5;
    const depth = config.chorusDepth ?? 0.002;
    const mix = config.chorusMix ?? 0.5;
    const voices = config.chorusVoices ?? 2;

    // Create input gain
    const inputGain = this.audioContext.createGain();
    inputGain.gain.value = 1.0;

    // Create dry path
    const dryGain = this.audioContext.createGain();
    dryGain.gain.value = 1.0 - mix;

    // Create wet path with multiple voices
    const wetGain = this.audioContext.createGain();
    wetGain.gain.value = mix / voices;

    // Create output
    const outputGain = this.audioContext.createGain();
    outputGain.gain.value = 1.0;

    // Connect dry path
    inputGain.connect(dryGain);
    dryGain.connect(outputGain);

    // Create chorus voices (each with slightly different delay and LFO phase)
    for (let i = 0; i < voices; i++) {
      const delayNode = this.audioContext.createDelay(0.1);
      delayNode.delayTime.value = 0.02 + i * 0.005; // Base delay offset per voice

      const lfo = this.audioContext.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = rate * (1 + i * 0.1); // Slightly different rate per voice

      const lfoGain = this.audioContext.createGain();
      lfoGain.gain.value = depth;

      // Connect LFO to modulate delay time
      lfo.connect(lfoGain);
      lfoGain.connect(delayNode.delayTime);

      // Connect voice to wet path
      inputGain.connect(delayNode);
      delayNode.connect(wetGain);

      lfo.start();

      // Store voice components
      this.nodes.set(`${nodeId}-delay-${i}`, delayNode);
      this.nodes.set(`${nodeId}-lfo-${i}`, lfo);
      this.nodes.set(`${nodeId}-lfoGain-${i}`, lfoGain);
      this.oscillators.set(`${nodeId}-lfo-${i}`, lfo);
    }

    wetGain.connect(outputGain);

    // Store main components
    this.nodes.set(nodeId, inputGain);
    this.nodes.set(`${nodeId}-dry`, dryGain);
    this.nodes.set(`${nodeId}-wet`, wetGain);
    this.nodes.set(`${nodeId}-output`, outputGain);
  }

  private createFlanger(nodeId: string, config: BlockConfig) {
    if (!this.audioContext) return;

    const rate = config.flangerRate ?? 0.5;
    const depth = config.flangerDepth ?? 0.001;
    const feedback = config.flangerFeedback ?? 0.5;
    const mix = config.flangerMix ?? 0.5;

    // Create input gain
    const inputGain = this.audioContext.createGain();
    inputGain.gain.value = 1.0;

    // Create delay node (short delay for flanging)
    const delayNode = this.audioContext.createDelay(0.02);
    delayNode.delayTime.value = 0.005; // Base delay

    // Create LFO
    const lfo = this.audioContext.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = rate;

    const lfoGain = this.audioContext.createGain();
    lfoGain.gain.value = depth;

    // Create feedback path
    const feedbackGain = this.audioContext.createGain();
    feedbackGain.gain.value = Math.max(-0.95, Math.min(0.95, feedback));

    // Create dry/wet mixing
    const dryGain = this.audioContext.createGain();
    dryGain.gain.value = 1.0 - mix;

    const wetGain = this.audioContext.createGain();
    wetGain.gain.value = mix;

    // Create output
    const outputGain = this.audioContext.createGain();
    outputGain.gain.value = 1.0;

    // Connect LFO to delay time
    lfo.connect(lfoGain);
    lfoGain.connect(delayNode.delayTime);

    // Wire up the flanger structure
    inputGain.connect(dryGain);
    inputGain.connect(delayNode);
    delayNode.connect(wetGain);
    delayNode.connect(feedbackGain);
    feedbackGain.connect(delayNode);
    dryGain.connect(outputGain);
    wetGain.connect(outputGain);

    lfo.start();

    // Store components
    this.nodes.set(nodeId, inputGain);
    this.nodes.set(`${nodeId}-delay`, delayNode);
    this.nodes.set(`${nodeId}-lfo`, lfo);
    this.nodes.set(`${nodeId}-lfoGain`, lfoGain);
    this.nodes.set(`${nodeId}-feedback`, feedbackGain);
    this.nodes.set(`${nodeId}-dry`, dryGain);
    this.nodes.set(`${nodeId}-wet`, wetGain);
    this.nodes.set(`${nodeId}-output`, outputGain);
    this.oscillators.set(`${nodeId}-lfo`, lfo);
  }

  private createPhaser(nodeId: string, config: BlockConfig) {
    if (!this.audioContext) return;

    const rate = config.phaserRate ?? 0.5;
    const depth = config.phaserDepth ?? 1.0;
    const stages = config.phaserStages ?? 4;
    const feedback = config.phaserFeedback ?? 0.5;
    const mix = config.phaserMix ?? 0.5;
    const baseFrequency = config.phaserBaseFrequency ?? 1000;

    // Create input gain
    const inputGain = this.audioContext.createGain();
    inputGain.gain.value = 1.0;

    // Create LFO for modulating allpass filter frequencies
    const lfo = this.audioContext.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = rate;

    const lfoGain = this.audioContext.createGain();
    lfoGain.gain.value = baseFrequency * depth; // Modulation range

    // Create chain of allpass filters
    const allpassFilters: BiquadFilterNode[] = [];
    let prevNode: AudioNode = inputGain;

    for (let i = 0; i < stages; i++) {
      const allpass = this.audioContext.createBiquadFilter();
      allpass.type = "allpass";
      allpass.frequency.value = baseFrequency;
      allpass.Q.value = 0.5;

      // Connect LFO to modulate frequency
      lfo.connect(lfoGain);
      lfoGain.connect(allpass.frequency);

      prevNode.connect(allpass);
      prevNode = allpass;
      allpassFilters.push(allpass);

      this.nodes.set(`${nodeId}-allpass-${i}`, allpass);
    }

    // Create feedback path
    const feedbackGain = this.audioContext.createGain();
    feedbackGain.gain.value = Math.max(-0.95, Math.min(0.95, feedback));

    // Create dry/wet mixing
    const dryGain = this.audioContext.createGain();
    dryGain.gain.value = 1.0 - mix;

    const wetGain = this.audioContext.createGain();
    wetGain.gain.value = mix;

    // Create output
    const outputGain = this.audioContext.createGain();
    outputGain.gain.value = 1.0;

    // Connect feedback from last allpass back to first
    if (allpassFilters.length > 0) {
      allpassFilters[allpassFilters.length - 1].connect(feedbackGain);
      feedbackGain.connect(allpassFilters[0]);
      allpassFilters[allpassFilters.length - 1].connect(wetGain);
    }

    inputGain.connect(dryGain);
    dryGain.connect(outputGain);
    wetGain.connect(outputGain);

    lfo.start();

    // Store components
    this.nodes.set(nodeId, inputGain);
    this.nodes.set(`${nodeId}-lfo`, lfo);
    this.nodes.set(`${nodeId}-lfoGain`, lfoGain);
    this.nodes.set(`${nodeId}-feedback`, feedbackGain);
    this.nodes.set(`${nodeId}-dry`, dryGain);
    this.nodes.set(`${nodeId}-wet`, wetGain);
    this.nodes.set(`${nodeId}-output`, outputGain);
    this.oscillators.set(`${nodeId}-lfo`, lfo);
  }

  private createVibrato(nodeId: string, config: BlockConfig) {
    if (!this.audioContext) return;

    const rate = config.vibratoRate ?? 5;
    const depth = config.vibratoDepth ?? 0.003;
    const waveform = config.vibratoWaveform ?? "sine";

    // Create input gain
    const inputGain = this.audioContext.createGain();
    inputGain.gain.value = 1.0;

    // Create delay node for pitch modulation
    const delayNode = this.audioContext.createDelay(0.1);
    delayNode.delayTime.value = 0.01; // Base delay

    // Create LFO
    const lfo = this.audioContext.createOscillator();
    lfo.type = waveform;
    lfo.frequency.value = rate;

    const lfoGain = this.audioContext.createGain();
    lfoGain.gain.value = depth;

    // Connect LFO to delay time (creates pitch modulation)
    lfo.connect(lfoGain);
    lfoGain.connect(delayNode.delayTime);

    // Connect signal path
    inputGain.connect(delayNode);

    lfo.start();

    // Store components
    this.nodes.set(nodeId, inputGain);
    this.nodes.set(`${nodeId}-delay`, delayNode);
    this.nodes.set(`${nodeId}-lfo`, lfo);
    this.nodes.set(`${nodeId}-lfoGain`, lfoGain);
    this.nodes.set(`${nodeId}-output`, delayNode); // Output is directly from delay
    this.oscillators.set(`${nodeId}-lfo`, lfo);
  }

  /**
   * Generate an impulse response for convolution reverb
   * Uses exponential decay with optional parameters for different room sizes
   */
  private generateImpulseResponse(
    duration: number,
    decay: number,
    preset: string,
  ): AudioBuffer {
    if (!this.audioContext) throw new Error("AudioContext not initialized");

    const sampleRate = this.audioContext.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioContext.createBuffer(2, length, sampleRate);

    // Get preset-specific parameters
    const presetParams = this.getReverbPresetParams(preset);
    const { earlyReflections, diffusion, highFreqDamping } = presetParams;

    for (let channel = 0; channel < 2; channel++) {
      const channelData = buffer.getChannelData(channel);

      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;

        // Base exponential decay
        let sample = (Math.random() * 2 - 1) * Math.exp(-t * decay);

        // Add early reflections for more realistic room simulation
        if (t < earlyReflections) {
          // Early reflections are louder and more distinct
          const earlyMix = 1 - t / earlyReflections;
          sample += (Math.random() * 2 - 1) * earlyMix * 0.5;
        }

        // Apply diffusion (randomize timing slightly per channel for stereo width)
        if (diffusion > 0 && channel === 1) {
          // Offset right channel slightly for stereo spread
          const offset = Math.floor(sampleRate * 0.02 * diffusion);
          if (i > offset) {
            const prevSample = channelData[i - offset];
            sample = sample * (1 - diffusion * 0.3) + prevSample * diffusion * 0.3;
          }
        }

        // High frequency damping (simple lowpass-like effect)
        if (highFreqDamping > 0 && i > 0) {
          const prevSample = channelData[i - 1];
          sample = sample * (1 - highFreqDamping) + prevSample * highFreqDamping;
        }

        channelData[i] = sample;
      }
    }

    return buffer;
  }

  /**
   * Get parameters for different reverb presets
   */
  private getReverbPresetParams(preset: string): {
    duration: number;
    decay: number;
    earlyReflections: number;
    diffusion: number;
    highFreqDamping: number;
  } {
    switch (preset) {
      case "small-room":
        return {
          duration: 0.5,
          decay: 8,
          earlyReflections: 0.02,
          diffusion: 0.3,
          highFreqDamping: 0.4,
        };
      case "medium-room":
        return {
          duration: 1.5,
          decay: 3,
          earlyReflections: 0.05,
          diffusion: 0.5,
          highFreqDamping: 0.3,
        };
      case "large-hall":
        return {
          duration: 3.0,
          decay: 1.5,
          earlyReflections: 0.1,
          diffusion: 0.7,
          highFreqDamping: 0.2,
        };
      case "cathedral":
        return {
          duration: 5.0,
          decay: 0.8,
          earlyReflections: 0.15,
          diffusion: 0.9,
          highFreqDamping: 0.15,
        };
      case "plate":
        return {
          duration: 2.0,
          decay: 2,
          earlyReflections: 0.01,
          diffusion: 0.8,
          highFreqDamping: 0.1,
        };
      case "spring":
        return {
          duration: 1.0,
          decay: 4,
          earlyReflections: 0.03,
          diffusion: 0.2,
          highFreqDamping: 0.5,
        };
      default:
        // Default to medium room
        return {
          duration: 1.5,
          decay: 3,
          earlyReflections: 0.05,
          diffusion: 0.5,
          highFreqDamping: 0.3,
        };
    }
  }

  private createReverb(nodeId: string, config: BlockConfig) {
    if (!this.audioContext) return;

    const preset = (config.reverbPreset as string) ?? "medium-room";
    const decay = config.reverbDecay ?? 2.0;
    const mix = config.reverbMix ?? 0.3;
    const predelay = config.reverbPredelay ?? 0.02;

    // Get preset parameters
    const presetParams = this.getReverbPresetParams(preset);

    // Create input gain
    const inputGain = this.audioContext.createGain();
    inputGain.gain.value = 1.0;

    // Create predelay
    const predelayNode = this.audioContext.createDelay(0.5);
    predelayNode.delayTime.value = predelay;

    // Create convolver for reverb
    const convolver = this.audioContext.createConvolver();
    const impulseResponse = this.generateImpulseResponse(
      presetParams.duration * (decay / 2),
      presetParams.decay / decay,
      preset,
    );
    convolver.buffer = impulseResponse;

    // Create dry/wet mix
    const dryGain = this.audioContext.createGain();
    dryGain.gain.value = 1 - mix;

    const wetGain = this.audioContext.createGain();
    wetGain.gain.value = mix;

    // Create output mixer
    const outputGain = this.audioContext.createGain();
    outputGain.gain.value = 1.0;

    // Connect signal path
    // Dry path: input -> dryGain -> output
    inputGain.connect(dryGain);
    dryGain.connect(outputGain);

    // Wet path: input -> predelay -> convolver -> wetGain -> output
    inputGain.connect(predelayNode);
    predelayNode.connect(convolver);
    convolver.connect(wetGain);
    wetGain.connect(outputGain);

    // Store components
    this.nodes.set(nodeId, inputGain);
    this.nodes.set(`${nodeId}-predelay`, predelayNode);
    this.nodes.set(`${nodeId}-convolver`, convolver);
    this.nodes.set(`${nodeId}-dry`, dryGain);
    this.nodes.set(`${nodeId}-wet`, wetGain);
    this.nodes.set(`${nodeId}-output`, outputGain);
  }

  private createEnvelopeFollower(nodeId: string, config: BlockConfig) {
    if (!this.audioContext) return;

    const attack = config.envelopeAttack ?? 0.01;
    const release = config.envelopeRelease ?? 0.1;

    try {
      // Create AudioWorkletNode for envelope follower
      // Has 1 input and 2 outputs (audio passthrough and envelope)
      const envelopeNode = new AudioWorkletNode(
        this.audioContext,
        "envelope-follower-processor",
        {
          numberOfInputs: 1,
          numberOfOutputs: 2,
          outputChannelCount: [1, 1],
          processorOptions: {
            attack,
            release,
          },
        },
      );

      // Store the main node (for input connections)
      this.nodes.set(nodeId, envelopeNode);
      // Also store output node references for connection routing
      this.nodes.set(`${nodeId}-audio`, envelopeNode);
      this.nodes.set(`${nodeId}-envelope`, envelopeNode);
    } catch (e) {
      console.error("Failed to create envelope-follower AudioWorkletNode:", e);
    }
  }

  private createADSR(nodeId: string, config: BlockConfig) {
    if (!this.audioContext) return;

    const attack = config.adsrAttack ?? 0.01;
    const decay = config.adsrDecay ?? 0.1;
    const sustain = config.adsrSustain ?? 0.7;
    const release = config.adsrRelease ?? 0.5;

    try {
      // Create AudioWorkletNode for ADSR
      // Has 2 inputs (gate, audio) and 1 output
      const adsrNode = new AudioWorkletNode(
        this.audioContext,
        "adsr-processor",
        {
          numberOfInputs: 2,
          numberOfOutputs: 1,
          outputChannelCount: [1],
          processorOptions: {
            attack,
            decay,
            sustain,
            release,
          },
        },
      );

      this.nodes.set(nodeId, adsrNode);
    } catch (e) {
      console.error("Failed to create adsr AudioWorkletNode:", e);
    }
  }

  private createBitCrusher(nodeId: string, config: BlockConfig) {
    if (!this.audioContext) return;

    const bits = config.crusherBits ?? 8;
    const mix = config.crusherMix ?? 1.0;

    try {
      // Create AudioWorkletNode for bit crusher
      const bitCrusherNode = new AudioWorkletNode(
        this.audioContext,
        "bit-crusher-processor",
        {
          numberOfInputs: 1,
          numberOfOutputs: 1,
          outputChannelCount: [1],
          processorOptions: {
            bits,
            mix,
          },
        },
      );

      this.nodes.set(nodeId, bitCrusherNode);
    } catch (e) {
      console.error("Failed to create bit-crusher AudioWorkletNode:", e);
    }
  }

  private createSampleRateReducer(nodeId: string, config: BlockConfig) {
    if (!this.audioContext) return;

    const targetSampleRate = config.reducerSampleRate ?? 8000;
    const mix = config.reducerMix ?? 1.0;

    try {
      // Create AudioWorkletNode for sample rate reducer
      const reducerNode = new AudioWorkletNode(
        this.audioContext,
        "sample-rate-reducer-processor",
        {
          numberOfInputs: 1,
          numberOfOutputs: 1,
          outputChannelCount: [1],
          processorOptions: {
            targetSampleRate,
            mix,
          },
        },
      );

      this.nodes.set(nodeId, reducerNode);
    } catch (e) {
      console.error("Failed to create sample-rate-reducer AudioWorkletNode:", e);
    }
  }

  private createSplitter(nodeId: string) {
    if (!this.audioContext) return;

    // A splitter is just a gain node with gain = 1
    // One input fans out to multiple outputs
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 1.0;

    this.nodes.set(nodeId, gainNode);
  }

  private createMultiplexer(nodeId: string, config: BlockConfig) {
    if (!this.audioContext) return;

    const numInputs = config.numInputs || 2;
    const selectorValue = config.selectorValue ?? 0;

    try {
      // Create AudioWorkletNode for multiplexer
      // Input 0: selector signal, Inputs 1-N: signal inputs
      const muxNode = new AudioWorkletNode(
        this.audioContext,
        "multiplexer-processor",
        {
          numberOfInputs: numInputs + 1, // +1 for selector signal input
          numberOfOutputs: 1,
          outputChannelCount: [1],
          channelCount: 1,
          channelCountMode: "explicit",
          channelInterpretation: "speakers",
          processorOptions: {
            numInputs: numInputs,
            selectorValue: selectorValue,
          },
        },
      );

      this.nodes.set(nodeId, muxNode);
    } catch (e) {
      console.error("Failed to create multiplexer AudioWorkletNode:", e);
      // Fallback to a simple gain node if worklet fails
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 1.0;
      this.nodes.set(nodeId, gainNode);
    }
  }

  private createKeyboard(nodeId: string, config: BlockConfig) {
    if (!this.audioContext) return;

    // Keyboard outputs three signals: frequency, gate, and velocity
    // Each is a ConstantSourceNode that gets updated when keys are pressed

    // Frequency output
    const freqSource = this.audioContext.createConstantSource();
    freqSource.offset.value = config.frequency || 0;
    freqSource.start();

    // Gate output (0 = off, 1 = on)
    const gateSource = this.audioContext.createConstantSource();
    gateSource.offset.value = config.gate || 0;
    gateSource.start();

    // Velocity output (0-1)
    const velocitySource = this.audioContext.createConstantSource();
    velocitySource.offset.value = config.velocity || 0;
    velocitySource.start();

    // Store all three outputs with suffixed IDs
    this.constantSources.set(`${nodeId}-freq`, freqSource);
    this.constantSources.set(`${nodeId}-gate`, gateSource);
    this.constantSources.set(`${nodeId}-velocity`, velocitySource);

    // Store main node reference (use freq as primary for lookups)
    this.nodes.set(nodeId, freqSource);
    this.nodes.set(`${nodeId}-freq`, freqSource);
    this.nodes.set(`${nodeId}-gate`, gateSource);
    this.nodes.set(`${nodeId}-velocity`, velocitySource);
  }

  private createBeatPad(nodeId: string, config: BlockConfig) {
    if (!this.audioContext) return;

    // Beat pad outputs three signals: trigger, padIndex, and velocity
    // Each is a ConstantSourceNode that gets updated when pads are pressed

    // Trigger output (0 = off, 1 = triggered)
    const triggerSource = this.audioContext.createConstantSource();
    triggerSource.offset.value = config.trigger || 0;
    triggerSource.start();

    // Pad index output (which pad was pressed, -1 = none)
    const padIndexSource = this.audioContext.createConstantSource();
    padIndexSource.offset.value = config.activePad ?? -1;
    padIndexSource.start();

    // Velocity output (0-1)
    const velocitySource = this.audioContext.createConstantSource();
    velocitySource.offset.value = config.velocity || 0;
    velocitySource.start();

    // Store all three outputs with suffixed IDs
    this.constantSources.set(`${nodeId}-trigger`, triggerSource);
    this.constantSources.set(`${nodeId}-padIndex`, padIndexSource);
    this.constantSources.set(`${nodeId}-velocity`, velocitySource);

    // Store main node reference (use trigger as primary for lookups)
    this.nodes.set(nodeId, triggerSource);
    this.nodes.set(`${nodeId}-trigger`, triggerSource);
    this.nodes.set(`${nodeId}-padIndex`, padIndexSource);
    this.nodes.set(`${nodeId}-velocity`, velocitySource);
  }

  private createCrossfader(nodeId: string, config: BlockConfig) {
    if (!this.audioContext) return;

    const position = (config.position as number) ?? 0.5;
    const curveType = (config.curveType as string) ?? "equal-power";

    // Calculate initial gain values
    const { gainA, gainB } = this.calculateCrossfadeGains(position, curveType);

    // Create input gain nodes for A and B channels
    const inputA = this.audioContext.createGain();
    inputA.gain.value = gainA;

    const inputB = this.audioContext.createGain();
    inputB.gain.value = gainB;

    // Create output mixer (sums the two weighted inputs)
    const outputMixer = this.audioContext.createGain();
    outputMixer.gain.value = 1.0;

    // Connect inputs to output mixer
    inputA.connect(outputMixer);
    inputB.connect(outputMixer);

    // Store nodes
    this.nodes.set(nodeId, outputMixer); // Main node is the output
    this.nodes.set(`${nodeId}-inputA`, inputA);
    this.nodes.set(`${nodeId}-inputB`, inputB);
    this.nodes.set(`${nodeId}-output`, outputMixer);
  }

  /**
   * Calculate gain values for crossfader A and B channels
   */
  private calculateCrossfadeGains(
    position: number,
    curveType: string
  ): { gainA: number; gainB: number } {
    const pos = Math.max(0, Math.min(1, position));

    switch (curveType) {
      case "linear":
        // Simple linear crossfade
        return {
          gainA: 1 - pos,
          gainB: pos,
        };

      case "equal-power":
        // Equal-power crossfade (constant total power)
        // Uses sine/cosine curves for smooth transition
        return {
          gainA: Math.cos(pos * Math.PI * 0.5),
          gainB: Math.sin(pos * Math.PI * 0.5),
        };

      case "cut":
        // DJ-style cut crossfade (sharp transition at edges)
        // Full A until 45%, transition 45-55%, full B after 55%
        if (pos < 0.45) {
          return { gainA: 1, gainB: 0 };
        } else if (pos > 0.55) {
          return { gainA: 0, gainB: 1 };
        } else {
          const t = (pos - 0.45) / 0.1;
          return {
            gainA: 1 - t,
            gainB: t,
          };
        }

      default:
        return { gainA: 0.5, gainB: 0.5 };
    }
  }

  private createAnalyser(nodeId: string, config: BlockConfig) {
    if (!this.audioContext) return;

    const analyser = this.audioContext.createAnalyser();

    // Calculate fftSize based on timeWindow
    // timeWindow is in seconds, we want to display that much time
    // fftSize determines the number of samples in the frequency domain
    // frequencyBinCount = fftSize / 2 = number of time domain samples
    const timeWindow = config.timeWindow || 0.05; // Default 50ms
    const sampleRate = this.audioContext.sampleRate;
    const desiredSamples = timeWindow * sampleRate;

    // fftSize must be a power of 2 between 32 and 32768
    // frequencyBinCount = fftSize / 2, so we need fftSize = desiredSamples * 2
    let fftSize = 32;
    while (fftSize < desiredSamples * 2 && fftSize < 32768) {
      fftSize *= 2;
    }

    analyser.fftSize = Math.min(fftSize, 32768);
    analyser.smoothingTimeConstant = 0.8;

    // Connect analyser output to a silent dummy gain node to ensure audio processing
    // Without an output connection, browsers may optimize away the analyser processing
    const dummyGain = this.audioContext.createGain();
    dummyGain.gain.value = 0; // Silent
    analyser.connect(dummyGain);
    dummyGain.connect(this.audioContext.destination);

    this.analysers.set(nodeId, analyser);
    this.nodes.set(nodeId, analyser);
  }

  private createAudioOutput(nodeId: string, config: BlockConfig) {
    if (!this.audioContext) return;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = config.muted ? 0 : config.volume || 0.5;

    // Connect to destination (speakers)
    gainNode.connect(this.audioContext.destination);

    this.nodes.set(nodeId, gainNode);
  }

  private createConstantSource(nodeId: string, config: BlockConfig) {
    if (!this.audioContext) return;

    const constantSource = this.audioContext.createConstantSource();
    // Initialize with the configured value or 0
    constantSource.offset.value = config.value || 0;
    constantSource.start();

    this.constantSources.set(nodeId, constantSource);
    this.nodes.set(nodeId, constantSource);
  }

  private createAddNode(nodeId: string) {
    if (!this.audioContext) return;

    // Addition: Web Audio naturally mixes (adds) inputs
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 1.0;

    this.nodes.set(nodeId, gainNode);
  }

  private createSubtractNode(nodeId: string) {
    if (!this.audioContext) return;

    // Subtraction: A - B = A + (-1 * B)
    // Create summer node (main node)
    const summer = this.audioContext.createGain();
    summer.gain.value = 1.0;

    // Create inverter node for input B
    const inverter = this.audioContext.createGain();
    inverter.gain.value = -1.0;

    // Connect inverter to summer
    inverter.connect(summer);

    // Store both nodes
    this.nodes.set(nodeId, summer); // Main node
    this.nodes.set(`${nodeId}-inverter`, inverter); // Helper node
  }

  private createMultiplyNode(nodeId: string) {
    if (!this.audioContext) return;

    // Multiplication: One signal modulates gain of the other
    // inputA passes through the gain node
    // inputB modulates the gain parameter
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 0; // Will be modulated by inputB

    this.nodes.set(nodeId, gainNode);
  }

  private createDivideNode(nodeId: string) {
    if (!this.audioContext) return;

    try {
      // Create AudioWorkletNode for division
      const divideNode = new AudioWorkletNode(
        this.audioContext,
        "divide-processor",
        {
          numberOfInputs: 2,
          numberOfOutputs: 1,
          outputChannelCount: [1],
        },
      );

      this.nodes.set(nodeId, divideNode);
    } catch (e) {
      console.error("Failed to create divide AudioWorkletNode:", e);
      // Fallback to a simple gain node if worklet fails
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 1.0;
      this.nodes.set(nodeId, gainNode);
    }
  }

  private createMathNode(nodeId: string, processorName: string) {
    if (!this.audioContext) return;

    try {
      // Create AudioWorkletNode for single-input math operations
      const mathNode = new AudioWorkletNode(this.audioContext, processorName, {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [1],
      });

      this.nodes.set(nodeId, mathNode);
    } catch (e) {
      console.error(`Failed to create ${processorName} AudioWorkletNode:`, e);
      // Fallback to a simple gain node if worklet fails
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 1.0;
      this.nodes.set(nodeId, gainNode);
    }
  }

  private createNegateNode(nodeId: string) {
    if (!this.audioContext) return;

    // Negate is simple: use a gain node with -1 gain
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = -1.0;
    this.nodes.set(nodeId, gainNode);
  }

  private createTwoInputMathNode(nodeId: string, processorName: string) {
    if (!this.audioContext) return;

    try {
      // Create AudioWorkletNode for two-input math operations
      const mathNode = new AudioWorkletNode(this.audioContext, processorName, {
        numberOfInputs: 2,
        numberOfOutputs: 1,
        outputChannelCount: [1],
      });

      this.nodes.set(nodeId, mathNode);
    } catch (e) {
      console.error(`Failed to create ${processorName} AudioWorkletNode:`, e);
      // Fallback to a simple gain node if worklet fails
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 1.0;
      this.nodes.set(nodeId, gainNode);
    }
  }

  private createThreeInputMathNode(nodeId: string, processorName: string) {
    if (!this.audioContext) return;

    try {
      // Create AudioWorkletNode for three-input math operations (clamp)
      const mathNode = new AudioWorkletNode(this.audioContext, processorName, {
        numberOfInputs: 3,
        numberOfOutputs: 1,
        outputChannelCount: [1],
      });

      this.nodes.set(nodeId, mathNode);
    } catch (e) {
      console.error(`Failed to create ${processorName} AudioWorkletNode:`, e);
      // Fallback to a simple gain node if worklet fails
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 1.0;
      this.nodes.set(nodeId, gainNode);
    }
  }

  private createFFTAnalyzer(nodeId: string, config: BlockConfig) {
    if (!this.audioContext) return;

    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = config.fftSize || 2048;
    analyser.smoothingTimeConstant = config.smoothingTimeConstant || 0.8;
    analyser.minDecibels = config.minDecibels || -90;
    analyser.maxDecibels = config.maxDecibels || -10;

    this.analysers.set(nodeId, analyser);
    this.nodes.set(nodeId, analyser);
  }

  private createFFTFrequencyOutput(nodeId: string, config: BlockConfig) {
    if (!this.audioContext) return;

    const numOutputs = config.numFrequencyOutputs || 4;
    const bins = config.frequencyBins || [];

    console.log(
      `[FFT] Creating frequency output for ${nodeId}, numOutputs=${numOutputs}`,
    );

    // Create input splitter
    const inputGain = this.audioContext.createGain();
    inputGain.gain.value = 1.0;

    // Create band-pass filters for each output
    for (let i = 0; i < numOutputs; i++) {
      const bin = bins[i];
      if (!bin) continue;

      const filter = this.audioContext.createBiquadFilter();
      filter.type = "bandpass";

      // Calculate center frequency from bin indices
      const nyquist = this.audioContext.sampleRate / 2;
      const fftSize = config.fftSize || 2048;
      const binWidth = nyquist / (fftSize / 2);
      const startFreq = bin.start * binWidth;
      const endFreq = bin.end * binWidth;
      const centerFreq = (startFreq + endFreq) / 2;
      const bandwidth = endFreq - startFreq;

      filter.frequency.value = centerFreq;
      filter.Q.value = bandwidth > 0 ? centerFreq / bandwidth : 1.0;

      console.log(
        `[FFT] Filter ${i} (${bin.label}): ${startFreq.toFixed(1)}-${endFreq.toFixed(1)} Hz, center=${centerFreq.toFixed(1)} Hz, Q=${filter.Q.value.toFixed(2)}`,
      );

      // Connect input gain to filter
      console.log(`[FFT] Connecting inputGain to filter ${i}...`);
      try {
        inputGain.connect(filter);
        console.log(`[FFT] Successfully connected inputGain to filter ${i}`);
      } catch (e) {
        console.error(`[FFT] FAILED to connect inputGain to filter ${i}:`, e);
      }

      // Store filter node with output ID
      const filterKey = `${nodeId}-freq_out${i}`;
      this.nodes.set(filterKey, filter);
      console.log(`[FFT] Stored filter as ${filterKey}`);
    }

    // Store main input node
    this.nodes.set(nodeId, inputGain);
    console.log(`[FFT] Stored input gain as ${nodeId}`);
    console.log(`[FFT] Input gain value: ${inputGain.gain.value}`);

    // Create analyser for potential visualization
    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = config.fftSize || 2048;
    inputGain.connect(analyser);
    this.analysers.set(nodeId, analyser);
  }

  private createFFTSpectralProcessor(nodeId: string, config: BlockConfig) {
    if (!this.audioContext) return;

    const operation = config.spectralOperation || "passthrough";
    const frequency = config.operationFrequency || 1000;
    const gain = config.operationGain || 0;

    // Create filter chain based on operation
    const filter = this.audioContext.createBiquadFilter();

    switch (operation) {
      case "low-shelf":
        filter.type = "lowshelf";
        filter.frequency.value = frequency;
        filter.gain.value = gain;
        break;

      case "high-shelf":
        filter.type = "highshelf";
        filter.frequency.value = frequency;
        filter.gain.value = gain;
        break;

      case "notch-band":
        filter.type = "notch";
        filter.frequency.value = frequency;
        filter.Q.value = 10; // Narrow notch
        break;

      case "passthrough":
      default:
        filter.type = "allpass";
        filter.frequency.value = frequency;
        break;
    }

    this.nodes.set(nodeId, filter);

    // Also create analyser for visualization
    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = config.fftSize || 2048;
    filter.connect(analyser);
    this.analysers.set(nodeId, analyser);
  }

  private connectNodes(
    sourceId: string,
    sourceHandle: string,
    targetId: string,
    targetHandle: string,
  ) {
    // Resolve instrument ports first
    let actualSourceId = sourceId;
    let actualSourceHandle = sourceHandle;
    let actualTargetId = targetId;
    let actualTargetHandle = targetHandle;

    // Check if source is an instrument node (output port)
    if (this.instrumentInstances.has(sourceId)) {
      console.log(
        `[Connection] Source is instrument: ${sourceId}, port: ${sourceHandle}`,
      );
      const resolved = this.resolveInstrumentPort(
        sourceId,
        sourceHandle,
        false,
      );
      if (resolved) {
        actualSourceId = resolved.nodeId;
        actualSourceHandle = resolved.handleId;
        console.log(
          `[Connection] Resolved source to: ${actualSourceId}:${actualSourceHandle}`,
        );
      } else {
        console.warn(
          `Could not resolve instrument source port: ${sourceId}:${sourceHandle}`,
        );
        return;
      }
    }

    // Check if target is an instrument node (input port)
    if (this.instrumentInstances.has(targetId)) {
      console.log(
        `[Connection] Target is instrument: ${targetId}, port: ${targetHandle}`,
      );
      const resolved = this.resolveInstrumentPort(targetId, targetHandle, true);
      if (resolved) {
        actualTargetId = resolved.nodeId;
        actualTargetHandle = resolved.handleId;
        console.log(
          `[Connection] Resolved target to: ${actualTargetId}:${actualTargetHandle}`,
        );
      } else {
        console.warn(
          `Could not resolve instrument target port: ${targetId}:${targetHandle}`,
        );
        return;
      }
    }

    // Special case: FFT analyzer frequency output mode
    // Source handles like 'freq_out0', 'freq_out1' route from filter nodes
    let sourceNode = this.nodes.get(actualSourceId);
    if (actualSourceHandle.startsWith("freq_out")) {
      const filterKey = `${actualSourceId}-${actualSourceHandle}`;
      const filterNode = this.nodes.get(filterKey);
      console.log(
        `[FFT] Looking for filter node ${filterKey}: ${filterNode ? "FOUND" : "NOT FOUND"}`,
      );
      if (filterNode) {
        sourceNode = filterNode;
        console.log(`[FFT] Using filter node for connection`);
      }
    }

    // Special case: Keyboard outputs (freq, gate, velocity)
    // Route from the appropriate constant source sub-node
    const sourceBlockForKeyboard = this.reactFlowNodes.find(
      (n) => n.id === actualSourceId,
    );
    if (sourceBlockForKeyboard?.data?.blockType === "keyboard") {
      if (actualSourceHandle === "freq" || actualSourceHandle === "gate" || actualSourceHandle === "velocity") {
        const subNode = this.nodes.get(`${actualSourceId}-${actualSourceHandle}`);
        if (subNode) {
          sourceNode = subNode;
        }
      }
    }

    // Special case: Beat pad outputs (trigger, padIndex, velocity)
    // Route from the appropriate constant source sub-node
    if (sourceBlockForKeyboard?.data?.blockType === "beat-pad") {
      if (actualSourceHandle === "trigger" || actualSourceHandle === "padIndex" || actualSourceHandle === "velocity") {
        const subNode = this.nodes.get(`${actualSourceId}-${actualSourceHandle}`);
        if (subNode) {
          sourceNode = subNode;
        }
      }
    }

    // Special case: Effects with separate output nodes
    // These blocks use a separate output node for the mixed signal
    const sourceBlock = this.reactFlowNodes.find(
      (n) => n.id === actualSourceId,
    );
    const effectsWithOutputNode = [
      "delay",
      "chorus",
      "flanger",
      "phaser",
      "vibrato",
      "reverb",
      "crossfader",
    ];
    if (
      sourceBlock?.data?.blockType &&
      effectsWithOutputNode.includes(sourceBlock.data.blockType as string)
    ) {
      const effectOutput = this.nodes.get(`${actualSourceId}-output`);
      if (effectOutput) {
        sourceNode = effectOutput;
      }
    }

    // Special case: Envelope follower has two outputs (audio and envelope)
    // Track which output index to use for envelope-follower connections
    let envelopeFollowerOutputIndex: number | undefined;
    if (sourceBlock?.data?.blockType === "envelope-follower") {
      if (actualSourceHandle === "audio") {
        envelopeFollowerOutputIndex = 0;
      } else if (actualSourceHandle === "envelope") {
        envelopeFollowerOutputIndex = 1;
      }
    }

    const targetNode = this.nodes.get(actualTargetId);

    if (!sourceNode || !targetNode) {
      console.log(
        `[Connection] Failed: sourceNode=${!!sourceNode}, targetNode=${!!targetNode}`,
      );
      return;
    }

    // Get target block type for handle-specific routing
    // For instrument internal nodes, parse out the original node ID
    const lookupTargetId = actualTargetId.includes("::")
      ? actualTargetId.split("::")[1]
      : actualTargetId;
    const targetBlock = actualTargetId.includes("::")
      ? this.instrumentInstances
          .get(actualTargetId.split("::")[0])
          ?.definition.internalNodes.find((n) => n.id === lookupTargetId)
      : this.reactFlowNodes.find((n) => n.id === actualTargetId);
    const blockType = targetBlock?.data?.blockType as BlockType | undefined;

    try {
      switch (blockType) {
        case "sine-wave":
        case "square-wave":
        case "triangle-wave":
        case "sawtooth-wave": {
          // Wave generators: connect to AudioParams based on handle
          if (actualTargetHandle === "freq") {
            const oscillator = this.oscillators.get(actualTargetId);
            if (oscillator) {
              // Base value already set to 0 in updateGraph reset loop
              sourceNode.connect(oscillator.frequency);
            }
          } else if (actualTargetHandle === "amp") {
            // targetNode is the gain node
            if (targetNode instanceof GainNode) {
              // Base value already set to 0 in updateGraph reset loop
              sourceNode.connect(targetNode.gain);
            }
          } else if (actualTargetHandle === "phase") {
            // Phase modulation not directly supported by Web Audio API
            // Would need custom processing - for now, ignore
          }
          break;
        }

        case "noise": {
          if (actualTargetHandle === "amp") {
            // targetNode is the gain node
            if (targetNode instanceof GainNode) {
              // Base value already set to 0 in updateGraph reset loop
              sourceNode.connect(targetNode.gain);
            }
          }
          break;
        }

        case "low-pass-filter":
        case "high-pass-filter":
        case "band-pass-filter":
        case "notch-filter":
        case "allpass-filter": {
          if (actualTargetHandle === "in") {
            // Normal audio connection
            sourceNode.connect(targetNode);
          } else if (actualTargetHandle === "cutoff") {
            // Connect to filter frequency parameter
            if (targetNode instanceof BiquadFilterNode) {
              // Base value already set to 0 in updateGraph reset loop
              sourceNode.connect(targetNode.frequency);
            }
          }
          break;
        }

        case "peaking-eq": {
          if (actualTargetHandle === "in") {
            // Normal audio connection
            sourceNode.connect(targetNode);
          } else if (actualTargetHandle === "frequency") {
            // Connect to filter frequency parameter
            if (targetNode instanceof BiquadFilterNode) {
              // Base value already set to 0 in updateGraph reset loop
              sourceNode.connect(targetNode.frequency);
            }
          }
          break;
        }

        case "lowshelf-filter":
        case "highshelf-filter": {
          if (actualTargetHandle === "in") {
            // Normal audio connection
            sourceNode.connect(targetNode);
          } else if (actualTargetHandle === "cutoff") {
            // Connect to filter frequency parameter
            if (targetNode instanceof BiquadFilterNode) {
              // Base value already set to 0 in updateGraph reset loop
              sourceNode.connect(targetNode.frequency);
            }
          }
          break;
        }

        case "delay": {
          if (actualTargetHandle === "in") {
            // Audio input connects to main input gain
            sourceNode.connect(targetNode);
          } else if (actualTargetHandle === "time") {
            // Time modulation connects to delay time AudioParam
            const delayNode = this.nodes.get(`${actualTargetId}-delay`);
            if (delayNode instanceof DelayNode) {
              sourceNode.connect(delayNode.delayTime);
            }
          } else if (actualTargetHandle === "feedback") {
            // Feedback modulation connects to feedback gain
            const feedbackNode = this.nodes.get(`${actualTargetId}-feedback`);
            if (feedbackNode instanceof GainNode) {
              sourceNode.connect(feedbackNode.gain);
            }
          }
          break;
        }

        case "tremolo": {
          if (actualTargetHandle === "in") {
            // Audio input connects to main signal gain
            sourceNode.connect(targetNode);
          } else if (actualTargetHandle === "rate") {
            // Rate modulation connects to LFO frequency
            const lfo = this.nodes.get(`${actualTargetId}-lfo`);
            if (lfo instanceof OscillatorNode) {
              sourceNode.connect(lfo.frequency);
            }
          } else if (actualTargetHandle === "depth") {
            // Depth modulation connects to depth gain
            const depthNode = this.nodes.get(`${actualTargetId}-depth`);
            if (depthNode instanceof GainNode) {
              sourceNode.connect(depthNode.gain);
            }
          }
          break;
        }

        case "chorus": {
          if (actualTargetHandle === "in") {
            sourceNode.connect(targetNode);
          } else if (actualTargetHandle === "rate") {
            // Modulate all voice LFOs
            for (let i = 0; i < 4; i++) {
              const lfo = this.nodes.get(`${actualTargetId}-lfo-${i}`);
              if (lfo instanceof OscillatorNode) {
                sourceNode.connect(lfo.frequency);
              }
            }
          } else if (actualTargetHandle === "depth") {
            // Modulate all voice depth gains
            for (let i = 0; i < 4; i++) {
              const lfoGain = this.nodes.get(`${actualTargetId}-lfoGain-${i}`);
              if (lfoGain instanceof GainNode) {
                sourceNode.connect(lfoGain.gain);
              }
            }
          }
          break;
        }

        case "flanger": {
          if (actualTargetHandle === "in") {
            sourceNode.connect(targetNode);
          } else if (actualTargetHandle === "rate") {
            const lfo = this.nodes.get(`${actualTargetId}-lfo`);
            if (lfo instanceof OscillatorNode) {
              sourceNode.connect(lfo.frequency);
            }
          } else if (actualTargetHandle === "depth") {
            const lfoGain = this.nodes.get(`${actualTargetId}-lfoGain`);
            if (lfoGain instanceof GainNode) {
              sourceNode.connect(lfoGain.gain);
            }
          }
          break;
        }

        case "phaser": {
          if (actualTargetHandle === "in") {
            sourceNode.connect(targetNode);
          } else if (actualTargetHandle === "rate") {
            const lfo = this.nodes.get(`${actualTargetId}-lfo`);
            if (lfo instanceof OscillatorNode) {
              sourceNode.connect(lfo.frequency);
            }
          } else if (actualTargetHandle === "depth") {
            const lfoGain = this.nodes.get(`${actualTargetId}-lfoGain`);
            if (lfoGain instanceof GainNode) {
              sourceNode.connect(lfoGain.gain);
            }
          }
          break;
        }

        case "vibrato": {
          if (actualTargetHandle === "in") {
            sourceNode.connect(targetNode);
          } else if (actualTargetHandle === "rate") {
            const lfo = this.nodes.get(`${actualTargetId}-lfo`);
            if (lfo instanceof OscillatorNode) {
              sourceNode.connect(lfo.frequency);
            }
          } else if (actualTargetHandle === "depth") {
            const lfoGain = this.nodes.get(`${actualTargetId}-lfoGain`);
            if (lfoGain instanceof GainNode) {
              sourceNode.connect(lfoGain.gain);
            }
          }
          break;
        }

        case "reverb": {
          // Reverb only has audio input, connect to main input
          if (actualTargetHandle === "in") {
            sourceNode.connect(targetNode);
          }
          break;
        }

        case "add":
          // Both inputs connect to same node (mixing/addition)
          sourceNode.connect(targetNode);
          break;

        case "subtract":
          if (actualTargetHandle === "inputA") {
            // Input A connects directly to summer
            sourceNode.connect(targetNode);
          } else if (actualTargetHandle === "inputB") {
            // Input B connects through inverter
            const inverter = this.nodes.get(`${actualTargetId}-inverter`);
            if (inverter) {
              sourceNode.connect(inverter);
            }
          }
          break;

        case "multiply":
          if (actualTargetHandle === "inputA") {
            // Signal A passes through gain node
            sourceNode.connect(targetNode);
          } else if (actualTargetHandle === "inputB") {
            // Signal B modulates the gain parameter
            sourceNode.connect((targetNode as GainNode).gain);
          }
          break;

        case "divide":
          // AudioWorklet with 2 inputs: connect to appropriate input channel
          if (actualTargetHandle === "inputA") {
            // Connect to first input (channel 0)
            sourceNode.connect(targetNode, 0, 0);
          } else if (actualTargetHandle === "inputB") {
            // Connect to second input (channel 1)
            sourceNode.connect(targetNode, 0, 1);
          }
          break;

        case "fft-analyzer":
          // FFT analyzer: normal audio connection to input
          console.log(
            `[FFT] Connecting input: ${actualSourceId}(${actualSourceHandle}) -> ${actualTargetId}(${actualTargetHandle})`,
          );
          console.log(`[FFT] Target node type: ${targetNode.constructor.name}`);
          sourceNode.connect(targetNode);
          console.log(`[FFT] Input connected successfully`);
          break;

        case "splitter":
          // Splitter: single input fans out to multiple outputs
          // All connections go to/from the same gain node
          if (actualTargetHandle === "in") {
            sourceNode.connect(targetNode);
          }
          break;

        case "multiplexer": {
          // Multiplexer: multiple inputs selected by selector
          // AudioWorklet has N+1 inputs: input 0 = selector, inputs 1-N = signal inputs
          // Handle format: "selector" for selector, "in0", "in1", etc. for signal inputs
          if (actualTargetHandle === "selector") {
            // Selector connects to input 0
            console.log(`[MUX] Connecting selector signal to input 0`);
            sourceNode.connect(targetNode, 0, 0);
          } else if (actualTargetHandle.startsWith("in")) {
            // Parse input number from handle (e.g., "in0" -> 0, "in1" -> 1)
            const inputNum = parseInt(actualTargetHandle.slice(2), 10);
            if (!isNaN(inputNum)) {
              // Signal inputs connect to inputs 1, 2, 3, etc. (offset by 1 for selector)
              const destInput = inputNum + 1;
              console.log(
                `[MUX] Connecting ${actualSourceId}(${actualSourceHandle}) to mux input ${destInput} (handle: ${actualTargetHandle})`,
              );
              sourceNode.connect(targetNode, 0, destInput);
            }
          }
          break;
        }

        case "crossfader": {
          // Crossfader: routes inputA and inputB to their respective gain nodes
          if (actualTargetHandle === "inputA") {
            const inputANode = this.nodes.get(`${actualTargetId}-inputA`);
            if (inputANode) {
              sourceNode.connect(inputANode);
            }
          } else if (actualTargetHandle === "inputB") {
            const inputBNode = this.nodes.get(`${actualTargetId}-inputB`);
            if (inputBNode) {
              sourceNode.connect(inputBNode);
            }
          }
          break;
        }

        case "envelope-follower": {
          // Envelope follower has a single input
          if (actualTargetHandle === "in") {
            sourceNode.connect(targetNode);
          }
          break;
        }

        case "adsr": {
          // ADSR has gate and optional audio input
          // Input 0 = gate, Input 1 = audio
          if (actualTargetHandle === "gate") {
            sourceNode.connect(targetNode, 0, 0);
          } else if (actualTargetHandle === "in") {
            sourceNode.connect(targetNode, 0, 1);
          }
          break;
        }

        case "bit-crusher": {
          // Bit crusher has audio input and optional bits parameter input
          if (actualTargetHandle === "in") {
            sourceNode.connect(targetNode);
          }
          // Note: bits parameter modulation would require postMessage to the worklet
          break;
        }

        case "sample-rate-reducer": {
          // Sample rate reducer has audio input and optional rate parameter input
          if (actualTargetHandle === "in") {
            sourceNode.connect(targetNode);
          }
          // Note: rate parameter modulation would require postMessage to the worklet
          break;
        }

        default:
          // Default connection for all other block types
          console.log(
            `[Connection] Default connect: ${actualSourceId}(${actualSourceHandle}) -> ${actualTargetId}(${actualTargetHandle}), blockType=${blockType}`,
          );
          // Handle envelope-follower multi-output connections
          if (envelopeFollowerOutputIndex !== undefined) {
            sourceNode.connect(targetNode, envelopeFollowerOutputIndex, 0);
          } else {
            sourceNode.connect(targetNode);
          }
          console.log(`[Connection] Successfully connected`);
          break;
      }
    } catch (e) {
      console.error("Failed to connect nodes:", e);
    }
  }

  getAnalyser(nodeId: string): AnalyserNode | undefined {
    return this.analysers.get(nodeId);
  }

  getConstantSource(nodeId: string): ConstantSourceNode | undefined {
    return this.constantSources.get(nodeId);
  }

  updateConstantValue(nodeId: string, value: number) {
    const source = this.constantSources.get(nodeId);
    if (source) {
      source.offset.value = value;
    }
  }

  updateNodeConfig(nodeId: string, blockType: BlockType, config: BlockConfig) {
    if (!this.audioContext) return;

    const node = this.nodes.get(nodeId);
    if (!node) return;

    // Update node parameters based on block type
    switch (blockType) {
      case "sine-wave":
      case "square-wave":
      case "triangle-wave":
      case "sawtooth-wave": {
        const oscillator = this.oscillators.get(nodeId);
        if (oscillator) {
          oscillator.frequency.value = config.frequency || 440;
        }
        if (node instanceof GainNode) {
          node.gain.value = config.amplitude || 0.5;
        }
        break;
      }

      case "noise":
      case "gain": {
        if (node instanceof GainNode) {
          node.gain.value = config.gain || config.amplitude || 1.0;
        }
        break;
      }

      case "low-pass-filter":
      case "high-pass-filter":
      case "band-pass-filter":
      case "notch-filter":
      case "allpass-filter": {
        if (node instanceof BiquadFilterNode) {
          node.frequency.value = config.cutoffFrequency || 1000;
          node.Q.value = config.qFactor || 1.0;
        }
        break;
      }

      case "peaking-eq":
      case "lowshelf-filter":
      case "highshelf-filter": {
        if (node instanceof BiquadFilterNode) {
          node.frequency.value = config.cutoffFrequency || 1000;
          if (config.qFactor !== undefined) {
            node.Q.value = config.qFactor;
          }
          node.gain.value = config.filterGain || 0;
        }
        break;
      }

      case "compressor": {
        if (node instanceof DynamicsCompressorNode) {
          node.threshold.value = config.threshold ?? -24;
          node.knee.value = config.knee ?? 30;
          node.ratio.value = config.ratio ?? 12;
          node.attack.value = config.attack ?? 0.003;
          node.release.value = config.release ?? 0.25;
        }
        break;
      }

      case "waveshaper": {
        if (node instanceof WaveShaperNode) {
          const amount = (config.distortionAmount ?? 50) / 100;
          const curveType = config.distortionCurve ?? "soft-clip";
          const curve = this.generateWaveshaperCurve(curveType, amount);
          // @ts-expect-error - Float32Array type compatibility with Web Audio API
          node.curve = curve;
          node.oversample = config.oversample ?? "none";
        }
        break;
      }

      case "hard-clip": {
        if (node instanceof WaveShaperNode) {
          const threshold = config.clipThreshold ?? 0.8;
          const samples = 1024;
          const curve = new Float32Array(samples);
          for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = Math.max(-threshold, Math.min(threshold, x));
          }
          node.curve = curve;
          node.oversample = config.oversample ?? "none";
        }
        break;
      }

      case "soft-clip": {
        if (node instanceof WaveShaperNode) {
          const amount = config.softClipAmount ?? 0.5;
          const curveType = config.softClipCurve ?? "tanh";
          const curve = this.generateWaveshaperCurve(curveType, amount);
          // @ts-expect-error - Float32Array type compatibility with Web Audio API
          node.curve = curve;
          node.oversample = config.oversample ?? "none";
        }
        break;
      }

      case "delay": {
        const delayNode = this.nodes.get(`${nodeId}-delay`);
        const feedbackNode = this.nodes.get(`${nodeId}-feedback`);
        const dryNode = this.nodes.get(`${nodeId}-dry`);
        const wetNode = this.nodes.get(`${nodeId}-wet`);

        if (delayNode instanceof DelayNode) {
          delayNode.delayTime.value = config.delayTime ?? 0.3;
        }
        if (feedbackNode instanceof GainNode) {
          feedbackNode.gain.value = Math.min(config.delayFeedback ?? 0.3, 0.95);
        }
        const mix = config.delayMix ?? 0.5;
        if (dryNode instanceof GainNode) {
          dryNode.gain.value = 1.0 - mix;
        }
        if (wetNode instanceof GainNode) {
          wetNode.gain.value = mix;
        }
        break;
      }

      case "tremolo": {
        const lfo = this.nodes.get(`${nodeId}-lfo`);
        const depthNode = this.nodes.get(`${nodeId}-depth`);

        const rate = config.tremoloRate ?? 5;
        const depth = config.tremoloDepth ?? 0.5;
        const waveform = config.tremoloWaveform ?? "sine";

        if (lfo instanceof OscillatorNode) {
          lfo.type = waveform;
          lfo.frequency.value = rate;
        }
        if (depthNode instanceof GainNode) {
          depthNode.gain.value = depth * 0.5;
        }
        if (node instanceof GainNode) {
          node.gain.value = 1.0 - depth * 0.5;
        }
        break;
      }

      case "chorus": {
        const chorusRate = config.chorusRate ?? 1.5;
        const chorusDepth = config.chorusDepth ?? 0.002;
        const chorusMix = config.chorusMix ?? 0.5;
        const voices = config.chorusVoices ?? 2;

        const dryNode = this.nodes.get(`${nodeId}-dry`);
        const wetNode = this.nodes.get(`${nodeId}-wet`);

        if (dryNode instanceof GainNode) {
          dryNode.gain.value = 1.0 - chorusMix;
        }
        if (wetNode instanceof GainNode) {
          wetNode.gain.value = chorusMix / voices;
        }

        // Update all voice LFOs
        for (let i = 0; i < 4; i++) {
          const lfo = this.nodes.get(`${nodeId}-lfo-${i}`);
          const lfoGain = this.nodes.get(`${nodeId}-lfoGain-${i}`);
          if (lfo instanceof OscillatorNode) {
            lfo.frequency.value = chorusRate * (1 + i * 0.1);
          }
          if (lfoGain instanceof GainNode) {
            lfoGain.gain.value = chorusDepth;
          }
        }
        break;
      }

      case "flanger": {
        const flangerRate = config.flangerRate ?? 0.5;
        const flangerDepth = config.flangerDepth ?? 0.001;
        const flangerFeedback = config.flangerFeedback ?? 0.5;
        const flangerMix = config.flangerMix ?? 0.5;

        const lfo = this.nodes.get(`${nodeId}-lfo`);
        const lfoGain = this.nodes.get(`${nodeId}-lfoGain`);
        const feedbackNode = this.nodes.get(`${nodeId}-feedback`);
        const dryNode = this.nodes.get(`${nodeId}-dry`);
        const wetNode = this.nodes.get(`${nodeId}-wet`);

        if (lfo instanceof OscillatorNode) {
          lfo.frequency.value = flangerRate;
        }
        if (lfoGain instanceof GainNode) {
          lfoGain.gain.value = flangerDepth;
        }
        if (feedbackNode instanceof GainNode) {
          feedbackNode.gain.value = Math.max(-0.95, Math.min(0.95, flangerFeedback));
        }
        if (dryNode instanceof GainNode) {
          dryNode.gain.value = 1.0 - flangerMix;
        }
        if (wetNode instanceof GainNode) {
          wetNode.gain.value = flangerMix;
        }
        break;
      }

      case "phaser": {
        const phaserRate = config.phaserRate ?? 0.5;
        const phaserDepth = config.phaserDepth ?? 1.0;
        const phaserFeedback = config.phaserFeedback ?? 0.5;
        const phaserMix = config.phaserMix ?? 0.5;
        const baseFrequency = config.phaserBaseFrequency ?? 1000;

        const lfo = this.nodes.get(`${nodeId}-lfo`);
        const lfoGain = this.nodes.get(`${nodeId}-lfoGain`);
        const feedbackNode = this.nodes.get(`${nodeId}-feedback`);
        const dryNode = this.nodes.get(`${nodeId}-dry`);
        const wetNode = this.nodes.get(`${nodeId}-wet`);

        if (lfo instanceof OscillatorNode) {
          lfo.frequency.value = phaserRate;
        }
        if (lfoGain instanceof GainNode) {
          lfoGain.gain.value = baseFrequency * phaserDepth;
        }
        if (feedbackNode instanceof GainNode) {
          feedbackNode.gain.value = Math.max(-0.95, Math.min(0.95, phaserFeedback));
        }
        if (dryNode instanceof GainNode) {
          dryNode.gain.value = 1.0 - phaserMix;
        }
        if (wetNode instanceof GainNode) {
          wetNode.gain.value = phaserMix;
        }

        // Update allpass filter frequencies
        const stages = config.phaserStages ?? 4;
        for (let i = 0; i < stages; i++) {
          const allpass = this.nodes.get(`${nodeId}-allpass-${i}`);
          if (allpass instanceof BiquadFilterNode) {
            allpass.frequency.value = baseFrequency;
          }
        }
        break;
      }

      case "vibrato": {
        const vibratoRate = config.vibratoRate ?? 5;
        const vibratoDepth = config.vibratoDepth ?? 0.003;
        const vibratoWaveform = config.vibratoWaveform ?? "sine";

        const lfo = this.nodes.get(`${nodeId}-lfo`);
        const lfoGain = this.nodes.get(`${nodeId}-lfoGain`);

        if (lfo instanceof OscillatorNode) {
          lfo.type = vibratoWaveform;
          lfo.frequency.value = vibratoRate;
        }
        if (lfoGain instanceof GainNode) {
          lfoGain.gain.value = vibratoDepth;
        }
        break;
      }

      case "reverb": {
        const reverbMix = config.reverbMix ?? 0.3;
        const reverbPredelay = config.reverbPredelay ?? 0.02;
        const reverbPreset = (config.reverbPreset as string) ?? "medium-room";
        const reverbDecay = config.reverbDecay ?? 2.0;

        const predelayNode = this.nodes.get(`${nodeId}-predelay`);
        const dryNode = this.nodes.get(`${nodeId}-dry`);
        const wetNode = this.nodes.get(`${nodeId}-wet`);
        const convolver = this.nodes.get(`${nodeId}-convolver`);

        // Update predelay
        if (predelayNode instanceof DelayNode) {
          predelayNode.delayTime.value = reverbPredelay;
        }

        // Update dry/wet mix
        if (dryNode instanceof GainNode) {
          dryNode.gain.value = 1 - reverbMix;
        }
        if (wetNode instanceof GainNode) {
          wetNode.gain.value = reverbMix;
        }

        // Regenerate impulse response if preset or decay changed
        // Note: We need to regenerate because the impulse response is baked at creation
        if (convolver instanceof ConvolverNode && this.audioContext) {
          const presetParams = this.getReverbPresetParams(reverbPreset);
          const impulseResponse = this.generateImpulseResponse(
            presetParams.duration * (reverbDecay / 2),
            presetParams.decay / reverbDecay,
            reverbPreset,
          );
          convolver.buffer = impulseResponse;
        }
        break;
      }

      case "audio-output": {
        if (node instanceof GainNode) {
          node.gain.value = config.muted ? 0 : config.volume || 0.5;
        }
        break;
      }

      case "slider":
      case "button":
      case "toggle": {
        const source = this.constantSources.get(nodeId);
        if (source instanceof ConstantSourceNode) {
          source.offset.value = config.value || 0;
        }
        break;
      }

      case "pulse": {
        const source = this.constantSources.get(nodeId);
        if (source instanceof ConstantSourceNode) {
          source.offset.value = config.pulseValue || 1.0;
        }
        break;
      }

      case "keyboard": {
        // Update all three output constant sources
        const freqSource = this.constantSources.get(`${nodeId}-freq`);
        const gateSource = this.constantSources.get(`${nodeId}-gate`);
        const velocitySource = this.constantSources.get(`${nodeId}-velocity`);

        if (freqSource instanceof ConstantSourceNode) {
          freqSource.offset.value = config.frequency || 0;
        }
        if (gateSource instanceof ConstantSourceNode) {
          gateSource.offset.value = config.gate || 0;
        }
        if (velocitySource instanceof ConstantSourceNode) {
          velocitySource.offset.value = config.velocity || 0;
        }
        break;
      }

      case "beat-pad": {
        // Update all three output constant sources
        const triggerSource = this.constantSources.get(`${nodeId}-trigger`);
        const padIndexSource = this.constantSources.get(`${nodeId}-padIndex`);
        const velocitySource = this.constantSources.get(`${nodeId}-velocity`);

        if (triggerSource instanceof ConstantSourceNode) {
          triggerSource.offset.value = config.trigger || 0;
        }
        if (padIndexSource instanceof ConstantSourceNode) {
          padIndexSource.offset.value = config.activePad ?? -1;
        }
        if (velocitySource instanceof ConstantSourceNode) {
          velocitySource.offset.value = config.velocity || 0;
        }
        break;
      }

      case "crossfader": {
        // Update crossfader gain values based on position and curve type
        const position = (config.position as number) ?? 0.5;
        const curveType = (config.curveType as string) ?? "equal-power";

        const { gainA, gainB } = this.calculateCrossfadeGains(position, curveType);

        const inputANode = this.nodes.get(`${nodeId}-inputA`);
        const inputBNode = this.nodes.get(`${nodeId}-inputB`);

        if (inputANode instanceof GainNode) {
          inputANode.gain.value = gainA;
        }
        if (inputBNode instanceof GainNode) {
          inputBNode.gain.value = gainB;
        }
        break;
      }

      case "multiplexer": {
        // Send selector value to AudioWorklet via postMessage
        console.log(
          `[MUX Config] Updating selector to ${config.selectorValue}, node type: ${node.constructor.name}`,
        );
        if (node instanceof AudioWorkletNode) {
          node.port.postMessage({
            type: "setSelector",
            value: config.selectorValue ?? 0,
          });
          console.log(`[MUX Config] Sent setSelector message`);
        } else {
          console.warn(`[MUX Config] Node is not AudioWorkletNode`);
        }
        break;
      }

      case "oscilloscope":
      case "numeric-meter": {
        const analyser = this.analysers.get(nodeId);
        if (analyser && node instanceof AnalyserNode) {
          // Recalculate fftSize based on new timeWindow
          const timeWindow = config.timeWindow || 0.05;
          const sampleRate = this.audioContext!.sampleRate;
          const desiredSamples = timeWindow * sampleRate;

          let fftSize = 32;
          while (fftSize < desiredSamples * 2 && fftSize < 32768) {
            fftSize *= 2;
          }

          analyser.fftSize = Math.min(fftSize, 32768);
        }
        break;
      }

      case "fft-analyzer": {
        const mode = config.fftMode || "spectrum";

        // Check if node structure matches the current mode
        // If not, we need to recreate the node (mode was switched)
        const currentNode = this.nodes.get(nodeId);
        let needsRecreation = false;

        if (mode === "spectrum" || mode === "peak-detection") {
          // Should be an AnalyserNode
          needsRecreation = !(currentNode instanceof AnalyserNode);
        } else if (mode === "frequency-output") {
          // Should be a GainNode with filter sub-nodes
          needsRecreation = !(currentNode instanceof GainNode);
        } else if (mode === "spectral-processing") {
          // Should be a BiquadFilterNode
          needsRecreation = !(currentNode instanceof BiquadFilterNode);
        }

        // If mode changed, recreate the node
        if (needsRecreation) {
          console.log(`[FFT] Mode changed, recreating node ${nodeId}`);

          // Disconnect old nodes before removing
          const oldNode = this.nodes.get(nodeId);
          if (oldNode) {
            console.log(`[FFT] Disconnecting old node ${nodeId}`);
            oldNode.disconnect();
          }

          // Disconnect frequency output sub-nodes if they exist
          const numOutputs = config.numFrequencyOutputs || 4;
          for (let i = 0; i < numOutputs; i++) {
            const filterNode = this.nodes.get(`${nodeId}-freq_out${i}`);
            if (filterNode) {
              console.log(
                `[FFT] Disconnecting old filter ${nodeId}-freq_out${i}`,
              );
              filterNode.disconnect();
            }
            this.nodes.delete(`${nodeId}-freq_out${i}`);
          }

          // Remove old nodes from maps
          this.nodes.delete(nodeId);
          this.analysers.delete(nodeId);
          this.oscillators.delete(nodeId);
          this.constantSources.delete(nodeId);

          // Recreate node with new mode
          switch (mode) {
            case "spectrum":
            case "peak-detection":
              this.createFFTAnalyzer(nodeId, config);
              break;
            case "frequency-output":
              this.createFFTFrequencyOutput(nodeId, config);
              break;
            case "spectral-processing":
              this.createFFTSpectralProcessor(nodeId, config);
              break;
          }

          // Force graph update to reconnect edges after node recreation
          if (this.reactFlowNodes && this.reactFlowEdges) {
            this.updateGraph(this.reactFlowNodes, this.reactFlowEdges);
          }
          return;
        }

        // Update analyser parameters for modes that use it
        if (mode === "spectrum" || mode === "peak-detection") {
          const analyser = this.analysers.get(nodeId);
          if (analyser instanceof AnalyserNode) {
            analyser.fftSize = config.fftSize || 2048;
            analyser.smoothingTimeConstant =
              config.smoothingTimeConstant ?? 0.8;
            analyser.minDecibels = config.minDecibels ?? -90;
            analyser.maxDecibels = config.maxDecibels ?? -10;
          }
        } else if (mode === "frequency-output") {
          // Update bandpass filter parameters
          const numOutputs = config.numFrequencyOutputs || 4;
          const bins = config.frequencyBins || [];
          const nyquist = this.audioContext!.sampleRate / 2;
          const fftSize = config.fftSize || 2048;
          const binWidth = nyquist / (fftSize / 2);

          for (let i = 0; i < numOutputs; i++) {
            const bin = bins[i];
            if (!bin) continue;

            const filter = this.nodes.get(`${nodeId}-freq_out${i}`);
            if (filter instanceof BiquadFilterNode) {
              const startFreq = bin.start * binWidth;
              const endFreq = bin.end * binWidth;
              const centerFreq = (startFreq + endFreq) / 2;
              const bandwidth = endFreq - startFreq;

              filter.frequency.value = centerFreq;
              filter.Q.value = bandwidth > 0 ? centerFreq / bandwidth : 1.0;
            }
          }
        } else if (mode === "spectral-processing") {
          // Update filter parameters
          if (node instanceof BiquadFilterNode) {
            const operation = config.spectralOperation || "passthrough";
            const frequency = config.operationFrequency || 1000;
            const gain = config.operationGain || 0;

            switch (operation) {
              case "low-shelf":
                node.type = "lowshelf";
                node.frequency.value = frequency;
                node.gain.value = gain;
                break;

              case "high-shelf":
                node.type = "highshelf";
                node.frequency.value = frequency;
                node.gain.value = gain;
                break;

              case "notch-band":
                node.type = "notch";
                node.frequency.value = frequency;
                node.Q.value = 10;
                break;

              case "passthrough":
              default:
                node.type = "allpass";
                node.frequency.value = frequency;
                break;
            }
          }
        }
        break;
      }

      case "envelope-follower": {
        const attack = config.envelopeAttack ?? 0.01;
        const release = config.envelopeRelease ?? 0.1;

        if (node instanceof AudioWorkletNode) {
          node.port.postMessage({ type: "setAttack", value: attack });
          node.port.postMessage({ type: "setRelease", value: release });
        }
        break;
      }

      case "adsr": {
        const attack = config.adsrAttack ?? 0.01;
        const decay = config.adsrDecay ?? 0.1;
        const sustain = config.adsrSustain ?? 0.7;
        const release = config.adsrRelease ?? 0.5;

        if (node instanceof AudioWorkletNode) {
          node.port.postMessage({ type: "setAttack", value: attack });
          node.port.postMessage({ type: "setDecay", value: decay });
          node.port.postMessage({ type: "setSustain", value: sustain });
          node.port.postMessage({ type: "setRelease", value: release });
        }
        break;
      }

      case "bit-crusher": {
        const bits = config.crusherBits ?? 8;
        const mix = config.crusherMix ?? 1.0;

        if (node instanceof AudioWorkletNode) {
          node.port.postMessage({ type: "setBits", value: bits });
          node.port.postMessage({ type: "setMix", value: mix });
        }
        break;
      }

      case "sample-rate-reducer": {
        const targetSampleRate = config.reducerSampleRate ?? 8000;
        const mix = config.reducerMix ?? 1.0;

        if (node instanceof AudioWorkletNode) {
          node.port.postMessage({
            type: "setTargetSampleRate",
            value: targetSampleRate,
          });
          node.port.postMessage({ type: "setMix", value: mix });
        }
        break;
      }
    }
  }

  /**
   * Expand an instrument into its internal audio nodes
   */
  private expandInstrument(
    instrumentNodeId: string,
    definition: InstrumentDefinition,
  ) {
    if (!this.audioContext) return;

    console.log(
      `[Instrument] Expanding instrument ${instrumentNodeId}: "${definition.metadata.name}"`,
    );
    console.log(
      `[Instrument] Internal nodes: ${definition.internalNodes.length}, edges: ${definition.internalEdges.length}`,
    );
    console.log(
      `[Instrument] External ports: ${definition.externalPorts.length}, mappings: ${definition.portMappings.length}`,
    );

    const internalNodeIds: string[] = [];

    // Create internal nodes with namespaced IDs
    definition.internalNodes.forEach((node) => {
      const internalId = `${instrumentNodeId}::${node.id}`;
      const blockType = node.data.blockType as BlockType;
      const config = node.data.config as BlockConfig;

      console.log(
        `[Instrument] Creating internal node: ${internalId} (${blockType})`,
      );
      this.createAudioNode(internalId, blockType, config);
      internalNodeIds.push(internalId);
    });

    // Set up internal connections
    definition.internalEdges.forEach((edge) => {
      const sourceId = `${instrumentNodeId}::${edge.source}`;
      const targetId = `${instrumentNodeId}::${edge.target}`;
      console.log(
        `[Instrument] Internal connection: ${sourceId}(${edge.sourceHandle}) -> ${targetId}(${edge.targetHandle})`,
      );
      this.connectNodes(
        sourceId,
        edge.sourceHandle!,
        targetId,
        edge.targetHandle!,
      );
    });

    // Log port mappings for debugging
    definition.portMappings.forEach((mapping) => {
      console.log(
        `[Instrument] Port mapping: ${mapping.externalPortId} -> ${mapping.internalNodeId}:${mapping.internalPortId}`,
      );
    });

    // Store the instrument instance
    this.instrumentInstances.set(instrumentNodeId, {
      definition,
      internalNodeIds,
    });

    console.log(`[Instrument] Expansion complete for ${instrumentNodeId}`);
  }

  /**
   * Clean up an instrument and all its internal nodes
   */
  private cleanupInstrument(instrumentNodeId: string) {
    const instance = this.instrumentInstances.get(instrumentNodeId);
    if (!instance) return;

    // Remove all internal nodes
    instance.internalNodeIds.forEach((internalId) => {
      const node = this.nodes.get(internalId);
      if (node) {
        try {
          node.disconnect();
        } catch {
          // Already disconnected
        }
      }

      // Stop oscillators
      const oscillator = this.oscillators.get(internalId);
      if (oscillator) {
        try {
          oscillator.stop();
        } catch {
          // Already stopped
        }
        this.oscillators.delete(internalId);
      }

      // Stop constant sources
      const constantSource = this.constantSources.get(internalId);
      if (constantSource) {
        try {
          constantSource.stop();
        } catch {
          // Already stopped
        }
        this.constantSources.delete(internalId);
      }

      // Remove helper nodes (inverter for subtraction)
      const helperNode = this.nodes.get(`${internalId}-inverter`);
      if (helperNode) {
        try {
          helperNode.disconnect();
        } catch {
          // Already disconnected
        }
        this.nodes.delete(`${internalId}-inverter`);
      }

      this.nodes.delete(internalId);
      this.analysers.delete(internalId);
    });

    this.instrumentInstances.delete(instrumentNodeId);
  }

  /**
   * Resolve an instrument port to its internal node and port
   * Returns the actual internal node ID and port handle to connect to
   */
  private resolveInstrumentPort(
    instrumentNodeId: string,
    externalPortId: string,
    isInput: boolean,
  ): { nodeId: string; handleId: string } | null {
    const instance = this.instrumentInstances.get(instrumentNodeId);
    if (!instance) {
      console.warn(
        `[Instrument] No instance found for instrument ${instrumentNodeId}`,
      );
      return null;
    }

    const { definition } = instance;

    console.log(
      `[Instrument] Resolving ${isInput ? "input" : "output"} port: ${externalPortId} on ${instrumentNodeId}`,
    );
    console.log(
      `[Instrument] Available mappings:`,
      definition.portMappings.map(
        (m) => `${m.externalPortId} -> ${m.internalNodeId}:${m.internalPortId}`,
      ),
    );

    // Find the port mapping for this external port
    const mapping = definition.portMappings.find(
      (m: PortMapping) => m.externalPortId === externalPortId,
    );

    if (!mapping) {
      console.warn(
        `[Instrument] No mapping found for external port ${externalPortId} on instrument ${instrumentNodeId}`,
      );
      return null;
    }

    const result = {
      nodeId: `${instrumentNodeId}::${mapping.internalNodeId}`,
      handleId: mapping.internalPortId,
    };

    console.log(
      `[Instrument] Resolved to: ${result.nodeId}:${result.handleId}`,
    );

    // Return the internal node ID (namespaced) and port handle
    return result;
  }

  /**
   * Check if a node ID is an instrument node
   */
  isInstrumentNode(nodeId: string): boolean {
    return this.instrumentInstances.has(nodeId);
  }
}
