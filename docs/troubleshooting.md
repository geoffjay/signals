# Troubleshooting Guide

This document covers common issues and debugging techniques for the Signals application.

## Processor Debugging

### Compressor Appears to Output "No Signal"

**Symptom:** After adding a compressor block, the oscilloscope shows a flat line and it appears no signal is passing through.

**Diagnosis:** This is often **expected behavior**, not a bug. Verify by checking:

1. **Level Meter:** Connect a Numeric Meter to the compressor output. If it shows a non-zero value (e.g., 0.237), signal IS flowing.
2. **FFT Analyzer:** If the FFT shows spectrum bars, signal is present.
3. **Console Logs:** Check browser console for `[Connection] Successfully connected` messages.

**Explanation:** A compressor with aggressive settings (e.g., -24dB threshold, 12:1 ratio) will dramatically reduce dynamic range. For noise input:
- Before compression: Signal varies widely (e.g., -1 to +1)
- After compression: Signal is nearly constant (e.g., ~0.2)

On an oscilloscope with -2 to +2 range, a constant 0.2 amplitude signal appears as a thin flat line near the center. This IS the compressed signal - compression flattens dynamics.

**Solutions:**
1. Reduce the compression ratio (e.g., 4:1 instead of 12:1)
2. Raise the threshold (e.g., -12dB instead of -24dB)
3. Increase the output gain after compression
4. Adjust oscilloscope amplitude range to zoom in on the signal

### General Processor Debugging Steps

1. **Verify connections in console:**
   - Open browser DevTools (F12)
   - Look for `[Connection]` log messages
   - Each edge should log "Successfully connected"

2. **Check node creation:**
   - Processor nodes are created in `SignalProcessingEngine.ts`
   - Each block type has a `create*` method (e.g., `createCompressor`)
   - The node must be stored in `this.nodes.set(nodeId, audioNode)`

3. **Verify the signal chain:**
   - Add oscilloscopes at different points in the chain
   - This helps isolate where signal is lost

4. **Check AudioContext state:**
   - Audio won't play if AudioContext is suspended
   - Click the play button to start/resume the AudioContext

## Web Audio API Constraints

### Oscillators Cannot Be Restarted
Once an OscillatorNode is stopped, it cannot be started again. The engine creates new oscillators when playback restarts.

### AudioContext Requires User Gesture
Browsers require a user interaction (click, key press) before audio can play. The play button handles this.

### DynamicsCompressorNode Behavior
The Web Audio API's DynamicsCompressorNode:
- Has built-in makeup gain that normalizes output
- Threshold is in dB (negative values, e.g., -24)
- Attack/Release are in seconds (e.g., 0.003 = 3ms)
- Ratio is linear (e.g., 12 means 12:1 compression)

## Common Issues

### No Sound from Audio Output
1. Check if the block is muted (default is muted for safety)
2. Verify volume slider is not at 0
3. Ensure AudioContext is running (click play)
4. Check system audio settings

### Oscilloscope Shows Flat Line
1. Verify signal source is connected and generating
2. Check if intermediate processors are configured correctly
3. Verify the analyser node is connected (check console logs)
4. Adjust amplitude range if signal is very quiet

### FFT Analyzer Shows No Data
1. Ensure input is connected
2. Verify the signal has frequency content (DC won't show in spectrum)
3. Check minDecibels/maxDecibels settings

## Debugging with Browser DevTools

The application logs connection information to the console:

```
[Connection] Default connect: node-X(out) -> node-Y(in), blockType=typename
[Connection] Successfully connected
```

Special logging for specific block types:
- `[FFT]` - FFT Analyzer connections and configuration
- `[MUX]` - Multiplexer selector and input routing

To inspect audio nodes programmatically, the engine stores references in:
- `this.nodes` - All audio nodes by ID
- `this.oscillators` - Oscillator nodes specifically
- `this.analysers` - Analyser nodes for visualization
- `this.constantSources` - Constant sources for input controls
