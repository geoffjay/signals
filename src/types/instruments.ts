/**
 * Type definitions for virtual instruments - reusable compound blocks
 * composed of signal processing primitives.
 */

import type { Node, Edge } from "@xyflow/react";
import type { BlockConfig } from "./blocks";

/**
 * Defines an external port exposed on an instrument.
 * External ports are the connection points visible when the instrument
 * is used as an opaque block in the main signal flow canvas.
 */
export interface ExternalPort {
  /** Unique port ID (e.g., "ext-in-0", "ext-out-0") */
  id: string;
  /** Display label for the port (e.g., "Frequency", "Output") */
  label: string;
  /** Port direction - input or output */
  type: "input" | "output";
  /** Optional signal type hint for UI/validation */
  dataType?: "audio" | "control";
}

/**
 * Maps an external port to an internal node's port.
 * This defines how signals flow between the instrument's
 * external interface and its internal block structure.
 */
export interface PortMapping {
  /** References the external port ID */
  externalPortId: string;
  /** ID of the node inside the instrument */
  internalNodeId: string;
  /** Port ID on the internal node (e.g., "freq", "out") */
  internalPortId: string;
}

/**
 * Metadata for an instrument definition.
 */
export interface InstrumentMetadata {
  /** Unique identifier for the instrument */
  id: string;
  /** Display name of the instrument */
  name: string;
  /** User-provided description */
  description: string;
  /** Creator's user ID or name */
  author?: string;
  /** ISO date string when created */
  createdAt: string;
  /** ISO date string when last updated */
  updatedAt: string;
  /** Semantic version (e.g., "1.0.0") */
  version: string;
  /** Categorization tags for discovery */
  tags?: string[];
  /** Whether the instrument is shared publicly */
  isPublic?: boolean;
}

/**
 * Instance-specific configuration for an instrument block.
 * Applied when an instrument is placed on the main canvas.
 */
export interface InstrumentConfig extends BlockConfig {
  /** The instrument definition ID this instance is based on */
  instrumentId: string;
}

/**
 * Complete instrument definition containing everything needed
 * to instantiate and use the instrument.
 */
export interface InstrumentDefinition {
  /** Metadata about the instrument */
  metadata: InstrumentMetadata;

  /** Nodes inside the instrument (the internal signal chain) */
  internalNodes: Node[];
  /** Connections between internal nodes */
  internalEdges: Edge[];
  /** Counter for generating unique node IDs within the instrument */
  nodeIdCounter: number;

  /** Ports exposed on the instrument block */
  externalPorts: ExternalPort[];
  /** Mappings from external ports to internal node ports */
  portMappings: PortMapping[];

  /** Default configuration applied to new instances */
  defaultConfig: InstrumentConfig;
}

/**
 * Local draft of an instrument (stored in localStorage).
 */
export interface InstrumentDraft {
  /** Local draft ID */
  id: string;
  /** The instrument definition being edited */
  definition: InstrumentDefinition;
  /** ISO date of last modification */
  lastModified: string;
  /** Marker to identify as draft */
  isDraft: true;
}

/**
 * Instrument record as stored in PocketBase.
 */
export interface InstrumentRecord {
  /** PocketBase record ID */
  id: string;
  /** Owner's user ID */
  userId: string;
  /** Searchable name */
  name: string;
  /** Searchable description */
  description: string;
  /** The complete instrument definition */
  instrumentData: InstrumentDefinition;
  /** Whether publicly visible */
  isPublic: boolean;
  /** Optional preview image */
  thumbnail?: string;
  /** PocketBase created timestamp */
  created: string;
  /** PocketBase updated timestamp */
  updated: string;
}

/**
 * Summary of an instrument for listing/browsing.
 * Contains only metadata without the full internal structure.
 */
export interface InstrumentSummary {
  id: string;
  name: string;
  description: string;
  author?: string;
  tags?: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  /** Number of external input ports */
  inputCount: number;
  /** Number of external output ports */
  outputCount: number;
}

/**
 * Helper to create an empty instrument definition with defaults.
 */
