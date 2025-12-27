# Additional Signal Processors - Recommendations

## Current State

The application currently has **4 basic processors**:
- `gain` - Simple amplitude control using GainNode
- `low-pass-filter` - BiquadFilterNode (lowpass)
- `high-pass-filter` - BiquadFilterNode (highpass)
- `band-pass-filter` - BiquadFilterNode (bandpass)

Additional processing is available through 18+ math blocks (add, multiply, sin, cos, etc.) but those are in the MATH category, not PROCESSORS.

## Architecture Constraints

**Web Audio API Capabilities:**
- BiquadFilterNode supports 8 filter types (currently using 3)
- WaveShaperNode for distortion/saturation
- DelayNode for time-based effects
- ConvolverNode for reverb/convolution
- DynamicsCompressorNode for dynamics processing
- AudioWorkletProcessor for custom DSP

**Current Implementation Patterns:**
1. Simple processors use native Web Audio nodes (GainNode, BiquadFilterNode)
2. Complex processors use AudioWorkletProcessor (divide, math ops)
3. All processors support real-time parameter modulation via additional inputs
4. Sample-rate processing (44.1kHz default)

---

## Recommended Additional Processors

### Priority 1: Essential Audio Processing (High Value, Easy Implementation)

#### 1.1 Additional Filters (Using BiquadFilterNode)

**Notch Filter (Band-Reject)**
```typescript
type: "notch-filter"
label: "Notch Filter"
inputs: [
  { id: "in", label: "In" },
  { id: "cutoff", label: "Cutoff" }
]
outputs: [{ id: "out", label: "Out" }]
config: {
  cutoffFrequency: 1000, // Hz
  qFactor: 1.0
}
implementation: BiquadFilterNode type="notch"
use_cases: ["Remove specific frequencies", "Hum removal", "Resonance elimination"]
```

**All-Pass Filter**
```typescript
type: "allpass-filter"
label: "All-Pass Filter"
inputs: [
  { id: "in", label: "In" },
  { id: "cutoff", label: "Cutoff" }
]
outputs: [{ id: "out", label: "Out" }]
config: {
  frequency: 1000,
  qFactor: 1.0
}
implementation: BiquadFilterNode type="allpass"
use_cases: ["Phase shifting", "Phaser effects", "Comb filtering"]
```

**Peaking EQ**
```typescript
type: "peaking-eq"
label: "Peaking EQ"
inputs: [
  { id: "in", label: "In" },
  { id: "frequency", label: "Freq" }
]
outputs: [{ id: "out", label: "Out" }]
config: {
  frequency: 1000,
  gain: 0, // dB (-40 to +40)
  qFactor: 1.0
}
implementation: BiquadFilterNode type="peaking"
use_cases: ["Boost/cut specific frequencies", "Tone shaping", "EQ"]
```

**Low-Shelf Filter**
```typescript
type: "lowshelf-filter"
label: "Low-Shelf Filter"
inputs: [{ id: "in", label: "In" }]
outputs: [{ id: "out", label: "Out" }]
config: {
  frequency: 200,
  gain: 0 // dB
}
implementation: BiquadFilterNode type="lowshelf"
use_cases: ["Bass boost/cut", "Tone control", "Mix shaping"]
```

**High-Shelf Filter**
```typescript
type: "highshelf-filter"
label: "High-Shelf Filter"
inputs: [{ id: "in", label: "In" }]
outputs: [{ id: "out", label: "Out" }]
config: {
  frequency: 3000,
  gain: 0 // dB
}
implementation: BiquadFilterNode type="highshelf"
use_cases: ["Treble boost/cut", "Presence control", "Air enhancement"]
```

**Implementation Complexity**: ⭐ Easy (1-2 hours)
- Uses existing BiquadFilterNode infrastructure
- Same connection pattern as existing filters
- Only UI configuration needed

---

#### 1.2 Dynamic Range Processors

**Compressor**
```typescript
type: "compressor"
label: "Compressor"
inputs: [{ id: "in", label: "In" }]
outputs: [{ id: "out", label: "Out" }]
config: {
  threshold: -24, // dB
  knee: 30, // dB
  ratio: 12, // 1:12
  attack: 0.003, // seconds
  release: 0.25 // seconds
}
implementation: DynamicsCompressorNode (native Web Audio)
use_cases: ["Dynamic range control", "Volume leveling", "Limiting peaks"]
```

**Implementation Complexity**: ⭐ Easy (1-2 hours)
- Native DynamicsCompressorNode available
- Similar to filter implementation
- Exposes standard compressor parameters

