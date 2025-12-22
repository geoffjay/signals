import { type Node, type Edge } from '@xyflow/react';
import { type BlockType, type BlockConfig } from '@/types/blocks';

export class SignalProcessingEngine {
  private audioContext: AudioContext | null = null;
  private nodes: Map<string, AudioNode | OscillatorNode | GainNode | BiquadFilterNode> = new Map();
  private oscillators: Map<string, OscillatorNode> = new Map();
  private analysers: Map<string, AnalyserNode> = new Map();
  private constantSources: Map<string, ConstantSourceNode> = new Map();
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

    // Get current node IDs
    const currentNodeIds = new Set(Array.from(this.nodes.keys()));
    const newNodeIds = new Set(nodes.map(n => n.id));

    // Find nodes to remove
    const nodesToRemove = Array.from(currentNodeIds).filter(id => !newNodeIds.has(id));

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
    // First disconnect everything
    this.nodes.forEach((node) => {
      try {
        node.disconnect();
      } catch (e) {
        // Already disconnected
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
        this.createAnalyser(nodeId);
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

  private createAnalyser(nodeId: string) {
    if (!this.audioContext) return;

    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;

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

  private connectNodes(sourceId: string, _sourceHandle: string, targetId: string, _targetHandle: string) {
    const sourceNode = this.nodes.get(sourceId);
    const targetNode = this.nodes.get(targetId);

    if (!sourceNode || !targetNode) return;

    try {
      sourceNode.connect(targetNode);
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
    }
  }
}
