import { useMemo, useCallback } from "react";
import type { Edge } from "@xyflow/react";
import { isInputConnected, isOutputConnected } from "@/utils/graph";

/**
 * Hook that provides helper functions to check connection status of node handles.
 *
 * @param nodeId - The ID of the node to check connections for
 * @param edges - The array of edges in the graph
 * @returns Object with connection check functions
 *
 * @example
 * ```tsx
 * const { isInputConnected, isOutputConnected, isAnyInputConnected } = useConnectionCheck(node.id, edges);
 *
 * const freqConnected = isInputConnected("freq");
 * ```
 */
export function useConnectionCheck(nodeId: string, edges: Edge[]) {
  // Memoize the check functions to avoid unnecessary re-renders
  const checkInputConnected = useCallback(
    (handleId: string): boolean => {
      return isInputConnected(nodeId, handleId, edges);
    },
    [nodeId, edges],
  );

  const checkOutputConnected = useCallback(
    (handleId: string): boolean => {
      return isOutputConnected(nodeId, handleId, edges);
    },
    [nodeId, edges],
  );

  // Get list of connected input handles
  const connectedInputs = useMemo(() => {
    return edges
      .filter((edge) => edge.target === nodeId)
      .map((edge) => edge.targetHandle)
      .filter((handle): handle is string => handle !== undefined);
  }, [nodeId, edges]);

  // Get list of connected output handles
  const connectedOutputs = useMemo(() => {
    return edges
      .filter((edge) => edge.source === nodeId)
      .map((edge) => edge.sourceHandle)
      .filter((handle): handle is string => handle !== undefined);
  }, [nodeId, edges]);

  // Check if any input is connected
  const hasAnyInputConnected = useMemo(() => {
    return connectedInputs.length > 0;
  }, [connectedInputs]);

  // Check if any output is connected
  const hasAnyOutputConnected = useMemo(() => {
    return connectedOutputs.length > 0;
  }, [connectedOutputs]);

  return {
    /** Check if a specific input handle is connected */
    isInputConnected: checkInputConnected,
    /** Check if a specific output handle is connected */
    isOutputConnected: checkOutputConnected,
    /** List of connected input handle IDs */
    connectedInputs,
    /** List of connected output handle IDs */
    connectedOutputs,
    /** Whether any input is connected */
    hasAnyInputConnected,
    /** Whether any output is connected */
    hasAnyOutputConnected,
  };
}
