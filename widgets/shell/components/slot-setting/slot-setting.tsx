import { React } from "jimu-core";
import { Button, Icon } from "jimu-ui";
import { SidePopper } from "jimu-ui/advanced/setting-components";
import { useRef, useState } from "react";
import icon from "../../src/runtime/assets/icons/gear-24.svg";
import { SlotSettingProps } from "./slot-setting.types";
import ShellPanelSetting from "../shell-panel-setting/shell-panel-setting";

const SlotSettingComponents = {
  "calcite-shell-panel": ShellPanelSetting,
};

export default function SlotSetting({ slot, type }: SlotSettingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const settingsButton = useRef(null);
  const SettingComponent = SlotSettingComponents[type];

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
        <SettingComponent slot={slot} />
      </SidePopper>
    </>
  );
}
