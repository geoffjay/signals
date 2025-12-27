import { X, Trash2 } from "lucide-react";
import { type Node, type Edge } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { BlockConfig, BlockType } from "@/types/blocks";
import type { SignalBlockData } from "./SignalBlock";
import { getConfigComponent } from "./config";
import { useConnectionCheck } from "@/hooks";

interface ConfigDrawerProps {
  node: Node<SignalBlockData> | undefined;
  edges: Edge[];
  onConfigChange: (config: BlockConfig) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function ConfigDrawer({
  node,
  edges,
  onConfigChange,
  onDelete,
  onClose,
}: ConfigDrawerProps) {
  // Hidden state when no node selected
  if (!node) {
    return (
      <div className="w-80 h-full bg-card border border-border rounded-3xl shadow-lg flex flex-col transition-transform duration-300 ease-in-out transform translate-x-full pointer-events-auto" />
    );
  }

  const { blockType, label, config } = node.data;

  // Get connection check helper for this node
  const { isInputConnected } = useConnectionCheck(node.id, edges);

  // Get the config component for this block type
  const ConfigComponent = getConfigComponent(blockType as BlockType);

  // Handler to merge config updates
  const updateConfig = (updates: Partial<BlockConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <div className="w-80 h-full bg-card border border-border rounded-3xl shadow-lg flex flex-col transition-transform duration-300 ease-in-out transform translate-x-0 pointer-events-auto">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border">
        <h2 className="text-lg font-semibold">{label}</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Configuration Options */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {ConfigComponent ? (
          <ConfigComponent
            config={config}
            blockType={blockType as BlockType}
            onConfigChange={updateConfig}
            isInputConnected={isInputConnected}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            No configuration options for this block.
          </p>
        )}
      </div>

      <Separator />

      {/* Delete Button */}
      <div className="p-4">
        <Button variant="destructive" className="w-full" onClick={onDelete}>
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Block
        </Button>
      </div>
    </div>
  );
}
