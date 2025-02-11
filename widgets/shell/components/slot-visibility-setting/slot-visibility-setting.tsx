import { React } from "jimu-core";
import {
  SettingRow,
  SettingSection,
} from "jimu-ui/advanced/setting-components";
import { Button, Checkbox, Icon, Label } from "jimu-ui";
import { SlotVisibilityProps } from "./slot-visibility-setting.types";
import { SlotsVisibilityConfig } from "../../src/shell-config.types";
import SlotSetting from "../slot-setting/slot-setting";

export default function SlotVisibilitySetting({
  slotVisibilityConfig,
  onUpdate,
}: SlotVisibilityProps) {
  const slotKeys = Object.keys(slotVisibilityConfig) as Array<
    keyof SlotsVisibilityConfig
  >;

  function toggleVisibility(key: keyof SlotsVisibilityConfig) {
    onUpdate({
      ...slotVisibilityConfig,
      [key]: !slotVisibilityConfig[key],
    });
  }

  function toggleAll() {
    const allChecked = Object.values(slotVisibilityConfig).every((v) => v);
    const updatedConfig = slotKeys.reduce(
      (acc, key) => ({ ...acc, [key]: !allChecked }),
      {} as SlotsVisibilityConfig
    );
    onUpdate(updatedConfig);
  }

  return (
    <SettingSection title="Slot Visibility">
      <SettingRow>
        <Label className="d-flex">
          <Checkbox
            className="mr-2"
            onChange={toggleAll}
            checked={Object.values(slotVisibilityConfig).every((v) => v)}
          />
          All Slots
        </Label>
      </SettingRow>
      {slotKeys.map((key) => (
        <SettingRow className="d-flex justify-content-between">
          <Label key={key} className="ml-2 d-flex">
            <Checkbox
              className="mr-2"
              onChange={() => toggleVisibility(key)}
              checked={slotVisibilityConfig[key]}
            />
            {formatSlotName(key)}
          </Label>
          {slotVisibilityConfig[key] && <SlotSetting slot={key} />}
        </SettingRow>
      ))}
    </SettingSection>
  );
}

function formatSlotName(slot: string) {
  return slot
    .replace(/-/g, " ") // Replace dashes with spaces
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize each word
}