export function createEmptyInstrumentDefinition(
  name: string = "New Instrument",
): InstrumentDefinition {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  return {
    metadata: {
      id,
      name,
      description: "",
      createdAt: now,
      updatedAt: now,
      version: "1.0.0",
      tags: [],
      isPublic: false,
    },
    internalNodes: [],
    internalEdges: [],
    nodeIdCounter: 1,
    externalPorts: [],
    portMappings: [],
    defaultConfig: {
      instrumentId: id,
    },
  };
}

/**
 * Extracts a summary from a full instrument definition.
 * Includes defensive checks for malformed data from database.
 */
export function toInstrumentSummary(
  definition: InstrumentDefinition,
): InstrumentSummary {
  // Defensive check for malformed externalPorts (may be object instead of array in older records)
  const ports = Array.isArray(definition.externalPorts)
    ? definition.externalPorts
    : [];

  return {
    id: definition.metadata?.id ?? "",
    name: definition.metadata?.name ?? "Unknown",
    description: definition.metadata?.description ?? "",
    author: definition.metadata?.author,
    tags: definition.metadata?.tags,
    isPublic: definition.metadata?.isPublic ?? false,
    createdAt: definition.metadata?.createdAt ?? "",
    updatedAt: definition.metadata?.updatedAt ?? "",
    inputCount: ports.filter((p) => p.type === "input").length,
    outputCount: ports.filter((p) => p.type === "output").length,
  };
}

/**
 * Validates an instrument definition for completeness.
 * Returns an array of validation error messages, empty if valid.
 * Includes defensive checks for malformed data.
 */
export function validateInstrumentDefinition(
  definition: InstrumentDefinition,
): string[] {
  const errors: string[] = [];

  // Defensive array checks for potentially malformed data
  const externalPorts = Array.isArray(definition.externalPorts)
    ? definition.externalPorts
    : [];
  const portMappings = Array.isArray(definition.portMappings)
    ? definition.portMappings
    : [];
  const internalNodes = Array.isArray(definition.internalNodes)
    ? definition.internalNodes
    : [];

  // Check metadata
  if (!definition.metadata?.name?.trim()) {
    errors.push("Instrument name is required");
  }

  // Validate array types
  if (!Array.isArray(definition.externalPorts)) {
    errors.push("externalPorts must be an array");
  }
  if (!Array.isArray(definition.portMappings)) {
    errors.push("portMappings must be an array");
  }
  if (!Array.isArray(definition.internalNodes)) {
    errors.push("internalNodes must be an array");
  }
  if (!Array.isArray(definition.internalEdges)) {
    errors.push("internalEdges must be an array");
  }

  // Check that all port mappings reference valid external ports
  const externalPortIds = new Set(externalPorts.map((p) => p.id));
  for (const mapping of portMappings) {
    if (!externalPortIds.has(mapping.externalPortId)) {
      errors.push(
        `Port mapping references unknown external port: ${mapping.externalPortId}`,
      );
    }
  }

  // Check that all port mappings reference valid internal nodes
  const internalNodeIds = new Set(internalNodes.map((n) => n.id));
  for (const mapping of portMappings) {
    if (!internalNodeIds.has(mapping.internalNodeId)) {
      errors.push(
        `Port mapping references unknown internal node: ${mapping.internalNodeId}`,
      );
    }
  }

  // Check for unmapped external ports
  const mappedPortIds = new Set(portMappings.map((m) => m.externalPortId));
  for (const port of externalPorts) {
    if (!mappedPortIds.has(port.id)) {
      errors.push(
        `External port "${port.label}" is not mapped to any internal node`,
      );
    }
  }

  // Check for duplicate external port labels
  const portLabels = externalPorts.map((p) => p.label.toLowerCase());
  const duplicateLabels = portLabels.filter(
    (label, index) => portLabels.indexOf(label) !== index,
  );
  if (duplicateLabels.length > 0) {
    errors.push(
      `Duplicate port labels: ${[...new Set(duplicateLabels)].join(", ")}`,
    );
  }

  return errors;
}
