import { useCallback, useRef, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  ReactFlowProvider,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import {
  type BlockType,
  BLOCK_DEFINITIONS,
  type BlockConfig,
} from "@/types/blocks";
import { SignalBlock, type SignalBlockData } from "./SignalBlock";
import {
  InstrumentBlock,
  type InstrumentBlockData,
} from "./instruments/InstrumentBlock";
import { Toolbar } from "./Toolbar";
import { Topbar } from "./Topbar";
import { ConfigDrawer } from "./ConfigDrawer";
import { useTheme } from "@/components/theme-provider";
import { SignalProcessingEngine } from "@/engine/SignalProcessingEngine";
import { useSignalFlowStore } from "@/store/signalFlowStore";
import { draftStorage, instrumentApi } from "@/lib/instrumentApi";

const nodeTypes = {
  signalBlock: SignalBlock,
  instrumentBlock: InstrumentBlock,
};

export function SignalFlowApp() {
  // Zustand store
  const {
    nodes: storeNodes,
    edges: storeEdges,
    selectedNodeId,
    configDrawerNodeId,
    isPlaying,
    setNodes: setStoreNodes,
    setEdges: setStoreEdges,
    setSelectedNodeId,
    setConfigDrawerNodeId,
    setIsPlaying,
    incrementNodeIdCounter,
    lastExternalUpdate,
  } = useSignalFlowStore();
  const { theme } = useTheme();

  // ReactFlow state for UI updates
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(storeNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(storeEdges);

  const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const engineRef = useRef(new SignalProcessingEngine());
  const isInternalNodeUpdate = useRef(false);
  const hasInitialized = useRef(false);
  const lastProcessedExternalUpdate = useRef(0);

  // Sync ReactFlow state to Zustand store
  useEffect(() => {
    if (!isInternalNodeUpdate.current) {
      setStoreNodes(nodes);
    }
  }, [nodes, setStoreNodes]);

  useEffect(() => {
    setStoreEdges(edges);
  }, [edges, setStoreEdges]);

  // Sync from store when external update occurs (import/load)
  useEffect(() => {
    if (lastExternalUpdate > lastProcessedExternalUpdate.current) {
      isInternalNodeUpdate.current = true;
      setNodes(storeNodes);
      setEdges(storeEdges);
      lastProcessedExternalUpdate.current = lastExternalUpdate;
      // Reset the flag after the state update
      setTimeout(() => {
        isInternalNodeUpdate.current = false;
      }, 0);
    }
  }, [lastExternalUpdate, storeNodes, storeEdges, setNodes, setEdges]);

  // Initialize from store on mount
  useEffect(() => {
    if (!hasInitialized.current && storeNodes.length > 0) {
      setNodes(storeNodes);
      setEdges(storeEdges);
      hasInitialized.current = true;

      // Reset play state to false on page load
      // AudioContext requires user gesture to start, so we can't auto-play
      if (isPlaying) {
        setIsPlaying(false);
      }
    }
  }, [isPlaying, setIsPlaying, setEdges, setNodes, storeEdges, storeNodes]);

  const onConnect = useCallback(
    (params: Connection) => {
      // Validate connection: input can only have one incoming connection
      const targetHandle = params.targetHandle;
      if (targetHandle) {
        const existingEdge = edges.find(
          (edge) =>
            edge.target === params.target && edge.targetHandle === targetHandle,
        );
        if (existingEdge) {
          // Remove the existing connection first
          setEdges((eds) => eds.filter((edge) => edge.id !== existingEdge.id));
        }
      }

      setEdges((eds) => addEdge({ ...params, animated: isPlaying }, eds));
    },
    [edges, setEdges, isPlaying],
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstanceRef.current) return;

      const position = reactFlowInstanceRef.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Check if this is an instrument drop
      const instrumentData = event.dataTransfer.getData(
        "application/instrument",
      );
      if (instrumentData) {
        try {
          const { id, source } = JSON.parse(instrumentData) as {
            id: string;
            source: "draft" | "cloud";
          };

          // Load the instrument definition
          let instrumentDefinition;
          if (source === "draft") {
            const draft = draftStorage.get(id);
            if (!draft) {
              console.error("Draft not found:", id);
              return;
            }
            instrumentDefinition = draft.definition;
          } else {
            instrumentDefinition = await instrumentApi.load(id);
          }

          const newNodeId = `node-${incrementNodeIdCounter()}`;
          const newNode: Node = {
            id: newNodeId,
            type: "instrumentBlock",
            position,
            data: {
              blockType: "instrument",
              label: instrumentDefinition.metadata.name,
              config: {
                ...instrumentDefinition.defaultConfig,
                instrumentId: id,
              },
              instrumentDefinition,
              externalPorts: instrumentDefinition.externalPorts,
            } as InstrumentBlockData,
          };

          setNodes((nds) => nds.concat(newNode));
        } catch (error) {
          console.error("Failed to load instrument:", error);
        }
        return;
      }

      // Handle regular block drop
      const blockType = event.dataTransfer.getData(
        "application/reactflow",
      ) as BlockType;
      if (!blockType) return;

      const definition = BLOCK_DEFINITIONS[blockType];
      const newNodeId = `node-${incrementNodeIdCounter()}`;

      const newNode: Node = {
        id: newNodeId,
        type: "signalBlock",
        position,
        data: {
          blockType,
          label: definition.label,
          config: { ...definition.defaultConfig },
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [incrementNodeIdCounter, setNodes],
  );

  const updateNodeConfig = useCallback(
    (nodeId: string, config: BlockConfig) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            const blockType = node.data.blockType as BlockType;
            const nodeData = node.data as SignalBlockData;

            // Merge with existing config to preserve all fields (especially value for input controls)
            const mergedConfig = { ...nodeData.config, ...config };

            // Update the engine if playing
            if (isPlaying) {
              engineRef.current.updateNodeConfig(
                nodeId,
                blockType,
                mergedConfig,
              );
            }

            return {
              ...node,
              data: {
                ...nodeData,
                config: mergedConfig,
              },
            };
          }
          return node;
        }),
      );
    },
    [setNodes, isPlaying],
  );

  const deleteSelectedNode = useCallback(() => {
    // Delete the node shown in the config drawer (if any)
    const nodeIdToDelete = configDrawerNodeId;
    if (!nodeIdToDelete) return;

    setNodes((nds) => nds.filter((node) => node.id !== nodeIdToDelete));
    setEdges((eds) =>
      eds.filter(
        (edge) =>
          edge.source !== nodeIdToDelete && edge.target !== nodeIdToDelete,
      ),
    );
    setConfigDrawerNodeId(null);
    if (selectedNodeId === nodeIdToDelete) {
      setSelectedNodeId(null);
    }
  }, [configDrawerNodeId, selectedNodeId, setNodes, setEdges, setConfigDrawerNodeId, setSelectedNodeId]);

  const togglePlayback = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying, setIsPlaying]);

  // Update edge animation when playback state changes
  useEffect(() => {
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        animated: isPlaying,
      })),
    );
  }, [isPlaying, setEdges]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't delete nodes when user is focused on form controls
      const activeElement = document.activeElement;
      const isFormControl =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.tagName === "SELECT" ||
          activeElement.getAttribute("contenteditable") === "true");

      // Only allow Delete key (not Backspace) to delete nodes
      // Backspace is reserved for text editing
      if (event.key === "Delete" && selectedNodeId && !isFormControl) {
        event.preventDefault();
        deleteSelectedNode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodeId, deleteSelectedNode]);

  // Handle playback state changes
  useEffect(() => {
    if (isPlaying) {
      // Set up sequencer step change callback
      engineRef.current.onSequencerStepChange = (nodeId: string, step: number) => {
        isInternalNodeUpdate.current = true;
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === nodeId && node.data.blockType === "sequencer") {
              return {
                ...node,
                data: {
                  ...node.data,
                  config: {
                    ...(node.data.config as BlockConfig),
                    seqCurrentStep: step,
                  },
                },
              };
            }
            return node;
          }),
        );
        setTimeout(() => {
          isInternalNodeUpdate.current = false;
        }, 0);
      };

      // Start audio engine (async to properly resume AudioContext)
      (async () => {
        await engineRef.current.start();
        engineRef.current.updateGraph(nodes, edges);

        // Update oscilloscope, numeric-meter, and fft-analyzer nodes with analysers
        isInternalNodeUpdate.current = true;
        setNodes((nds) =>
          nds.map((node) => {
            if (
              node.data.blockType === "oscilloscope" ||
              node.data.blockType === "numeric-meter" ||
              node.data.blockType === "fft-analyzer"
            ) {
              const analyser = engineRef.current.getAnalyser(node.id);
              return {
                ...node,
                data: {
                  ...node.data,
                  analyser,
                },
              };
            }
            return node;
          }),
        );
        // Reset flag after state update completes
        setTimeout(() => {
          isInternalNodeUpdate.current = false;
        }, 0);
      })();
    } else {
      // Clear sequencer callback
      engineRef.current.onSequencerStepChange = null;
      engineRef.current.stop();

      // Clear analysers from oscilloscope, numeric-meter, and fft-analyzer nodes
      isInternalNodeUpdate.current = true;
      setNodes((nds) =>
        nds.map((node) => {
          if (
            node.data.blockType === "oscilloscope" ||
            node.data.blockType === "numeric-meter" ||
            node.data.blockType === "fft-analyzer"
          ) {
            return {
              ...node,
              data: {
                ...node.data,
                analyser: undefined,
              },
            };
          }
          return node;
        }),
      );
      // Reset flag after state update completes
      setTimeout(() => {
        isInternalNodeUpdate.current = false;
      }, 0);
    }
    // Only depend on isPlaying to avoid infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  // Track previous values of input controls to detect changes
  const prevInputValuesRef = useRef<Map<string, number>>(new Map());
  // Track previous values for multi-output controls (keyboard, beat-pad, crossfader)
  const prevMultiOutputValuesRef = useRef<Map<string, string>>(new Map());

  // Update engine when input control values change during playback
  useEffect(() => {
    if (!isPlaying) return;

    nodes.forEach((node) => {
      const blockType = node.data.blockType as BlockType;
      const config = node.data.config as BlockConfig;

      // Check if this is a simple input control block (single value output)
      if (["slider", "button", "toggle", "pulse"].includes(blockType)) {
        const currentValue = config.value ?? 0;
        const prevValue = prevInputValuesRef.current.get(node.id);

        // If value changed, update the engine
        if (prevValue !== currentValue) {
          engineRef.current.updateConstantValue(node.id, currentValue);
          prevInputValuesRef.current.set(node.id, currentValue);
        }
      }

      // Handle keyboard (outputs: frequency, gate, velocity)
      if (blockType === "keyboard") {
        const currentKey = `${config.frequency ?? 0}-${config.gate ?? 0}-${config.velocity ?? 0}`;
        const prevKey = prevMultiOutputValuesRef.current.get(node.id);

        if (prevKey !== currentKey) {
          engineRef.current.updateNodeConfig(node.id, blockType, config);
          prevMultiOutputValuesRef.current.set(node.id, currentKey);
        }
      }

      // Handle beat-pad (outputs: trigger, padIndex, velocity)
      if (blockType === "beat-pad") {
        const currentKey = `${config.trigger ?? 0}-${config.activePad ?? -1}-${config.velocity ?? 0}`;
        const prevKey = prevMultiOutputValuesRef.current.get(node.id);

        if (prevKey !== currentKey) {
          engineRef.current.updateNodeConfig(node.id, blockType, config);
          prevMultiOutputValuesRef.current.set(node.id, currentKey);
        }
      }

      // Handle crossfader (position affects gain distribution)
      if (blockType === "crossfader") {
        const currentKey = `${config.position ?? 0.5}-${config.curveType ?? "equal-power"}`;
        const prevKey = prevMultiOutputValuesRef.current.get(node.id);

        if (prevKey !== currentKey) {
          engineRef.current.updateNodeConfig(node.id, blockType, config);
          prevMultiOutputValuesRef.current.set(node.id, currentKey);
        }
      }

      // Handle sequencer (grid changes affect trigger outputs)
      if (blockType === "sequencer") {
        const gridKey = JSON.stringify(config.seqGrid || []);
        const prevKey = prevMultiOutputValuesRef.current.get(node.id);

        if (prevKey !== gridKey) {
          engineRef.current.updateNodeConfig(node.id, blockType, config);
          prevMultiOutputValuesRef.current.set(node.id, gridKey);
        }
      }
    });
  }, [nodes, isPlaying]);

  // Update graph when nodes are added/removed or edges change during playback
  const prevIsPlayingRef = useRef(isPlaying);
  const prevNodeCountRef = useRef(nodes.length);
  const prevNodeIdsRef = useRef(nodes.map((n) => n.id).join(","));
  const prevEdgesRef = useRef(
    edges.map((e) => `${e.source}-${e.target}`).join(","),
  );

  useEffect(() => {
    const currentNodeIds = nodes.map((n) => n.id).join(",");
    const currentEdges = edges.map((e) => `${e.source}-${e.target}`).join(",");
    const nodeCountChanged = nodes.length !== prevNodeCountRef.current;
    const nodeIdsChanged = currentNodeIds !== prevNodeIdsRef.current;
    const edgesChanged = currentEdges !== prevEdgesRef.current;

    // Only update if already playing and topology changed (nodes added/removed or connections changed)
    if (
      isPlaying &&
      prevIsPlayingRef.current &&
      !isInternalNodeUpdate.current &&
      (nodeCountChanged || nodeIdsChanged || edgesChanged)
    ) {
      engineRef.current.updateGraph(nodes, edges);

      // Attach analysers to any new oscilloscope, numeric-meter, or fft-analyzer nodes that don't have them yet
      const needsAnalyserUpdate = nodes.some(
        (node) =>
          (node.data.blockType === "oscilloscope" ||
            node.data.blockType === "numeric-meter" ||
            node.data.blockType === "fft-analyzer") &&
          !node.data.analyser,
      );

      if (needsAnalyserUpdate) {
        isInternalNodeUpdate.current = true;
        setNodes((nds) =>
          nds.map((node) => {
            if (
              (node.data.blockType === "oscilloscope" ||
                node.data.blockType === "numeric-meter" ||
                node.data.blockType === "fft-analyzer") &&
              !node.data.analyser
            ) {
              const analyser = engineRef.current.getAnalyser(node.id);
              if (analyser) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    analyser,
                  },
                };
              }
            }
            return node;
          }),
        );
        setTimeout(() => {
          isInternalNodeUpdate.current = false;
        }, 0);
      }
    }

    prevIsPlayingRef.current = isPlaying;
    prevNodeCountRef.current = nodes.length;
    prevNodeIdsRef.current = currentNodeIds;
    prevEdgesRef.current = currentEdges;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, isPlaying]);

  const configDrawerNode = nodes.find((node) => node.id === configDrawerNodeId);

  const proOptions = { hideAttribution: true };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-radial-gradient">
      {/* Top Bar */}
      <Topbar isPlaying={isPlaying} onTogglePlayback={togglePlayback} />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <Toolbar />

        {/* Center Canvas with margin and rounded corners */}
        <div className="flex-1 relative pb-4 pr-4">
          <div
            className="h-full w-full rounded-3xl overflow-hidden border border-border shadow-canvas bg-card"
            ref={reactFlowWrapper}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              colorMode={theme}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onInit={(instance) => {
                reactFlowInstanceRef.current = instance;
              }}
              nodeTypes={nodeTypes}
              proOptions={proOptions}
              fitView
            >
              <Background />
              <Controls />
              <MiniMap pannable zoomable />
            </ReactFlow>
          </div>

          {/* Right Configuration Drawer - Absolutely positioned overlay */}
          <div className="absolute top-0 right-4 bottom-4 pointer-events-none overflow-hidden">
            <ConfigDrawer
              node={configDrawerNode as Node<SignalBlockData> | undefined}
              edges={edges}
              onConfigChange={(config) =>
                configDrawerNode && updateNodeConfig(configDrawerNode.id, config)
              }
              onDelete={deleteSelectedNode}
              onClose={() => setConfigDrawerNodeId(null)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SignalFlowAppWithProvider() {
  return (
    <ReactFlowProvider>
      <SignalFlowApp />
    </ReactFlowProvider>
  );
}
