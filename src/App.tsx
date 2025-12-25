import { useEffect } from 'react';
import { ThemeProvider } from "@/components/theme-provider";
import { SignalFlowAppWithProvider } from "@/components/SignalFlowApp";
import { useAuthStore } from "@/store/authStore";

export function App() {
  const checkAuth = useAuthStore(state => state.checkAuth);

  useEffect(() => {
    // Check if user is authenticated on mount
    checkAuth();
  }, [checkAuth]);

  return (
    <ThemeProvider defaultTheme="dark">
      <SignalFlowAppWithProvider />
    </ThemeProvider>
  );
}

export default App;
