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
import { Separator } from "@/components/ui/separator";
import {
  useSignalFlowStore,
  type VisualizerType,
} from "@/store/signalFlowStore";
import { cn } from "@/lib/utils";
import { EffectControl, DualEffectControl } from "./EffectControl";

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
    bloomExternalSource: visualizerConfig.effects.bloomExternalSource ?? null,
    chromaticAberrationEnabled: visualizerConfig.effects.chromaticAberrationEnabled ?? false,
    chromaticAberrationOffset: visualizerConfig.effects.chromaticAberrationOffset ?? 0.005,
    chromaticAberrationExternalSource: visualizerConfig.effects.chromaticAberrationExternalSource ?? null,
    vignetteEnabled: visualizerConfig.effects.vignetteEnabled ?? false,
    vignetteIntensity: visualizerConfig.effects.vignetteIntensity ?? 0.5,
    vignetteExternalSource: visualizerConfig.effects.vignetteExternalSource ?? null,
    noiseEnabled: visualizerConfig.effects.noiseEnabled ?? false,
    noiseIntensity: visualizerConfig.effects.noiseIntensity ?? 0.15,
    noiseExternalSource: visualizerConfig.effects.noiseExternalSource ?? null,
    glitchEnabled: visualizerConfig.effects.glitchEnabled ?? false,
    glitchIntensity: visualizerConfig.effects.glitchIntensity ?? 0.5,
    glitchExternalSource: visualizerConfig.effects.glitchExternalSource ?? null,
    scanlinesEnabled: visualizerConfig.effects.scanlinesEnabled ?? false,
    scanlinesIntensity: visualizerConfig.effects.scanlinesIntensity ?? 0.5,
    scanlinesExternalSource: visualizerConfig.effects.scanlinesExternalSource ?? null,
    pixelationEnabled: visualizerConfig.effects.pixelationEnabled ?? false,
    pixelationGranularity: visualizerConfig.effects.pixelationGranularity ?? 8,
    pixelationExternalSource: visualizerConfig.effects.pixelationExternalSource ?? null,
    dotScreenEnabled: visualizerConfig.effects.dotScreenEnabled ?? false,
    dotScreenScale: visualizerConfig.effects.dotScreenScale ?? 1.5,
    dotScreenExternalSource: visualizerConfig.effects.dotScreenExternalSource ?? null,
    sepiaEnabled: visualizerConfig.effects.sepiaEnabled ?? false,
    sepiaIntensity: visualizerConfig.effects.sepiaIntensity ?? 0.5,
    sepiaExternalSource: visualizerConfig.effects.sepiaExternalSource ?? null,
    hueSaturationEnabled: visualizerConfig.effects.hueSaturationEnabled ?? false,
    hueShift: visualizerConfig.effects.hueShift ?? 0,
    hueExternalSource: visualizerConfig.effects.hueExternalSource ?? null,
    saturation: visualizerConfig.effects.saturation ?? 0,
    saturationExternalSource: visualizerConfig.effects.saturationExternalSource ?? null,
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

        {/* Bloom */}
        <EffectControl
          effectName="bloom"
          label="Bloom"
          description="Glow effect"
          enabled={effects.bloomEnabled}
          value={effects.bloomIntensity}
          externalSource={effects.bloomExternalSource}
          min={0}
          max={10}
          step={0.1}
          valueLabel="Intensity"
          onToggle={() => setVisualizerEffects({ bloomEnabled: !effects.bloomEnabled })}
          onValueChange={(v) => setVisualizerEffects({ bloomIntensity: v })}
          onExternalSourceChange={(s) => setVisualizerEffects({ bloomExternalSource: s })}
        />

        {/* Chromatic Aberration */}
        <EffectControl
          effectName="chromaticAberration"
          label="Chromatic Aberration"
          description="RGB color fringing"
          enabled={effects.chromaticAberrationEnabled}
          value={effects.chromaticAberrationOffset}
          externalSource={effects.chromaticAberrationExternalSource}
          min={0}
          max={0.1}
          step={0.001}
          valueLabel="Offset"
          onToggle={() => setVisualizerEffects({ chromaticAberrationEnabled: !effects.chromaticAberrationEnabled })}
          onValueChange={(v) => setVisualizerEffects({ chromaticAberrationOffset: v })}
          onExternalSourceChange={(s) => setVisualizerEffects({ chromaticAberrationExternalSource: s })}
        />

        {/* Vignette */}
        <EffectControl
          effectName="vignette"
          label="Vignette"
          description="Darkened edges"
          enabled={effects.vignetteEnabled}
          value={effects.vignetteIntensity}
          externalSource={effects.vignetteExternalSource}
          min={0}
          max={1.5}
          step={0.01}
          valueLabel="Intensity"
          onToggle={() => setVisualizerEffects({ vignetteEnabled: !effects.vignetteEnabled })}
          onValueChange={(v) => setVisualizerEffects({ vignetteIntensity: v })}
          onExternalSourceChange={(s) => setVisualizerEffects({ vignetteExternalSource: s })}
        />

        {/* Noise */}
        <EffectControl
          effectName="noise"
          label="Noise"
          description="Film grain texture"
          enabled={effects.noiseEnabled}
          value={effects.noiseIntensity}
          externalSource={effects.noiseExternalSource}
          min={0}
          max={1}
          step={0.01}
          valueLabel="Intensity"
          onToggle={() => setVisualizerEffects({ noiseEnabled: !effects.noiseEnabled })}
          onValueChange={(v) => setVisualizerEffects({ noiseIntensity: v })}
          onExternalSourceChange={(s) => setVisualizerEffects({ noiseExternalSource: s })}
        />

        {/* Glitch */}
        <EffectControl
          effectName="glitch"
          label="Glitch"
          description="Digital artifacts"
          enabled={effects.glitchEnabled}
          value={effects.glitchIntensity}
          externalSource={effects.glitchExternalSource}
          min={0}
          max={2}
          step={0.01}
          valueLabel="Intensity"
          onToggle={() => setVisualizerEffects({ glitchEnabled: !effects.glitchEnabled })}
          onValueChange={(v) => setVisualizerEffects({ glitchIntensity: v })}
          onExternalSourceChange={(s) => setVisualizerEffects({ glitchExternalSource: s })}
        />

        {/* Scanlines */}
        <EffectControl
          effectName="scanlines"
          label="Scanlines"
          description="CRT monitor effect"
          enabled={effects.scanlinesEnabled}
          value={effects.scanlinesIntensity}
          externalSource={effects.scanlinesExternalSource}
          min={0}
          max={2}
          step={0.01}
          valueLabel="Intensity"
          onToggle={() => setVisualizerEffects({ scanlinesEnabled: !effects.scanlinesEnabled })}
          onValueChange={(v) => setVisualizerEffects({ scanlinesIntensity: v })}
          onExternalSourceChange={(s) => setVisualizerEffects({ scanlinesExternalSource: s })}
        />

        {/* Pixelation */}
        <EffectControl
          effectName="pixelation"
          label="Pixelation"
          description="Retro 8-bit look"
          enabled={effects.pixelationEnabled}
          value={effects.pixelationGranularity}
          externalSource={effects.pixelationExternalSource}
          min={2}
          max={32}
          step={1}
          valueLabel="Granularity"
          onToggle={() => setVisualizerEffects({ pixelationEnabled: !effects.pixelationEnabled })}
          onValueChange={(v) => setVisualizerEffects({ pixelationGranularity: v })}
          onExternalSourceChange={(s) => setVisualizerEffects({ pixelationExternalSource: s })}
        />

        {/* Dot Screen */}
        <EffectControl
          effectName="dotScreen"
          label="Dot Screen"
          description="Halftone pattern"
          enabled={effects.dotScreenEnabled}
          value={effects.dotScreenScale}
          externalSource={effects.dotScreenExternalSource}
          min={0.5}
          max={5}
          step={0.1}
          valueLabel="Scale"
          onToggle={() => setVisualizerEffects({ dotScreenEnabled: !effects.dotScreenEnabled })}
          onValueChange={(v) => setVisualizerEffects({ dotScreenScale: v })}
          onExternalSourceChange={(s) => setVisualizerEffects({ dotScreenExternalSource: s })}
        />

        {/* Sepia */}
        <EffectControl
          effectName="sepia"
          label="Sepia"
          description="Vintage brown tone"
          enabled={effects.sepiaEnabled}
          value={effects.sepiaIntensity}
          externalSource={effects.sepiaExternalSource}
          min={0}
          max={1}
          step={0.01}
          valueLabel="Intensity"
          onToggle={() => setVisualizerEffects({ sepiaEnabled: !effects.sepiaEnabled })}
          onValueChange={(v) => setVisualizerEffects({ sepiaIntensity: v })}
          onExternalSourceChange={(s) => setVisualizerEffects({ sepiaExternalSource: s })}
        />

        {/* Hue/Saturation */}
        <DualEffectControl
          label="Hue/Saturation"
          description="Color adjustment"
          enabled={effects.hueSaturationEnabled}
          onToggle={() => setVisualizerEffects({ hueSaturationEnabled: !effects.hueSaturationEnabled })}
          param1Name="hue"
          param1Label="Hue Shift"
          param1Value={effects.hueShift}
          param1ExternalSource={effects.hueExternalSource}
          param1Min={-1}
          param1Max={1}
          param1Step={0.01}
          param1FormatValue={(v) => `${(v * 180).toFixed(0)}°`}
          onParam1Change={(v) => setVisualizerEffects({ hueShift: v })}
          onParam1ExternalSourceChange={(s) => setVisualizerEffects({ hueExternalSource: s })}
          param2Name="saturation"
          param2Label="Saturation"
          param2Value={effects.saturation}
          param2ExternalSource={effects.saturationExternalSource}
          param2Min={-1}
          param2Max={1}
          param2Step={0.01}
          param2FormatValue={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}`}
          onParam2Change={(v) => setVisualizerEffects({ saturation: v })}
          onParam2ExternalSourceChange={(s) => setVisualizerEffects({ saturationExternalSource: s })}
        />
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
