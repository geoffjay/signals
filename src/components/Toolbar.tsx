import { useSignalFlowStore } from "@/store/signalFlowStore";
import { ToolbarShell, SignalToolbar, VisualizerToolbar } from "./toolbar/index";

export function Toolbar() {
  const { appMode } = useSignalFlowStore();

  const title = appMode === "signal" ? "Tools" : "Visualizer";

  return (
    <ToolbarShell title={title}>
      {appMode === "signal" ? <SignalToolbar /> : <VisualizerToolbar />}
    </ToolbarShell>
  );
}
