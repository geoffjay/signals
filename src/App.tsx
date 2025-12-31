import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { SignalFlowAppWithProvider } from "@/components/SignalFlowApp";
import { Documentation } from "@/pages/Documentation";
import { InstrumentBuilder } from "@/pages/InstrumentBuilder";
import { useAuthStore } from "@/store/authStore";
import { useSignalFlowStore } from "@/store/signalFlowStore";
import { useInstrumentBuilderStore } from "@/store/instrumentBuilderStore";

function AppContent() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isProjectDirty = useSignalFlowStore((state) => state.isDirty);
  const isInstrumentDirty = useInstrumentBuilderStore((state) => state.isDirty);
  const isDirty = isProjectDirty || isInstrumentDirty;

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
      <Route path="/docs" element={<Documentation />} />
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