---

#### 1.3 Distortion/Saturation

**Waveshaper (Distortion)**
```typescript
type: "waveshaper"
label: "Waveshaper"
inputs: [
  { id: "in", label: "In" },
  { id: "drive", label: "Drive" }
]
outputs: [{ id: "out", label: "Out" }]
config: {
  amount: 0, // 0-100
  curve: "soft-clip", // "soft-clip" | "hard-clip" | "tanh" | "sine" | "custom"
  oversample: "none" // "none" | "2x" | "4x"
}
implementation: WaveShaperNode with pre-generated curves
use_cases: ["Distortion", "Saturation", "Harmonic enhancement", "Fuzz"]
```

**Hard Clipper**
```typescript
type: "hard-clip"
label: "Hard Clipper"
inputs: [
  { id: "in", label: "In" },
  { id: "threshold", label: "Threshold" }
]
outputs: [{ id: "out", label: "Out" }]
config: {
  threshold: 0.8 // 0-1
}
implementation: WaveShaperNode with hard-clip curve
use_cases: ["Digital clipping", "Aggressive distortion", "Limiting"]
```

**Soft Clipper**
```typescript
type: "soft-clip"
label: "Soft Clipper"
inputs: [
  { id: "in", label: "In" },
  { id: "amount", label: "Amount" }
]
outputs: [{ id: "out", label: "Out" }]
config: {
  amount: 0.5, // 0-1
  curve: "tanh" // "tanh" | "atan" | "cubic"
}
implementation: WaveShaperNode with tanh/atan curve
use_cases: ["Warm saturation", "Analog-style clipping", "Subtle harmonic enhancement"]
```

**Implementation Complexity**: ⭐⭐ Medium (2-4 hours)
- WaveShaperNode requires generating transfer curves
- Need to implement curve generation functions (tanh, atan, polynomial, etc.)
- Oversample option adds quality

---

### Priority 2: Time-Based Effects (Medium Complexity, High Value)

#### 2.1 Delay

**Simple Delay**
```typescript
type: "delay"
label: "Delay"
inputs: [
  { id: "in", label: "In" },
  { id: "time", label: "Time" },
  { id: "feedback", label: "Feedback" }
]
outputs: [{ id: "out", label: "Out" }]
config: {
  delayTime: 0.5, // seconds (0-5)
  feedback: 0.3, // 0-0.95
  mix: 0.5 // dry/wet (0-1)
}
implementation: DelayNode + GainNode feedback loop
use_cases: ["Echo", "Slapback delay", "Rhythmic delay", "Dub delay"]
```

**Implementation Complexity**: ⭐⭐ Medium (3-4 hours)
- DelayNode is native but needs feedback routing
- Requires careful feedback gain control to prevent runaway
- Mix control needs separate dry/wet paths

---

#### 2.2 Modulation Effects

**Chorus**
```typescript
type: "chorus"
label: "Chorus"
inputs: [{ id: "in", label: "In" }]
outputs: [{ id: "out", label: "Out" }]
config: {
  rate: 1.5, // Hz (LFO speed)
  depth: 0.002, // seconds (modulation depth)
  mix: 0.5 // dry/wet
}
implementation: DelayNode + internal oscillator modulating delay time
use_cases: ["Chorus effect", "Doubling", "Thickening", "Detuning"]
```

**Flanger**
```typescript
type: "flanger"
label: "Flanger"
inputs: [{ id: "in", label: "In" }]
outputs: [{ id: "out", label: "Out" }]
config: {
  rate: 0.5, // Hz
  depth: 0.001, // seconds (shorter than chorus)
  feedback: 0.5, // 0-0.95
  mix: 0.5
}
implementation: DelayNode + feedback + LFO
use_cases: ["Jet plane effect", "Sweeping", "Metallic tone"]
```

**Phaser**
```typescript
type: "phaser"
label: "Phaser"
inputs: [{ id: "in", label: "In" }]
outputs: [{ id: "out", label: "Out" }]
config: {
  rate: 0.5, // Hz
  depth: 1.0, // 0-1
  stages: 4, // 2, 4, 6, or 8 (allpass stages)
  feedback: 0.5,
  mix: 0.5
}
implementation: Chain of allpass BiquadFilterNodes + LFO
use_cases: ["Phaser sweep", "Spacey effects", "Guitar pedal simulation"]
```

