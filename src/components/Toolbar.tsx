import { useState, useEffect } from "react";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import {
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
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  LayoutList,
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

interface ToolbarProps {}

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
    blocks: [
      "oscilloscope",
      "numeric-meter",
      "fft-analyzer",
      "audio-output",
    ] as BlockType[],
  },
];

export function Toolbar({}: ToolbarProps) {
  // Initialize from localStorage
  const [showLabels, setShowLabels] = useState(() => {
    const saved = localStorage.getItem("toolbar-show-labels");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    () => {
      const saved = localStorage.getItem("toolbar-collapsed-sections");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    },
  );

  // Save showLabels to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("toolbar-show-labels", JSON.stringify(showLabels));
  }, [showLabels]);

  // Save collapsedSections to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(
      "toolbar-collapsed-sections",
      JSON.stringify(Array.from(collapsedSections)),
    );
  }, [collapsedSections]);

  const onDragStart = (event: React.DragEvent, blockType: BlockType) => {
    event.dataTransfer.setData("application/reactflow", blockType);
    event.dataTransfer.effectAllowed = "move";
  };

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  return (
    <div className="w-64 flex flex-col">
      {/* Header */}
      <div className="px-3 py-1 flex items-center justify-between">
        <span className="text-sm font-semibold text-muted-foreground">
          Tools
        </span>
        <Button
          onClick={() => setShowLabels(!showLabels)}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          data-tooltip-id="view-toggle-tooltip"
          data-tooltip-content={showLabels ? "Icons Only" : "Show Labels"}
        >
          {showLabels ? (
            <LayoutGrid className="w-4 h-4" />
          ) : (
            <LayoutList className="w-4 h-4" />
          )}
        </Button>
      </div>

      <Separator />

      {/* Block Buttons */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {blockGroups.map((group) => {
          const isCollapsed = collapsedSections.has(group.title);
          return (
            <div key={group.title} className="space-y-1">
              <button
                onClick={() => toggleSection(group.title)}
                className="flex items-center gap-1 w-full hover:bg-accent/50 rounded px-1 py-0.5 transition-colors"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                )}
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.title}
                </h3>
              </button>
              {!isCollapsed && (
                <div
                  className={
                    showLabels ? "space-y-0.5" : "flex flex-wrap gap-1"
                  }
                >
                  {group.blocks.map((blockType) => {
                    const definition = BLOCK_DEFINITIONS[blockType];
                    const Icon = BLOCK_ICONS[blockType];
                    return (
                      <div
                        key={blockType}
                        draggable
                        onDragStart={(e) => onDragStart(e, blockType)}
                        className={`
                          cursor-grab active:cursor-grabbing
                          group
                          ${showLabels ? "flex items-center gap-2 w-full" : ""}
                        `}
                        {...(!showLabels && {
                          "data-tooltip-id": "block-tooltip",
                          "data-tooltip-content": definition.label,
                        })}
                      >
                        <div
                          className="
                            flex items-center justify-center
                            w-7 h-7 flex-shrink-0
                            bg-secondary group-hover:bg-accent
                            border border-border rounded-md
                            transition-colors
                          "
                        >
                          <Icon className="w-3.5 h-3.5 text-foreground" />
                        </div>
                        {showLabels && (
                          <span className="text-[11px] text-foreground">
                            {definition.label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <Tooltip
        id="block-tooltip"
        place="top"
        delayShow={300}
        style={{
          fontSize: "11px",
          padding: "4px 8px",
          zIndex: 9999,
        }}
      />
      <Tooltip
        id="view-toggle-tooltip"
        place="bottom"
        delayShow={300}
        style={{
          fontSize: "11px",
          padding: "4px 8px",
          zIndex: 9999,
        }}
      />
    </div>
  );
}
