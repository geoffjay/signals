import { useState, useEffect } from "react";
import {
  BarChart3,
  Waves,
  Circle,
  CircleDot,
  Sparkles,
  Grid3X3,
  Hexagon,
  ChevronDown,
  ChevronRight,
  Mic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToolbarContext } from "./ToolbarShell";

// Visualizer element types
export type VisualizerElementType =
  | "bar-spectrum"
  | "waveform"
  | "circular-spectrum"
  | "particle-system"
  | "frequency-grid"
  | "geometric-shapes"
  | "audio-input";

interface VisualizerElementDefinition {
  type: VisualizerElementType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const VISUALIZER_ELEMENTS: VisualizerElementDefinition[] = [
  {
    type: "bar-spectrum",
    label: "Bar Spectrum",
    icon: BarChart3,
    description: "Classic frequency spectrum analyzer with bars",
  },
  {
    type: "waveform",
    label: "Waveform",
    icon: Waves,
    description: "Real-time audio waveform display",
  },
  {
    type: "circular-spectrum",
    label: "Circular Spectrum",
    icon: CircleDot,
    description: "Frequency spectrum in a circular layout",
  },
  {
    type: "particle-system",
    label: "Particles",
    icon: Sparkles,
    description: "Audio-reactive particle system",
  },
  {
    type: "frequency-grid",
    label: "Frequency Grid",
    icon: Grid3X3,
    description: "Grid visualization of frequency bands",
  },
  {
    type: "geometric-shapes",
    label: "Geometric",
    icon: Hexagon,
    description: "Animated geometric shapes reacting to audio",
  },
];

const visualizerGroups = [
  {
    title: "Inputs",
    elements: [
      {
        type: "audio-input" as VisualizerElementType,
        label: "Audio Input",
        icon: Mic,
        description: "Capture audio from microphone or system",
      },
    ],
  },
  {
    title: "Visualizers",
    elements: VISUALIZER_ELEMENTS,
  },
  {
    title: "Effects",
    elements: [
      {
        type: "particle-system" as VisualizerElementType,
        label: "Bloom",
        icon: Circle,
        description: "Add glow effect to bright elements",
      },
    ],
  },
];

export function VisualizerToolbar() {
  const { showLabels } = useToolbarContext();

  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    () => {
      const saved = localStorage.getItem("visualizer-toolbar-collapsed-sections");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    },
  );

  // Save collapsedSections to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(
      "visualizer-toolbar-collapsed-sections",
      JSON.stringify(Array.from(collapsedSections)),
    );
  }, [collapsedSections]);

  const onDragStart = (event: React.DragEvent, elementType: VisualizerElementType) => {
    event.dataTransfer.setData("application/visualizer-element", elementType);
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
    <>
      {/* Info Section */}
      <div className="p-2 bg-muted/50 rounded-lg mb-4">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Drag visualizer elements onto the canvas to create audio-reactive visuals.
          Connect an audio input to drive the visualizations.
        </p>
      </div>

      <Separator />

      {/* Visualizer Element Groups */}
      {visualizerGroups.map((group) => {
        const isCollapsed = collapsedSections.has(group.title);
        return (
          <div key={group.title} className="space-y-2">
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
                className={showLabels ? "space-y-2" : "flex flex-wrap gap-2"}
              >
                {group.elements.map((element) => {
                  const Icon = element.icon;
                  return (
                    <div
                      key={element.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, element.type)}
                      className={`
                        cursor-grab active:cursor-grabbing
                        group
                        ${showLabels ? "flex items-center gap-2 w-full" : ""}
                      `}
                      {...(!showLabels && {
                        "data-tooltip-id": "block-tooltip",
                        "data-tooltip-content": element.label,
                      })}
                    >
                      <div
                        className="
                          flex items-center justify-center
                          w-7 h-7 flex-shrink-0
                          bg-purple-500/10 group-hover:bg-purple-500/20
                          border border-purple-400/50 rounded-md
                          transition-colors
                        "
                      >
                        <Icon className="w-3.5 h-3.5 text-purple-400" />
                      </div>
                      {showLabels && (
                        <div className="flex flex-col min-w-0">
                          <span className="text-[11px] text-foreground">
                            {element.label}
                          </span>
                          <span className="text-[9px] text-muted-foreground truncate">
                            {element.description}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <Separator className="my-4" />

      {/* Quick Actions */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Quick Start
        </h3>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 h-8 text-[11px]"
          onClick={() => {
            // TODO: Create a preset visualizer scene
            console.log("Create preset scene");
          }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          New Visualizer Scene
        </Button>
      </div>
    </>
  );
}
