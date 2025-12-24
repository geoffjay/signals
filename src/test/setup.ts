import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Web Audio API
global.AudioContext = class MockAudioContext {
  destination = {};
  sampleRate = 48000;
  currentTime = 0;
  state = 'running';
  audioWorklet = {
    addModule: vi.fn().mockResolvedValue(undefined),
  };

  createOscillator() {
    const freq = { value: 440 };
    return {
      type: 'sine',
      frequency: freq,
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }

  createGain() {
    return {
      gain: { value: 1 },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  createBiquadFilter() {
    return {
      type: 'lowpass',
      frequency: { value: 1000 },
      Q: { value: 1 },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  createAnalyser() {
    return {
      fftSize: 2048,
      frequencyBinCount: 1024,
      smoothingTimeConstant: 0.8,
      minDecibels: -100,
      maxDecibels: -30,
      getByteTimeDomainData: vi.fn(),
      getByteFrequencyData: vi.fn(),
      getFloatFrequencyData: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  createChannelSplitter() {
    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  createChannelMerger() {
    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  createConstantSource() {
    return {
      offset: { value: 0 },
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }

  resume() {
    return Promise.resolve();
  }

  suspend() {
    return Promise.resolve();
  }

  close() {
    return Promise.resolve();
  }
} as any;

// Mock GainNode and BiquadFilterNode types for instanceof checks
global.GainNode = class MockGainNode {
  gain = { value: 1 };
  connect = vi.fn();
  disconnect = vi.fn();
} as any;

global.BiquadFilterNode = class MockBiquadFilterNode {
  type = 'lowpass';
  frequency = { value: 1000 };
  Q = { value: 1 };
  connect = vi.fn();
  disconnect = vi.fn();
} as any;

// Mock AudioWorkletNode
global.AudioWorkletNode = class MockAudioWorkletNode {
  connect = vi.fn();
  disconnect = vi.fn();
  port = {
    postMessage: vi.fn(),
  };

  constructor(public context: any, public name: string, public options?: any) {}
} as any;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => {
  cb(0);
  return 0;
});

global.cancelAnimationFrame = vi.fn();
