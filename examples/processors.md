# Processor Examples

This document describes the example configurations demonstrating signal processors in the Signals application.

## Compressor Demo (`compressor-demo.json`)

Demonstrates the **DynamicsCompressorNode**-based compressor processor with before/after visualization.

### Signal Flow

```
                                    ┌─────────────────┐
                                    │  Before Scope   │
                                    └────────▲────────┘
                                             │ out0
┌──────────┐    ┌──────────┐    ┌────────────┴───────┐
│  Noise   │───▶│ Input    │───▶│ Pre-Compressor     │
│Generator │    │ Gain     │    │ Splitter           │
└──────────┘    └──────────┘    └────────────┬───────┘
      ▲               ▲                      │ out1
      │               │                      ▼
┌─────┴────┐    ┌─────┴────┐         ┌──────────────┐
│ Amplitude│    │  Input   │         │    Mix       │◀─── AM Modulated Tone
└──────────┘    │  Level   │         │   Sources    │
                │  Slider  │         └──────┬───────┘
                └──────────┘                │
                                            ▼
                                    ┌──────────────┐
                                    │  Compressor  │
                                    │              │
                                    │ threshold:-24│
                                    │ knee: 30     │
                                    │ ratio: 12    │
                                    │ attack: 3ms  │
                                    │ release: 250ms│
                                    └──────┬───────┘
                                           │
                                           ▼
┌──────────┐                       ┌──────────────┐
│  Output  │──────────────────────▶│ Output Gain  │
│  Level   │                       │  (Multiply)  │
│  Slider  │                       └──────┬───────┘
└──────────┘                              │
                                          ▼
                                  ┌───────────────┐
                                  │ Output Split  │
                                  │  (4 outputs)  │
                                  └───┬───┬───┬───┘
                                      │   │   │   │
              ┌───────────────────────┘   │   │   └─────────────────────┐
              ▼                           ▼   ▼                         ▼
      ┌──────────────┐           ┌─────────┐ ┌──────────┐      ┌──────────────┐
      │ After Scope  │           │  FFT    │ │  Level   │      │ Audio Output │
      │              │           │Analyzer │ │  Meter   │      │   (Muted)    │
      └──────────────┘           └─────────┘ └──────────┘      └──────────────┘
```

### Controls

| Control      | Range  | Default | Purpose                                      |
| ------------ | ------ | ------- | -------------------------------------------- |
| Input Level  | 0 - 2  | 1.5     | Controls signal amplitude before compression |
| Output Level | 0 - 1  | 0.5     | Controls final output amplitude              |
| DC Offset    | 0 - 1  | 0.5     | Adds DC offset to LFO for AM modulation      |
| Tone On/Off  | Toggle | Off     | Enables 440Hz tone for testing               |

### Compressor Parameters

The compressor block is configured with standard dynamics processing parameters:

| Parameter     | Value  | Description                          |
| ------------- | ------ | ------------------------------------ |
| **Threshold** | -24 dB | Level above which compression starts |
| **Knee**      | 30 dB  | Smoothness of compression onset      |
| **Ratio**     | 12:1   | Compression ratio (aggressive)       |
| **Attack**    | 3 ms   | How fast compression engages         |
| **Release**   | 250 ms | How fast compression releases        |

### How to Use

1. **Load the example**: Import `compressor-demo.json` from the File menu
2. **Start playback**: Click the Play button in the toolbar
3. **Observe the difference**: Compare the "Before Compression" and "After Compression" oscilloscopes
4. **Experiment with input level**: Adjust the Input Level slider to see how the compressor responds to different signal levels
5. **Enable audio**: Unmute the Audio Output block to hear the compressed signal
6. **Add tone**: Toggle "Tone On/Off" to add a 440Hz sine wave for clearer compression demonstration

### What to Observe

- **Before Compression scope**: Shows the raw, uncompressed noise signal with full dynamic range
- **After Compression scope**: Shows the compressed signal with reduced peaks and more consistent amplitude
- **FFT Analyzer**: Displays the frequency spectrum of the compressed output
- **Level Meter**: Shows the instantaneous amplitude of the output signal

### Technical Notes

The compressor uses the Web Audio API's native `DynamicsCompressorNode`, which provides:

- Hardware-accelerated dynamics processing
- Standard compressor parameters (threshold, knee, ratio, attack, release)
- Low-latency real-time processing

The aggressive settings (12:1 ratio, -24dB threshold) make the compression effect clearly visible on the oscilloscopes.

---

## Future Examples

Additional processor examples will be added as new processors are implemented:

- **Waveshaper Demo**: Distortion and saturation effects
- **Delay Demo**: Time-based effects with feedback
- **Modulation Demo**: Chorus, flanger, and phaser effects
