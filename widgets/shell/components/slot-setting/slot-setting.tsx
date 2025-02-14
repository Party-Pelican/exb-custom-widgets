import { React } from "jimu-core";
import {
  Button,
  Checkbox,
  Icon,
  Label,
  Tooltip,
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownMenu,
} from "jimu-ui";
import {
  SettingSection,
  SidePopper,
} from "jimu-ui/advanced/setting-components";
import { useRef, useState } from "react";
import icon from "../../src/runtime/assets/icons/gear-24.svg";
import { SlotSettingProps } from "./slot-setting.types";
import { DisplayMode, displayModes } from "../../src/shell-config.types";

export default function SlotSetting({
  shellPanelConfig,
  slot,
  onUpdate,
}: SlotSettingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const settingsButton = useRef(null);

  return (
    <>
      <Button
        icon
        ref={settingsButton}
        onClick={() => setIsOpen((prevState) => !prevState)}
      >
        <Icon icon={icon}></Icon>
      </Button>
      <SidePopper
        isOpen={isOpen}
        position="right"
        title={`${slot.replace(/\b\w/g, (char) => char.toUpperCase())} Setting`}
        trigger={settingsButton.current}
        toggle={() => {
          setIsOpen((prevState) => !prevState);
        }}
      >
        <SettingSection title="Properties">
          <Label className="d-flex">
            <Tooltip
              title={"When `checked`, hides the component's content area."}
            >
              <Checkbox
                className="mr-2"
                checked={shellPanelConfig?.collapsed}
                onClick={() =>
                  onUpdate(slot, {
                    ...shellPanelConfig,
                    collapsed: !shellPanelConfig?.collapsed,
                  })
                }
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
                checked={shellPanelConfig?.resizable}
                onClick={() =>
                  onUpdate(slot, {
                    ...shellPanelConfig,
                    resizable: !shellPanelConfig?.resizable,
                  })
                }
              />
            </Tooltip>
            Resizable
          </Label>
          <Dropdown>
            <DropdownButton>{shellPanelConfig?.displayMode}</DropdownButton>
            <DropdownMenu>
              {displayModes.map((m) => (
                <DropdownItem
                  key={m}
                  value={m}
                  active={shellPanelConfig?.displayMode == m}
                  onClick={(e) =>
                    onUpdate(slot, {
                      ...shellPanelConfig,
                      displayMode: e.target.value,
                    })
                  }
                >
                  {m}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </SettingSection>
      </SidePopper>
    </>
  );
}
