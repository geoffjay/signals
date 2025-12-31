/**
 * Instrument Builder Page
 *
 * A dedicated page for creating and editing virtual instruments.
 * Similar to the main SignalFlowApp but with additional UI for:
 * - Instrument metadata (name, description)
 * - External port definition and mapping
 * - Draft/cloud save management
 */

import { useCallback, useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  ArrowLeft,
  Play,
  Square,
  Save,
  FileDown,
  AlertCircle,
} from "lucide-react";

import {
  type BlockType,
  BLOCK_DEFINITIONS,
  type BlockConfig,
} from "@/types/blocks";
import { SignalBlock, type SignalBlockData } from "@/components/SignalBlock";
import { Toolbar } from "@/components/Toolbar";
import { ConfigDrawer } from "@/components/ConfigDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/theme-provider";
import { SignalProcessingEngine } from "@/engine/SignalProcessingEngine";
import { useInstrumentBuilderStore } from "@/store/instrumentBuilderStore";
import { PortMappingPanel } from "@/components/instruments/PortMappingPanel";

const nodeTypes = {
  signalBlock: SignalBlock,
};

function InstrumentBuilderContent() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  // Instrument builder store
  const {
    nodes: storeNodes,
    edges: storeEdges,
    selectedNodeId,
    isPlaying,
    instrumentName,
    externalPorts,
    portMappings,
    isDirty,
    cloudRecordId,
    setNodes: setStoreNodes,
    setEdges: setStoreEdges,
    setSelectedNodeId,
    setIsPlaying,
    incrementNodeIdCounter,
    setInstrumentName,
    addExternalPort,
    updateExternalPort,
    removeExternalPort,
    setPortMapping,
    saveDraft,
    saveToCloud,
    updateInCloud,
    validateInstrument,
    lastExternalUpdate,
  } = useInstrumentBuilderStore();

  // ReactFlow state
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(storeNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(storeEdges);

  // UI state
  const [showPortMapping, setShowPortMapping] = useState(true);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Refs
  const reactFlowInstanceRef = useRef<ReactFlowInstance | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const engineRef = useRef(new SignalProcessingEngine());
  const isInternalNodeUpdate = useRef(false);
  const hasInitialized = useRef(false);
  const lastProcessedExternalUpdate = useRef(0);

  // Sync ReactFlow state to store
  useEffect(() => {
    if (!isInternalNodeUpdate.current) {
      setStoreNodes(nodes);
    }
  }, [nodes, setStoreNodes]);

  useEffect(() => {
    setStoreEdges(edges);
  }, [edges, setStoreEdges]);

  // Sync from store when external update occurs
  useEffect(() => {
    if (lastExternalUpdate > lastProcessedExternalUpdate.current) {
      isInternalNodeUpdate.current = true;
      setNodes(storeNodes);
      setEdges(storeEdges);
      lastProcessedExternalUpdate.current = lastExternalUpdate;
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

      if (isPlaying) {
        setIsPlaying(false);
      }
    }
  }, [isPlaying, setIsPlaying, setEdges, setNodes, storeEdges, storeNodes]);

  // Connection handler
  const onConnect = useCallback(
    (params: Connection) => {
      const targetHandle = params.targetHandle;
      if (targetHandle) {
        const existingEdge = edges.find(
          (edge) =>
            edge.target === params.target && edge.targetHandle === targetHandle,
        );
        if (existingEdge) {
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
      setShowPortMapping(false);
    },
    [setSelectedNodeId],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setShowPortMapping(true);
  }, [setSelectedNodeId]);

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

      // Don't allow dropping non-block types (instrument blocks will be filtered in Phase 5)
      if (!BLOCK_DEFINITIONS[blockType]) return;

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
            const nodeData = node.data as SignalBlockData;
            const mergedConfig = { ...nodeData.config, ...config };

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

  // Handle playback for testing
  useEffect(() => {
    if (isPlaying) {
      (async () => {
        await engineRef.current.start();
        engineRef.current.updateGraph(nodes, edges);

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
        setTimeout(() => {
          isInternalNodeUpdate.current = false;
        }, 0);
      })();
    } else {
      engineRef.current.stop();

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
      setTimeout(() => {
        isInternalNodeUpdate.current = false;
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isFormControl =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.tagName === "SELECT" ||
          activeElement.getAttribute("contenteditable") === "true");

      if (event.key === "Delete" && selectedNodeId && !isFormControl) {
        event.preventDefault();
        deleteSelectedNode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodeId, deleteSelectedNode]);

  // Save handlers
  const handleSaveDraft = useCallback(() => {
    saveDraft();
    setSaveError(null);
  }, [saveDraft]);

  const handleSaveToCloud = useCallback(async () => {
    const errors = validateInstrument();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);

    setIsSaving(true);
    setSaveError(null);

    try {
      if (cloudRecordId) {
        await updateInCloud();
      } else {
        await saveToCloud();
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  }, [validateInstrument, cloudRecordId, updateInCloud, saveToCloud]);

  const handleBack = useCallback(() => {
    if (isDirty) {
      // TODO: Add confirmation dialog
      if (
        !window.confirm(
          "You have unsaved changes. Are you sure you want to leave?",
        )
      ) {
        return;
      }
    }
    navigate("/");
  }, [isDirty, navigate]);

  const selectedNode = nodes.find((node) => node.id === selectedNodeId);
  const proOptions = { hideAttribution: true };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-radial-gradient">
      {/* Top Bar */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border">
        {/* Left: Back button and name */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Input
            value={instrumentName}
            onChange={(e) => setInstrumentName(e.target.value)}
            placeholder="Instrument Name"
            className="w-64 h-8"
          />
        </div>

        {/* Right: Save buttons and test button */}
        <div className="flex items-center gap-2">
          {validationErrors.length > 0 && (
            <div className="flex items-center gap-1 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{validationErrors[0]}</span>
            </div>
          )}
          {saveError && (
            <div className="flex items-center gap-1 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{saveError}</span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            disabled={!isDirty}
          >
            <FileDown className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSaveToCloud}
            disabled={isSaving || nodes.length === 0}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : cloudRecordId ? "Update" : "Save"}
          </Button>
          <div className="w-px h-6 bg-border mx-2" />
          <Button
            onClick={togglePlayback}
            size="sm"
            variant={isPlaying ? "destructive" : "default"}
            className="h-8 w-8 p-0"
            title="Test instrument"
          >
            {isPlaying ? (
              <Square className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <Toolbar />

        {/* Center Canvas */}
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

          {/* Right Panel - Port Mapping or Config Drawer */}
          <div className="absolute top-0 right-4 bottom-4 pointer-events-none overflow-hidden">
            {showPortMapping || !selectedNode ? (
              <PortMappingPanel
                nodes={nodes}
                externalPorts={externalPorts}
                portMappings={portMappings}
                onAddPort={addExternalPort}
                onUpdatePort={updateExternalPort}
                onRemovePort={removeExternalPort}
                onSetMapping={setPortMapping}
              />
            ) : (
              <ConfigDrawer
                node={selectedNode as Node<SignalBlockData> | undefined}
                edges={edges}
                onConfigChange={(config) =>
                  selectedNode && updateNodeConfig(selectedNode.id, config)
                }
                onDelete={deleteSelectedNode}
                onClose={() => {
                  setSelectedNodeId(null);
                  setShowPortMapping(true);
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function InstrumentBuilder() {
  return (
    <ReactFlowProvider>
      <InstrumentBuilderContent />
    </ReactFlowProvider>
  );
}
