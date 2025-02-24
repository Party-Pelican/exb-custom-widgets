import { React } from "jimu-core";
import { SettingSection } from "jimu-ui/advanced/setting-components";
import {
  Checkbox,
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownMenu,
  Label,
  Tooltip,
} from "jimu-ui";
import { ShellPanelSettingProps } from "./shell-panel.types";
import { useWidgetContext } from "../../context/widget-context";
import { displayModes } from "../../src/shell-config.types";

export default function ShellPanelSetting({ slot }: ShellPanelSettingProps) {
  const { state, dispatch } = useWidgetContext();
  const slotAction = `UPDATE_${slot.replace("-", "").toUpperCase()}`;
  function toggleResizable() {
    dispatch({
      //@ts-ignore
      type: slotAction,
      payload: {
        resizable: !state[slot].resizable,
      },
    });
  }
  function toggleCollapsed() {
    dispatch({
      //@ts-ignore
      type: slotAction,
      payload: {
        collapsed: !state[slot].collapsed,
      },
    });
  }

  return (
    <SettingSection title="Properties">
      <Label className="d-flex">
        <Tooltip title={"When `checked`, hides the component's content area."}>
          <Checkbox
            className="mr-2"
            checked={state[slot].collapsed}
            onChange={toggleCollapsed}
          />
        </Tooltip>
        Collapsed
      </Label>
      <Label className="d-flex">
        <Tooltip
          title={
            "When `true` and `displayMode` is not `float-content` or `float`, the component's content area is resizable."
          }
        >
          <Checkbox
            className="mr-2"
            checked={state[slot].resizable}
            onChange={toggleResizable}
          />
        </Tooltip>
        Resizable
      </Label>
      <Dropdown>
        <DropdownButton>{state[slot].displayMode}</DropdownButton>
        <DropdownMenu onSelect={(e) => console.log(e)}>
          {displayModes.map((m) => (
            <DropdownItem
              key={m}
              value={m}
              active={state[slot].displayMode == m}
              onClick={(e) => {
                dispatch({
                  //@ts-ignore
                  type: slotAction,
                  payload: {
                    displayMode: e.target.value,
                  },
                });
              }}
            >
              {m}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
    </SettingSection>
  );
}
