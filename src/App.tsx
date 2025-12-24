import { ThemeProvider } from "@/components/theme-provider";
import { SignalFlowAppWithProvider } from "@/components/SignalFlowApp";

export function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <SignalFlowAppWithProvider />
    </ThemeProvider>
  );
}

export default App;
