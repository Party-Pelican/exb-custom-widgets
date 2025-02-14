import { ShellConfig } from "../../src/shell-config.types";

export interface SlotVisibilityProps {
  shellConfig: ShellConfig;
  onUpdate: (newConfig: Partial<ShellConfig>) => void;
}
