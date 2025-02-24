import {
  ShellPanelConfig,
  SlotsVisibilityConfig,
} from "../../src/shell-config.types";

export interface SlotSettingProps {
  slot: keyof SlotsVisibilityConfig;
  type: "calcite-shell-panel";
}
