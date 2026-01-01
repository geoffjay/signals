/**
 * Type definitions for CLI operations.
 * Re-exports shared types from the main application.
 */

// Re-export all instrument types from shared module
export type {
  ExternalPort,
  PortMapping,
  InstrumentMetadata,
  InstrumentDefinition,
  InstrumentRecord,
  InstrumentSummary,
} from "@/types/instruments";

// Re-export utility functions
export { toInstrumentSummary } from "@/types/instruments";
