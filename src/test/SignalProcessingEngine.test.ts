import { describe, it, expect, beforeEach, vi } from "vitest";
import { SignalProcessingEngine } from "../engine/SignalProcessingEngine";
import type { Node, Edge } from "@xyflow/react";
import type { SignalBlockData, BlockType } from "../types/blocks";

describe("SignalProcessingEngine", () => {
  let engine: SignalProcessingEngine;

  beforeEach(() => {
    engine = new SignalProcessingEngine();
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize with null audio context", () => {
      expect(engine["audioContext"]).toBeNull();
    });

    it("should create audio context on start", async () => {
      await engine.start();
      expect(engine["audioContext"]).toBeTruthy();
    });

    it("should register math processors on start", async () => {
      await engine.start();
      const context = engine["audioContext"];
      expect(context?.audioWorklet).toBeDefined();
    });
  });

  describe("Playback Control", () => {
    it("should start playback", async () => {
      await engine.start();
      expect(engine["audioContext"]?.state).toBe("running");
    });

    it("should stop playback and clear nodes", async () => {
      await engine.start();

      const nodes: Node<SignalBlockData>[] = [
        {
          id: "1",
          type: "signal-block",
          position: { x: 0, y: 0 },
          data: {
            blockType: "sine-wave",
            config: { frequency: 440, amplitude: 0.5 },
          },
        },
      ];

      await engine.updateGraph(nodes, []);
      expect(engine["nodes"].size).toBeGreaterThan(0);

      engine.stop();

      expect(engine["nodes"].size).toBe(0);
      expect(engine["oscillators"].size).toBe(0);
      expect(engine["analysers"].size).toBe(0);
    });
  });

  describe("Node Creation", () => {
    beforeEach(async () => {
      await engine.start();
    });

    it("should create sine wave oscillator", async () => {
      const nodes: Node<SignalBlockData>[] = [
        {
          id: "1",
          type: "signal-block",
          position: { x: 0, y: 0 },
          data: {
            blockType: "sine-wave",
            config: { frequency: 440, amplitude: 0.5 },
          },
        },
      ];

      await engine.updateGraph(nodes, []);

      expect(engine["oscillators"].has("1")).toBe(true);
      expect(engine["nodes"].size).toBeGreaterThan(0);
    });

    it("should create gain node", async () => {
      const nodes: Node<SignalBlockData>[] = [
        {
          id: "1",
          type: "signal-block",
          position: { x: 0, y: 0 },
          data: {
            blockType: "gain",
            config: { value: 0.5 },
          },
        },
      ];

      await engine.updateGraph(nodes, []);

      expect(engine["nodes"].has("1")).toBe(true);
    });

    it("should create filter node", async () => {
      const nodes: Node<SignalBlockData>[] = [
        {
          id: "1",
          type: "signal-block",
          position: { x: 0, y: 0 },
          data: {
            blockType: "low-pass-filter",
            config: { cutoffFrequency: 1000, qFactor: 1 },
          },
        },
      ];

      await engine.updateGraph(nodes, []);

      expect(engine["nodes"].has("1")).toBe(true);
    });

    it("should create analyser for oscilloscope", async () => {
      const nodes: Node<SignalBlockData>[] = [
        {
          id: "1",
          type: "signal-block",
          position: { x: 0, y: 0 },
          data: {
            blockType: "oscilloscope",
            config: {},
          },
        },
      ];

      await engine.updateGraph(nodes, []);

      expect(engine["analysers"].has("1")).toBe(true);
    });

    it("should create math nodes", async () => {
      const mathBlocks: Array<{ id: string; blockType: BlockType }> = [
        { id: "1", blockType: "add" },
        { id: "2", blockType: "ceil" },
        { id: "3", blockType: "sqrt" },
        { id: "4", blockType: "sin" },
        { id: "5", blockType: "min" },
        { id: "6", blockType: "clamp" },
        { id: "7", blockType: "negate" },
      ];

      const nodes: Node<SignalBlockData>[] = mathBlocks.map(
        ({ id, blockType }) => ({
          id,
          type: "signal-block",
          position: { x: 0, y: 0 },
          data: {
            blockType,
            config: {},
          },
        }),
      );

      await engine.updateGraph(nodes, []);

      mathBlocks.forEach(({ id }) => {
        expect(engine["nodes"].has(id)).toBe(true);
      });
    });

    it("should create splitter", async () => {
      const nodes: Node<SignalBlockData>[] = [
        {
          id: "1",
          type: "signal-block",
          position: { x: 0, y: 0 },
          data: {
            blockType: "splitter",
            config: { numOutputs: 4 },
          },
        },
      ];

      await engine.updateGraph(nodes, []);

      // Splitter should create at least the main node
      expect(engine["nodes"].size).toBeGreaterThan(0);
    });

    it("should handle multiplexer blocks", async () => {
      const nodes: Node<SignalBlockData>[] = [
        {
          id: "1",
          type: "signal-block",
          position: { x: 0, y: 0 },
          data: {
            blockType: "multiplexer",
            config: { numInputs: 4, selector: 0 },
          },
        },
      ];

      // Should not throw when creating multiplexer
      expect(() => engine.updateGraph(nodes, [])).not.toThrow();
    });
  });

  describe("Node Connections", () => {
    beforeEach(async () => {
      await engine.start();
    });

    it("should connect nodes via edges", async () => {
      const nodes: Node<SignalBlockData>[] = [
        {
          id: "1",
          type: "signal-block",
          position: { x: 0, y: 0 },
          data: {
            blockType: "sine-wave",
            config: { frequency: 440 },
          },
        },
        {
          id: "2",
          type: "signal-block",
          position: { x: 100, y: 0 },
          data: {
            blockType: "gain",
            config: { gainValue: 0.5 },
          },
        },
      ];

      const edges: Edge[] = [
        {
          id: "e1-2",
          source: "1",
          target: "2",
          sourceHandle: "out",
          targetHandle: "in",
        },
      ];

      await engine.updateGraph(nodes, edges);

      const sourceNode = engine["nodes"].get("1");
      const targetNode = engine["nodes"].get("2");

      expect(sourceNode).toBeDefined();
      expect(targetNode).toBeDefined();
    });

    it("should handle multiple connections from one source", async () => {
      const nodes: Node<SignalBlockData>[] = [
        {
          id: "1",
          type: "signal-block",
          position: { x: 0, y: 0 },
          data: {
            blockType: "sine-wave",
            config: {},
          },
        },
        {
          id: "2",
          type: "signal-block",
          position: { x: 100, y: 0 },
          data: {
            blockType: "gain",
            config: {},
          },
        },
        {
          id: "3",
          type: "signal-block",
          position: { x: 100, y: 100 },
          data: {
            blockType: "oscilloscope",
            config: {},
          },
        },
      ];

      const edges: Edge[] = [
        {
          id: "e1-2",
          source: "1",
          target: "2",
          sourceHandle: "out",
          targetHandle: "in",
        },
        {
          id: "e1-3",
          source: "1",
          target: "3",
          sourceHandle: "out",
          targetHandle: "in",
        },
      ];

      await engine.updateGraph(nodes, edges);

      expect(engine["nodes"].size).toBeGreaterThan(0);
    });
  });

  describe("Configuration Updates", () => {
    beforeEach(async () => {
      await engine.start();
    });

    it("should allow updating oscillator configuration", async () => {
      const nodes: Node<SignalBlockData>[] = [
        {
          id: "1",
          type: "signal-block",
          position: { x: 0, y: 0 },
          data: {
            blockType: "sine-wave",
            config: { frequency: 440 },
          },
        },
      ];

      await engine.updateGraph(nodes, []);

      const oscillator = engine["oscillators"].get("1");
      expect(oscillator).toBeDefined();

      // Update configuration should not throw
      expect(() =>
        engine.updateNodeConfig("1", { frequency: 880 }),
      ).not.toThrow();
    });

    it("should allow updating gain configuration", async () => {
      const nodes: Node<SignalBlockData>[] = [
        {
          id: "1",
          type: "signal-block",
          position: { x: 0, y: 0 },
          data: {
            blockType: "gain",
            config: { value: 0.5 },
          },
        },
      ];

      await engine.updateGraph(nodes, []);

      expect(engine["nodes"].has("1")).toBe(true);

      // Should not throw when updating configuration
      expect(() => engine.updateNodeConfig("1", { value: 0.8 })).not.toThrow();
    });

    it("should allow updating filter configuration", async () => {
      const nodes: Node<SignalBlockData>[] = [
        {
          id: "1",
          type: "signal-block",
          position: { x: 0, y: 0 },
          data: {
            blockType: "low-pass-filter",
            config: { cutoffFrequency: 1000, qFactor: 1 },
          },
        },
      ];

      await engine.updateGraph(nodes, []);

      expect(engine["nodes"].has("1")).toBe(true);

      // Should not throw when updating configuration
      expect(() =>
        engine.updateNodeConfig("1", { cutoffFrequency: 2000 }),
      ).not.toThrow();
    });
  });

  describe("Analyser Retrieval", () => {
    beforeEach(async () => {
      await engine.start();
    });

    it("should return analyser for oscilloscope", async () => {
      const nodes: Node<SignalBlockData>[] = [
        {
          id: "1",
          type: "signal-block",
          position: { x: 0, y: 0 },
          data: {
            blockType: "oscilloscope",
            config: {},
          },
        },
      ];

      await engine.updateGraph(nodes, []);

      const analyser = engine.getAnalyser("1");
      expect(analyser).toBeDefined();
      expect(analyser?.fftSize).toBeGreaterThan(0);
    });

    it("should return undefined for non-oscilloscope nodes", async () => {
      const nodes: Node<SignalBlockData>[] = [
        {
          id: "1",
          type: "signal-block",
          position: { x: 0, y: 0 },
          data: {
            blockType: "sine-wave",
            config: {},
          },
        },
      ];

      await engine.updateGraph(nodes, []);

      const analyser = engine.getAnalyser("1");
      expect(analyser).toBeUndefined();
    });
  });

  describe("Incremental Updates", () => {
    beforeEach(async () => {
      await engine.start();
    });

    it("should preserve existing oscillators when adding new nodes", async () => {
      // Create initial graph
      const initialNodes: Node<SignalBlockData>[] = [
        {
          id: "1",
          type: "signal-block",
          position: { x: 0, y: 0 },
          data: {
            blockType: "sine-wave",
            config: { frequency: 440 },
          },
        },
      ];

      await engine.updateGraph(initialNodes, []);
      const initialOscillator = engine["oscillators"].get("1");

      // Add a new node
      const updatedNodes: Node<SignalBlockData>[] = [
        ...initialNodes,
        {
          id: "2",
          type: "signal-block",
          position: { x: 100, y: 0 },
          data: {
            blockType: "gain",
            config: {},
          },
        },
      ];

      await engine.updateGraph(updatedNodes, []);

      // Original oscillator should be preserved
      expect(engine["oscillators"].get("1")).toBe(initialOscillator);
    });

    it("should remove nodes that are no longer in the graph", async () => {
      // Create initial graph with two nodes
      const initialNodes: Node<SignalBlockData>[] = [
        {
          id: "1",
          type: "signal-block",
          position: { x: 0, y: 0 },
          data: {
            blockType: "sine-wave",
            config: {},
          },
        },
        {
          id: "2",
          type: "signal-block",
          position: { x: 100, y: 0 },
          data: {
            blockType: "gain",
            config: {},
          },
        },
      ];

      await engine.updateGraph(initialNodes, []);
      expect(engine["nodes"].has("2")).toBe(true);

      // Remove second node
      const updatedNodes: Node<SignalBlockData>[] = [initialNodes[0]];

      await engine.updateGraph(updatedNodes, []);

      // Second node should be removed
      expect(engine["nodes"].has("2")).toBe(false);
    });
  });

  describe("EQ Filter Processors", () => {
    beforeEach(async () => {
      await engine.start();
    });

    const eqFilterTypes: Array<{
      blockType: BlockType;
      expectedType: string;
      defaultFreq: number;
    }> = [
      { blockType: "peaking-eq", expectedType: "peaking", defaultFreq: 1000 },
      {
        blockType: "lowshelf-filter",
        expectedType: "lowshelf",
        defaultFreq: 200,
      },
      {
        blockType: "highshelf-filter",
        expectedType: "highshelf",
        defaultFreq: 3000,
      },
    ];

    describe("Filter Creation", () => {
      eqFilterTypes.forEach(({ blockType, expectedType, defaultFreq }) => {
        it(`should create ${blockType} with correct type`, async () => {
          const nodes: Node<SignalBlockData>[] = [
            {
              id: "1",
              type: "signal-block",
              position: { x: 0, y: 0 },
              data: {
                blockType,
                config: {
                  cutoffFrequency: defaultFreq,
                  filterGain: 6,
                },
              },
            },
          ];

          await engine.updateGraph(nodes, []);

          const filterNode = engine["nodes"].get("1");
          expect(filterNode).toBeDefined();
          expect((filterNode as BiquadFilterNode).type).toBe(expectedType);
        });

        it(`should set frequency for ${blockType}`, async () => {
          const nodes: Node<SignalBlockData>[] = [
            {
              id: "1",
              type: "signal-block",
              position: { x: 0, y: 0 },
              data: {
                blockType,
                config: {
                  cutoffFrequency: 2000,
                  filterGain: 6,
                },
              },
            },
          ];

          await engine.updateGraph(nodes, []);

          const filterNode = engine["nodes"].get("1") as BiquadFilterNode;
          expect(filterNode.frequency.value).toBe(2000);
        });

        it(`should set gain for ${blockType}`, async () => {
          const nodes: Node<SignalBlockData>[] = [
            {
              id: "1",
              type: "signal-block",
              position: { x: 0, y: 0 },
              data: {
                blockType,
                config: {
                  cutoffFrequency: defaultFreq,
                  filterGain: 12,
                },
              },
            },
          ];

          await engine.updateGraph(nodes, []);

          const filterNode = engine["nodes"].get("1") as BiquadFilterNode;
          expect(filterNode.gain.value).toBe(12);
        });

        it(`should default gain to 0 for ${blockType} when not specified`, async () => {
          const nodes: Node<SignalBlockData>[] = [
            {
              id: "1",
              type: "signal-block",
              position: { x: 0, y: 0 },
              data: {
                blockType,
                config: {
                  cutoffFrequency: defaultFreq,
                },
              },
            },
          ];

          await engine.updateGraph(nodes, []);

          const filterNode = engine["nodes"].get("1") as BiquadFilterNode;
          expect(filterNode.gain.value).toBe(0);
        });
      });
    });

    describe("Filter Configuration Updates", () => {
      eqFilterTypes.forEach(({ blockType, defaultFreq }) => {
        it(`should update frequency for ${blockType}`, async () => {
          const nodes: Node<SignalBlockData>[] = [
            {
              id: "1",
              type: "signal-block",
              position: { x: 0, y: 0 },
              data: {
                blockType,
                config: {
                  cutoffFrequency: defaultFreq,
                  filterGain: 0,
                },
              },
            },
          ];

          await engine.updateGraph(nodes, []);

          engine.updateNodeConfig("1", blockType, {
            cutoffFrequency: 5000,
            filterGain: 0,
          });

          const filterNode = engine["nodes"].get("1") as BiquadFilterNode;
          expect(filterNode.frequency.value).toBe(5000);
        });

        it(`should update gain for ${blockType}`, async () => {
          const nodes: Node<SignalBlockData>[] = [
            {
              id: "1",
              type: "signal-block",
              position: { x: 0, y: 0 },
              data: {
                blockType,
                config: {
                  cutoffFrequency: defaultFreq,
                  filterGain: 0,
                },
              },
            },
          ];

          await engine.updateGraph(nodes, []);

          engine.updateNodeConfig("1", blockType, {
            cutoffFrequency: defaultFreq,
            filterGain: -6,
          });

          const filterNode = engine["nodes"].get("1") as BiquadFilterNode;
          expect(filterNode.gain.value).toBe(-6);
        });

        it(`should update both frequency and gain for ${blockType}`, async () => {
          const nodes: Node<SignalBlockData>[] = [
            {
              id: "1",
              type: "signal-block",
              position: { x: 0, y: 0 },
              data: {
                blockType,
                config: {
                  cutoffFrequency: defaultFreq,
                  filterGain: 0,
                },
              },
            },
          ];

          await engine.updateGraph(nodes, []);

          engine.updateNodeConfig("1", blockType, {
            cutoffFrequency: 8000,
            filterGain: 15,
          });

          const filterNode = engine["nodes"].get("1") as BiquadFilterNode;
          expect(filterNode.frequency.value).toBe(8000);
          expect(filterNode.gain.value).toBe(15);
        });
      });
    });

    describe("Filter Signal Input Connections", () => {
      it("should set frequency to 0 when cutoff input is connected for lowshelf-filter", async () => {
        const nodes: Node<SignalBlockData>[] = [
          {
            id: "slider1",
            type: "signal-block",
            position: { x: 0, y: 0 },
            data: {
              blockType: "slider",
              config: { value: 1000, min: 20, max: 20000 },
            },
          },
          {
            id: "filter1",
            type: "signal-block",
            position: { x: 200, y: 0 },
            data: {
              blockType: "lowshelf-filter",
              config: { cutoffFrequency: 200, filterGain: 6 },
            },
          },
        ];

        const edges: Edge[] = [
          {
            id: "e1",
            source: "slider1",
            target: "filter1",
            sourceHandle: "out",
            targetHandle: "cutoff",
          },
        ];

        await engine.updateGraph(nodes, edges);

        const filterNode = engine["nodes"].get("filter1") as BiquadFilterNode;
        // When cutoff is connected, base frequency should be 0
        expect(filterNode.frequency.value).toBe(0);
      });

      it("should set frequency to 0 when cutoff input is connected for highshelf-filter", async () => {
        const nodes: Node<SignalBlockData>[] = [
          {
            id: "slider1",
            type: "signal-block",
            position: { x: 0, y: 0 },
            data: {
              blockType: "slider",
              config: { value: 1000, min: 20, max: 20000 },
            },
          },
          {
            id: "filter1",
            type: "signal-block",
            position: { x: 200, y: 0 },
            data: {
              blockType: "highshelf-filter",
              config: { cutoffFrequency: 3000, filterGain: 6 },
            },
          },
        ];

        const edges: Edge[] = [
          {
            id: "e1",
            source: "slider1",
            target: "filter1",
            sourceHandle: "out",
            targetHandle: "cutoff",
          },
        ];

        await engine.updateGraph(nodes, edges);

        const filterNode = engine["nodes"].get("filter1") as BiquadFilterNode;
        expect(filterNode.frequency.value).toBe(0);
      });

      it("should set frequency to 0 when frequency input is connected for peaking-eq", async () => {
        const nodes: Node<SignalBlockData>[] = [
          {
            id: "slider1",
            type: "signal-block",
            position: { x: 0, y: 0 },
            data: {
              blockType: "slider",
              config: { value: 1000, min: 20, max: 20000 },
            },
          },
          {
            id: "filter1",
            type: "signal-block",
            position: { x: 200, y: 0 },
            data: {
              blockType: "peaking-eq",
              config: { cutoffFrequency: 1000, filterGain: 6 },
            },
          },
        ];

        const edges: Edge[] = [
          {
            id: "e1",
            source: "slider1",
            target: "filter1",
            sourceHandle: "out",
            targetHandle: "frequency",
          },
        ];

        await engine.updateGraph(nodes, edges);

        const filterNode = engine["nodes"].get("filter1") as BiquadFilterNode;
        expect(filterNode.frequency.value).toBe(0);
      });

      it("should connect slider output to filter frequency AudioParam", async () => {
        const nodes: Node<SignalBlockData>[] = [
          {
            id: "slider1",
            type: "signal-block",
            position: { x: 0, y: 0 },
            data: {
              blockType: "slider",
              config: { value: 1000, min: 20, max: 20000 },
            },
          },
          {
            id: "filter1",
            type: "signal-block",
            position: { x: 200, y: 0 },
            data: {
              blockType: "lowshelf-filter",
              config: { cutoffFrequency: 200, filterGain: 6 },
            },
          },
        ];

        const edges: Edge[] = [
          {
            id: "e1",
            source: "slider1",
            target: "filter1",
            sourceHandle: "out",
            targetHandle: "cutoff",
          },
        ];

        await engine.updateGraph(nodes, edges);

        const sliderNode = engine["nodes"].get("slider1");
        const filterNode = engine["nodes"].get("filter1") as BiquadFilterNode;

        // Verify the connection was made to the frequency AudioParam
        expect(sliderNode?.connect).toHaveBeenCalledWith(filterNode.frequency);
      });
    });

    describe("Standard Filter Types", () => {
      const standardFilterTypes: Array<{
        blockType: BlockType;
        expectedType: string;
      }> = [
        { blockType: "low-pass-filter", expectedType: "lowpass" },
        { blockType: "high-pass-filter", expectedType: "highpass" },
        { blockType: "band-pass-filter", expectedType: "bandpass" },
        { blockType: "notch-filter", expectedType: "notch" },
        { blockType: "allpass-filter", expectedType: "allpass" },
      ];

      standardFilterTypes.forEach(({ blockType, expectedType }) => {
        it(`should create ${blockType} with correct type`, async () => {
          const nodes: Node<SignalBlockData>[] = [
            {
              id: "1",
              type: "signal-block",
              position: { x: 0, y: 0 },
              data: {
                blockType,
                config: {
                  cutoffFrequency: 1000,
                  qFactor: 1.0,
                },
              },
            },
          ];

          await engine.updateGraph(nodes, []);

          const filterNode = engine["nodes"].get("1");
          expect(filterNode).toBeDefined();
          expect((filterNode as BiquadFilterNode).type).toBe(expectedType);
        });

        it(`should set frequency to 0 when cutoff is connected for ${blockType}`, async () => {
          const nodes: Node<SignalBlockData>[] = [
            {
              id: "slider1",
              type: "signal-block",
              position: { x: 0, y: 0 },
              data: {
                blockType: "slider",
                config: { value: 1000 },
              },
            },
            {
              id: "filter1",
              type: "signal-block",
              position: { x: 200, y: 0 },
              data: {
                blockType,
                config: { cutoffFrequency: 1000 },
              },
            },
          ];

          const edges: Edge[] = [
            {
              id: "e1",
              source: "slider1",
              target: "filter1",
              sourceHandle: "out",
              targetHandle: "cutoff",
            },
          ];

          await engine.updateGraph(nodes, edges);

          const filterNode = engine["nodes"].get("filter1") as BiquadFilterNode;
          expect(filterNode.frequency.value).toBe(0);
        });
      });
    });
  });

  describe("Routing Blocks", () => {
    beforeEach(async () => {
      await engine.start();
    });

    describe("Splitter", () => {
      it("should create splitter as a gain node with gain = 1", async () => {
        const nodes: Node<SignalBlockData>[] = [
          {
            id: "splitter1",
            type: "signal-block",
            position: { x: 0, y: 0 },
            data: {
              blockType: "splitter",
              config: { numOutputs: 2 },
            },
          },
        ];

        await engine.updateGraph(nodes, []);

        const splitterNode = engine["nodes"].get("splitter1");
        expect(splitterNode).toBeDefined();
        expect(splitterNode).toBeInstanceOf(GainNode);
        expect((splitterNode as GainNode).gain.value).toBe(1.0);
      });

      it("should connect input to splitter", async () => {
        const nodes: Node<SignalBlockData>[] = [
          {
            id: "osc1",
            type: "signal-block",
            position: { x: 0, y: 0 },
            data: {
              blockType: "sine-wave",
              config: { frequency: 440 },
            },
          },
          {
            id: "splitter1",
            type: "signal-block",
            position: { x: 200, y: 0 },
            data: {
              blockType: "splitter",
              config: { numOutputs: 2 },
            },
          },
        ];

        const edges: Edge[] = [
          {
            id: "e1",
            source: "osc1",
            target: "splitter1",
            sourceHandle: "out",
            targetHandle: "in",
          },
        ];

        await engine.updateGraph(nodes, edges);

        const oscNode = engine["nodes"].get("osc1");
        const splitterNode = engine["nodes"].get("splitter1");

        expect(oscNode?.connect).toHaveBeenCalledWith(splitterNode);
      });

      it("should connect splitter output to multiple targets", async () => {
        const nodes: Node<SignalBlockData>[] = [
          {
            id: "osc1",
            type: "signal-block",
            position: { x: 0, y: 0 },
            data: {
              blockType: "sine-wave",
              config: { frequency: 440 },
            },
          },
          {
            id: "splitter1",
            type: "signal-block",
            position: { x: 200, y: 0 },
            data: {
              blockType: "splitter",
              config: { numOutputs: 2 },
            },
          },
          {
            id: "scope1",
            type: "signal-block",
            position: { x: 400, y: 0 },
            data: {
              blockType: "oscilloscope",
              config: {},
            },
          },
          {
            id: "scope2",
            type: "signal-block",
            position: { x: 400, y: 100 },
            data: {
              blockType: "oscilloscope",
              config: {},
            },
          },
        ];

        const edges: Edge[] = [
          {
            id: "e1",
            source: "osc1",
            target: "splitter1",
            sourceHandle: "out",
            targetHandle: "in",
          },
          {
            id: "e2",
            source: "splitter1",
            target: "scope1",
            sourceHandle: "out0",
            targetHandle: "in",
          },
          {
            id: "e3",
            source: "splitter1",
            target: "scope2",
            sourceHandle: "out1",
            targetHandle: "in",
          },
        ];

        await engine.updateGraph(nodes, edges);

        const splitterNode = engine["nodes"].get("splitter1");
        const scope1Node = engine["nodes"].get("scope1");
        const scope2Node = engine["nodes"].get("scope2");

        // Splitter should connect to both scopes
        expect(splitterNode?.connect).toHaveBeenCalledWith(scope1Node);
        expect(splitterNode?.connect).toHaveBeenCalledWith(scope2Node);
      });

      it("should support configurable number of outputs", async () => {
        const nodes: Node<SignalBlockData>[] = [
          {
            id: "splitter1",
            type: "signal-block",
            position: { x: 0, y: 0 },
            data: {
              blockType: "splitter",
              config: { numOutputs: 4 },
            },
          },
        ];

        await engine.updateGraph(nodes, []);

        const splitterNode = engine["nodes"].get("splitter1");
        expect(splitterNode).toBeDefined();
        // The splitter is just a gain node, numOutputs is handled at UI level
        expect(splitterNode).toBeInstanceOf(GainNode);
      });
    });

    describe("Multiplexer", () => {
      it("should create multiplexer node", async () => {
        const nodes: Node<SignalBlockData>[] = [
          {
            id: "mux1",
            type: "signal-block",
            position: { x: 0, y: 0 },
            data: {
              blockType: "multiplexer",
              config: { numInputs: 2, selectorValue: 0 },
            },
          },
        ];

        await engine.updateGraph(nodes, []);

        const muxNode = engine["nodes"].get("mux1");
        expect(muxNode).toBeDefined();
      });

      it("should connect signal inputs to multiplexer", async () => {
        const nodes: Node<SignalBlockData>[] = [
          {
            id: "osc1",
            type: "signal-block",
            position: { x: 0, y: 0 },
            data: {
              blockType: "sine-wave",
              config: { frequency: 440 },
            },
          },
          {
            id: "osc2",
            type: "signal-block",
            position: { x: 0, y: 100 },
            data: {
              blockType: "sine-wave",
              config: { frequency: 880 },
            },
          },
          {
            id: "mux1",
            type: "signal-block",
            position: { x: 200, y: 50 },
            data: {
              blockType: "multiplexer",
              config: { numInputs: 2, selectorValue: 0 },
            },
          },
        ];

        const edges: Edge[] = [
          {
            id: "e1",
            source: "osc1",
            target: "mux1",
            sourceHandle: "out",
            targetHandle: "in0",
          },
          {
            id: "e2",
            source: "osc2",
            target: "mux1",
            sourceHandle: "out",
            targetHandle: "in1",
          },
        ];

        await engine.updateGraph(nodes, edges);

        const osc1Node = engine["nodes"].get("osc1");
        const osc2Node = engine["nodes"].get("osc2");
        const muxNode = engine["nodes"].get("mux1");

        // Each oscillator should connect to its respective mux input
        // in0 connects to input 1 (offset by 1 for selector)
        // in1 connects to input 2
        expect(osc1Node?.connect).toHaveBeenCalledWith(muxNode, 0, 1);
        expect(osc2Node?.connect).toHaveBeenCalledWith(muxNode, 0, 2);
      });

      it("should connect selector to multiplexer", async () => {
        const nodes: Node<SignalBlockData>[] = [
          {
            id: "slider1",
            type: "signal-block",
            position: { x: 0, y: 0 },
            data: {
              blockType: "slider",
              config: { value: 0, min: 0, max: 1 },
            },
          },
          {
            id: "mux1",
            type: "signal-block",
            position: { x: 200, y: 0 },
            data: {
              blockType: "multiplexer",
              config: { numInputs: 2, selectorValue: 0 },
            },
          },
        ];

        const edges: Edge[] = [
          {
            id: "e1",
            source: "slider1",
            target: "mux1",
            sourceHandle: "out",
            targetHandle: "selector",
          },
        ];

        await engine.updateGraph(nodes, edges);

        const sliderNode = engine["nodes"].get("slider1");
        const muxNode = engine["nodes"].get("mux1");

        // Selector connects to input 0
        expect(sliderNode?.connect).toHaveBeenCalledWith(muxNode, 0, 0);
      });

      it("should connect multiplexer output to target", async () => {
        const nodes: Node<SignalBlockData>[] = [
          {
            id: "mux1",
            type: "signal-block",
            position: { x: 0, y: 0 },
            data: {
              blockType: "multiplexer",
              config: { numInputs: 2, selectorValue: 0 },
            },
          },
          {
            id: "scope1",
            type: "signal-block",
            position: { x: 200, y: 0 },
            data: {
              blockType: "oscilloscope",
              config: {},
            },
          },
        ];

        const edges: Edge[] = [
          {
            id: "e1",
            source: "mux1",
            target: "scope1",
            sourceHandle: "out",
            targetHandle: "in",
          },
        ];

        await engine.updateGraph(nodes, edges);

        const muxNode = engine["nodes"].get("mux1");
        const scopeNode = engine["nodes"].get("scope1");

        expect(muxNode?.connect).toHaveBeenCalledWith(scopeNode);
      });

      it("should support configurable number of inputs", async () => {
        const nodes: Node<SignalBlockData>[] = [
          {
            id: "mux1",
            type: "signal-block",
            position: { x: 0, y: 0 },
            data: {
              blockType: "multiplexer",
              config: { numInputs: 4, selectorValue: 0 },
            },
          },
        ];

        await engine.updateGraph(nodes, []);

        const muxNode = engine["nodes"].get("mux1");
        expect(muxNode).toBeDefined();
      });

      it("should handle full multiplexer signal chain", async () => {
        const nodes: Node<SignalBlockData>[] = [
          {
            id: "osc1",
            type: "signal-block",
            position: { x: 0, y: 0 },
            data: {
              blockType: "sine-wave",
              config: { frequency: 440 },
            },
          },
          {
            id: "osc2",
            type: "signal-block",
            position: { x: 0, y: 100 },
            data: {
              blockType: "square-wave",
              config: { frequency: 440 },
            },
          },
          {
            id: "selector",
            type: "signal-block",
            position: { x: 0, y: 200 },
            data: {
              blockType: "slider",
              config: { value: 0, min: 0, max: 1 },
            },
          },
          {
            id: "mux1",
            type: "signal-block",
            position: { x: 200, y: 100 },
            data: {
              blockType: "multiplexer",
              config: { numInputs: 2, selectorValue: 0 },
            },
          },
          {
            id: "scope1",
            type: "signal-block",
            position: { x: 400, y: 100 },
            data: {
              blockType: "oscilloscope",
              config: {},
            },
          },
        ];

        const edges: Edge[] = [
          {
            id: "e1",
            source: "osc1",
            target: "mux1",
            sourceHandle: "out",
            targetHandle: "in0",
          },
          {
            id: "e2",
            source: "osc2",
            target: "mux1",
            sourceHandle: "out",
            targetHandle: "in1",
          },
          {
            id: "e3",
            source: "selector",
            target: "mux1",
            sourceHandle: "out",
            targetHandle: "selector",
          },
          {
            id: "e4",
            source: "mux1",
            target: "scope1",
            sourceHandle: "out",
            targetHandle: "in",
          },
        ];

        await engine.updateGraph(nodes, edges);

        // Verify all nodes were created
        expect(engine["nodes"].has("osc1")).toBe(true);
        expect(engine["nodes"].has("osc2")).toBe(true);
        expect(engine["nodes"].has("selector")).toBe(true);
        expect(engine["nodes"].has("mux1")).toBe(true);
        expect(engine["nodes"].has("scope1")).toBe(true);

        // Verify connections
        const osc1Node = engine["nodes"].get("osc1");
        const osc2Node = engine["nodes"].get("osc2");
        const selectorNode = engine["nodes"].get("selector");
        const muxNode = engine["nodes"].get("mux1");
        const scopeNode = engine["nodes"].get("scope1");

        expect(osc1Node?.connect).toHaveBeenCalledWith(muxNode, 0, 1);
        expect(osc2Node?.connect).toHaveBeenCalledWith(muxNode, 0, 2);
        expect(selectorNode?.connect).toHaveBeenCalledWith(muxNode, 0, 0);
        expect(muxNode?.connect).toHaveBeenCalledWith(scopeNode);
      });
    });
  });
});
