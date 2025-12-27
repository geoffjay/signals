import { useCallback } from "react";
import { useReactFlow, type Node } from "@xyflow/react";
import type { BlockConfig } from "@/types/blocks";
import type { SignalBlockData } from "@/components/SignalBlock";

/**
 * Hook that provides helper functions to update node data.
 * Simplifies the common pattern of updating a node's data in ReactFlow.
 *
 * @param nodeId - The ID of the node to update
 * @returns Object with update functions
 *
 * @example
 * ```tsx
 * const { updateConfig, updateData } = useNodeUpdater(id);
 *
 * // Update specific config values
 * updateConfig({ value: 0.5 });
 *
 * // Update arbitrary data
 * updateData({ analyser: newAnalyser });
 * ```
 */
export function useNodeUpdater(nodeId: string) {
  const { setNodes } = useReactFlow();

  /**
   * Update the node's config with partial updates (merges with existing config)
   */
  const updateConfig = useCallback(
    (configUpdates: Partial<BlockConfig>) => {
      setNodes((nds: Node[]) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            const nodeData = node.data as SignalBlockData;
            return {
              ...node,
              data: {
                ...nodeData,
                config: { ...nodeData.config, ...configUpdates },
              },
            };
          }
          return node;
        }),
      );
    },
    [nodeId, setNodes],
  );

  /**
   * Update arbitrary fields on the node's data (merges with existing data)
   */
  const updateData = useCallback(
    (dataUpdates: Partial<SignalBlockData>) => {
      setNodes((nds: Node[]) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            const nodeData = node.data as SignalBlockData;
            return {
              ...node,
              data: {
                ...nodeData,
                ...dataUpdates,
              },
            };
          }
          return node;
        }),
      );
    },
    [nodeId, setNodes],
  );

  /**
   * Set a specific config value
   */
  const setConfigValue = useCallback(
    (key: keyof BlockConfig, value: BlockConfig[keyof BlockConfig]) => {
      updateConfig({ [key]: value } as Partial<BlockConfig>);
    },
    [updateConfig],
  );

  /**
   * Get the current node data (read-only snapshot)
   */
  const getNodeData = useCallback((): SignalBlockData | undefined => {
    // Note: This returns a snapshot, not a live reference
    // For reactive updates, use the data prop passed to the component
    const { getNodes } = useReactFlow();
    const node = getNodes().find((n) => n.id === nodeId);
    return node?.data as SignalBlockData | undefined;
  }, [nodeId]);

  return {
    /** Update config with partial updates */
    updateConfig,
    /** Update node data with partial updates */
    updateData,
    /** Set a specific config value */
    setConfigValue,
    /** Get current node data (snapshot) */
    getNodeData,
    /** Direct access to setNodes for complex updates */
    setNodes,
  };
}

/**
 * Hook for creating control value handlers.
 * Provides pre-built handlers for common control patterns.
 *
 * @param nodeId - The ID of the node
 * @param config - The current config (for reading outputValue, pulseValue, etc.)
 * @returns Object with control handlers
 */
export function useControlHandlers(nodeId: string, config: BlockConfig) {
  const { updateConfig } = useNodeUpdater(nodeId);

  /** Handle slider value change */
  const handleSliderChange = useCallback(
    (values: readonly number[] | number) => {
      const newValue = Array.isArray(values) ? values[0] : values;
      updateConfig({ value: newValue });
    },
    [updateConfig],
  );

  /** Handle button press (set to outputValue) */
  const handleButtonPress = useCallback(() => {
    updateConfig({ value: config.outputValue ?? 1.0 });
  }, [updateConfig, config.outputValue]);

  /** Handle button release (set to 0) */
  const handleButtonRelease = useCallback(() => {
    updateConfig({ value: 0 });
  }, [updateConfig]);

  /** Handle toggle click (toggle between 0 and outputValue) */
  const handleToggle = useCallback(() => {
    const currentValue = config.value ?? 0;
    const newValue = currentValue === 0 ? (config.outputValue ?? 1.0) : 0;
    updateConfig({ value: newValue });
  }, [updateConfig, config.value, config.outputValue]);

  /** Handle pulse click (set to pulseValue, then reset after duration) */
  const handlePulse = useCallback(
    (pulseTimeoutRef: React.MutableRefObject<number | null>) => {
      // Clear any existing pulse timeout
      if (pulseTimeoutRef.current !== null) {
        window.clearTimeout(pulseTimeoutRef.current);
      }

      // Set pulse value
      updateConfig({ value: config.pulseValue ?? 1.0 });

      // Reset to 0 after pulse duration
      pulseTimeoutRef.current = window.setTimeout(() => {
        updateConfig({ value: 0 });
        pulseTimeoutRef.current = null;
      }, config.pulseDuration ?? 100);
    },
    [updateConfig, config.pulseValue, config.pulseDuration],
  );

  return {
    handleSliderChange,
    handleButtonPress,
    handleButtonRelease,
    handleToggle,
    handlePulse,
  };
}
