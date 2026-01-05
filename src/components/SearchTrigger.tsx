import { Search } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Kbd, KbdGroup } from "@/components/ui/kbd";

interface SearchTriggerProps {
  onClick: () => void;
}

export function SearchTrigger({ onClick }: SearchTriggerProps) {
  const isMac =
    typeof navigator !== "undefined" &&
    navigator.platform.toUpperCase().includes("MAC");

  return (
    <InputGroup
      className="cursor-pointer w-40 h-8 hover:border-ring/50 transition-colors"
      onClick={onClick}
    >
      <InputGroupAddon align="inline-start">
        <Search className="h-3.5 w-3.5" />
      </InputGroupAddon>
      <InputGroupInput
        placeholder="Search..."
        readOnly
        className="cursor-pointer"
      />
      <InputGroupAddon align="inline-end">
        <KbdGroup>
          <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </InputGroupAddon>
    </InputGroup>
  );
}
