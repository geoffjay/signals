/**
 * Port Mapping Panel
 *
 * UI for defining external ports on an instrument and mapping them
 * to internal node ports.
 */

import { useState } from "react";
import type { Node } from "@xyflow/react";
import { Plus, Trash2, ChevronDown, ChevronRight, Plug } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { ExternalPort, PortMapping } from "@/types/instruments";
import {
  getBlockInputs,
  getBlockOutputs,
  type BlockType,
} from "@/types/blocks";
import type { SignalBlockData } from "@/components/SignalBlock";

interface PortMappingPanelProps {
  nodes: Node[];
  externalPorts: ExternalPort[];
  portMappings: PortMapping[];
  onAddPort: (port: ExternalPort) => void;
  onUpdatePort: (portId: string, updates: Partial<ExternalPort>) => void;
  onRemovePort: (portId: string) => void;
  onSetMapping: (
    externalPortId: string,
    mapping: { internalNodeId: string; internalPortId: string } | null,
  ) => void;
}

export function PortMappingPanel({
  nodes,
  externalPorts,
  portMappings,
  onAddPort,
  onUpdatePort,
  onRemovePort,
  onSetMapping,
}: PortMappingPanelProps) {
  const [inputsExpanded, setInputsExpanded] = useState(true);
  const [outputsExpanded, setOutputsExpanded] = useState(true);

  const inputPorts = externalPorts.filter((p) => p.type === "input");
  const outputPorts = externalPorts.filter((p) => p.type === "output");

  const handleAddInput = () => {
    const id = `ext-in-${Date.now()}`;
    onAddPort({
      id,
      label: `Input ${inputPorts.length + 1}`,
      type: "input",
    });
  };

  const handleAddOutput = () => {
    const id = `ext-out-${Date.now()}`;
    onAddPort({
      id,
      label: `Output ${outputPorts.length + 1}`,
      type: "output",
    });
  };

  // Get available targets for input ports (internal node inputs)
  const getInputTargets = () => {
    const targets: Array<{
      nodeId: string;
      nodeLabel: string;
      portId: string;
      portLabel: string;
    }> = [];

    nodes.forEach((node) => {
      const data = node.data as SignalBlockData;
      const blockType = data.blockType as BlockType;
      const inputs = getBlockInputs(blockType, data.config);

      inputs.forEach((input) => {
        targets.push({
          nodeId: node.id,
          nodeLabel: data.config?.customLabel || data.label,
          portId: input.id,
          portLabel: input.label,
        });
      });
    });

    return targets;
  };

  // Get available sources for output ports (internal node outputs)
  const getOutputSources = () => {
    const sources: Array<{
      nodeId: string;
      nodeLabel: string;
      portId: string;
      portLabel: string;
    }> = [];

    nodes.forEach((node) => {
      const data = node.data as SignalBlockData;
      const blockType = data.blockType as BlockType;
      const outputs = getBlockOutputs(blockType, data.config);

      outputs.forEach((output) => {
        sources.push({
          nodeId: node.id,
          nodeLabel: data.config?.customLabel || data.label,
          portId: output.id,
          portLabel: output.label,
        });
      });
    });

    return sources;
  };

  const getMappingForPort = (portId: string) => {
    return portMappings.find((m) => m.externalPortId === portId);
  };

  const inputTargets = getInputTargets();
  const outputSources = getOutputSources();

  return (
    <div className="w-80 h-full bg-background border-l border-border pointer-events-auto overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Plug className="w-5 h-5" />
          <h2 className="font-semibold">External Ports</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Define the ports exposed on your instrument
        </p>
      </div>

      {/* Input Ports Section */}
      <div className="p-4">
        <button
          onClick={() => setInputsExpanded(!inputsExpanded)}
          className="flex items-center gap-2 w-full text-left mb-2"
        >
          {inputsExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            Inputs ({inputPorts.length})
          </span>
        </button>

        {inputsExpanded && (
          <div className="space-y-3">
            {inputPorts.map((port) => {
              const mapping = getMappingForPort(port.id);
              const mappingValue = mapping
                ? `${mapping.internalNodeId}::${mapping.internalPortId}`
                : "";

              return (
                <div
                  key={port.id}
                  className="p-3 bg-muted/50 rounded-lg space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Input
                      value={port.label}
                      onChange={(e) =>
                        onUpdatePort(port.id, { label: e.target.value })
                      }
                      placeholder="Port name"
                      className="h-8 flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => onRemovePort(port.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Maps to
                    </Label>
                    <Select
                      value={mappingValue || "none"}
                      onValueChange={(value) => {
                        if (value === "none") {
                          onSetMapping(port.id, null);
                        } else if (value) {
                          const parts = value.split("::");
                          if (parts.length === 2) {
                            onSetMapping(port.id, {
                              internalNodeId: parts[0],
                              internalPortId: parts[1],
                            });
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not mapped</SelectItem>
                        {/* Group by node */}
                        {Array.from(
                          new Set(inputTargets.map((t) => t.nodeId)),
                        ).map((nodeId) => {
                          const nodeTargets = inputTargets.filter(
                            (t) => t.nodeId === nodeId,
                          );
                          const nodeLabel = nodeTargets[0]?.nodeLabel;

                          return (
                            <SelectGroup key={nodeId}>
                              <SelectLabel className="text-xs">
                                {nodeLabel}
                              </SelectLabel>
                              {nodeTargets.map((target) => (
                                <SelectItem
                                  key={`${target.nodeId}::${target.portId}`}
                                  value={`${target.nodeId}::${target.portId}`}
                                >
                                  {target.portLabel}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleAddInput}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Input
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {/* Output Ports Section */}
      <div className="p-4">
        <button
          onClick={() => setOutputsExpanded(!outputsExpanded)}
          className="flex items-center gap-2 w-full text-left mb-2"
        >
          {outputsExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            Outputs ({outputPorts.length})
          </span>
        </button>

        {outputsExpanded && (
          <div className="space-y-3">
            {outputPorts.map((port) => {
              const mapping = getMappingForPort(port.id);
              const mappingValue = mapping
                ? `${mapping.internalNodeId}::${mapping.internalPortId}`
                : "";

              return (
                <div
                  key={port.id}
                  className="p-3 bg-muted/50 rounded-lg space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Input
                      value={port.label}
                      onChange={(e) =>
                        onUpdatePort(port.id, { label: e.target.value })
                      }
                      placeholder="Port name"
                      className="h-8 flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => onRemovePort(port.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Maps from
                    </Label>
                    <Select
                      value={mappingValue || "none"}
                      onValueChange={(value) => {
                        if (value === "none") {
                          onSetMapping(port.id, null);
                        } else if (value) {
                          const parts = value.split("::");
                          if (parts.length === 2) {
                            onSetMapping(port.id, {
                              internalNodeId: parts[0],
                              internalPortId: parts[1],
                            });
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not mapped</SelectItem>
                        {/* Group by node */}
                        {Array.from(
                          new Set(outputSources.map((s) => s.nodeId)),
                        ).map((nodeId) => {
                          const nodeSources = outputSources.filter(
                            (s) => s.nodeId === nodeId,
                          );
                          const nodeLabel = nodeSources[0]?.nodeLabel;

                          return (
                            <SelectGroup key={nodeId}>
                              <SelectLabel className="text-xs">
                                {nodeLabel}
                              </SelectLabel>
                              {nodeSources.map((source) => (
                                <SelectItem
                                  key={`${source.nodeId}::${source.portId}`}
                                  value={`${source.nodeId}::${source.portId}`}
                                >
                                  {source.portLabel}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleAddOutput}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Output
            </Button>
          </div>
        )}
      </div>

      {/* Help Text */}
      {nodes.length === 0 && (
        <div className="p-4 text-center text-muted-foreground text-sm">
          <p>Drag blocks from the toolbar to start building your instrument.</p>
        </div>
      )}
    </div>
  );
}
