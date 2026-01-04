import { ConfigField } from "./shared";
import type { ConfigComponentProps } from "./types";

/**
 * Configuration for external connections block
 */
export function ExternalConnectionsConfig({ config, onConfigChange }: ConfigComponentProps) {
  const numConnections = config.extConnectionCount || 1;
  const names = config.extConnectionNames || [];

  // Handle number of connections change
  const handleNumConnectionsChange = (newNum: number) => {
    // Create new names array with appropriate length
    const newNames = Array.from({ length: newNum }, (_, i) =>
      names[i] || `ext${i}`
    );
    onConfigChange({ extConnectionCount: newNum, extConnectionNames: newNames });
  };

  // Handle connection name change
  const handleNameChange = (index: number, name: string) => {
    const newNames = [...names];
    // Ensure array is long enough
    while (newNames.length <= index) {
      newNames.push(`ext${newNames.length}`);
    }
    newNames[index] = name;
    onConfigChange({ extConnectionNames: newNames });
  };

  return (
    <>
      <ConfigField label="Number of Connections" htmlFor="numConnections">
        <select
          id="numConnections"
          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          value={numConnections}
          onChange={(e) => handleNumConnectionsChange(Number(e.target.value))}
        >
          <option value={1}>1 Connection</option>
          <option value={2}>2 Connections</option>
          <option value={4}>4 Connections</option>
          <option value={8}>8 Connections</option>
          <option value={16}>16 Connections</option>
        </select>
      </ConfigField>

      <div className="mt-4 space-y-2">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Connection Names
        </div>
        <p className="text-[10px] text-muted-foreground">
          Give each connection a meaningful name to reference it from the visualizer
        </p>
        {Array.from({ length: numConnections }).map((_, i) => {
          const name = names[i] || `ext${i}`;
          return (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground min-w-[24px]">
                {i}:
              </span>
              <input
                type="text"
                className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-sm"
                value={name}
                onChange={(e) => handleNameChange(i, e.target.value)}
                placeholder={`ext${i}`}
              />
            </div>
          );
        })}
      </div>
    </>
  );
}
