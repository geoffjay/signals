/**
 * Zustand store for the Instrument Builder.
 * Manages the state of the instrument being built, including:
 * - Internal nodes and edges (the signal chain)
 * - External ports and their mappings
 * - Draft management
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Node, Edge } from "@xyflow/react";
import type { SignalBlockData } from "@/components/SignalBlock";
import type {
  InstrumentDefinition,
  ExternalPort,
  PortMapping,
  InstrumentDraft,
} from "@/types/instruments";
import {
  createEmptyInstrumentDefinition,
  validateInstrumentDefinition,
} from "@/types/instruments";
import { draftStorage, instrumentApi } from "@/lib/instrumentApi";

interface InstrumentBuilderState {
  // Canvas state (internal nodes/edges)
  nodes: Node[];
  edges: Edge[];
  nodeIdCounter: number;
  selectedNodeId: string | null;
  isPlaying: boolean; // For testing the instrument in builder

  // Instrument metadata
  instrumentId: string | null;
  instrumentName: string;
  instrumentDescription: string;
  instrumentTags: string[];

  // External ports configuration
  externalPorts: ExternalPort[];
  portMappings: PortMapping[];

  // Persistence state
  cloudRecordId: string | null; // PocketBase record ID if saved to cloud
  isDraft: boolean;
  isDirty: boolean;
  lastSavedAt: string | null;
  lastExternalUpdate: number;

  // Node/Edge actions
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((edges: Edge[]) => Edge[])) => void;
  setSelectedNodeId: (id: string | null) => void;
  setIsPlaying: (playing: boolean) => void;
  incrementNodeIdCounter: () => number;
  addNode: (node: Node) => void;
  updateNodeConfig: (nodeId: string, updates: Partial<SignalBlockData>) => void;
  deleteNode: (nodeId: string) => void;

  // Metadata actions
  setInstrumentName: (name: string) => void;
  setInstrumentDescription: (description: string) => void;
  setInstrumentTags: (tags: string[]) => void;

  // External port actions
  addExternalPort: (port: ExternalPort) => void;
  updateExternalPort: (portId: string, updates: Partial<ExternalPort>) => void;
  removeExternalPort: (portId: string) => void;

  // Port mapping actions
  setPortMapping: (
    externalPortId: string,
    mapping: Omit<PortMapping, "externalPortId"> | null,
  ) => void;

  // Instrument lifecycle
  createNewInstrument: (name?: string) => void;
  loadInstrument: (
    definition: InstrumentDefinition,
    cloudRecordId?: string,
  ) => void;
  getInstrumentDefinition: () => InstrumentDefinition;
  validateInstrument: () => string[];
  clearBuilder: () => void;

  // Draft persistence
  saveDraft: () => void;
  loadDraft: (draftId: string) => boolean;
  deleteDraft: (draftId: string) => void;
  listDrafts: () => InstrumentDraft[];

  // Cloud persistence
  saveToCloud: () => Promise<string>;
  updateInCloud: () => Promise<void>;
}

export const useInstrumentBuilderStore = create<InstrumentBuilderState>()(
  persist(
    (set, get) => ({
      // Initial state
      nodes: [],
      edges: [],
      nodeIdCounter: 1,
      selectedNodeId: null,
      isPlaying: false,

      instrumentId: null,
      instrumentName: "New Instrument",
      instrumentDescription: "",
      instrumentTags: [],

      externalPorts: [],
      portMappings: [],

      cloudRecordId: null,
      isDraft: true,
      isDirty: false,
      lastSavedAt: null,
      lastExternalUpdate: 0,

      // Node/Edge actions
      setNodes: (nodesOrUpdater) => {
        set((state) => ({
          nodes:
            typeof nodesOrUpdater === "function"
              ? nodesOrUpdater(state.nodes)
              : nodesOrUpdater,
          isDirty: true,
        }));
      },

      setEdges: (edgesOrUpdater) => {
        set((state) => ({
          edges:
            typeof edgesOrUpdater === "function"
              ? edgesOrUpdater(state.edges)
              : edgesOrUpdater,
          isDirty: true,
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
          isDirty: true,
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
          isDirty: true,
        }));
      },

      deleteNode: (nodeId) => {
        set((state) => {
          // Also remove any port mappings that reference this node
          const newPortMappings = state.portMappings.filter(
            (m) => m.internalNodeId !== nodeId,
          );

          return {
            nodes: state.nodes.filter((node) => node.id !== nodeId),
            edges: state.edges.filter(
              (edge) => edge.source !== nodeId && edge.target !== nodeId,
            ),
            selectedNodeId:
              state.selectedNodeId === nodeId ? null : state.selectedNodeId,
            portMappings: newPortMappings,
            isDirty: true,
          };
        });
      },

      // Metadata actions
      setInstrumentName: (name) => set({ instrumentName: name, isDirty: true }),
      setInstrumentDescription: (description) =>
        set({ instrumentDescription: description, isDirty: true }),
      setInstrumentTags: (tags) => set({ instrumentTags: tags, isDirty: true }),

      // External port actions
      addExternalPort: (port) => {
        set((state) => ({
          externalPorts: [...state.externalPorts, port],
          isDirty: true,
        }));
      },

      updateExternalPort: (portId, updates) => {
        set((state) => ({
          externalPorts: state.externalPorts.map((port) =>
            port.id === portId ? { ...port, ...updates } : port,
          ),
          isDirty: true,
        }));
      },

      removeExternalPort: (portId) => {
        set((state) => ({
          externalPorts: state.externalPorts.filter((p) => p.id !== portId),
          portMappings: state.portMappings.filter(
            (m) => m.externalPortId !== portId,
          ),
          isDirty: true,
        }));
      },

      // Port mapping actions
      setPortMapping: (externalPortId, mapping) => {
        set((state) => {
          // Remove existing mapping for this external port
          const filteredMappings = state.portMappings.filter(
            (m) => m.externalPortId !== externalPortId,
          );

          // Add new mapping if provided
          if (mapping) {
            filteredMappings.push({
              externalPortId,
              internalNodeId: mapping.internalNodeId,
              internalPortId: mapping.internalPortId,
            });
          }

          return {
            portMappings: filteredMappings,
            isDirty: true,
          };
        });
      },

      // Instrument lifecycle
      createNewInstrument: (name = "New Instrument") => {
        const definition = createEmptyInstrumentDefinition(name);
        set({
          nodes: [],
          edges: [],
          nodeIdCounter: 1,
          selectedNodeId: null,
          isPlaying: false,
          instrumentId: definition.metadata.id,
          instrumentName: name,
          instrumentDescription: "",
          instrumentTags: [],
          externalPorts: [],
          portMappings: [],
          cloudRecordId: null,
          isDraft: true,
          isDirty: false,
          lastSavedAt: null,
          lastExternalUpdate: Date.now(),
        });
      },

      loadInstrument: (definition, cloudRecordId) => {
        set({
          nodes: definition.internalNodes,
          edges: definition.internalEdges,
          nodeIdCounter: definition.nodeIdCounter,
          selectedNodeId: null,
          isPlaying: false,
          instrumentId: definition.metadata.id,
          instrumentName: definition.metadata.name,
          instrumentDescription: definition.metadata.description,
          instrumentTags: definition.metadata.tags ?? [],
          externalPorts: definition.externalPorts,
          portMappings: definition.portMappings,
          cloudRecordId: cloudRecordId ?? null,
          isDraft: !cloudRecordId,
          isDirty: false,
          lastSavedAt: definition.metadata.updatedAt,
          lastExternalUpdate: Date.now(),
        });
      },

      getInstrumentDefinition: () => {
        const state = get();
        const now = new Date().toISOString();

        return {
          metadata: {
            id: state.instrumentId ?? crypto.randomUUID(),
            name: state.instrumentName,
            description: state.instrumentDescription,
            createdAt: state.lastSavedAt ?? now,
            updatedAt: now,
            version: "1.0.0",
            tags: state.instrumentTags,
            isPublic: false,
          },
          internalNodes: state.nodes.map((node) => ({
            ...node,
            // Strip non-serializable data
            data: {
              ...node.data,
              analyser: undefined,
            },
          })),
          internalEdges: state.edges,
          nodeIdCounter: state.nodeIdCounter,
          externalPorts: state.externalPorts,
          portMappings: state.portMappings,
          defaultConfig: {
            instrumentId: state.instrumentId ?? crypto.randomUUID(),
          },
        };
      },

      validateInstrument: () => {
        const definition = get().getInstrumentDefinition();
        return validateInstrumentDefinition(definition);
      },

      clearBuilder: () => {
        set({
          nodes: [],
          edges: [],
          nodeIdCounter: 1,
          selectedNodeId: null,
          isPlaying: false,
          instrumentId: null,
          instrumentName: "New Instrument",
          instrumentDescription: "",
          instrumentTags: [],
          externalPorts: [],
          portMappings: [],
          cloudRecordId: null,
          isDraft: true,
          isDirty: false,
          lastSavedAt: null,
          lastExternalUpdate: Date.now(),
        });
      },

      // Draft persistence
      saveDraft: () => {
        const definition = get().getInstrumentDefinition();
        draftStorage.save(definition);
        set({
          isDirty: false,
          lastSavedAt: new Date().toISOString(),
        });
      },

      loadDraft: (draftId) => {
        const draft = draftStorage.get(draftId);
        if (!draft) return false;

        get().loadInstrument(draft.definition);
        return true;
      },

      deleteDraft: (draftId) => {
        draftStorage.delete(draftId);
        // If deleting current draft, clear builder
        if (get().instrumentId === draftId) {
          get().clearBuilder();
        }
      },

      listDrafts: () => {
        return draftStorage.list();
      },

      // Cloud persistence
      saveToCloud: async () => {
        const state = get();
        const definition = state.getInstrumentDefinition();

        // Validate before saving
        const errors = validateInstrumentDefinition(definition);
        if (errors.length > 0) {
          throw new Error(`Validation failed: ${errors.join(", ")}`);
        }

        const recordId = await instrumentApi.save(definition);

        set({
          cloudRecordId: recordId,
          isDraft: false,
          isDirty: false,
          lastSavedAt: new Date().toISOString(),
        });

        return recordId;
      },

      updateInCloud: async () => {
        const state = get();
        if (!state.cloudRecordId) {
          throw new Error("Instrument not saved to cloud yet");
        }

        const definition = state.getInstrumentDefinition();

        // Validate before saving
        const errors = validateInstrumentDefinition(definition);
        if (errors.length > 0) {
          throw new Error(`Validation failed: ${errors.join(", ")}`);
        }

        await instrumentApi.update(state.cloudRecordId, definition);

        set({
          isDirty: false,
          lastSavedAt: new Date().toISOString(),
        });
      },
    }),
    {
      name: "instrument-builder-storage",
      partialize: (state) => ({
        // Persist all builder state except non-serializable data
        nodes: state.nodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            analyser: undefined,
          },
        })),
        edges: state.edges,
        nodeIdCounter: state.nodeIdCounter,
        instrumentId: state.instrumentId,
        instrumentName: state.instrumentName,
        instrumentDescription: state.instrumentDescription,
        instrumentTags: state.instrumentTags,
        externalPorts: state.externalPorts,
        portMappings: state.portMappings,
        cloudRecordId: state.cloudRecordId,
        isDraft: state.isDraft,
        lastSavedAt: state.lastSavedAt,
      }),
    },
  ),
);
