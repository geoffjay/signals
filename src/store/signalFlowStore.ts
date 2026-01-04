import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Node, type Edge } from "@xyflow/react";
import { type SignalBlockData } from "@/components/SignalBlock";
import { projectApi, type ProjectMetadata } from "@/lib/projectApi";

export type AppMode = "signal" | "visualizer";

// Visualizer types
export type VisualizerType =
  | "bar-spectrum"
  | "waveform"
  | "circular-spectrum"
  | "particles"
  | "frequency-grid"
  | "geometric";

export interface VisualizerEffects {
  bloomEnabled: boolean;
  bloomIntensity: number;
  chromaticAberrationEnabled: boolean;
  chromaticAberrationOffset: number;
  vignetteEnabled: boolean;
  vignetteIntensity: number;
  noiseEnabled: boolean;
  noiseIntensity: number;
  glitchEnabled: boolean;
  glitchIntensity: number;
  scanlinesEnabled: boolean;
  scanlinesIntensity: number;
  pixelationEnabled: boolean;
  pixelationGranularity: number;
}

export interface VisualizerConfig {
  type: VisualizerType;
  effects: VisualizerEffects;
  barCount: number;
  particleCount: number;
  colorScheme: "purple" | "rainbow" | "monochrome";
}

interface SignalFlowState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  configDrawerNodeId: string | null;
  isPlaying: boolean;
  nodeIdCounter: number;

  // App mode (signal generation vs audio visualizer)
  appMode: AppMode;

  // Visualizer configuration
  visualizerConfig: VisualizerConfig;

  // Project management
  currentProjectId: string | null;
  currentProjectName: string;
  isDirty: boolean;

  // External update tracking (for import/load operations)
  lastExternalUpdate: number;

  // Actions
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((edges: Edge[]) => Edge[])) => void;
  setSelectedNodeId: (id: string | null) => void;
  setConfigDrawerNodeId: (id: string | null) => void;
  openConfigDrawer: (id: string) => void;
  setIsPlaying: (playing: boolean) => void;
  incrementNodeIdCounter: () => number;
  addNode: (node: Node) => void;
  updateNodeConfig: (nodeId: string, updates: Partial<SignalBlockData>) => void;
  deleteNode: (nodeId: string) => void;
  updateNodeData: (nodeId: string, data: Partial<SignalBlockData>) => void;
  setAppMode: (mode: AppMode) => void;
  toggleAppMode: () => void;

  // Visualizer configuration
  setVisualizerType: (type: VisualizerType) => void;
  setVisualizerEffects: (effects: Partial<VisualizerEffects>) => void;
  setVisualizerConfig: (config: Partial<VisualizerConfig>) => void;

  // Project persistence
  saveProject: (name: string, description?: string) => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  createNewProject: () => void;
  deleteProject: (projectId: string) => Promise<void>;
  listUserProjects: () => Promise<ProjectMetadata[]>;
  markDirty: () => void;
  markClean: () => void;

  // Import/Export
  importProject: (
    name: string,
    projectData: {
      nodes: Node[];
      edges: Edge[];
      nodeIdCounter: number;
      selectedNodeId: string | null;
    },
  ) => void;
}

export const useSignalFlowStore = create<SignalFlowState>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      configDrawerNodeId: null,
      isPlaying: false,
      nodeIdCounter: 0,

      // App mode
      appMode: "signal",

      // Visualizer configuration defaults
      visualizerConfig: {
        type: "bar-spectrum",
        effects: {
          bloomEnabled: true,
          bloomIntensity: 1.5,
          chromaticAberrationEnabled: false,
          chromaticAberrationOffset: 0.005,
          vignetteEnabled: false,
          vignetteIntensity: 0.5,
          noiseEnabled: false,
          noiseIntensity: 0.15,
          glitchEnabled: false,
          glitchIntensity: 0.5,
          scanlinesEnabled: false,
          scanlinesIntensity: 0.5,
          pixelationEnabled: false,
          pixelationGranularity: 8,
        },
        barCount: 64,
        particleCount: 50,
        colorScheme: "purple",
      },

      // Project management state
      currentProjectId: null,
      currentProjectName: "Untitled Project",
      isDirty: false,
      lastExternalUpdate: 0,

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

      setConfigDrawerNodeId: (id) => set({ configDrawerNodeId: id }),

      openConfigDrawer: (id) => set({ configDrawerNodeId: id, selectedNodeId: id }),

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
          configDrawerNodeId:
            state.configDrawerNodeId === nodeId ? null : state.configDrawerNodeId,
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

      setAppMode: (mode) => set({ appMode: mode }),

      toggleAppMode: () => {
        set((state) => ({
          appMode: state.appMode === "signal" ? "visualizer" : "signal",
        }));
      },

      // Visualizer configuration actions
      setVisualizerType: (type) => {
        set((state) => ({
          visualizerConfig: {
            ...state.visualizerConfig,
            type,
          },
        }));
      },

      setVisualizerEffects: (effects) => {
        set((state) => ({
          visualizerConfig: {
            ...state.visualizerConfig,
            effects: {
              ...state.visualizerConfig.effects,
              ...effects,
            },
          },
        }));
      },

      setVisualizerConfig: (config) => {
        set((state) => ({
          visualizerConfig: {
            ...state.visualizerConfig,
            ...config,
          },
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
            const projectId = await projectApi.save(
              name,
              projectData,
              description,
            );
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
            configDrawerNodeId: null,
            currentProjectId: project.id,
            currentProjectName: project.name,
            isDirty: false,
            lastExternalUpdate: Date.now(),
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
          configDrawerNodeId: null,
          nodeIdCounter: 0,
          currentProjectId: null,
          currentProjectName: "Untitled Project",
          isDirty: false,
          lastExternalUpdate: Date.now(),
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

      importProject: (name, projectData) => {
        set({
          nodes: projectData.nodes,
          edges: projectData.edges,
          nodeIdCounter: projectData.nodeIdCounter,
          selectedNodeId: projectData.selectedNodeId,
          configDrawerNodeId: null,
          currentProjectId: null, // Imported projects are not linked to cloud storage
          currentProjectName: name,
          isDirty: true, // Mark as dirty since it's not saved to cloud
          lastExternalUpdate: Date.now(),
        });
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
        appMode: state.appMode,
        visualizerConfig: state.visualizerConfig,
      }),
    },
  ),
);
