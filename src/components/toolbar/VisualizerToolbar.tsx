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

  // Merge with defaults for backwards compatibility with persisted state
  const effects = {
    bloomEnabled: visualizerConfig.effects.bloomEnabled ?? true,
    bloomIntensity: visualizerConfig.effects.bloomIntensity ?? 1.5,
    chromaticAberrationEnabled: visualizerConfig.effects.chromaticAberrationEnabled ?? false,
    chromaticAberrationOffset: visualizerConfig.effects.chromaticAberrationOffset ?? 0.005,
    vignetteEnabled: visualizerConfig.effects.vignetteEnabled ?? false,
    vignetteIntensity: visualizerConfig.effects.vignetteIntensity ?? 0.5,
    noiseEnabled: visualizerConfig.effects.noiseEnabled ?? false,
    noiseIntensity: visualizerConfig.effects.noiseIntensity ?? 0.15,
    glitchEnabled: visualizerConfig.effects.glitchEnabled ?? false,
    glitchIntensity: visualizerConfig.effects.glitchIntensity ?? 0.5,
    scanlinesEnabled: visualizerConfig.effects.scanlinesEnabled ?? false,
    scanlinesIntensity: visualizerConfig.effects.scanlinesIntensity ?? 0.5,
    pixelationEnabled: visualizerConfig.effects.pixelationEnabled ?? false,
    pixelationGranularity: visualizerConfig.effects.pixelationGranularity ?? 8,
    dotScreenEnabled: visualizerConfig.effects.dotScreenEnabled ?? false,
    dotScreenScale: visualizerConfig.effects.dotScreenScale ?? 1.5,
    sepiaEnabled: visualizerConfig.effects.sepiaEnabled ?? false,
    sepiaIntensity: visualizerConfig.effects.sepiaIntensity ?? 0.5,
    hueSaturationEnabled: visualizerConfig.effects.hueSaturationEnabled ?? false,
    hueShift: visualizerConfig.effects.hueShift ?? 0,
    saturation: visualizerConfig.effects.saturation ?? 0,
  };

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
            checked={effects.bloomEnabled}
            onCheckedChange={(checked) =>
              setVisualizerEffects({ bloomEnabled: checked })
            }
          />
        </div>

        {/* Bloom Intensity */}
        {effects.bloomEnabled && (
          <div className="space-y-1.5 pl-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-muted-foreground">Intensity</Label>
              <span className="text-[10px] text-muted-foreground">
                {effects.bloomIntensity.toFixed(1)}
              </span>
            </div>
            <Slider
              value={[effects.bloomIntensity]}
              onValueChange={(value) => {
                const val = Array.isArray(value) ? value[0] : value;
                setVisualizerEffects({ bloomIntensity: val });
              }}
              min={0}
              max={10}
              step={0.1}
              className="w-full"
            />
          </div>
        )}

        {/* Chromatic Aberration Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-[11px]">Chromatic Aberration</Label>
            <p className="text-[9px] text-muted-foreground">RGB color fringing</p>
          </div>
          <Switch
            checked={effects.chromaticAberrationEnabled}
            onCheckedChange={(checked) =>
              setVisualizerEffects({ chromaticAberrationEnabled: checked })
            }
          />
        </div>

        {/* Chromatic Aberration Offset */}
        {effects.chromaticAberrationEnabled && (
          <div className="space-y-1.5 pl-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-muted-foreground">Offset</Label>
              <span className="text-[10px] text-muted-foreground">
                {effects.chromaticAberrationOffset.toFixed(3)}
              </span>
            </div>
            <Slider
              value={[effects.chromaticAberrationOffset]}
              onValueChange={(value) => {
                const val = Array.isArray(value) ? value[0] : value;
                setVisualizerEffects({ chromaticAberrationOffset: val });
              }}
              min={0}
              max={0.1}
              step={0.001}
              className="w-full"
            />
          </div>
        )}

        {/* Vignette Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-[11px]">Vignette</Label>
            <p className="text-[9px] text-muted-foreground">Darkened edges</p>
          </div>
          <Switch
            checked={effects.vignetteEnabled}
            onCheckedChange={(checked) =>
              setVisualizerEffects({ vignetteEnabled: checked })
            }
          />
        </div>

        {/* Vignette Intensity */}
        {effects.vignetteEnabled && (
          <div className="space-y-1.5 pl-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-muted-foreground">Intensity</Label>
              <span className="text-[10px] text-muted-foreground">
                {effects.vignetteIntensity.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[effects.vignetteIntensity]}
              onValueChange={(value) => {
                const val = Array.isArray(value) ? value[0] : value;
                setVisualizerEffects({ vignetteIntensity: val });
              }}
              min={0}
              max={1.5}
              step={0.01}
              className="w-full"
            />
          </div>
        )}

        {/* Noise Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-[11px]">Noise</Label>
            <p className="text-[9px] text-muted-foreground">Film grain texture</p>
          </div>
          <Switch
            checked={effects.noiseEnabled}
            onCheckedChange={(checked) =>
              setVisualizerEffects({ noiseEnabled: checked })
            }
          />
        </div>

        {/* Noise Intensity */}
        {effects.noiseEnabled && (
          <div className="space-y-1.5 pl-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-muted-foreground">Intensity</Label>
              <span className="text-[10px] text-muted-foreground">
                {effects.noiseIntensity.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[effects.noiseIntensity]}
              onValueChange={(value) => {
                const val = Array.isArray(value) ? value[0] : value;
                setVisualizerEffects({ noiseIntensity: val });
              }}
              min={0}
              max={1}
              step={0.01}
              className="w-full"
            />
          </div>
        )}

        {/* Glitch Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-[11px]">Glitch</Label>
            <p className="text-[9px] text-muted-foreground">Digital artifacts</p>
          </div>
          <Switch
            checked={effects.glitchEnabled}
            onCheckedChange={(checked) =>
              setVisualizerEffects({ glitchEnabled: checked })
            }
          />
        </div>

        {/* Glitch Intensity */}
        {effects.glitchEnabled && (
          <div className="space-y-1.5 pl-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-muted-foreground">Intensity</Label>
              <span className="text-[10px] text-muted-foreground">
                {effects.glitchIntensity.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[effects.glitchIntensity]}
              onValueChange={(value) => {
                const val = Array.isArray(value) ? value[0] : value;
                setVisualizerEffects({ glitchIntensity: val });
              }}
              min={0}
              max={2}
              step={0.01}
              className="w-full"
            />
          </div>
        )}

        {/* Scanlines Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-[11px]">Scanlines</Label>
            <p className="text-[9px] text-muted-foreground">CRT monitor effect</p>
          </div>
          <Switch
            checked={effects.scanlinesEnabled}
            onCheckedChange={(checked) =>
              setVisualizerEffects({ scanlinesEnabled: checked })
            }
          />
        </div>

        {/* Scanlines Intensity */}
        {effects.scanlinesEnabled && (
          <div className="space-y-1.5 pl-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-muted-foreground">Intensity</Label>
              <span className="text-[10px] text-muted-foreground">
                {effects.scanlinesIntensity.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[effects.scanlinesIntensity]}
              onValueChange={(value) => {
                const val = Array.isArray(value) ? value[0] : value;
                setVisualizerEffects({ scanlinesIntensity: val });
              }}
              min={0}
              max={2}
              step={0.01}
              className="w-full"
            />
          </div>
        )}

        {/* Pixelation Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-[11px]">Pixelation</Label>
            <p className="text-[9px] text-muted-foreground">Retro 8-bit look</p>
          </div>
          <Switch
            checked={effects.pixelationEnabled}
            onCheckedChange={(checked) =>
              setVisualizerEffects({ pixelationEnabled: checked })
            }
          />
        </div>

        {/* Pixelation Granularity */}
        {effects.pixelationEnabled && (
          <div className="space-y-1.5 pl-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-muted-foreground">Granularity</Label>
              <span className="text-[10px] text-muted-foreground">
                {effects.pixelationGranularity.toFixed(0)}
              </span>
            </div>
            <Slider
              value={[effects.pixelationGranularity]}
              onValueChange={(value) => {
                const val = Array.isArray(value) ? value[0] : value;
                setVisualizerEffects({ pixelationGranularity: val });
              }}
              min={2}
              max={32}
              step={1}
              className="w-full"
            />
          </div>
        )}

        {/* Dot Screen Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-[11px]">Dot Screen</Label>
            <p className="text-[9px] text-muted-foreground">Halftone pattern</p>
          </div>
          <Switch
            checked={effects.dotScreenEnabled}
            onCheckedChange={(checked) =>
              setVisualizerEffects({ dotScreenEnabled: checked })
            }
          />
        </div>

        {/* Dot Screen Scale */}
        {effects.dotScreenEnabled && (
          <div className="space-y-1.5 pl-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-muted-foreground">Scale</Label>
              <span className="text-[10px] text-muted-foreground">
                {effects.dotScreenScale.toFixed(1)}
              </span>
            </div>
            <Slider
              value={[effects.dotScreenScale]}
              onValueChange={(value) => {
                const val = Array.isArray(value) ? value[0] : value;
                setVisualizerEffects({ dotScreenScale: val });
              }}
              min={0.5}
              max={5}
              step={0.1}
              className="w-full"
            />
          </div>
        )}

        {/* Sepia Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-[11px]">Sepia</Label>
            <p className="text-[9px] text-muted-foreground">Vintage brown tone</p>
          </div>
          <Switch
            checked={effects.sepiaEnabled}
            onCheckedChange={(checked) =>
              setVisualizerEffects({ sepiaEnabled: checked })
            }
          />
        </div>

        {/* Sepia Intensity */}
        {effects.sepiaEnabled && (
          <div className="space-y-1.5 pl-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-muted-foreground">Intensity</Label>
              <span className="text-[10px] text-muted-foreground">
                {effects.sepiaIntensity.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[effects.sepiaIntensity]}
              onValueChange={(value) => {
                const val = Array.isArray(value) ? value[0] : value;
                setVisualizerEffects({ sepiaIntensity: val });
              }}
              min={0}
              max={1}
              step={0.01}
              className="w-full"
            />
          </div>
        )}

        {/* Hue/Saturation Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-[11px]">Hue/Saturation</Label>
            <p className="text-[9px] text-muted-foreground">Color adjustment</p>
          </div>
          <Switch
            checked={effects.hueSaturationEnabled}
            onCheckedChange={(checked) =>
              setVisualizerEffects({ hueSaturationEnabled: checked })
            }
          />
        </div>

        {/* Hue/Saturation Controls */}
        {effects.hueSaturationEnabled && (
          <>
            <div className="space-y-1.5 pl-1">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] text-muted-foreground">Hue Shift</Label>
                <span className="text-[10px] text-muted-foreground">
                  {(effects.hueShift * 180).toFixed(0)}°
                </span>
              </div>
              <Slider
                value={[effects.hueShift]}
                onValueChange={(value) => {
                  const val = Array.isArray(value) ? value[0] : value;
                  setVisualizerEffects({ hueShift: val });
                }}
                min={-1}
                max={1}
                step={0.01}
                className="w-full"
              />
            </div>
            <div className="space-y-1.5 pl-1">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] text-muted-foreground">Saturation</Label>
                <span className="text-[10px] text-muted-foreground">
                  {effects.saturation >= 0 ? "+" : ""}{effects.saturation.toFixed(2)}
                </span>
              </div>
              <Slider
                value={[effects.saturation]}
                onValueChange={(value) => {
                  const val = Array.isArray(value) ? value[0] : value;
                  setVisualizerEffects({ saturation: val });
                }}
                min={-1}
                max={1}
                step={0.01}
                className="w-full"
              />
            </div>
          </>
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