**Tremolo**
```typescript
type: "tremolo"
label: "Tremolo"
inputs: [{ id: "in", label: "In" }]
outputs: [{ id: "out", label: "Out" }]
config: {
  rate: 5, // Hz
  depth: 0.5, // 0-1
  waveform: "sine" // "sine" | "square" | "triangle"
}
implementation: GainNode + internal oscillator modulating gain
use_cases: ["Amplitude modulation", "Tremolo effect", "Rhythmic pulsing"]
```

**Vibrato**
```typescript
type: "vibrato"
label: "Vibrato"
inputs: [{ id: "in", label: "In" }]
outputs: [{ id: "out", label: "Out" }]
config: {
  rate: 5, // Hz
  depth: 0.5, // pitch variation (cents)
  waveform: "sine"
}
implementation: DelayNode + LFO (pitch modulation via delay time)
use_cases: ["Pitch vibrato", "Guitar/vocal effect", "Wobble"]
```

**Implementation Complexity**: ⭐⭐⭐ Medium-Hard (4-6 hours each)
- Requires internal LFO oscillators (OscillatorNode)
- Need proper modulation routing
- Chorus/Flanger share similar architecture
- Phaser needs multiple allpass filters in series

---

#### 2.3 Reverb

**Convolution Reverb**
```typescript
type: "reverb"
label: "Reverb"
inputs: [{ id: "in", label: "In" }]
outputs: [{ id: "out", label: "Out" }]
config: {
  impulse: "small-room", // Preset impulse responses
  mix: 0.3,
  predelay: 0.02 // seconds
}
implementation: ConvolverNode with impulse response buffers
use_cases: ["Room simulation", "Ambience", "Spatial effects"]
```

**Implementation Complexity**: ⭐⭐⭐ Medium-Hard (6-8 hours)
- ConvolverNode requires impulse response (IR) files
- Need to generate or acquire IR samples
- Loading/decoding audio buffers
- More complex than other effects

---

### Priority 3: Advanced Processors (Complex, Specialized)

#### 3.1 Envelope Processing

**Envelope Follower**
```typescript
type: "envelope-follower"
label: "Envelope Follower"
inputs: [{ id: "in", label: "In" }]
outputs: [
  { id: "audio", label: "Audio" },
  { id: "envelope", label: "Envelope" }
]
config: {
  attack: 0.01, // seconds
  release: 0.1 // seconds
}
implementation: AudioWorkletProcessor (RMS + envelope detector)
use_cases: ["Envelope extraction", "Sidechain control", "Dynamic modulation"]
```

**ADSR Envelope**
```typescript
type: "adsr"
label: "ADSR Envelope"
inputs: [
  { id: "gate", label: "Gate" }, // Trigger input
  { id: "in", label: "In" } // Optional audio input to shape
]
outputs: [{ id: "out", label: "Out" }]
config: {
  attack: 0.01,
  decay: 0.1,
  sustain: 0.7,
  release: 0.5
}
implementation: AudioWorkletProcessor or ConstantSourceNode scheduling
use_cases: ["Envelope generation", "Note shaping", "VCA control"]
```

**Implementation Complexity**: ⭐⭐⭐⭐ Hard (8-12 hours)
- Requires AudioWorkletProcessor for precise envelope detection
- RMS calculation or peak detection at sample rate
- Exponential attack/release curves
- Gate detection logic

---

#### 3.2 Bit Manipulation

**Bit Crusher**
```typescript
type: "bit-crusher"
label: "Bit Crusher"
inputs: [
  { id: "in", label: "In" },
  { id: "bits", label: "Bits" }
]
outputs: [{ id: "out", label: "Out" }]
config: {
  bits: 8, // 1-16
  mix: 1.0
}
implementation: AudioWorkletProcessor (bit depth reduction)
use_cases: ["Lo-fi effect", "Digital degradation", "Retro sound"]
```

**Sample Rate Reducer**
```typescript
type: "sample-rate-reducer"
label: "Sample Rate Reducer"
inputs: [
  { id: "in", label: "In" },
  { id: "rate", label: "Rate" }
]
outputs: [{ id: "out", label: "Out" }]
config: {
  sampleRate: 8000, // Hz (100-44100)
  mix: 1.0
}
implementation: AudioWorkletProcessor (downsampling + hold)
use_cases: ["Aliasing", "Lo-fi", "Digital artifacts"]
```

**Implementation Complexity**: ⭐⭐⭐ Medium-Hard (4-6 hours)
- AudioWorkletProcessor required
- Bit reduction: quantization algorithm
- Sample rate reduction: sample-and-hold algorithm

