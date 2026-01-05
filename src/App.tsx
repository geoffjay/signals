import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { SignalFlowAppWithProvider } from "@/components/SignalFlowApp";
import { InstrumentBuilder } from "@/pages/InstrumentBuilder";
import {
  GettingStarted,
  Blocks,
  SignalGeneration,
  SignalProcessing,
  Routing,
  Visualization,
  ExternalConnections,
  KeyboardShortcuts,
} from "@/pages/docs";
import { useAuthStore } from "@/store/authStore";
import { useSignalFlowStore } from "@/store/signalFlowStore";
import { useInstrumentBuilderStore } from "@/store/instrumentBuilderStore";
import { useExternalConnectionSync } from "@/hooks/useExternalConnectionSync";

function AppContent() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isProjectDirty = useSignalFlowStore((state) => state.isDirty);
  const isInstrumentDirty = useInstrumentBuilderStore((state) => state.isDirty);
  const isDirty = isProjectDirty || isInstrumentDirty;

  // Sync external connections from signal flow nodes to the store
  useExternalConnectionSync();

  useEffect(() => {
    // Check if user is authenticated on mount
    checkAuth();
  }, [checkAuth]);

  // Warn user before closing tab with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  return (
    <Routes>
      <Route path="/" element={<SignalFlowAppWithProvider />} />
      <Route path="/docs" element={<Navigate to="/docs/getting-started" replace />} />
      <Route path="/docs/getting-started" element={<GettingStarted />} />
      <Route path="/docs/blocks" element={<Blocks />} />
      <Route path="/docs/signal-generation" element={<SignalGeneration />} />
      <Route path="/docs/signal-processing" element={<SignalProcessing />} />
      <Route path="/docs/routing" element={<Routing />} />
      <Route path="/docs/visualization" element={<Visualization />} />
      <Route path="/docs/external-connections" element={<ExternalConnections />} />
      <Route path="/docs/keyboard-shortcuts" element={<KeyboardShortcuts />} />
      <Route path="/instruments/builder" element={<InstrumentBuilder />} />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="dark">
        <AppContent />
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
