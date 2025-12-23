import { memo, useCallback, useRef } from 'react';
import { Handle, Position, type NodeProps, useReactFlow } from '@xyflow/react';
import { type BlockType, type BlockConfig, getBlockInputs, getBlockOutputs } from '@/types/blocks';
import { OscilloscopeDisplay } from './OscilloscopeDisplay';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

export interface SignalBlockData extends Record<string, unknown> {
  blockType: BlockType;
  label: string;
  config: BlockConfig;
  analyser?: AnalyserNode;
}

export const SignalBlock = memo(({ id, data, selected }: NodeProps) => {
  const blockData = data as SignalBlockData;
  const inputs = getBlockInputs(blockData.blockType, blockData.config);
  const outputs = getBlockOutputs(blockData.blockType, blockData.config);
  const { setNodes } = useReactFlow();
  const pulseTimeoutRef = useRef<number | null>(null);

  const hasInputs = inputs.length > 0;
  const hasOutputs = outputs.length > 0;

  // Debug logging
  if (blockData.blockType === 'slider') {
    console.log('[DEBUG] Slider rendering:', { id, value: blockData.config.value, config: blockData.config });
  }

  // Prevent node selection when clicking on interactive controls
  const stopPropagation = useCallback((e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
  }, []);

  const handleSliderChange = useCallback((values: number[] | number) => {
    const newValue = Array.isArray(values) ? values[0] : values;
    console.log('[DEBUG] handleSliderChange called:', { id, values, newValue });
    setNodes((nds) => {
      const updated = nds.map((node) => {
        if (node.id === id) {
          const nodeData = node.data as SignalBlockData;
          console.log('[DEBUG] Updating node:', { id, oldValue: nodeData.config.value, newValue });
          return {
            ...node,
            data: {
              ...nodeData,
              config: { ...nodeData.config, value: newValue }
            }
          };
        }
        return node;
      });
      console.log('[DEBUG] setNodes completed');
      return updated;
    });
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
        bg-card border-2 rounded-lg px-4 py-3 min-w-[180px]
        transition-all duration-200
        ${selected ? 'border-primary shadow-lg' : 'border-border'}
      `}
    >
      {/* Block Label */}
      <div className="text-sm font-medium text-foreground text-center mb-2">
        {blockData.label}
      </div>

      {/* Oscilloscope Display */}
      {blockData.blockType === 'oscilloscope' && (
        <div className="mb-2">
          <OscilloscopeDisplay
            analyser={blockData.analyser}
            width={200}
            height={100}
            refreshRate={blockData.config.refreshRate}
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

      {/* Input Ports */}
      {hasInputs && (
        <div className="space-y-2 mb-2">
          {inputs.map((input, index) => (
            <div key={input.id} className="relative flex items-center">
              <Handle
                type="target"
                position={Position.Left}
                id={input.id}
                style={{
                  left: -8,
                  top: `calc(50% + ${(index - (inputs.length - 1) / 2) * 32}px)`,
                  background: '#555',
                  width: 12,
                  height: 12,
                  border: '2px solid #fff',
                }}
              />
              <span className="text-xs text-muted-foreground ml-2">{input.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Output Ports */}
      {hasOutputs && (
        <div className="space-y-2">
          {outputs.map((output, index) => (
            <div key={output.id} className="relative flex items-center justify-end">
              <span className="text-xs text-muted-foreground mr-2">{output.label}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={output.id}
                style={{
                  right: -8,
                  top: `calc(50% + ${(index - (outputs.length - 1) / 2) * 32}px)`,
                  background: '#555',
                  width: 12,
                  height: 12,
                  border: '2px solid #fff',
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

SignalBlock.displayName = 'SignalBlock';