---

#### 3.3 Frequency/Pitch Effects

**Ring Modulator**
```typescript
type: "ring-mod"
label: "Ring Modulator"
inputs: [
  { id: "carrier", label: "Carrier" },
  { id: "modulator", label: "Modulator" }
]
outputs: [{ id: "out", label: "Out" }]
config: {
  mix: 1.0
}
implementation: GainNode (multiply using existing multiply block or dedicated)
use_cases: ["Ring modulation", "Metallic tones", "Inharmonic spectra"]
```

**Frequency Shifter**
```typescript
type: "freq-shifter"
label: "Frequency Shifter"
inputs: [{ id: "in", label: "In" }]
outputs: [{ id: "out", label: "Out" }]
config: {
  shift: 100, // Hz (-1000 to +1000)
  mix: 1.0
}
implementation: AudioWorkletProcessor (Hilbert transform + modulation)
use_cases: ["Frequency shifting", "Pitch shifting (without formant)", "Special effects"]
```

**Pitch Shifter**
```typescript
type: "pitch-shifter"
label: "Pitch Shifter"
inputs: [{ id: "in", label: "In" }]
outputs: [{ id: "out", label: "Out" }]
config: {
  semitones: 0, // -12 to +12
  cents: 0, // -100 to +100
  formantPreserve: true
}
implementation: AudioWorkletProcessor (pitch shifting algorithm - complex)
use_cases: ["Pitch correction", "Harmonization", "Transposition"]
```

**Implementation Complexity**: ⭐⭐⭐⭐⭐ Very Hard (20+ hours)
- Ring mod is easy (already have multiply)
- Frequency shifter requires Hilbert transform (complex DSP)
- Pitch shifter requires phase vocoder or granular synthesis (very complex)

---

#### 3.4 Spectral Processing

**Vocoder**
```typescript
type: "vocoder"
label: "Vocoder"
inputs: [
  { id: "carrier", label: "Carrier" },
  { id: "modulator", label: "Modulator" }
]
outputs: [{ id: "out", label: "Out" }]
config: {
  bands: 16, // Number of frequency bands
  qFactor: 10
}
implementation: Multiple BiquadFilterNodes + Envelope followers
use_cases: ["Vocoder effect", "Robot voice", "Talking synthesizer"]
```

**Implementation Complexity**: ⭐⭐⭐⭐⭐ Very Hard (20+ hours)
- Requires multiple filter banks (16-32 bands)
- Envelope followers for each band
- Complex routing and mixing

---

## Implementation Recommendations

### Quick Wins (1-2 days total)

Implement these first for immediate value:

1. **Notch Filter** (1 hour) - Complete the BiquadFilterNode suite
2. **All-Pass Filter** (1 hour) - Enable phaser building blocks
3. **Peaking EQ** (1 hour) - Essential for tone shaping
4. **Low/High-Shelf Filters** (2 hours) - Standard EQ controls
5. **Compressor** (2 hours) - Critical dynamics processor
6. **Waveshaper/Distortion** (3 hours) - Popular effect

**Total**: ~10 hours for 6 new essential processors

### Medium-Term Goals (1-2 weeks)

7. **Delay** (4 hours) - Time-based foundation
8. **Tremolo** (3 hours) - Simplest modulation effect
9. **Chorus** (4 hours) - Popular thickening effect
10. **Hard/Soft Clippers** (2 hours) - Saturation variety
11. **Bit Crusher** (4 hours) - Lo-fi effects

**Total**: ~17 hours for 5 more processors

### Long-Term / Advanced (1-2 months)

12. **Phaser** (6 hours) - Complex modulation
13. **Flanger** (5 hours) - Sweeping effect
14. **Vibrato** (4 hours) - Pitch modulation
15. **Reverb** (8 hours) - Spatial processing
16. **Envelope Follower** (10 hours) - Dynamic control
17. **Sample Rate Reducer** (4 hours) - Lo-fi complement

---

## Priority Matrix

