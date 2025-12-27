import { Label } from "@/components/ui/label";

interface ConfigFieldProps {
  /** Field label text */
  label: string;
  /** HTML for attribute for accessibility */
  htmlFor: string;
  /** Whether this input is connected (receives signal from another block) */
  isConnected?: boolean;
  /** Child input elements */
  children: React.ReactNode;
}

/**
 * Wrapper component for configuration fields.
 * Handles label styling and connection status display.
 */
export function ConfigField({
  label,
  htmlFor,
  isConnected = false,
  children,
}: ConfigFieldProps) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={htmlFor}
        className={isConnected ? "text-muted-foreground" : ""}
      >
        {label} {isConnected && "(Connected)"}
      </Label>
      {children}
    </div>
  );
}
