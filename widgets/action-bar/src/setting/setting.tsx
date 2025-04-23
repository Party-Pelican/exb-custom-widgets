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
      <Label>Layout</Label>
      <Dropdown alignment="start">
        <DropdownButton>{props.config.layout}</DropdownButton>
        <DropdownMenu>
          {["horizontal", "vertical"].map((i) => (
            <DropdownItem
              key={i}
              value={i}
              active={props.config.layout == i}
              onClick={(e) => updateActionConfig({ layout: e.target.value })}
            >
              {i}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
      <br></br>
      <Label>Overlay Positioning</Label>
      <Dropdown alignment="start">
        <DropdownButton>{props.config.overlayPositioning}</DropdownButton>
        <DropdownMenu>
          {["absolute", "fixed"].map((i) => (
            <DropdownItem
              key={i}
              value={i}
              active={props.config.overlayPositioning == i}
              onClick={(e) =>
                updateActionConfig({ overlayPositioning: e.target.value })
              }
            >
              {i}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
      <br></br>
      <Label>Position</Label>
      <Dropdown alignment="start">
        <DropdownButton>{props.config.position}</DropdownButton>
        <DropdownMenu>
          {["end", "start"].map((i) => (
            <DropdownItem
              key={i}
              value={i}
              active={props.config.position == i}
              onClick={(e) => updateActionConfig({ position: e.target.value })}
            >
              {i}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
      <br></br>
      <Label>
        Expand Disabled
        <Checkbox
          checked={props.config.expandDisabled}
          onChange={(c) =>
            updateActionConfig({ expandDisabled: c.target.checked })
          }
        ></Checkbox>
      </Label>
      <br></br>
      <Label>
        Expanded
        <Checkbox
          checked={props.config.expanded}
          onChange={(c) => updateActionConfig({ expanded: c.target.checked })}
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
