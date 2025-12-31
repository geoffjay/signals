/**
 * Type definitions for CLI operations.
 * Mirrors relevant types from src/types/instruments.ts
 */

export interface ExternalPort {
  id: string;
  label: string;
  type: "input" | "output";
  dataType?: "audio" | "control";
}

export interface PortMapping {
  externalPortId: string;
  internalNodeId: string;
  internalPortId: string;
}

export interface InstrumentMetadata {
  id: string;
  name: string;
  description: string;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
  version?: string;
  tags?: string[];
  isPublic?: boolean;
}

export interface InstrumentDefinition {
  metadata: InstrumentMetadata;
  internalNodes: unknown[];
  internalEdges: unknown[];
  nodeIdCounter: number;
  externalPorts: ExternalPort[];
  portMappings: PortMapping[];
  defaultConfig: Record<string, unknown>;
}

export interface InstrumentRecord {
  id: string;
  userId: string;
  name: string;
  description: string;
  instrumentData: InstrumentDefinition;
  isPublic: boolean;
  tags: string[];
  created: string;
  updated: string;
}

export interface InstrumentSummary {
  id: string;
  name: string;
  description: string;
  author?: string;
  tags?: string[];
  isPublic: boolean;
  createdAt?: string;
  updatedAt?: string;
  inputCount: number;
  outputCount: number;
}

/**
 * Convert an InstrumentDefinition to a summary
 */
export function toInstrumentSummary(definition: InstrumentDefinition): InstrumentSummary {
  const ports = definition.externalPorts || [];
  return {
    id: definition.metadata.id,
    name: definition.metadata.name,
    description: definition.metadata.description,
    author: definition.metadata.author,
    tags: definition.metadata.tags,
    isPublic: definition.metadata.isPublic ?? false,
    createdAt: definition.metadata.createdAt,
    updatedAt: definition.metadata.updatedAt,
    inputCount: Array.isArray(ports) ? ports.filter((p) => p.type === "input").length : 0,
    outputCount: Array.isArray(ports) ? ports.filter((p) => p.type === "output").length : 0,
  };
}
