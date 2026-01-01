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

## Adding New Processor Blocks

### Time-Based Effects with Internal Sub-nodes (No Audio Output)

**Symptom:** After adding a new time-based effect (like reverb, delay, chorus, flanger, phaser, vibrato), no audio is heard when connected to an audio output or oscilloscope, even though console logs show connections being made successfully.

**Root Cause:** Time-based effects store multiple internal Web Audio nodes with suffixes (e.g., `-predelay`, `-convolver`, `-dry`, `-wet`, `-output`). The `updateGraph` method has logic that:

1. Removes nodes not in the ReactFlow graph
2. Disconnects all nodes before rebuilding connections

The problem is that internal sub-nodes (like `reverb-1-output`) are not in the ReactFlow node list (only `reverb-1` is), so they get:

1. **Incorrectly marked for removal** because they're not in `newNodeIds`
2. **Disconnected** during the reconnection phase, breaking internal signal paths

**Solution - Two Required Changes in `SignalProcessingEngine.ts`:**

1. **Add effect sub-node suffixes to the exclusion list** (around line 101):

```typescript
// Effect sub-node patterns: time-based effects store multiple internal nodes with suffixes
const effectSubNodeSuffixes = [
  "-predelay",
  "-convolver",
  "-dry",
  "-wet",
  "-output", // reverb, delay, chorus, flanger
  "-delay",
  "-feedback", // delay, flanger, vibrato
  "-lfo",
  "-lfoGain",
  "-depth", // tremolo, chorus, flanger, phaser, vibrato
  "-allpass-", // phaser stages
];
const isEffectSubNode = (id: string) =>
  effectSubNodeSuffixes.some((suffix) => id.includes(suffix));

const nodesToRemove = Array.from(currentNodeIds).filter(
  (id) =>
    !newNodeIds.has(id) &&
    !id.includes("-freq_out") && // FFT filter sub-nodes
    !id.includes("-inverter") && // Subtraction inverter nodes
    !id.includes("::") && // Instrument internal nodes
    !isEffectSubNode(id), // Effect internal sub-nodes  <-- ADD THIS
);
```

2. **Skip effect sub-nodes in the disconnect loop** (around line 261):

```typescript
this.nodes.forEach((node, nodeId) => {
  if (nodeId.includes("-freq_out")) return;
  if (nodeId.includes("::")) return;
  if (isEffectSubNode(nodeId)) return; // <-- ADD THIS
  try {
    node.disconnect();
  } catch {
    // Already disconnected
  }
});
```

3. **Add the effect to `effectsWithOutputNode` array** if it has a separate output node (around line 2085):

```typescript
const effectsWithOutputNode = [
  "delay",
  "chorus",
  "flanger",
  "phaser",
  "vibrato",
  "reverb", // <-- ADD NEW EFFECTS HERE
  "crossfader",
];
```

**Checklist for Adding New Time-Based Effects:**

- [ ] Create internal sub-nodes with consistent suffix patterns (e.g., `-output`, `-dry`, `-wet`)
- [ ] Add any new suffix patterns to `effectSubNodeSuffixes` array
- [ ] Add effect type to `effectsWithOutputNode` if it has a separate output node
- [ ] Store the main input node as `this.nodes.set(nodeId, inputGain)`
- [ ] Store the output node as `this.nodes.set(`${nodeId}-output`, outputGain)`
- [ ] Add connection handling case in the `connectNodes` switch statement
- [ ] Add config update handling case in `updateNodeConfig`

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

## PocketBase Setup Issues

### "Missing collection context" Error

**Symptom:** Console shows `404: Missing collection context` when loading instruments.

**Cause:** The `instruments` collection doesn't exist in PocketBase yet.

**Solution:** Create the instruments collection in PocketBase Admin:

1. Open PocketBase Admin (http://localhost:8090/\_/)
2. Go to Collections
3. Click "New collection"
4. Use these settings:
   - Name: `instruments`
   - Type: Base collection
5. Add fields:
   - `userId` - Relation to users (required, cascade delete)
   - `name` - Text (required, max 100 chars)
   - `description` - Text (optional, max 1000 chars)
   - `instrumentData` - JSON (required)
   - `isPublic` - Boolean (optional)
   - `tags` - JSON (optional)
6. Set API rules:
   - List/View: `@request.auth.id != '' && (userId = @request.auth.id || isPublic = true)`
   - Create: `@request.auth.id != ''`
   - Update/Delete: `@request.auth.id != '' && userId = @request.auth.id`

**Alternative:** Import the schema from `pb_schema/instruments.json` via PocketBase Admin > Settings > Import collections.

### "Not authenticated" Error When Saving

**Symptom:** "Not authenticated" error when trying to save an instrument to the cloud.

**Cause:** User is not logged in or authentication token has expired.

**Solution:**

1. Log in to the application using the user menu
2. If already logged in, try logging out and back in to refresh the token

### 400 Bad Request When Loading Instruments

**Symptom:** Console shows `400 Bad Request` with message "Something went wrong while processing your request" when loading instruments while logged in.

**Cause:** The `instruments` collection schema doesn't match what the application expects. Common issues:

1. **Field name mismatch**: The field must be named exactly `userId` (not `user` or `user_id`)
2. **Field type wrong**: The `userId` field must be a **Relation** type pointing to users (not Text)
3. **Missing required fields**: All required fields must exist with correct names

**Solution:** Verify your collection schema in PocketBase Admin:

1. Open PocketBase Admin (http://localhost:8090/\_/)
2. Go to Collections → instruments
3. Check that the following fields exist with **exact names**:
   - `userId` - Type: **Relation** (to users collection)
   - `name` - Type: Text
   - `description` - Type: Text
   - `instrumentData` - Type: JSON
   - `isPublic` - Type: Boolean
   - `tags` - Type: JSON

**Quick Fix - Delete and Reimport:**

If field names don't match, the easiest fix is to delete the collection and reimport:

1. In PocketBase Admin, delete the `instruments` collection
2. Go to Settings → Import collections
3. Upload `pb_schema/instruments.json` from this repository
4. This will create the collection with the correct schema

**Note:** The API rules in the imported schema use `userId` in filter expressions (e.g., `userId = @request.auth.id`). If your field is named differently, these rules will fail silently with a 400 error
