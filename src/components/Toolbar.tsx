import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  Minimize2,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  LayoutList,
  AudioWaveform,
  Scissors,
  Feather,
  Package,
  Pencil,
  Trash2,
  Copy,
  Timer,
  AudioLines,
  Layers,
  Orbit,
  CircleDashed,
  Vibrate,
  Piano,
  Grid2X2,
  ArrowLeftRight,
  Repeat,
  TrendingDown as Envelope,
  PlayCircle,
  Disc,
  Radio as SampleRate,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { type BlockType, BLOCK_DEFINITIONS } from "@/types/blocks";
import { draftStorage, instrumentApi } from "@/lib/instrumentApi";
import { useAuthStore } from "@/store/authStore";
import { useInstrumentBuilderStore } from "@/store/instrumentBuilderStore";
import type { InstrumentSummary, InstrumentDraft } from "@/types/instruments";

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
  "notch-filter": Filter,
  "allpass-filter": Filter,
  "peaking-eq": Filter,
  "lowshelf-filter": TrendingDown,
  "highshelf-filter": TrendingUp,
  compressor: Minimize2,
  waveshaper: AudioWaveform,
  "hard-clip": Scissors,
  "soft-clip": Feather,
  delay: Timer,
  tremolo: AudioLines,
  chorus: Layers,
  flanger: Orbit,
  phaser: CircleDashed,
  vibrato: Vibrate,
  reverb: Repeat,
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
  keyboard: Piano,
  "beat-pad": Grid2X2,
  crossfader: ArrowLeftRight,
  "envelope-follower": Envelope,
  adsr: PlayCircle,
  "bit-crusher": Disc,
  "sample-rate-reducer": SampleRate,
};

