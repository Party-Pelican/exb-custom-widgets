import { React } from "jimu-core";
import { SettingSection } from "jimu-ui/advanced/setting-components";
import { Checkbox, Label } from "jimu-ui";
import { SlotVisibilityProps } from "./slot-visibility.types";
import { SlotsVisibilityConfig } from "../../src/panel-config.types";

export default function SlotVisibility({
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
      <Label className="d-flex">
        <Checkbox
          className="mr-2"
          onChange={toggleAll}
          checked={Object.values(slotVisibilityConfig).every((v) => v)}
        />
        All Slots
      </Label>
      {slotKeys.map((key) => (
        <Label key={key} className="ml-2 d-flex">
          <Checkbox
            className="mr-2"
            onChange={() => toggleVisibility(key)}
            checked={slotVisibilityConfig[key]}
          />
          {formatSlotName(key)}
        </Label>
      ))}
    </SettingSection>
  );
}

function formatSlotName(slot: string) {
  return slot
    .replace(/-/g, " ") // Replace dashes with spaces
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize each word
}
