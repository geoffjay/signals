import type { BlockConfig } from "@/types/blocks";
import { useExternalConnectionStore } from "@/store/externalConnectionStore";

interface ExternalConnectionsControlProps {
  nodeId: string;
  config: BlockConfig;
}

/**
 * External Connections control block - displays connection names and current values.
 * Registration is handled by useExternalConnectionSync at the app level.
 */
export function ExternalConnectionsControl({ nodeId, config }: ExternalConnectionsControlProps) {
  const numConnections = config.extConnectionCount || 1;
  const names = config.extConnectionNames || [];
  const connections = useExternalConnectionStore((state) => state.connections);

  return (
    <div className="mb-3 px-2 nodrag nowheel">
      <div className="flex flex-col gap-1">
        {Array.from({ length: numConnections }).map((_, i) => {
          const name = names[i] || `ext${i}`;
          const key = `${nodeId}:${i}`;
          const connection = connections.get(key);
          const value = connection?.value ?? 0;

          // Calculate bar width based on value (0-1 range)
          const barWidth = Math.min(100, Math.max(0, value * 100));

          return (
            <div key={i} className="flex items-center gap-2">
              <div className="text-[9px] text-muted-foreground font-medium min-w-[40px] truncate">
                {name}
              </div>
              <div className="flex-1 h-3 bg-muted rounded overflow-hidden">
                <div
                  className="h-full bg-primary/60 transition-all duration-75"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <div className="text-[8px] text-muted-foreground min-w-[28px] text-right">
                {value.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
