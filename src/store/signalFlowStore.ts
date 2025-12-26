import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Node, type Edge } from "@xyflow/react";
import { type SignalBlockData } from "@/components/SignalBlock";
import { projectApi, type ProjectMetadata } from "@/lib/projectApi";

interface SignalFlowState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  isPlaying: boolean;
  nodeIdCounter: number;

  // Project management
  currentProjectId: string | null;
  currentProjectName: string;
  isDirty: boolean;

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

  // Project persistence
  saveProject: (name: string, description?: string) => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  createNewProject: () => void;
  deleteProject: (projectId: string) => Promise<void>;
  listUserProjects: () => Promise<ProjectMetadata[]>;
  markDirty: () => void;
  markClean: () => void;
}

export const useSignalFlowStore = create<SignalFlowState>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      isPlaying: false,
      nodeIdCounter: 0,

      // Project management state
      currentProjectId: null,
      currentProjectName: "Untitled Project",
      isDirty: false,

      setNodes: (nodesOrUpdater) => {
        set((state) => ({
          nodes:
            typeof nodesOrUpdater === "function"
              ? nodesOrUpdater(state.nodes)
              : nodesOrUpdater,
          isDirty: true, // Mark as dirty when nodes change
        }));
      },

      setEdges: (edgesOrUpdater) => {
        set((state) => ({
          edges:
            typeof edgesOrUpdater === "function"
              ? edgesOrUpdater(state.edges)
              : edgesOrUpdater,
          isDirty: true, // Mark as dirty when edges change
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
          isDirty: true, // Mark as dirty when nodes are added
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
          isDirty: true, // Mark as dirty when node config changes
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
          isDirty: true, // Mark as dirty when nodes are deleted
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
          isDirty: true, // Mark as dirty when node data changes
        }));
      },

      // Project persistence methods
      saveProject: async (name, description) => {
        const state = get();
        const projectData = {
          nodes: state.nodes,
          edges: state.edges,
          nodeIdCounter: state.nodeIdCounter,
          selectedNodeId: state.selectedNodeId,
        };

        try {
          if (state.currentProjectId) {
            // Update existing project
            await projectApi.update(
              state.currentProjectId,
              name,
              projectData,
              description,
            );
          } else {
            // Create new project
            const projectId = await projectApi.save(name, projectData, description);
            set({ currentProjectId: projectId });
          }

          set({
            currentProjectName: name,
            isDirty: false,
          });
        } catch (error) {
          console.error("Failed to save project:", error);
          throw error;
        }
      },

      loadProject: async (projectId) => {
        try {
          const project = await projectApi.load(projectId);

          set({
            nodes: project.projectData.nodes,
            edges: project.projectData.edges,
            nodeIdCounter: project.projectData.nodeIdCounter,
            selectedNodeId: project.projectData.selectedNodeId,
            currentProjectId: project.id,
            currentProjectName: project.name,
            isDirty: false,
          });
        } catch (error) {
          console.error("Failed to load project:", error);
          throw error;
        }
      },

      createNewProject: () => {
        set({
          nodes: [],
          edges: [],
          selectedNodeId: null,
          nodeIdCounter: 0,
          currentProjectId: null,
          currentProjectName: "Untitled Project",
          isDirty: false,
        });
      },

      deleteProject: async (projectId) => {
        try {
          await projectApi.delete(projectId);

          // If deleting current project, reset to new project
          const state = get();
          if (state.currentProjectId === projectId) {
            state.createNewProject();
          }
        } catch (error) {
          console.error("Failed to delete project:", error);
          throw error;
        }
      },

      listUserProjects: async () => {
        try {
          return await projectApi.list();
        } catch (error) {
          console.error("Failed to list projects:", error);
          throw error;
        }
      },

      markDirty: () => {
        set({ isDirty: true });
      },

      markClean: () => {
        set({ isDirty: false });
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
