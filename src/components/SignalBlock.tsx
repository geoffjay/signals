import { memo, useCallback, useRef } from 'react';
import { Handle, Position, type NodeProps, useReactFlow } from '@xyflow/react';
import { type BlockType, type BlockConfig, getBlockInputs, getBlockOutputs } from '@/types/blocks';
import { OscilloscopeDisplay } from './OscilloscopeDisplay';
import { NumericMeterDisplay } from './NumericMeterDisplay';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

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

  // Prevent node selection when clicking on interactive controls
  const stopPropagation = useCallback((e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
  }, []);

  const handleSliderChange = useCallback((values: readonly number[] | number) => {
    const newValue = Array.isArray(values) ? values[0] : values;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          const nodeData = node.data as SignalBlockData;
          return {
            ...node,
            data: {
              ...nodeData,
              config: { ...nodeData.config, value: newValue }
            }
          };
        }
        return node;
      })
    );
  }, [id, setNodes]);

  const handleButtonPress = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          const nodeData = node.data as SignalBlockData;
          return {
            ...node,
            data: {
              ...nodeData,
              config: { ...nodeData.config, value: nodeData.config.outputValue ?? 1.0 }
            }
          };
        }
        return node;
      })
    );
  }, [id, setNodes]);

  const handleButtonRelease = useCallback(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          const nodeData = node.data as SignalBlockData;
          return {
            ...node,
            data: {
              ...nodeData,
              config: { ...nodeData.config, value: 0 }
            }
          };
        }
        return node;
      })
    );
  }, [id, setNodes]);

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          const nodeData = node.data as SignalBlockData;
          const currentValue = nodeData.config.value ?? 0;
          const newValue = currentValue === 0 ? (nodeData.config.outputValue ?? 1.0) : 0;
          return {
            ...node,
            data: {
              ...nodeData,
              config: { ...nodeData.config, value: newValue }
            }
          };
        }
        return node;
      })
    );
  }, [id, setNodes]);

  const handlePulse = useCallback((e: React.MouseEvent) => {
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
              config: { ...nodeData.config, value: nodeData.config.pulseValue ?? 1.0 }
            }
          };
        }
        return node;
      })
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
                config: { ...nodeData.config, value: 0 }
              }
            };
          }
          return node;
        })
      );
      pulseTimeoutRef.current = null;
    }, blockData.config.pulseDuration ?? 100);
  }, [id, blockData.config.pulseDuration, setNodes]);

  return (
    <div
      className={`
        bg-card border-2 rounded-lg min-w-[180px]
        transition-all duration-200
        ${selected ? 'border-primary shadow-lg' : 'border-border'}
      `}
    >
      {/* Block Header */}
      <div className="bg-muted/50 px-3 py-2 rounded-t-md border-b border-border">
        <div className="text-sm font-medium text-foreground">
          {blockData.label}
        </div>
      </div>

      {/* Block Content */}
      <div className="px-4 py-3 relative">{/* Content wrapper for proper positioning */}

      {/* Oscilloscope Display */}
      {blockData.blockType === 'oscilloscope' && (
        <div className="mb-2">
          <OscilloscopeDisplay
            analyser={blockData.analyser}
            width={200}
            height={100}
            refreshRate={blockData.config.refreshRate}
            timeWindow={blockData.config.timeWindow}
            minAmplitude={blockData.config.minAmplitude}
            maxAmplitude={blockData.config.maxAmplitude}
          />
        </div>
      )}

      {/* Slider Control */}
      {blockData.blockType === 'slider' && (
        <div className="mb-3 px-2 nodrag nowheel">
          <div className="text-xs text-center text-muted-foreground mb-1">
            {(blockData.config.value ?? 0.5).toFixed(3)}
          </div>
          <div onClick={stopPropagation}>
            <Slider
              min={blockData.config.min ?? 0}
              max={blockData.config.max ?? 1}
              step={blockData.config.step ?? 0.01}
              value={[blockData.config.value ?? 0.5]}
              onValueChange={handleSliderChange}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Button Control */}
      {blockData.blockType === 'button' && (
        <div className="mb-2 nodrag nowheel">
          <Button
            onMouseDown={handleButtonPress}
            onMouseUp={handleButtonRelease}
            onMouseLeave={handleButtonRelease}
            onPointerDown={stopPropagation}
            onClick={stopPropagation}
            className="w-full"
            size="sm"
          >
            Press
          </Button>
          <div className="text-xs text-center text-muted-foreground mt-1">
            {(blockData.config.value ?? 0).toFixed(2)}
          </div>
        </div>
      )}

      {/* Toggle Control */}
      {blockData.blockType === 'toggle' && (
        <div className="mb-2 nodrag nowheel">
          <Button
            onClick={handleToggle}
            variant={(blockData.config.value ?? 0) === 0 ? 'outline' : 'default'}
            className="w-full"
            size="sm"
          >
            {(blockData.config.value ?? 0) === 0 ? 'Off' : 'On'}
          </Button>
          <div className="text-xs text-center text-muted-foreground mt-1">
            {(blockData.config.value ?? 0).toFixed(2)}
          </div>
        </div>
      )}

      {/* Pulse Control */}
      {blockData.blockType === 'pulse' && (
        <div className="mb-2 nodrag nowheel">
          <Button
            onClick={handlePulse}
            className="w-full"
            size="sm"
          >
            Pulse
          </Button>
          <div className="text-xs text-center text-muted-foreground mt-1">
            {(blockData.config.value ?? 0).toFixed(2)}
          </div>
        </div>
      )}

      {/* Numeric Meter Display */}
      {blockData.blockType === 'numeric-meter' && (
        <div className="mb-2 px-2">
          <NumericMeterDisplay
            analyser={blockData.analyser}
            decimals={blockData.config.decimals ?? 3}
            unit={blockData.config.unit ?? ''}
          />
        </div>
      )}

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
                  left: '-6px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: '#555',
                  width: 12,
                  height: 12,
                  border: '2px solid #fff',
                  position: 'absolute',
                }}
              />
              <span className="text-xs text-muted-foreground ml-3">{input.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Output Ports */}
      {hasOutputs && (
        <div className="mt-2 space-y-1 flex flex-col items-end">
          {outputs.map((output) => (
            <div key={output.id} className="relative flex items-center justify-end h-6">
              <span className="text-xs text-muted-foreground mr-3">{output.label}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={output.id}
                style={{
                  right: '-6px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: '#555',
                  width: 12,
                  height: 12,
                  border: '2px solid #fff',
                  position: 'absolute',
                }}
              />
            </div>
          ))}
        </div>
      )}
      </div>{/* Close content wrapper */}
    </div>
  );
});

SignalBlock.displayName = 'SignalBlock';
