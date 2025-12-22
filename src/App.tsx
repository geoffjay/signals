import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { SignalFlowAppWithProvider } from "@/components/SignalFlowApp"

export function App() {
return (
  <ThemeProvider defaultTheme="dark">
    <header className="fixed top-0 right-0 z-50 flex justify-end p-4">
      <ThemeToggle />
    </header>
    <SignalFlowAppWithProvider />
  </ThemeProvider>
);
}

export default App;