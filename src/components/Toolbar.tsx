import {
  Play,
  Square,
  Waves,
  Box,
  Triangle,
  Zap,
  Radio,
  Volume2,
  Filter,
  TrendingUp,
  TrendingDown,
  Split,
  Combine,
  LineChart,
  Speaker,
  SlidersHorizontal,
  Circle,
  ToggleLeft,
  Zap as Pulse,
  Gauge,
  Plus,
  Minus,
  X as MultiplyIcon,
  Divide,
  BarChart3,
  ArrowUpToLine,
  ArrowDownToLine,
  CircleDot,
  Binary,
  PlusCircle,
  MinusCircle,
  Calculator,
  Activity,
  ChevronsDown,
  ChevronsUp,
  Superscript,
  Percent,
  Shrink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { type BlockType, BLOCK_DEFINITIONS } from "@/types/blocks";

const BLOCK_ICONS: Record<
  BlockType,
  React.ComponentType<{ className?: string }>
> = {
  "sine-wave": Waves,
  "square-wave": Box,
  "triangle-wave": Triangle,
  "sawtooth-wave": Zap,
  noise: Radio,
  gain: Volume2,
  "low-pass-filter": TrendingDown,
  "high-pass-filter": TrendingUp,
  "band-pass-filter": Filter,
  multiplexer: Combine,
  splitter: Split,
  oscilloscope: LineChart,
  "audio-output": Speaker,
  slider: SlidersHorizontal,
  button: Circle,
  toggle: ToggleLeft,
  pulse: Pulse,
  "numeric-meter": Gauge,
  add: Plus,
  subtract: Minus,
  multiply: MultiplyIcon,
  divide: Divide,
  "fft-analyzer": BarChart3,
  ceil: ArrowUpToLine,
  floor: ArrowDownToLine,
  round: CircleDot,
  abs: Binary,
  sign: PlusCircle,
  negate: MinusCircle,
  sqrt: Calculator,
  sin: Activity,
  cos: Activity,
  min: ChevronsDown,
  max: ChevronsUp,
  pow: Superscript,
  mod: Percent,
  clamp: Shrink,
};

interface ToolbarProps {
  isPlaying: boolean;
  onTogglePlayback: () => void;
}

const blockGroups = [
  {
    title: "Inputs",
    blocks: ["slider", "button", "toggle", "pulse"] as BlockType[],
  },
  {
    title: "Generators",
    blocks: [
      "sine-wave",
      "square-wave",
      "triangle-wave",
      "sawtooth-wave",
      "noise",
    ] as BlockType[],
  },
  {
    title: "Processors",
    blocks: [
      "gain",
      "low-pass-filter",
      "high-pass-filter",
      "band-pass-filter",
    ] as BlockType[],
  },
  {
    title: "Math",
    blocks: [
      "add",
      "subtract",
      "multiply",
      "divide",
      "ceil",
      "floor",
      "round",
      "abs",
      "sign",
      "negate",
      "sqrt",
      "sin",
      "cos",
      "min",
      "max",
      "pow",
      "mod",
      "clamp",
    ] as BlockType[],
  },
  {
    title: "Routing",
    blocks: ["multiplexer", "splitter"] as BlockType[],
  },
  {
    title: "Outputs",
    blocks: ["oscilloscope", "numeric-meter", "fft-analyzer", "audio-output"] as BlockType[],
  },
];

export function Toolbar({ isPlaying, onTogglePlayback }: ToolbarProps) {
  const onDragStart = (event: React.DragEvent, blockType: BlockType) => {
    event.dataTransfer.setData("application/reactflow", blockType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Playback Controls */}
      <div className="p-4 space-y-2">
        <Button
          onClick={onTogglePlayback}
          className="w-full"
          variant={isPlaying ? "destructive" : "default"}
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
                const Icon = BLOCK_ICONS[blockType];
                return (
                  <div
                    key={blockType}
                    draggable
                    onDragStart={(e) => onDragStart(e, blockType)}
                    className="
                      flex items-center gap-2 w-full
                      cursor-grab active:cursor-grabbing
                      group
                    "
                  >
                    <div
                      className="
                        flex items-center justify-center
                        w-8 h-8 flex-shrink-0
                        bg-secondary group-hover:bg-accent
                        border border-border rounded-md
                        transition-colors
                      "
                    >
                      <Icon className="w-4 h-4 text-foreground" />
                    </div>
                    <span className="text-sm text-foreground">
                      {definition.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