| Processor | Value | Complexity | Priority |
|-----------|-------|------------|----------|
| Notch Filter | High | Low | ⭐⭐⭐⭐⭐ Must Have |
| All-Pass Filter | Medium | Low | ⭐⭐⭐⭐ Should Have |
| Peaking EQ | High | Low | ⭐⭐⭐⭐⭐ Must Have |
| Low/High-Shelf | High | Low | ⭐⭐⭐⭐⭐ Must Have |
| Compressor | High | Low | ⭐⭐⭐⭐⭐ Must Have |
| Waveshaper | High | Medium | ⭐⭐⭐⭐⭐ Must Have |
| Delay | High | Medium | ⭐⭐⭐⭐ Should Have |
| Tremolo | Medium | Low | ⭐⭐⭐ Nice to Have |
| Chorus | High | Medium | ⭐⭐⭐⭐ Should Have |
| Hard/Soft Clip | Medium | Low | ⭐⭐⭐ Nice to Have |
| Bit Crusher | Medium | Medium | ⭐⭐⭐ Nice to Have |
| Phaser | Medium | Hard | ⭐⭐ Optional |
| Flanger | Medium | Hard | ⭐⭐ Optional |
| Reverb | High | Hard | ⭐⭐⭐ Nice to Have |
| Envelope Follower | Medium | Very Hard | ⭐ Optional |
| Pitch Shifter | Low | Very Hard | ⭐ Future |
| Vocoder | Low | Very Hard | ⭐ Future |

---

## Implementation Strategy

### Phase 1: Complete the Filter Suite (4 hours)
Add all 5 remaining BiquadFilterNode types:
- Notch, All-pass, Peaking EQ, Low-shelf, High-shelf
- Reuse existing filter infrastructure
- Only need config UI updates

### Phase 2: Dynamics (2 hours)
Add DynamicsCompressorNode:
- Native Web Audio node
- Standard compressor controls

### Phase 3: Distortion (5 hours)
Implement waveshaping:
- Create curve generation functions
- WaveShaperNode wrapper
- Hard/soft clip variants

### Phase 4: Time-Based (7 hours)
Start with simple effects:
- Delay with feedback
- Tremolo (amplitude modulation)

### Phase 5: Modulation (13 hours)
Add complex modulation:
- Chorus (delay + LFO)
- Phaser (allpass chain + LFO)
- Flanger (short delay + feedback + LFO)

### Phase 6: Lo-Fi (6 hours)
Digital degradation:
- Bit crusher
- Sample rate reducer

### Phase 7: Advanced (20+ hours)
Complex processors:
- Convolution reverb
- Envelope follower
- Pitch shifting (if needed)

---

## Technical Notes

### Curve Generation for WaveShaperNode

```javascript
// Soft clip (tanh)
function makeSoftClipCurve(amount) {
  const samples = 1024;
  const curve = new Float32Array(samples);
  const k = amount * 10;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = Math.tanh(k * x);
  }
  return curve;
}

// Hard clip
function makeHardClipCurve(threshold) {
  const samples = 1024;
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = Math.max(-threshold, Math.min(threshold, x));
  }
  return curve;
}
```

### LFO Pattern for Modulation

```javascript
// Internal oscillator for chorus/flanger/phaser
const lfo = audioContext.createOscillator();
lfo.type = 'sine';
lfo.frequency.value = rate; // Hz

const lfoGain = audioContext.createGain();
lfoGain.gain.value = depth;

lfo.connect(lfoGain);
lfoGain.connect(delayNode.delayTime); // Modulate delay time
lfo.start();
```

### Delay Feedback Pattern

```javascript
const delay = audioContext.createDelay(5.0);
const feedback = audioContext.createGain();
const mix = audioContext.createGain();

// Feedback loop
delay.connect(feedback);
feedback.connect(delay);
feedback.gain.value = 0.3; // Prevent runaway

// Mix
inputNode.connect(delay);
delay.connect(mix);
mix.connect(output);
```

---

## Files to Modify

1. **src/types/blocks.ts** - Add new block definitions
2. **src/engine/SignalProcessingEngine.ts** - Add creation methods for each processor
3. **src/components/ConfigDrawer.tsx** - Add UI for new processor configs
4. **public/*.js** - Add AudioWorklet processors if needed (bit crusher, etc.)

---

## Summary

**Recommended Priority 1 Additions** (10 hours total):
1. Notch Filter
2. All-Pass Filter
3. Peaking EQ
4. Low/High-Shelf Filters
5. Compressor
6. Waveshaper

These 6 additions would:
- Complete the filter/EQ suite (essential for audio work)
- Add dynamics processing (compressor)
- Add distortion/saturation (waveshaper)
- Use mostly native Web Audio nodes (low complexity)
- Provide high value for users

**Future additions** in order of priority:
- Delay → Tremolo → Chorus → Clipping → Bit Crusher → Phaser/Flanger → Reverb
