import { memo, useCallback, useRef } from "react";
import { Handle, Position, type NodeProps, useReactFlow } from "@xyflow/react";
import {
  type BlockType,
  type BlockConfig,
  getBlockInputs,
  getBlockOutputs,
} from "@/types/blocks";
import { BlockContent } from "./blocks";

export interface SignalBlockData extends Record<string, unknown> {
  blockType: BlockType;
  label: string;
  config: BlockConfig;
  analyser?: AnalyserNode;
  currentValue?: number; // For numeric meter display
}

export const SignalBlock = memo(({ id, data, selected }: NodeProps) => {
  const blockData = data as SignalBlockData;
  const inputs = getBlockInputs(blockData.blockType, blockData.config);
  const outputs = getBlockOutputs(blockData.blockType, blockData.config);
  const { setNodes } = useReactFlow();
  const pulseTimeoutRef = useRef<number | null>(null);

  const hasInputs = inputs.length > 0;
  const hasOutputs = outputs.length > 0;

  // Handler for slider value changes
  const handleSliderChange = useCallback(
    (newValue: number) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === id) {
            const nodeData = node.data as SignalBlockData;
            return {
              ...node,
              data: {
                ...nodeData,
                config: { ...nodeData.config, value: newValue },
              },
            };
          }
          return node;
        }),
      );
    },
    [id, setNodes],
  );

  // Handler for button press
  const handleButtonPress = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          const nodeData = node.data as SignalBlockData;
          return {
            ...node,
            data: {
              ...nodeData,
              config: {
                ...nodeData.config,
                value: nodeData.config.outputValue ?? 1.0,
              },
            },
          };
        }
        return node;
      }),
    );
  }, [id, setNodes]);

  // Handler for button release
  const handleButtonRelease = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          const nodeData = node.data as SignalBlockData;
          return {
            ...node,
            data: {
              ...nodeData,
              config: { ...nodeData.config, value: 0 },
            },
          };
        }
        return node;
      }),
    );
  }, [id, setNodes]);

  // Handler for toggle clicks
  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === id) {
            const nodeData = node.data as SignalBlockData;
            const currentValue = nodeData.config.value ?? 0;
            const newValue =
              currentValue === 0 ? (nodeData.config.outputValue ?? 1.0) : 0;
            return {
              ...node,
              data: {
                ...nodeData,
                config: { ...nodeData.config, value: newValue },
              },
            };
          }
          return node;
        }),
      );
    },
    [id, setNodes],
  );

  // Handler for pulse clicks
  const handlePulse = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      // Clear any existing pulse timeout
      if (pulseTimeoutRef.current !== null) {
        window.clearTimeout(pulseTimeoutRef.current);
      }

      // Set pulse value
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === id) {
            const nodeData = node.data as SignalBlockData;
            return {
              ...node,
              data: {
                ...nodeData,
                config: {
                  ...nodeData.config,
                  value: nodeData.config.pulseValue ?? 1.0,
                },
              },
            };
          }
          return node;
        }),
      );

      // Reset to 0 after pulse duration
      pulseTimeoutRef.current = window.setTimeout(() => {
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === id) {
              const nodeData = node.data as SignalBlockData;
              return {
                ...node,
                data: {
                  ...nodeData,
                  config: { ...nodeData.config, value: 0 },
                },
              };
            }
            return node;
          }),
        );
        pulseTimeoutRef.current = null;
      }, blockData.config.pulseDuration ?? 100);
    },
    [id, blockData.config.pulseDuration, setNodes],
  );

  // Collected handlers for BlockContent
  const handlers = {
    onSliderChange: handleSliderChange,
    onButtonPress: handleButtonPress,
    onButtonRelease: handleButtonRelease,
    onToggle: handleToggle,
    onPulse: handlePulse,
  };

  // Use custom label if set, otherwise use default block label
  const displayLabel = blockData.config.customLabel || blockData.label;
  const customColor = blockData.config.customColor;

  return (
    <div
      className={`
        border-2 rounded-lg min-w-[180px]
        transition-all duration-200
        ${selected ? "border-primary shadow-lg" : "border-border"}
      `}
      style={{
        backgroundColor: customColor || undefined,
      }}
    >
      {/* Block Header */}
      <div
        className={`px-3 py-2 rounded-t-md border-b border-border ${!customColor ? "bg-muted/50" : ""}`}
        style={{
          backgroundColor: customColor
            ? "rgba(0, 0, 0, 0.15)"
            : undefined,
        }}
      >
        <div className="text-sm font-medium text-foreground">
          {displayLabel}
        </div>
      </div>

      {/* Block Content */}
      <div
        className={`px-4 py-3 relative rounded-b-md ${!customColor ? "bg-card" : ""}`}
      >
        {/* Block-specific content (controls, visualizations) */}
        <BlockContent
          blockType={blockData.blockType}
          config={blockData.config}
          analyser={blockData.analyser}
          handlers={handlers}
        />

        {/* Input Ports */}
        {hasInputs && (
          <div className="mt-2 space-y-1">
            {inputs.map((input) => (
              <div key={input.id} className="relative flex items-center h-6">
                <Handle
                  type="target"
                  position={Position.Left}
                  id={input.id}
                  style={{
                    left: "-6px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "#555",
                    width: 12,
                    height: 12,
                    border: "2px solid #fff",
                    position: "absolute",
                  }}
                />
                <span className="text-xs text-muted-foreground ml-3">
                  {input.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Output Ports */}
        {hasOutputs && (
          <div className="mt-2 space-y-1 flex flex-col items-end">
            {outputs.map((output) => (
              <div
                key={output.id}
                className="relative flex items-center justify-end h-6"
              >
                <span className="text-xs text-muted-foreground mr-3">
                  {output.label}
                </span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={output.id}
                  style={{
                    right: "-6px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "#555",
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
      </div>
    </div>
  );
});

SignalBlock.displayName = "SignalBlock";
