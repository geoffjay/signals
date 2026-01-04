import { useEffect, useRef } from "react";
import { useSignalFlowStore } from "@/store/signalFlowStore";
import { useExternalConnectionStore } from "@/store/externalConnectionStore";

/**
 * Hook that syncs external connections from signal flow nodes to the external connection store.
 * This ensures connections are available even when the External Connections block isn't rendered
 * (e.g., when viewing the visualizer page).
 *
 * Note: This hook only registers/updates connections. Cleanup is handled by the engine
 * when nodes are removed from the audio graph.
 */
export function useExternalConnectionSync() {
  const nodes = useSignalFlowStore((state) => state.nodes);
  // Track previous external connection node IDs to detect deletions
  const prevNodeIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const { registerConnection, unregisterAllForNode } =
      useExternalConnectionStore.getState();

    // Track current external connection node IDs
    const currentNodeIds = new Set<string>();

    // Find all external-connections nodes and register their connections
    for (const node of nodes) {
      if (node.type === "external-connections" && node.data) {
        currentNodeIds.add(node.id);
        const config = (node.data.config || {}) as Record<string, unknown>;
        const numConnections = (config.extConnectionCount as number) || 1;
        const names = (config.extConnectionNames as string[]) || [];

        const connections = useExternalConnectionStore.getState().connections;

        // Register each connection
        for (let i = 0; i < numConnections; i++) {
          const name = names[i] || `ext${i}`;
          const key = `${node.id}:${i}`;
          const existing = connections.get(key);

          if (!existing) {
            registerConnection(node.id, i, name);
          } else if (existing.name !== name) {
            // Update name if changed
            useExternalConnectionStore.getState().updateName(node.id, i, name);
          }
        }

        // Unregister connections that exceed the current count (for this node only)
        for (const [key] of connections) {
          if (key.startsWith(`${node.id}:`)) {
            const inputIndex = parseInt(key.split(":")[1], 10);
            if (inputIndex >= numConnections) {
              useExternalConnectionStore.getState().unregisterConnection(node.id, inputIndex);
            }
          }
        }
      }
    }

    // Only clean up connections for nodes that were previously tracked but are now deleted
    // This prevents interfering with engine-registered connections
    for (const prevNodeId of prevNodeIdsRef.current) {
      if (!currentNodeIds.has(prevNodeId)) {
        // This node was deleted from the canvas
        unregisterAllForNode(prevNodeId);
      }
    }

    // Update the ref for next render
    prevNodeIdsRef.current = currentNodeIds;
  }, [nodes]);
}
