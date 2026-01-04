import { useMemo } from "react";
import { Link, Unlink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useExternalConnectionStore } from "@/store/externalConnectionStore";
import { cn } from "@/lib/utils";

interface ExternalSourcePickerProps {
  value: string | null;
  onChange: (source: string | null) => void;
}

/**
 * Dropdown picker for selecting an external connection source.
 * Shows link/unlink icon and displays available connections from the store.
 */
export function ExternalSourcePicker({
  value,
  onChange,
}: ExternalSourcePickerProps) {
  // Get the raw connections Map - don't transform in selector to avoid infinite loops
  const connectionsMap = useExternalConnectionStore((state) => state.connections);

  // Transform to array in useMemo to maintain stable reference
  const connections = useMemo(
    () => Array.from(connectionsMap.values()),
    [connectionsMap]
  );

  const isConnected = value !== null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "h-6 w-6 shrink-0 inline-flex items-center justify-center rounded-md hover:bg-accent/50 transition-colors",
          isConnected && "text-purple-400 hover:text-purple-300"
        )}
        title={isConnected ? `Connected: ${value}` : "Connect to external source"}
      >
        {isConnected ? (
          <Link className="h-3 w-3" />
        ) : (
          <Unlink className="h-3 w-3" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          External Source
        </div>
        <DropdownMenuSeparator />

        {connections.length === 0 ? (
          <div className="px-2 py-1.5 text-[10px] text-muted-foreground">
            No external connections available.
            Add an External Connections block to create them.
          </div>
        ) : (
          <>
            {connections.map((connection) => (
              <DropdownMenuItem
                key={`${connection.nodeId}:${connection.inputIndex}`}
                onClick={() => onChange(connection.name)}
                className={cn(
                  value === connection.name && "bg-purple-500/20 text-purple-400"
                )}
              >
                <span className="flex-1">{connection.name}</span>
                <span className="text-[9px] text-muted-foreground ml-2">
                  {connection.value.toFixed(2)}
                </span>
              </DropdownMenuItem>
            ))}
          </>
        )}

        {isConnected && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onChange(null)}
              className="text-muted-foreground"
            >
              Disconnect
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
