/**
 * InstrumentBlock Component
 *
 * Renders a saved instrument as an opaque block in the main signal flow canvas.
 * Unlike SignalBlock which renders primitives, this component:
 * - Uses external ports defined in the instrument definition
 * - Has a distinctive appearance (icon, styling)
 * - Contains the full instrument definition for audio engine expansion
 */

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Package } from "lucide-react";
import type { InstrumentDefinition, ExternalPort } from "@/types/instruments";
import type { BlockConfig } from "@/types/blocks";

export interface InstrumentBlockData extends Record<string, unknown> {
  blockType: "instrument";
  label: string;
  config: BlockConfig & {
    instrumentId: string;
  };
  /** The full instrument definition for audio engine expansion */
  instrumentDefinition: InstrumentDefinition;
  /** External ports from the instrument definition */
  externalPorts: ExternalPort[];
}

export const InstrumentBlock = memo(({ data, selected }: NodeProps) => {
  const blockData = data as InstrumentBlockData;
  const { externalPorts, instrumentDefinition } = blockData;

  const inputPorts = externalPorts.filter((p) => p.type === "input");
  const outputPorts = externalPorts.filter((p) => p.type === "output");

  // Use custom label if set, otherwise use instrument name
  const displayLabel =
    blockData.config.customLabel ||
    blockData.label ||
    instrumentDefinition.metadata.name;
  const customColor = blockData.config.customColor;

  // Instrument-specific background color (slightly different from primitives)
  const instrumentBgColor = customColor || "rgba(99, 102, 241, 0.1)"; // Indigo tint

  return (
    <div
      className={`
        border-2 rounded-lg min-w-[180px]
        transition-all duration-200
        ${selected ? "border-primary shadow-lg" : "border-indigo-400/50"}
      `}
      style={{
        backgroundColor: instrumentBgColor,
      }}
    >
      {/* Block Header */}
      <div
        className="px-3 py-2 rounded-t-md border-b border-indigo-400/30"
        style={{
          backgroundColor: customColor
            ? "rgba(0, 0, 0, 0.15)"
            : "rgba(99, 102, 241, 0.15)",
        }}
      >
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-medium text-foreground">
            {displayLabel}
          </span>
        </div>
        {instrumentDefinition.metadata.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {instrumentDefinition.metadata.description}
          </p>
        )}
      </div>

      {/* Block Content - Ports */}
      <div className="px-4 py-3 relative rounded-b-md">
        {/* Input Ports */}
        {inputPorts.length > 0 && (
          <div className="space-y-1">
            {inputPorts.map((port) => (
              <div key={port.id} className="relative flex items-center h-6">
                <Handle
                  type="target"
                  position={Position.Left}
                  id={port.id}
                  style={{
                    left: "-6px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "#6366f1", // Indigo color for instrument ports
                    width: 12,
                    height: 12,
                    border: "2px solid #fff",
                    position: "absolute",
                  }}
                />
                <span className="text-xs text-muted-foreground ml-3">
                  {port.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Spacer if both inputs and outputs exist */}
        {inputPorts.length > 0 && outputPorts.length > 0 && (
          <div className="my-2" />
        )}

        {/* Output Ports */}
        {outputPorts.length > 0 && (
          <div className="space-y-1 flex flex-col items-end">
            {outputPorts.map((port) => (
              <div
                key={port.id}
                className="relative flex items-center justify-end h-6"
              >
                <span className="text-xs text-muted-foreground mr-3">
                  {port.label}
                </span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={port.id}
                  style={{
                    right: "-6px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "#6366f1", // Indigo color for instrument ports
                    width: 12,
                    height: 12,
                    border: "2px solid #fff",
                    position: "absolute",
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Empty state if no ports */}
        {inputPorts.length === 0 && outputPorts.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-2">
            No ports defined
          </div>
        )}
      </div>
    </div>
  );
});

InstrumentBlock.displayName = "InstrumentBlock";
