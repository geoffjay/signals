import { type Node, type Edge } from '@xyflow/react';
import { type BlockType, type BlockConfig } from '@/types/blocks';

export class SignalProcessingEngine {
  private audioContext: AudioContext | null = null;
  private nodes: Map<string, AudioNode | OscillatorNode | GainNode | BiquadFilterNode> = new Map();
  private oscillators: Map<string, OscillatorNode> = new Map();
  private analysers: Map<string, AnalyserNode> = new Map();
  private constantSources: Map<string, ConstantSourceNode> = new Map();
  private reactFlowNodes: Node[] = [];
  private reactFlowEdges: Edge[] = [];
  private isRunning = false;

  async start() {
    if (this.isRunning) return;

    // Create audio context if it doesn't exist
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    // Resume audio context if suspended
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // Register AudioWorklet processor for division
    try {
      // Use relative path to respect Vite's base configuration
      const basePath = import.meta.env.BASE_URL || '/';
      await this.audioContext.audioWorklet.addModule(`${basePath}divide-processor.js`);
    } catch (e) {
      console.error('Failed to load divide-processor AudioWorklet:', e);
    }

    // Register AudioWorklet processors for math operations
    try {
      const basePath = import.meta.env.BASE_URL || '/';
      await this.audioContext.audioWorklet.addModule(`${basePath}math-processors.js`);
    } catch (e) {
      console.error('Failed to load math-processors AudioWorklet:', e);
    }

    this.isRunning = true;
  }

  stop() {
    if (!this.isRunning) return;

    // Stop all oscillators
    this.oscillators.forEach((osc) => {
      try {
        osc.stop();
      } catch (e) {
        // Oscillator might already be stopped
      }
    });

    // Stop all constant sources
    this.constantSources.forEach((source) => {
      try {
        source.stop();
      } catch (e) {
        // Source might already be stopped
      }
    });

    this.oscillators.clear();
    this.constantSources.clear();
    this.nodes.clear();
    this.analysers.clear();

    this.isRunning = false;
  }

