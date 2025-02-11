import { SlotsVisibilityConfig } from "../../src/shell-config.types";

export interface SlotVisibilityProps {
  slotVisibilityConfig: SlotsVisibilityConfig;
  onUpdate: (updatedVisibility: SlotsVisibilityConfig) => void;
}
