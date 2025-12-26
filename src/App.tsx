import { useEffect } from 'react';
import { ThemeProvider } from "@/components/theme-provider";
import { SignalFlowAppWithProvider } from "@/components/SignalFlowApp";
import { useAuthStore } from "@/store/authStore";
import { useSignalFlowStore } from "@/store/signalFlowStore";

export function App() {
  const checkAuth = useAuthStore(state => state.checkAuth);
  const isDirty = useSignalFlowStore(state => state.isDirty);

  useEffect(() => {
    // Check if user is authenticated on mount
    checkAuth();
  }, [checkAuth]);

  // Warn user before closing tab with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return (
    <ThemeProvider defaultTheme="dark">
      <SignalFlowAppWithProvider />
    </ThemeProvider>
  );
}

export default App;
