import { Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { type BlockType, BLOCK_DEFINITIONS } from '@/types/blocks';

interface ToolbarProps {
  isPlaying: boolean;
  onTogglePlayback: () => void;
}

const blockGroups = [
  {
    title: 'Generators',
    blocks: ['sine-wave', 'square-wave', 'triangle-wave', 'sawtooth-wave', 'noise'] as BlockType[],
  },
  {
    title: 'Processors',
    blocks: ['gain', 'low-pass-filter', 'high-pass-filter', 'band-pass-filter'] as BlockType[],
  },
  {
    title: 'Routing',
    blocks: ['multiplexer', 'splitter'] as BlockType[],
  },
  {
    title: 'Outputs',
    blocks: ['oscilloscope', 'audio-output'] as BlockType[],
  },
];

export function Toolbar({ isPlaying, onTogglePlayback }: ToolbarProps) {
  const onDragStart = (event: React.DragEvent, blockType: BlockType) => {
    event.dataTransfer.setData('application/reactflow', blockType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Playback Controls */}
      <div className="p-4 space-y-2">
        <Button
          onClick={onTogglePlayback}
          className="w-full"
          variant={isPlaying ? 'destructive' : 'default'}
        >
          {isPlaying ? (
            <>
              <Square className="w-4 h-4 mr-2" />
              Stop
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Start
            </>
          )}
        </Button>
      </div>

      <Separator />

      {/* Block Buttons */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {blockGroups.map((group) => (
          <div key={group.title} className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.blocks.map((blockType) => {
                const definition = BLOCK_DEFINITIONS[blockType];
                return (
                  <button
                    key={blockType}
                    draggable
                    onDragStart={(e) => onDragStart(e, blockType)}
                    className="
                      w-full px-3 py-2 text-sm text-left
                      bg-secondary hover:bg-accent
                      border border-border rounded-md
                      transition-colors cursor-grab active:cursor-grabbing
                    "
                  >
                    {definition.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