  updateGraph(nodes: Node[], edges: Edge[]) {
    if (!this.isRunning || !this.audioContext) return;

    // Store nodes and edges for connection routing logic
    this.reactFlowNodes = nodes;
    this.reactFlowEdges = edges;

    // Get current node IDs
    const currentNodeIds = new Set(Array.from(this.nodes.keys()));
    const newNodeIds = new Set(nodes.map(n => n.id));

    // Find nodes to remove (excluding internal helper nodes like FFT filters and inverters)
    const nodesToRemove = Array.from(currentNodeIds).filter(id =>
      !newNodeIds.has(id) &&
      !id.includes('-freq_out') &&  // FFT filter sub-nodes
      !id.includes('-inverter')     // Subtraction inverter nodes
    );

    // Find nodes to add
    const nodesToAdd = nodes.filter(node => !currentNodeIds.has(node.id));

    // Remove deleted nodes
    nodesToRemove.forEach(nodeId => {
      const node = this.nodes.get(nodeId);
      if (node) {
        try {
          node.disconnect();
        } catch (e) {
          // Already disconnected
        }
      }

      // Stop and remove oscillator if it exists
      const oscillator = this.oscillators.get(nodeId);
      if (oscillator) {
        try {
          oscillator.stop();
        } catch (e) {
          // Already stopped
        }
        this.oscillators.delete(nodeId);
      }

      // Stop and remove constant source if it exists
      const constantSource = this.constantSources.get(nodeId);
      if (constantSource) {
        try {
          constantSource.stop();
        } catch (e) {
          // Already stopped
        }
        this.constantSources.delete(nodeId);
      }

      // Remove helper nodes (e.g., inverter for subtraction)
      const helperNode = this.nodes.get(`${nodeId}-inverter`);
      if (helperNode) {
        try {
          helperNode.disconnect();
        } catch (e) {
          // Already disconnected
        }
        this.nodes.delete(`${nodeId}-inverter`);
      }

      this.nodes.delete(nodeId);
      this.analysers.delete(nodeId);
    });

    // Add new nodes
    nodesToAdd.forEach((node) => {
      const blockType = node.data.blockType as BlockType;
      const config = node.data.config as BlockConfig;
      this.createAudioNode(node.id, blockType, config);
    });

    // Rebuild all connections (simpler than tracking connection changes)
    // First disconnect everything EXCEPT FFT filter sub-nodes (preserve internal FFT structure)
    this.nodes.forEach((node, nodeId) => {
      // Skip FFT filter sub-nodes - they maintain internal connections
      if (nodeId.includes('-freq_out')) {
        return;
      }
      try {
        node.disconnect();
      } catch (e) {
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
        return edges.some(edge => edge.target === node.id && edge.targetHandle === handleId);
      };

      switch (blockType) {
        case 'sine-wave':
        case 'square-wave':
        case 'triangle-wave':
        case 'sawtooth-wave': {
          const oscillator = this.oscillators.get(node.id);
          // Only set frequency if NOT connected
          if (oscillator && !isInputConnected('freq')) {
            oscillator.frequency.value = config.frequency || 440;
          } else if (oscillator && isInputConnected('freq')) {
            // If connected, set base to 0 so signal directly controls it
            oscillator.frequency.value = 0;
          }

          // Only set amplitude if NOT connected
          if (audioNode instanceof GainNode && !isInputConnected('amp')) {
            audioNode.gain.value = config.amplitude || 0.5;
          } else if (audioNode instanceof GainNode && isInputConnected('amp')) {
            // If connected, set base to 0 so signal directly controls it
            audioNode.gain.value = 0;
          }
          break;
        }

        case 'noise': {
          // Only set amplitude if NOT connected
          if (audioNode instanceof GainNode && !isInputConnected('amp')) {
            audioNode.gain.value = config.amplitude || 0.5;
          } else if (audioNode instanceof GainNode && isInputConnected('amp')) {
            // If connected, set base to 0 so signal directly controls it
            audioNode.gain.value = 0;
          }
          break;
        }

        case 'low-pass-filter':
        case 'high-pass-filter':
        case 'band-pass-filter': {
          // Only set cutoff if NOT connected
          if (audioNode instanceof BiquadFilterNode && !isInputConnected('cutoff')) {
            audioNode.frequency.value = config.cutoffFrequency || 1000;
          } else if (audioNode instanceof BiquadFilterNode && isInputConnected('cutoff')) {
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
        } catch (e) {
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
        } catch (e) {
          // Connection failed
        }
      }
    });

    // Reconnect audio outputs to destination
    // Audio output nodes need to stay connected to speakers
    nodes.forEach((node) => {
      if (node.data.blockType === 'audio-output') {
        const audioOutputNode = this.nodes.get(node.id);
        if (audioOutputNode && this.audioContext) {
          try {
            audioOutputNode.connect(this.audioContext.destination);
          } catch (e) {
            // Already connected
          }
        }
      }
    });

    // Apply new connections from edges
    edges.forEach((edge) => {
      this.connectNodes(edge.source, edge.sourceHandle!, edge.target, edge.targetHandle!);
    });

    // Reconnect FFT frequency-output internal connections (inputGain -> filters)
    // These are internal connections that need to be maintained after disconnection
    nodes.forEach((node) => {
      if (node.data.blockType === 'fft-analyzer') {
        const config = node.data.config as BlockConfig;
        if (config.fftMode === 'frequency-output') {
          const inputGain = this.nodes.get(node.id);
          const numOutputs = config.numFrequencyOutputs || 4;

          if (inputGain) {
            for (let i = 0; i < numOutputs; i++) {
              const filter = this.nodes.get(`${node.id}-freq_out${i}`);
              if (filter) {
                try {
                  inputGain.connect(filter);
                } catch (e) {
                  // Already connected
                }
              }
            }
          }
        }
      }
    });
  }

  private createAudioNode(nodeId: string, blockType: BlockType, config: BlockConfig) {
    if (!this.audioContext) return;

    switch (blockType) {
      case 'sine-wave':
      case 'square-wave':
      case 'triangle-wave':
      case 'sawtooth-wave':
        this.createOscillator(nodeId, blockType, config);
        break;

      case 'noise':
        this.createNoiseGenerator(nodeId, config);
        break;

      case 'gain':
        this.createGainNode(nodeId, config);
        break;

      case 'low-pass-filter':
        this.createFilter(nodeId, 'lowpass', config);
        break;

      case 'high-pass-filter':
        this.createFilter(nodeId, 'highpass', config);
        break;

      case 'band-pass-filter':
        this.createFilter(nodeId, 'bandpass', config);
        break;

      case 'splitter':
        this.createSplitter(nodeId);
        break;

      case 'oscilloscope':
        this.createAnalyser(nodeId, config);
        break;

      case 'audio-output':
        this.createAudioOutput(nodeId, config);
        break;

      case 'slider':
      case 'button':
      case 'toggle':
      case 'pulse':
        this.createConstantSource(nodeId, config);
        break;

      case 'numeric-meter':
        this.createAnalyser(nodeId, config);
        break;

      case 'add':
        this.createAddNode(nodeId);
        break;

      case 'subtract':
        this.createSubtractNode(nodeId);
        break;

      case 'multiply':
        this.createMultiplyNode(nodeId);
        break;

      case 'divide':
        this.createDivideNode(nodeId);
        break;

      case 'fft-analyzer': {
        const mode = config.fftMode || 'spectrum';
        switch (mode) {
          case 'spectrum':
          case 'peak-detection':
            this.createFFTAnalyzer(nodeId, config);
            break;
          case 'frequency-output':
            this.createFFTFrequencyOutput(nodeId, config);
            break;
          case 'spectral-processing':
            this.createFFTSpectralProcessor(nodeId, config);
            break;
        }
        break;
      }

      case 'ceil':
        this.createMathNode(nodeId, 'ceil-processor');
        break;

      case 'floor':
        this.createMathNode(nodeId, 'floor-processor');
        break;

      case 'round':
        this.createMathNode(nodeId, 'round-processor');
        break;

      case 'abs':
        this.createMathNode(nodeId, 'abs-processor');
        break;

      case 'sign':
        this.createMathNode(nodeId, 'sign-processor');
        break;

      case 'negate':
        this.createNegateNode(nodeId);
        break;

      case 'sqrt':
        this.createMathNode(nodeId, 'sqrt-processor');
        break;

      case 'sin':
        this.createMathNode(nodeId, 'sin-processor');
        break;

      case 'cos':
        this.createMathNode(nodeId, 'cos-processor');
        break;

      case 'min':
        this.createTwoInputMathNode(nodeId, 'min-processor');
        break;

      case 'max':
        this.createTwoInputMathNode(nodeId, 'max-processor');
        break;

      case 'pow':
        this.createTwoInputMathNode(nodeId, 'pow-processor');
        break;

      case 'mod':
        this.createTwoInputMathNode(nodeId, 'mod-processor');
        break;

      case 'clamp':
        this.createThreeInputMathNode(nodeId, 'clamp-processor');
        break;

      // Note: Multiplexer is complex and would need custom processing
      // For now, we'll skip it or implement a simplified version
    }
  }

  private createOscillator(nodeId: string, blockType: BlockType, config: BlockConfig) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();

    // Set waveform type
    switch (blockType) {
      case 'sine-wave':
        oscillator.type = 'sine';
        break;
      case 'square-wave':
        oscillator.type = 'square';
        break;
      case 'triangle-wave':
        oscillator.type = 'triangle';
        break;
      case 'sawtooth-wave':
        oscillator.type = 'sawtooth';
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
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
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

  private createFilter(nodeId: string, type: BiquadFilterType, config: BlockConfig) {
    if (!this.audioContext) return;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = config.cutoffFrequency || 1000;
    filter.Q.value = config.qFactor || 1.0;

    this.nodes.set(nodeId, filter);
  }

  private createSplitter(nodeId: string) {
    if (!this.audioContext) return;

    // A splitter is just a gain node with gain = 1
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 1.0;

    this.nodes.set(nodeId, gainNode);
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
    gainNode.gain.value = config.muted ? 0 : (config.volume || 0.5);

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
      const divideNode = new AudioWorkletNode(this.audioContext, 'divide-processor', {
        numberOfInputs: 2,
        numberOfOutputs: 1,
        outputChannelCount: [1]
      });

      this.nodes.set(nodeId, divideNode);
    } catch (e) {
      console.error('Failed to create divide AudioWorkletNode:', e);
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
        outputChannelCount: [1]
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
        outputChannelCount: [1]
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
        outputChannelCount: [1]
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

    console.log(`[FFT] Creating frequency output for ${nodeId}, numOutputs=${numOutputs}`);

    // Create input splitter
    const inputGain = this.audioContext.createGain();
    inputGain.gain.value = 1.0;

    // Create band-pass filters for each output
    for (let i = 0; i < numOutputs; i++) {
      const bin = bins[i];
      if (!bin) continue;

      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'bandpass';

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

      console.log(`[FFT] Filter ${i} (${bin.label}): ${startFreq.toFixed(1)}-${endFreq.toFixed(1)} Hz, center=${centerFreq.toFixed(1)} Hz, Q=${filter.Q.value.toFixed(2)}`);

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

    const operation = config.spectralOperation || 'passthrough';
    const frequency = config.operationFrequency || 1000;
    const gain = config.operationGain || 0;

    // Create filter chain based on operation
    const filter = this.audioContext.createBiquadFilter();

    switch (operation) {
      case 'low-shelf':
        filter.type = 'lowshelf';
        filter.frequency.value = frequency;
        filter.gain.value = gain;
        break;

      case 'high-shelf':
        filter.type = 'highshelf';
        filter.frequency.value = frequency;
        filter.gain.value = gain;
        break;

      case 'notch-band':
        filter.type = 'notch';
        filter.frequency.value = frequency;
        filter.Q.value = 10; // Narrow notch
        break;

      case 'passthrough':
      default:
        filter.type = 'allpass';
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

  private connectNodes(sourceId: string, sourceHandle: string, targetId: string, targetHandle: string) {
    // Special case: FFT analyzer frequency output mode
    // Source handles like 'freq_out0', 'freq_out1' route from filter nodes
    let sourceNode = this.nodes.get(sourceId);
    if (sourceHandle.startsWith('freq_out')) {
      const filterKey = `${sourceId}-${sourceHandle}`;
      const filterNode = this.nodes.get(filterKey);
      console.log(`[FFT] Looking for filter node ${filterKey}: ${filterNode ? 'FOUND' : 'NOT FOUND'}`);
      if (filterNode) {
        sourceNode = filterNode;
        console.log(`[FFT] Using filter node for connection`);
      }
    }

    const targetNode = this.nodes.get(targetId);

    if (!sourceNode || !targetNode) {
      console.log(`[Connection] Failed: sourceNode=${!!sourceNode}, targetNode=${!!targetNode}`);
      return;
    }

    // Get target block type for handle-specific routing
    const targetBlock = this.reactFlowNodes.find(n => n.id === targetId);
    const blockType = targetBlock?.data?.blockType as BlockType | undefined;

    try {
      switch (blockType) {
        case 'sine-wave':
        case 'square-wave':
        case 'triangle-wave':
        case 'sawtooth-wave': {
          // Wave generators: connect to AudioParams based on handle
          if (targetHandle === 'freq') {
            const oscillator = this.oscillators.get(targetId);
            if (oscillator) {
              // Base value already set to 0 in updateGraph reset loop
              sourceNode.connect(oscillator.frequency);
            }
          } else if (targetHandle === 'amp') {
            // targetNode is the gain node
            if (targetNode instanceof GainNode) {
              // Base value already set to 0 in updateGraph reset loop
              sourceNode.connect(targetNode.gain);
            }
          } else if (targetHandle === 'phase') {
            // Phase modulation not directly supported by Web Audio API
            // Would need custom processing - for now, ignore
          }
          break;
        }

        case 'noise': {
          if (targetHandle === 'amp') {
            // targetNode is the gain node
            if (targetNode instanceof GainNode) {
              // Base value already set to 0 in updateGraph reset loop
              sourceNode.connect(targetNode.gain);
            }
          }
          break;
        }

        case 'low-pass-filter':
        case 'high-pass-filter':
        case 'band-pass-filter': {
          if (targetHandle === 'in') {
            // Normal audio connection
            sourceNode.connect(targetNode);
          } else if (targetHandle === 'cutoff') {
            // Connect to filter frequency parameter
            if (targetNode instanceof BiquadFilterNode) {
              // Base value already set to 0 in updateGraph reset loop
              sourceNode.connect(targetNode.frequency);
            }
          }
          break;
        }

        case 'add':
          // Both inputs connect to same node (mixing/addition)
          sourceNode.connect(targetNode);
          break;

        case 'subtract':
          if (targetHandle === 'inputA') {
            // Input A connects directly to summer
            sourceNode.connect(targetNode);
          } else if (targetHandle === 'inputB') {
            // Input B connects through inverter
            const inverter = this.nodes.get(`${targetId}-inverter`);
            if (inverter) {
              sourceNode.connect(inverter);
            }
          }
          break;

        case 'multiply':
          if (targetHandle === 'inputA') {
            // Signal A passes through gain node
            sourceNode.connect(targetNode);
          } else if (targetHandle === 'inputB') {
            // Signal B modulates the gain parameter
            sourceNode.connect((targetNode as GainNode).gain);
          }
          break;

        case 'divide':
          // AudioWorklet with 2 inputs: connect to appropriate input channel
          if (targetHandle === 'inputA') {
            // Connect to first input (channel 0)
            sourceNode.connect(targetNode, 0, 0);
          } else if (targetHandle === 'inputB') {
            // Connect to second input (channel 1)
            sourceNode.connect(targetNode, 0, 1);
          }
          break;

        case 'fft-analyzer':
          // FFT analyzer: normal audio connection to input
          console.log(`[FFT] Connecting input: ${sourceId}(${sourceHandle}) -> ${targetId}(${targetHandle})`);
          console.log(`[FFT] Target node type: ${targetNode.constructor.name}`);
          sourceNode.connect(targetNode);
          console.log(`[FFT] Input connected successfully`);
          break;

        default:
          // Default connection for all other block types
          console.log(`[Connection] Default connect: ${sourceId}(${sourceHandle}) -> ${targetId}(${targetHandle}), blockType=${blockType}`);
          sourceNode.connect(targetNode);
          console.log(`[Connection] Successfully connected`);
          break;
      }
    } catch (e) {
      console.error('Failed to connect nodes:', e);
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
      case 'sine-wave':
      case 'square-wave':
      case 'triangle-wave':
      case 'sawtooth-wave': {
        const oscillator = this.oscillators.get(nodeId);
        if (oscillator) {
          oscillator.frequency.value = config.frequency || 440;
        }
        if (node instanceof GainNode) {
          node.gain.value = config.amplitude || 0.5;
        }
        break;
      }

      case 'noise':
      case 'gain': {
        if (node instanceof GainNode) {
          node.gain.value = config.gain || config.amplitude || 1.0;
        }
        break;
      }

      case 'low-pass-filter':
      case 'high-pass-filter':
      case 'band-pass-filter': {
        if (node instanceof BiquadFilterNode) {
          node.frequency.value = config.cutoffFrequency || 1000;
          node.Q.value = config.qFactor || 1.0;
        }
        break;
      }

      case 'audio-output': {
        if (node instanceof GainNode) {
          node.gain.value = config.muted ? 0 : (config.volume || 0.5);
        }
        break;
      }

      case 'slider':
      case 'button':
      case 'toggle': {
        const source = this.constantSources.get(nodeId);
        if (source instanceof ConstantSourceNode) {
          source.offset.value = config.value || 0;
        }
        break;
      }

      case 'pulse': {
        const source = this.constantSources.get(nodeId);
        if (source instanceof ConstantSourceNode) {
          source.offset.value = config.pulseValue || 1.0;
        }
        break;
      }

      case 'oscilloscope':
      case 'numeric-meter': {
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

      case 'fft-analyzer': {
        const mode = config.fftMode || 'spectrum';

        // Check if node structure matches the current mode
        // If not, we need to recreate the node (mode was switched)
        const currentNode = this.nodes.get(nodeId);
        let needsRecreation = false;

        if (mode === 'spectrum' || mode === 'peak-detection') {
          // Should be an AnalyserNode
          needsRecreation = !(currentNode instanceof AnalyserNode);
        } else if (mode === 'frequency-output') {
          // Should be a GainNode with filter sub-nodes
          needsRecreation = !(currentNode instanceof GainNode);
        } else if (mode === 'spectral-processing') {
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
              console.log(`[FFT] Disconnecting old filter ${nodeId}-freq_out${i}`);
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
            case 'spectrum':
            case 'peak-detection':
              this.createFFTAnalyzer(nodeId, config);
              break;
            case 'frequency-output':
              this.createFFTFrequencyOutput(nodeId, config);
              break;
            case 'spectral-processing':
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
        if (mode === 'spectrum' || mode === 'peak-detection') {
          const analyser = this.analysers.get(nodeId);
          if (analyser instanceof AnalyserNode) {
            analyser.fftSize = config.fftSize || 2048;
            analyser.smoothingTimeConstant = config.smoothingTimeConstant ?? 0.8;
            analyser.minDecibels = config.minDecibels ?? -90;
            analyser.maxDecibels = config.maxDecibels ?? -10;
          }
        } else if (mode === 'frequency-output') {
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
        } else if (mode === 'spectral-processing') {
          // Update filter parameters
          if (node instanceof BiquadFilterNode) {
            const operation = config.spectralOperation || 'passthrough';
            const frequency = config.operationFrequency || 1000;
            const gain = config.operationGain || 0;

            switch (operation) {
              case 'low-shelf':
                node.type = 'lowshelf';
                node.frequency.value = frequency;
                node.gain.value = gain;
                break;

              case 'high-shelf':
                node.type = 'highshelf';
                node.frequency.value = frequency;
                node.gain.value = gain;
                break;

              case 'notch-band':
                node.type = 'notch';
                node.frequency.value = frequency;
                node.Q.value = 10;
                break;

              case 'passthrough':
              default:
                node.type = 'allpass';
                node.frequency.value = frequency;
                break;
            }
          }
        }
        break;
      }
    }
  }
}
