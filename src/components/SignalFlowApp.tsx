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
import { Toolbar } from "./Toolbar";
import { ConfigDrawer } from "./ConfigDrawer";
import { SignalProcessingEngine } from "@/engine/SignalProcessingEngine";
import { useSignalFlowStore } from "@/store/signalFlowStore";

const nodeTypes = {
  signalBlock: SignalBlock,
};

export function SignalFlowApp() {
  // Zustand store
  const {
    nodes: storeNodes,
    edges: storeEdges,
    selectedNodeId,
    isPlaying,
    setNodes: setStoreNodes,
    setEdges: setStoreEdges,
    setSelectedNodeId,
    setIsPlaying,
    incrementNodeIdCounter,
  } = useSignalFlowStore();

  // ReactFlow state for UI updates
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(storeNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(storeEdges);

  const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const engineRef = useRef(new SignalProcessingEngine());
  const isInternalNodeUpdate = useRef(false);
  const hasInitialized = useRef(false);

  // Sync ReactFlow state to Zustand store
  useEffect(() => {
    if (!isInternalNodeUpdate.current) {
      setStoreNodes(nodes);
    }
  }, [nodes, setStoreNodes]);

  useEffect(() => {
    setStoreEdges(edges);
  }, [edges, setStoreEdges]);

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
  }, []);

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

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstanceRef.current) return;

      const blockType = event.dataTransfer.getData(
        "application/reactflow",
      ) as BlockType;
      if (!blockType) return;

      const position = reactFlowInstanceRef.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

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

            // Update the engine if playing
            if (isPlaying) {
              engineRef.current.updateNodeConfig(nodeId, blockType, config);
            }

            return {
              ...node,
              data: {
                ...node.data,
                config,
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
    if (!selectedNodeId) return;

    setNodes((nds) => nds.filter((node) => node.id !== selectedNodeId));
    setEdges((eds) =>
      eds.filter(
        (edge) =>
          edge.source !== selectedNodeId && edge.target !== selectedNodeId,
      ),
    );
    setSelectedNodeId(null);
  }, [selectedNodeId, setNodes, setEdges, setSelectedNodeId]);

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
      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        selectedNodeId
      ) {
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
      // Start audio engine (async to properly resume AudioContext)
      (async () => {
        await engineRef.current.start();
        engineRef.current.updateGraph(nodes, edges);

        // Update oscilloscope nodes with analysers
        isInternalNodeUpdate.current = true;
        setNodes((nds) =>
          nds.map((node) => {
            if (node.data.blockType === "oscilloscope") {
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
      engineRef.current.stop();

      // Clear analysers from oscilloscope nodes
      isInternalNodeUpdate.current = true;
      setNodes((nds) =>
        nds.map((node) => {
          if (node.data.blockType === "oscilloscope") {
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

      // Attach analysers to any new oscilloscope nodes that don't have them yet
      const needsAnalyserUpdate = nodes.some(
        (node) => node.data.blockType === "oscilloscope" && !node.data.analyser,
      );

      if (needsAnalyserUpdate) {
        isInternalNodeUpdate.current = true;
        setNodes((nds) =>
          nds.map((node) => {
            if (node.data.blockType === "oscilloscope" && !node.data.analyser) {
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

  const selectedNode = nodes.find((node) => node.id === selectedNodeId);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Left Toolbar */}
      <Toolbar isPlaying={isPlaying} onTogglePlayback={togglePlayback} />

      {/* Center Canvas */}
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
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
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {/* Right Configuration Drawer */}
      <ConfigDrawer
        node={selectedNode as Node<SignalBlockData> | undefined}
        onConfigChange={(config) =>
          selectedNode && updateNodeConfig(selectedNode.id, config)
        }
        onDelete={deleteSelectedNode}
        onClose={() => setSelectedNodeId(null)}
      />
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
