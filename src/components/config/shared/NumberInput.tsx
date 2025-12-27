import { Input } from "@/components/ui/input";

interface NumberInputProps {
  /** Input ID for form association */
  id: string;
  /** Current value */
  value: number;
  /** Change handler */
  onChange: (value: number) => void;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Whether input is disabled (e.g., when connected) */
  disabled?: boolean;
  /** Optional placeholder text */
  placeholder?: string;
}

/**
 * Standardized number input for configuration fields.
 * Handles parsing and provides consistent styling.
 */
export function NumberInput({
  id,
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled = false,
  placeholder,
}: NumberInputProps) {
  return (
    <Input
      id={id}
      type="number"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      disabled={disabled}
      placeholder={placeholder}
      className={disabled ? "opacity-50 cursor-not-allowed" : ""}
    />
  );
}
