import {
  BarChart3,
  Waves,
  CircleDot,
  Sparkles,
  Grid3X3,
  Hexagon,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  useSignalFlowStore,
  type VisualizerType,
} from "@/store/signalFlowStore";
import { cn } from "@/lib/utils";

// Visualizer type definitions with icons
const VISUALIZER_TYPES: {
  type: VisualizerType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}[] = [
  {
    type: "bar-spectrum",
    label: "Bar Spectrum",
    icon: BarChart3,
    description: "Classic frequency bars",
  },
  {
    type: "waveform",
    label: "Waveform",
    icon: Waves,
    description: "Time-domain waveform",
  },
  {
    type: "circular-spectrum",
    label: "Circular",
    icon: CircleDot,
    description: "Radial frequency display",
  },
  {
    type: "particles",
    label: "Particles",
    icon: Sparkles,
    description: "Audio-reactive particles",
  },
  {
    type: "frequency-grid",
    label: "Grid",
    icon: Grid3X3,
    description: "Frequency band grid",
  },
  {
    type: "geometric",
    label: "Geometric",
    icon: Hexagon,
    description: "Animated shapes",
  },
];

const COLOR_SCHEMES = [
  { value: "purple" as const, label: "Purple", color: "bg-purple-500" },
  { value: "rainbow" as const, label: "Rainbow", color: "bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500" },
  { value: "monochrome" as const, label: "Mono", color: "bg-white" },
];

export function VisualizerToolbar() {
  const {
    visualizerConfig,
    setVisualizerType,
    setVisualizerEffects,
    setVisualizerConfig,
  } = useSignalFlowStore();

  return (
    <div className="space-y-4">
      {/* Visualizer Type Selection */}
      <div className="space-y-2">
        <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Visualizer
        </Label>
        <div className="grid grid-cols-3 gap-1.5">
          {VISUALIZER_TYPES.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => setVisualizerType(type)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg border transition-all",
                "hover:bg-accent/50",
                visualizerConfig.type === type
                  ? "border-purple-500 bg-purple-500/10 text-purple-400"
                  : "border-border/50 text-muted-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[9px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Effects Section */}
      <div className="space-y-3">
        <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Effects
        </Label>

        {/* Bloom Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-[11px]">Bloom</Label>
            <p className="text-[9px] text-muted-foreground">Glow effect</p>
          </div>
          <Switch
            checked={visualizerConfig.effects.bloomEnabled}
            onCheckedChange={(checked) =>
              setVisualizerEffects({ bloomEnabled: checked })
            }
          />
        </div>

        {/* Bloom Intensity */}
        {visualizerConfig.effects.bloomEnabled && (
          <div className="space-y-1.5 pl-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-muted-foreground">Intensity</Label>
              <span className="text-[10px] text-muted-foreground">
                {visualizerConfig.effects.bloomIntensity.toFixed(1)}
              </span>
            </div>
            <Slider
              value={[visualizerConfig.effects.bloomIntensity]}
              onValueChange={(value) => {
                const val = Array.isArray(value) ? value[0] : value;
                setVisualizerEffects({ bloomIntensity: val });
              }}
              min={0}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>
        )}
      </div>

      <Separator />

      {/* Display Settings */}
      <div className="space-y-3">
        <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Display
        </Label>

        {/* Bar Count (for bar-spectrum) */}
        {visualizerConfig.type === "bar-spectrum" && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-muted-foreground">Bar Count</Label>
              <span className="text-[10px] text-muted-foreground">
                {visualizerConfig.barCount}
              </span>
            </div>
            <Slider
              value={[visualizerConfig.barCount]}
              onValueChange={(value) => {
                const val = Array.isArray(value) ? value[0] : value;
                setVisualizerConfig({ barCount: val });
              }}
              min={16}
              max={128}
              step={8}
              className="w-full"
            />
          </div>
        )}

        {/* Particle Count (for particles) */}
        {visualizerConfig.type === "particles" && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-muted-foreground">Particle Count</Label>
              <span className="text-[10px] text-muted-foreground">
                {visualizerConfig.particleCount}
              </span>
            </div>
            <Slider
              value={[visualizerConfig.particleCount]}
              onValueChange={(value) => {
                const val = Array.isArray(value) ? value[0] : value;
                setVisualizerConfig({ particleCount: val });
              }}
              min={20}
              max={200}
              step={10}
              className="w-full"
            />
          </div>
        )}

        {/* Color Scheme */}
        <div className="space-y-1.5">
          <Label className="text-[10px] text-muted-foreground">Color Scheme</Label>
          <div className="flex gap-1.5">
            {COLOR_SCHEMES.map(({ value, label, color }) => (
              <button
                key={value}
                onClick={() => setVisualizerConfig({ colorScheme: value })}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md border transition-all",
                  "hover:bg-accent/50",
                  visualizerConfig.colorScheme === value
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-border/50"
                )}
              >
                <div className={cn("w-3 h-3 rounded-full", color)} />
                <span className="text-[9px]">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      {/* Info Section */}
      <div className="p-2 bg-muted/50 rounded-lg">
        <p className="text-[9px] text-muted-foreground leading-relaxed">
          The visualizer reacts to audio from your signal flow.
          Start playback to see the visualization respond to your sounds.
        </p>
      </div>
    </div>
  );
}
