import { React } from "jimu-core";
import { type AllWidgetSettingProps } from "jimu-for-builder";
import { TextInput, Label } from "jimu-ui";
import {
  SettingSection,
  SettingRow,
} from "jimu-ui/advanced/setting-components";
import { type IMConfig } from "../config";

export default function Setting(props: AllWidgetSettingProps<IMConfig>) {
  const { config, onSettingChange, id } = props;

  const handleChange = (key: keyof IMConfig, value: string) => {
    onSettingChange({ id, config: config.set(key, value) });
  };

  return (
    <SettingSection title="List panel">
      <SettingRow label="Heading">
        <TextInput
          value={config.listHeading ?? ""}
          onChange={(e) => handleChange("listHeading", e.target.value)}
          placeholder="Heading"
        />
      </SettingRow>
      <SettingRow label="Description">
        <TextInput
          value={config.listDescription ?? ""}
          onChange={(e) => handleChange("listDescription", e.target.value)}
          placeholder="Description"
        />
      </SettingRow>
    </SettingSection>
  );
}
