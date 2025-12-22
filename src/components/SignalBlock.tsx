import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { type BlockType, type BlockConfig, getBlockInputs, getBlockOutputs } from '@/types/blocks';
import { OscilloscopeDisplay } from './OscilloscopeDisplay';

export interface SignalBlockData extends Record<string, unknown> {
  blockType: BlockType;
  label: string;
  config: BlockConfig;
  analyser?: AnalyserNode;
}

export const SignalBlock = memo(({ data, selected }: NodeProps) => {
  const blockData = data as SignalBlockData;
  const inputs = getBlockInputs(blockData.blockType, blockData.config);
  const outputs = getBlockOutputs(blockData.blockType, blockData.config);

  const hasInputs = inputs.length > 0;
  const hasOutputs = outputs.length > 0;

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

      {/* Input Control Value Display */}
      {(blockData.blockType === 'slider' ||
        blockData.blockType === 'button' ||
        blockData.blockType === 'toggle' ||
        blockData.blockType === 'pulse') && (
        <div className="mb-2 text-center">
          <div className="text-2xl font-bold text-primary">
            {blockData.blockType === 'pulse'
              ? (blockData.config.pulseValue || 1.0).toFixed(2)
              : (blockData.config.value || 0).toFixed(2)}
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
