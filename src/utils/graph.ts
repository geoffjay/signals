import type { Edge, Node } from "@xyflow/react";

/**
 * Get a stable string key representing node IDs for comparison
 */
export function getNodeIds(nodes: Node[]): string {
  return nodes.map((n) => n.id).join(",");
}

/**
 * Get a stable string key representing edge connections for comparison
 */
export function getEdgeKeys(edges: Edge[]): string {
  return edges.map((e) => `${e.source}-${e.target}`).join(",");
}

/**
 * Detect if the graph topology has changed between two states
 */
export function detectTopologyChange(
  prevNodes: Node[],
  newNodes: Node[],
  prevEdges: Edge[],
  newEdges: Edge[],
): boolean {
  const nodeCountChanged = prevNodes.length !== newNodes.length;
  const nodeIdsChanged = getNodeIds(prevNodes) !== getNodeIds(newNodes);
  const edgesChanged = getEdgeKeys(prevEdges) !== getEdgeKeys(newEdges);

  return nodeCountChanged || nodeIdsChanged || edgesChanged;
}

/**
 * Check if a specific input handle on a node is connected
 */
export function isInputConnected(
  nodeId: string,
  handleId: string,
  edges: Edge[],
): boolean {
  return edges.some(
    (edge) => edge.target === nodeId && edge.targetHandle === handleId,
  );
}

/**
 * Check if a specific output handle on a node is connected
 */
export function isOutputConnected(
  nodeId: string,
  handleId: string,
  edges: Edge[],
): boolean {
  return edges.some(
    (edge) => edge.source === nodeId && edge.sourceHandle === handleId,
  );
}

/**
 * Get all edges connected to a node (both inputs and outputs)
 */
export function getNodeEdges(nodeId: string, edges: Edge[]): Edge[] {
  return edges.filter(
    (edge) => edge.source === nodeId || edge.target === nodeId,
  );
}

/**
 * Get edges that are inputs to a node
 */
export function getInputEdges(nodeId: string, edges: Edge[]): Edge[] {
  return edges.filter((edge) => edge.target === nodeId);
}

/**
 * Get edges that are outputs from a node
 */
export function getOutputEdges(nodeId: string, edges: Edge[]): Edge[] {
  return edges.filter((edge) => edge.source === nodeId);
}
