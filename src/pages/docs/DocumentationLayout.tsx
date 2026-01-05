import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchTrigger } from "@/components/SearchTrigger";
import { SearchDialog, useSearchDialog } from "@/components/SearchDialog";

interface DocNavItem {
  id: string;
  title: string;
  path: string;
}

const NAV_ITEMS: DocNavItem[] = [
  { id: "getting-started", title: "Getting Started", path: "/docs/getting-started" },
  { id: "blocks", title: "Blocks", path: "/docs/blocks" },
  { id: "signal-generation", title: "Signal Generation", path: "/docs/signal-generation" },
  { id: "signal-processing", title: "Signal Processing", path: "/docs/signal-processing" },
  { id: "routing", title: "Routing", path: "/docs/routing" },
  { id: "visualization", title: "Visualization", path: "/docs/visualization" },
  { id: "external-connections", title: "External Connections", path: "/docs/external-connections" },
  { id: "keyboard-shortcuts", title: "Keyboard Shortcuts", path: "/docs/keyboard-shortcuts" },
];

interface DocumentationLayoutProps {
  children: React.ReactNode;
}

export function DocumentationLayout({ children }: DocumentationLayoutProps) {
  const navigate = useNavigate();
  const { page } = useParams();
  const { open, setOpen } = useSearchDialog();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to App
          </Button>
          <div className="flex-1" />
          <SearchTrigger onClick={() => setOpen(true)} />
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="sticky top-14 h-[calc(100vh-3.5rem)] w-64 shrink-0 border-r border-border overflow-y-auto">
          <nav className="p-4 space-y-1">
            <h2 className="text-sm font-semibold mb-3 text-foreground">Documentation</h2>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  page === item.id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
              >
                <ChevronRight className={`h-3 w-3 ${page === item.id ? "opacity-100" : "opacity-0"}`} />
                {item.title}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-3xl mx-auto px-8 py-12">
            {children}
          </div>
        </main>
      </div>

      <SearchDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
