import { React } from "jimu-core";
import { type AllWidgetSettingProps } from "jimu-for-builder";
import { type IMConfig } from "../config";
import {
  SettingRow,
  SettingSection,
} from "jimu-ui/advanced/setting-components";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  TextInput,
  DropdownMenu,
  Label,
  Checkbox,
} from "jimu-ui";

export default function Setting(props: AllWidgetSettingProps<IMConfig>) {
  function updateActionConfig(updatedProp) {
    const key = Object.keys(updatedProp)[0];
    const value = Object.values(updatedProp)[0];
    props.onSettingChange({
      id: props.id,
      config: props.config.set(key, value),
    });
  }

  return (
    <SettingSection>
      <SettingRow>
        <TextInput
          onAcceptValue={(t) => updateActionConfig({ text: t })}
        ></TextInput>
      </SettingRow>
      <br></br>
      <Label>Alignment</Label>
      <Dropdown alignment="start">
        <DropdownButton>{props.config.alignment}</DropdownButton>
        <DropdownMenu>
          {["center", "end", "start"].map((i) => (
            <DropdownItem
              key={i}
              value={i}
              active={props.config.alignment == i}
              onClick={(e) => updateActionConfig({ alignment: e.target.value })}
            >
              {i}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
      <br></br>
      <Label>Appearance</Label>
      <Dropdown alignment="start">
        <DropdownButton>{props.config.appearance}</DropdownButton>
        <DropdownMenu>
          {["solid", "transparent"].map((i) => (
            <DropdownItem
              key={i}
              value={i}
              active={props.config.appearance == i}
              onClick={(e) =>
                updateActionConfig({ appearance: e.target.value })
              }
            >
              {i}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
      <br></br>
      <Label>
        Indicator
        <Checkbox
          checked={props.config.indicator}
          onChange={(c) => updateActionConfig({ indicator: c.target.checked })}
        ></Checkbox>
      </Label>
      <br></br>
      <Label>
        Text Enabled
        <Checkbox
          checked={props.config.textEnabled}
          onChange={(c) =>
            updateActionConfig({ textEnabled: c.target.checked })
          }
        ></Checkbox>
      </Label>
      <br></br>
      <Label>Scale</Label>
      <Dropdown alignment="start">
        <DropdownButton>{props.config.scale}</DropdownButton>
        <DropdownMenu>
          {["s", "m", "l"].map((i) => (
            <DropdownItem
              key={i}
              value={i}
              active={props.config.scale == i}
              onClick={(e) => updateActionConfig({ scale: e.target.value })}
            >
              {i}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
    </SettingSection>
  );
}