const blockGroups = [
  {
    title: "Inputs",
    blocks: ["slider", "button", "toggle", "pulse", "keyboard", "beat-pad", "crossfader"] as BlockType[],
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
      "compressor",
      "waveshaper",
      "hard-clip",
      "soft-clip",
      "delay",
      "tremolo",
      "chorus",
      "flanger",
      "phaser",
      "vibrato",
      "reverb",
      "envelope-follower",
      "adsr",
      "bit-crusher",
      "sample-rate-reducer",
      "low-pass-filter",
      "high-pass-filter",
      "band-pass-filter",
      "notch-filter",
      "allpass-filter",
      "peaking-eq",
      "lowshelf-filter",
      "highshelf-filter",
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

export function Toolbar() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { loadDraft, loadInstrument, createNewInstrument } =
    useInstrumentBuilderStore();

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

  // Instrument state
  const [instruments, setInstruments] = useState<
    Array<{ id: string; name: string; source: "draft" | "cloud" }>
  >([]);

  // Context menu state
  const [contextMenuInstrument, setContextMenuInstrument] = useState<{
    id: string;
    name: string;
    source: "draft" | "cloud";
  } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Load instruments on mount and when auth changes
  useEffect(() => {
    const loadInstruments = async () => {
      const items: Array<{
        id: string;
        name: string;
        source: "draft" | "cloud";
      }> = [];

      // Load local drafts
      const drafts = draftStorage.list();
      drafts.forEach((draft: InstrumentDraft) => {
        items.push({
          id: draft.id,
          name: draft.definition.metadata.name,
          source: "draft",
        });
      });

      // Load cloud instruments if authenticated
      if (isAuthenticated) {
        try {
          const cloudInstruments = await instrumentApi.listMine();
          cloudInstruments.forEach((instrument: InstrumentSummary) => {
            // Avoid duplicates if the same instrument is in both drafts and cloud
            if (
              !items.some(
                (i) => i.name === instrument.name && i.source === "draft",
              )
            ) {
              items.push({
                id: instrument.id,
                name: instrument.name,
                source: "cloud",
              });
            }
          });
        } catch (error) {
          console.error("Failed to load cloud instruments:", error);
        }
      }

      setInstruments(items);
    };

    loadInstruments();
  }, [isAuthenticated]);

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

  const onInstrumentDragStart = (
    event: React.DragEvent,
    instrumentId: string,
    source: "draft" | "cloud",
  ) => {
    event.dataTransfer.setData(
      "application/instrument",
      JSON.stringify({ id: instrumentId, source }),
    );
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

  // Instrument context menu handlers
  const handleEditInstrument = useCallback(
    async (instrument: { id: string; source: "draft" | "cloud" }) => {
      try {
        if (instrument.source === "draft") {
          loadDraft(instrument.id);
        } else {
          const definition = await instrumentApi.load(instrument.id);
          loadInstrument(definition, instrument.id);
        }
        navigate("/instruments/builder");
      } catch (error) {
        console.error("Failed to load instrument for editing:", error);
      }
    },
    [loadDraft, loadInstrument, navigate],
  );

  const handleDeleteInstrument = useCallback(async () => {
    if (!contextMenuInstrument) return;

    try {
      if (contextMenuInstrument.source === "draft") {
        draftStorage.delete(contextMenuInstrument.id);
      } else {
        await instrumentApi.delete(contextMenuInstrument.id);
      }
      // Refresh instruments list
      setInstruments((prev) =>
        prev.filter(
          (i) =>
            !(
              i.id === contextMenuInstrument.id &&
              i.source === contextMenuInstrument.source
            ),
        ),
      );
    } catch (error) {
      console.error("Failed to delete instrument:", error);
    } finally {
      setDeleteDialogOpen(false);
      setContextMenuInstrument(null);
    }
  }, [contextMenuInstrument]);

  const handleDuplicateInstrument = useCallback(
    async (instrument: {
      id: string;
      name: string;
      source: "draft" | "cloud";
    }) => {
      try {
        let definition;
        if (instrument.source === "draft") {
          const draft = draftStorage.get(instrument.id);
          if (!draft) return;
          definition = draft.definition;
        } else {
          definition = await instrumentApi.load(instrument.id);
        }

        // Create a copy with new ID and name
        const newDefinition = {
          ...definition,
          metadata: {
            ...definition.metadata,
            id: crypto.randomUUID(),
            name: `${definition.metadata.name} (Copy)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        };

        // Save as draft
        draftStorage.save(newDefinition);

        // Refresh instruments list
        setInstruments((prev) => [
          ...prev,
          {
            id: newDefinition.metadata.id,
            name: newDefinition.metadata.name,
            source: "draft" as const,
          },
        ]);
      } catch (error) {
        console.error("Failed to duplicate instrument:", error);
      }
    },
    [],
  );

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
        {/* Instruments Section */}
        <div className="space-y-2">
          <button
            onClick={() => toggleSection("Instruments")}
            className="flex items-center gap-1 w-full hover:bg-accent/50 rounded px-1 py-0.5 transition-colors"
          >
            {collapsedSections.has("Instruments") ? (
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            )}
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Instruments
            </h3>
          </button>
          {!collapsedSections.has("Instruments") && (
            <div className="space-y-2">
              {/* Create New Button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 h-7 text-[11px]"
                onClick={() => {
                  createNewInstrument();
                  navigate("/instruments/builder");
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                Create New
              </Button>

              {/* Saved Instruments */}
              {instruments.length > 0 && (
                <div
                  className={showLabels ? "space-y-2" : "flex flex-wrap gap-2"}
                >
                  {instruments.map((instrument) => (
                    <ContextMenu key={`${instrument.source}-${instrument.id}`}>
                      <ContextMenuTrigger>
                        <div
                          draggable
                          onDragStart={(e) =>
                            onInstrumentDragStart(
                              e,
                              instrument.id,
                              instrument.source,
                            )
                          }
                          className={`
                            cursor-grab active:cursor-grabbing
                            group select-none
                            ${showLabels ? "flex items-center gap-2 w-full" : ""}
                          `}
                          {...(!showLabels && {
                            "data-tooltip-id": "block-tooltip",
                            "data-tooltip-content": instrument.name,
                          })}
                        >
                          <div
                            className="
                              flex items-center justify-center
                              w-7 h-7 flex-shrink-0
                              bg-indigo-500/10 group-hover:bg-indigo-500/20
                              border border-indigo-400/50 rounded-md
                              transition-colors
                            "
                          >
                            <Package className="w-3.5 h-3.5 text-indigo-400" />
                          </div>
                          {showLabels && (
                            <span className="text-[11px] text-foreground truncate flex-1">
                              {instrument.name}
                            </span>
                          )}
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-40">
                        <ContextMenuItem
                          onClick={() => handleEditInstrument(instrument)}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </ContextMenuItem>
                        <ContextMenuItem
                          onClick={() => handleDuplicateInstrument(instrument)}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                          onClick={() => {
                            setContextMenuInstrument(instrument);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  ))}
                </div>
              )}

              {instruments.length === 0 && (
                <p className="text-[10px] text-muted-foreground px-1">
                  No instruments yet
                </p>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Primitive Block Groups */}
        {blockGroups.map((group) => {
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Instrument</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{contextMenuInstrument?.name}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setContextMenuInstrument(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteInstrument}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
