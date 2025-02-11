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

const displayModes = ["dock", "overlay", "float-all", "float-content"] as const;

type DisplayMode = (typeof displayModes)[number];

export default function SlotSetting({ slot }: SlotSettingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("dock");
  const buttonRef = useRef(null);
  return (
    <>
      <Button
        icon
        ref={buttonRef}
        onClick={() => setIsOpen((prevState) => !prevState)}
      >
        <Icon icon={icon}></Icon>
      </Button>
      <SidePopper
        isOpen={isOpen}
        position="right"
        title={`${slot.replace(/\b\w/g, (char) => char.toUpperCase())} Setting`}
        trigger={null}
        toggle={() => setIsOpen((prevState) => !prevState)}
      >
        <SettingSection title="Properties">
          <Label className="d-flex">
            <Tooltip
              title={"When `checked`, hides the component's content area."}
            >
              <Checkbox className="mr-2" />
            </Tooltip>
            Collapsed
          </Label>
          <Label className="d-flex">
            <Tooltip
              title={
                "When `true` and `displayMode` is not `float-content` or `float`, the component's content area is resizable."
              }
            >
              <Checkbox className="mr-2" />
            </Tooltip>
            Resizable
          </Label>
          <Dropdown>
            <DropdownButton>{displayMode}</DropdownButton>
            <DropdownMenu>
              {displayModes.map((m) => (
                <DropdownItem
                  key={m}
                  value={m}
                  active={displayMode == m}
                  onClick={(e) => setDisplayMode(e.target.value)}
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
