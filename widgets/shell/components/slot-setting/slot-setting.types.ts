import {
  ShellPanelConfig,
  SlotsVisibilityConfig,
} from "../../src/shell-config.types";

export interface SlotSettingProps {
  shellPanelConfig: ShellPanelConfig;
  slot: keyof SlotsVisibilityConfig;
  onUpdate: (
    slot: keyof SlotsVisibilityConfig,
    shellPanelConfig: ShellPanelConfig
  ) => void;
}
