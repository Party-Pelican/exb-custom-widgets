import { React } from "jimu-core";
import {
  SettingRow,
  SettingSection,
} from "jimu-ui/advanced/setting-components";
import { Checkbox, Label } from "jimu-ui";
import { SlotVisibilityProps } from "./slot-visibility-setting.types";
import {
  ShellPanelConfig,
  SlotsVisibilityConfig,
} from "../../src/shell-config.types";
import SlotSetting from "../slot-setting/slot-setting";

export default function SlotVisibilitySetting({
  shellConfig,
  onUpdate,
}: SlotVisibilityProps) {
  const slotKeys = Object.keys(shellConfig.slotsVisibility) as Array<
    keyof SlotsVisibilityConfig
  >;

  function toggleVisibility(key: keyof SlotsVisibilityConfig) {
    onUpdate({
      slotsVisibility: {
        ...shellConfig.slotsVisibility,
        [key]: !shellConfig.slotsVisibility[key],
      },
    });
  }

  function toggleAll() {
    const allChecked = Object.values(shellConfig.slotsVisibility).every(
      (v) => v
    );
    const updatedVisibility = slotKeys.reduce(
      (acc, key) => ({ ...acc, [key]: !allChecked }),
      {}
    );
    onUpdate({ slotsVisibility: updatedVisibility });
  }

  function updateShellPanelConfig(
    slot: keyof SlotsVisibilityConfig,
    shellPanelConfig: Partial<ShellPanelConfig>
  ) {
    onUpdate({
      [slot]: shellPanelConfig,
    });
  }

  return (
    <SettingSection title="Slot Visibility">
      <SettingRow>
        <Label className="d-flex">
          <Checkbox
            className="mr-2"
            onChange={toggleAll}
            checked={Object.values(shellConfig.slotsVisibility).every((v) => v)}
          />
          All Slots
        </Label>
      </SettingRow>
      {slotKeys.map((key) => {
        return (
          <SettingRow className="d-flex justify-content-between">
            <Label key={key} className="ml-2 d-flex">
              <Checkbox
                className="mr-2"
                onChange={() => toggleVisibility(key)}
                checked={shellConfig.slotsVisibility[key]}
              />
              {formatSlotName(key)}
            </Label>
            {shellConfig.slotsVisibility[key] && (
              <SlotSetting
                shellPanelConfig={shellConfig[key]}
                onUpdate={updateShellPanelConfig}
                slot={key}
              />
            )}
          </SettingRow>
        );
      })}
    </SettingSection>
  );
}

function formatSlotName(slot: string) {
  return slot
    .replace(/-/g, " ") // Replace dashes with spaces
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize each word
}
