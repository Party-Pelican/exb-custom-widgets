import { SlotsVisibilityConfig } from "../../src/panel-config.types";

export interface SlotVisibilityProps {
  slotVisibilityConfig: SlotsVisibilityConfig;
  onUpdate: (updatedVisibility: SlotsVisibilityConfig) => void;
}
