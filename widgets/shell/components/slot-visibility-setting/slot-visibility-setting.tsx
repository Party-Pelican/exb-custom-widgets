import { React } from "jimu-core";
import {
  SettingRow,
  SettingSection,
} from "jimu-ui/advanced/setting-components";
import { Checkbox, Label } from "jimu-ui";
import { SlotsVisibilityConfig } from "../../src/shell-config.types";
import SlotSetting from "../slot-setting/slot-setting";
import { useWidgetContext } from "../../context/widget-context";

export default function SlotVisibilitySetting() {
  const { state, dispatch } = useWidgetContext();
  const slotKeys = Object.keys(state.slotsVisibility) as Array<
    keyof SlotsVisibilityConfig
  >;

  function toggleVisibility(key: keyof SlotsVisibilityConfig) {
    dispatch({
      type: "UPDATE_SLOTS_VISIBILITY",
      payload: { ...state.slotsVisibility, [key]: !state.slotsVisibility[key] },
    });
  }

  function toggleAll() {
    const allChecked = Object.values(state.slotsVisibility).every((v) => v);
    const updatedVisibility = slotKeys.reduce(
      (acc, key) => ({ ...acc, [key]: !allChecked }),
      {}
    );

    dispatch({
      type: "UPDATE_SLOTS_VISIBILITY",
      payload: updatedVisibility,
    });
  }

  return (
    <SettingSection title="Slot Visibility">
      <SettingRow>
        <Label className="d-flex">
          <Checkbox
            className="mr-2"
            onChange={toggleAll}
            checked={Object.values(state.slotsVisibility).every((v) => v)}
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
                checked={state.slotsVisibility[key]}
              />
              {formatSlotName(key)}
            </Label>
            {state.slotsVisibility[key] && (
              <SlotSetting slot={key} type="calcite-shell-panel" />
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
