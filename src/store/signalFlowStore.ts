import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Node, type Edge } from "@xyflow/react";
import { type SignalBlockData } from "@/components/SignalBlock";

interface SignalFlowState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  isPlaying: boolean;
  nodeIdCounter: number;

  // Actions
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((edges: Edge[]) => Edge[])) => void;
  setSelectedNodeId: (id: string | null) => void;
  setIsPlaying: (playing: boolean) => void;
  incrementNodeIdCounter: () => number;
  addNode: (node: Node) => void;
  updateNodeConfig: (nodeId: string, updates: Partial<SignalBlockData>) => void;
  deleteNode: (nodeId: string) => void;
  updateNodeData: (nodeId: string, data: Partial<SignalBlockData>) => void;
}

export const useSignalFlowStore = create<SignalFlowState>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      isPlaying: false,
      nodeIdCounter: 0,

      setNodes: (nodesOrUpdater) => {
        set((state) => ({
          nodes:
            typeof nodesOrUpdater === "function"
              ? nodesOrUpdater(state.nodes)
              : nodesOrUpdater,
        }));
      },

      setEdges: (edgesOrUpdater) => {
        set((state) => ({
          edges:
            typeof edgesOrUpdater === "function"
              ? edgesOrUpdater(state.edges)
              : edgesOrUpdater,
        }));
      },

      setSelectedNodeId: (id) => set({ selectedNodeId: id }),

      setIsPlaying: (playing) => set({ isPlaying: playing }),

      incrementNodeIdCounter: () => {
        const current = get().nodeIdCounter;
        set({ nodeIdCounter: current + 1 });
        return current;
      },

      addNode: (node) => {
        set((state) => ({
          nodes: [...state.nodes, node],
        }));
      },

      updateNodeConfig: (nodeId, updates) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === nodeId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    ...updates,
                  },
                }
              : node,
          ),
        }));
      },

      deleteNode: (nodeId) => {
        set((state) => ({
          nodes: state.nodes.filter((node) => node.id !== nodeId),
          edges: state.edges.filter(
            (edge) => edge.source !== nodeId && edge.target !== nodeId,
          ),
          selectedNodeId:
            state.selectedNodeId === nodeId ? null : state.selectedNodeId,
        }));
      },

      updateNodeData: (nodeId, data) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === nodeId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    ...data,
                  },
                }
              : node,
          ),
        }));
      },
    }),
    {
      name: "signal-flow-storage",
      partialize: (state) => ({
        nodes: state.nodes.map((node) => ({
          ...node,
          // Remove analyser references as they can't be serialized
          data: {
            ...node.data,
            analyser: undefined,
          },
        })),
        edges: state.edges,
        selectedNodeId: state.selectedNodeId,
        isPlaying: state.isPlaying,
        nodeIdCounter: state.nodeIdCounter,
      }),
    },
  ),
);
