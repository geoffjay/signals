import type { BlockDefinition } from "./common";

/**
 * Filter block types
 */
export type FilterBlockType =
  | "low-pass-filter"
  | "high-pass-filter"
  | "band-pass-filter"
  | "notch-filter"
  | "allpass-filter"
  | "peaking-eq"
  | "lowshelf-filter"
  | "highshelf-filter";

/**
 * Filter block definitions
 */
export const FILTER_DEFINITIONS: Record<FilterBlockType, BlockDefinition> = {
  "low-pass-filter": {
    type: "low-pass-filter",
    label: "Low-Pass Filter",
    inputs: [
      { id: "in", label: "In" },
      { id: "cutoff", label: "Cutoff" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      cutoffFrequency: 1000,
      qFactor: 1.0,
    },
  },
  "high-pass-filter": {
    type: "high-pass-filter",
    label: "High-Pass Filter",
    inputs: [
      { id: "in", label: "In" },
      { id: "cutoff", label: "Cutoff" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      cutoffFrequency: 1000,
      qFactor: 1.0,
    },
  },
  "band-pass-filter": {
    type: "band-pass-filter",
    label: "Band-Pass Filter",
    inputs: [
      { id: "in", label: "In" },
      { id: "cutoff", label: "Cutoff" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      cutoffFrequency: 1000,
      qFactor: 1.0,
    },
  },
  "notch-filter": {
    type: "notch-filter",
    label: "Notch Filter",
    inputs: [
      { id: "in", label: "In" },
      { id: "cutoff", label: "Cutoff" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      cutoffFrequency: 1000,
      qFactor: 1.0,
    },
  },
  "allpass-filter": {
    type: "allpass-filter",
    label: "All-Pass Filter",
    inputs: [
      { id: "in", label: "In" },
      { id: "cutoff", label: "Cutoff" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      cutoffFrequency: 1000,
      qFactor: 1.0,
    },
  },
  "peaking-eq": {
    type: "peaking-eq",
    label: "Peaking EQ",
    inputs: [
      { id: "in", label: "In" },
      { id: "frequency", label: "Freq" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      cutoffFrequency: 1000,
      qFactor: 1.0,
      filterGain: 0,
    },
  },
  "lowshelf-filter": {
    type: "lowshelf-filter",
    label: "Low-Shelf Filter",
    inputs: [
      { id: "in", label: "In" },
      { id: "cutoff", label: "Cutoff" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      cutoffFrequency: 200,
      filterGain: 0,
    },
  },
  "highshelf-filter": {
    type: "highshelf-filter",
    label: "High-Shelf Filter",
    inputs: [
      { id: "in", label: "In" },
      { id: "cutoff", label: "Cutoff" },
    ],
    outputs: [{ id: "out", label: "Out" }],
    defaultConfig: {
      cutoffFrequency: 3000,
      filterGain: 0,
    },
  },
};
