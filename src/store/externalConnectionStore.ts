import { create } from "zustand";

/**
 * Represents a single external connection that exposes a signal value
 */
export interface ExternalConnection {
  name: string;
  value: number;
  nodeId: string;
  inputIndex: number;
}

interface ExternalConnectionState {
  // Map of connections keyed by "nodeId:inputIndex"
  connections: Map<string, ExternalConnection>;

  // Actions
  registerConnection: (
    nodeId: string,
    inputIndex: number,
    name: string,
  ) => void;
  unregisterConnection: (nodeId: string, inputIndex: number) => void;
  unregisterAllForNode: (nodeId: string) => void;
  updateValue: (nodeId: string, inputIndex: number, value: number) => void;
  updateName: (nodeId: string, inputIndex: number, name: string) => void;
  getConnectionByName: (name: string) => ExternalConnection | undefined;
  getAllConnections: () => ExternalConnection[];
  clearAll: () => void;
}

const makeKey = (nodeId: string, inputIndex: number) =>
  `${nodeId}:${inputIndex}`;

export const useExternalConnectionStore = create<ExternalConnectionState>(
  (set, get) => ({
    connections: new Map(),

    registerConnection: (nodeId, inputIndex, name) => {
      set((state) => {
        const newConnections = new Map(state.connections);
        newConnections.set(makeKey(nodeId, inputIndex), {
          name,
          value: 0,
          nodeId,
          inputIndex,
        });
        return { connections: newConnections };
      });
    },

    unregisterConnection: (nodeId, inputIndex) => {
      set((state) => {
        const newConnections = new Map(state.connections);
        newConnections.delete(makeKey(nodeId, inputIndex));
        return { connections: newConnections };
      });
    },

    unregisterAllForNode: (nodeId) => {
      set((state) => {
        const newConnections = new Map(state.connections);
        // Remove all connections for this node
        for (const key of Array.from(newConnections.keys())) {
          if (key.startsWith(`${nodeId}:`)) {
            newConnections.delete(key);
          }
        }
        return { connections: newConnections };
      });
    },

    updateValue: (nodeId, inputIndex, value) => {
      const key = makeKey(nodeId, inputIndex);
      const connection = get().connections.get(key);
      if (connection) {
        set((state) => {
          const newConnections = new Map(state.connections);
          newConnections.set(key, { ...connection, value });
          return { connections: newConnections };
        });
      }
    },

    updateName: (nodeId, inputIndex, name) => {
      const key = makeKey(nodeId, inputIndex);
      const connection = get().connections.get(key);
      if (connection) {
        set((state) => {
          const newConnections = new Map(state.connections);
          newConnections.set(key, { ...connection, name });
          return { connections: newConnections };
        });
      }
    },

    getConnectionByName: (name) => {
      for (const connection of get().connections.values()) {
        if (connection.name === name) {
          return connection;
        }
      }
      return undefined;
    },

    getAllConnections: () => {
      return Array.from(get().connections.values());
    },

    clearAll: () => {
      set({ connections: new Map() });
    },
  }),
);
