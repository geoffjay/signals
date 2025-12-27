import type { BlockConfig, BlockType } from "@/types/blocks";

/**
 * Props shared by all config components
 */
export interface ConfigComponentProps {
  /** Current block configuration */
  config: BlockConfig;
  /** Block type (for type-specific rendering) */
  blockType: BlockType;
  /** Handler to update configuration */
  onConfigChange: (updates: Partial<BlockConfig>) => void;
  /** Function to check if an input handle is connected */
  isInputConnected: (handleId: string) => boolean;
}
