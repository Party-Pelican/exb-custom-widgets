import {
  AlertDuration,
  Kind,
  MenuPlacement,
  Scale,
} from "@esri/calcite-components";
import {
  React,
  jsx,
  type ActionSettingProps,
  type ImmutableObject,
  Immutable,
  IMIconResult,
} from "jimu-core";
import {
  Checkbox,
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownMenu,
  Label,
  Select,
  TextInput,
  Option,
} from "jimu-ui";
import { IconPicker } from "jimu-ui/advanced/resource-selector";
import {
  SettingRow,
  SettingSection,
} from "jimu-ui/advanced/setting-components";
import { useEffect } from "react";

interface AlertProps {
  label: string;
  title: string;
  message: string;
  autoClose: boolean;
  open: boolean;
  autoCloseDuration: AlertDuration;
  kind: Extract<"brand" | "danger" | "info" | "success" | "warning", Kind>;
  placement: MenuPlacement;
  scale: Scale;
  icon: string;
}

interface Config {
  alertConfig: AlertProps;
}

export type IMConfig = ImmutableObject<Config>;

const defaultConfig: IMConfig = Immutable({
  alertConfig: {
    label: "Accessibility Label",
    title: "Alert Title",
    message: "Alert!",
    autoClose: true,
    open: false,
    autoCloseDuration: "medium",
    kind: "brand",
    placement: "bottom",
    scale: "m",
    icon: "add-reaction",
  },
});

export default function AlertActionSetting(
  props: ActionSettingProps<IMConfig>
) {
  const config = props.config ? props.config : defaultConfig;
  console.log(config);

  function acceptValue(updatedProperty: Partial<AlertProps>) {
    const newConfig = { ...config.alertConfig, ...updatedProperty };
    console.log("updated", newConfig);
    props.onSettingChange({
      actionId: props.actionId,
      config: props.config.set("alertConfig", newConfig),
    });
  }

  function changeIcon(icon: IMIconResult) {
    console.log(icon);
  }

  useEffect(() => {
    props.onSettingChange({
      actionId: props.actionId,
      config: config,
    });
  }, [config]);

  return (
    <SettingSection title={"Specify a message."}>
      <TextInput
        id="alertLabel"
        type="text"
        onAcceptValue={(l) => acceptValue({ label: l })}
        placeholder={config.alertConfig.label}
      ></TextInput>
      <TextInput
        id="alertTitle"
        type="text"
        onAcceptValue={(t) => acceptValue({ title: t })}
        placeholder={config.alertConfig.title}
      ></TextInput>
      <TextInput
        id="alertMessage"
        type="text"
        onAcceptValue={(m) => acceptValue({ message: m })}
        placeholder={config.alertConfig.message}
      ></TextInput>
      <SettingRow>
        <Checkbox
          id="alertAutoClose"
          checked={config.alertConfig.autoClose}
          onChange={(e, c) => acceptValue({ autoClose: c })}
        />
        <Label className="ml-2">Alert Auto Close?</Label>
      </SettingRow>
      <SettingRow>
        <Select
          placeholder={config.alertConfig.autoCloseDuration}
          onChange={(e) => acceptValue({ autoCloseDuration: e.target.value })}
        >
          {["fast", "medium", "slow"].map((i) => (
            <Option key={i} value={i}>
              {i}
            </Option>
          ))}
        </Select>
      </SettingRow>
      <SettingRow>
        <Select
          placeholder={config.alertConfig.kind}
          onChange={(e) => acceptValue({ kind: e.target.value })}
        >
          {["brand", "danger", "info", "success", "warning"].map((i) => (
            <Option key={i} value={i}>
              {i}
            </Option>
          ))}
        </Select>
      </SettingRow>
      <SettingRow>
        <Select
          placeholder={config.alertConfig.placement}
          onChange={(e) => acceptValue({ placement: e.target.value })}
        >
          {[
            "bottom",
            "bottom-end",
            "bottom-start",
            "top",
            "top-end",
            "top-start",
          ].map((i) => (
            <Option key={i} value={i}>
              {i}
            </Option>
          ))}
        </Select>
      </SettingRow>
      <SettingRow>
        <IconPicker onChange={changeIcon}></IconPicker>
      </SettingRow>
    </SettingSection>
  );
}
