import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi, beforeAll } from "vitest";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock GainNode and BiquadFilterNode types for instanceof checks
// These must be defined before MockAudioContext since it uses them
const MockGainNode = class MockGainNode {
  gain = { value: 1 };
  connect = vi.fn();
  disconnect = vi.fn();
} as unknown as typeof GainNode;

const MockBiquadFilterNode = class MockBiquadFilterNode {
  type: BiquadFilterType = "lowpass";
  frequency = { value: 1000 };
  Q = { value: 1 };
  gain = { value: 0 };
  connect = vi.fn();
  disconnect = vi.fn();
} as unknown as typeof BiquadFilterNode;

// Mock Web Audio API
const MockAudioContext = class MockAudioContext {
  destination = {};
  sampleRate = 48000;
  currentTime = 0;
  state = "running";
  audioWorklet = {
    addModule: vi.fn().mockResolvedValue(undefined),
  };

  createOscillator() {
    const freq = { value: 440 };
    return {
      type: "sine",
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
    return new MockBiquadFilterNode();
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
} as unknown as typeof AudioContext;

global.AudioContext = MockAudioContext;
window.AudioContext = MockAudioContext as unknown as typeof AudioContext;
vi.stubGlobal("AudioContext", MockAudioContext);

// Mock AudioWorkletNode
const MockAudioWorkletNode = class MockAudioWorkletNode {
  connect = vi.fn();
  disconnect = vi.fn();
  port = {
    postMessage: vi.fn(),
  };

  constructor(
    public context: AudioContext,
    public name: string,
    public options?: Record<string, unknown>,
  ) {}
} as unknown as typeof AudioWorkletNode;

global.GainNode = MockGainNode;
window.GainNode = MockGainNode as unknown as typeof GainNode;

global.BiquadFilterNode = MockBiquadFilterNode;
window.BiquadFilterNode = MockBiquadFilterNode as unknown as typeof BiquadFilterNode;

global.AudioWorkletNode = MockAudioWorkletNode;
window.AudioWorkletNode = MockAudioWorkletNode as unknown as typeof AudioWorkletNode;

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

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
});

vi.stubGlobal("localStorage", localStorageMock);

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => {
  cb(0);
  return 0;
});

global.cancelAnimationFrame = vi.fn();
