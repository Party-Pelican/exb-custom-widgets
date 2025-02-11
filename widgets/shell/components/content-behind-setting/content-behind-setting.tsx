import { React } from "jimu-core";
import { ContentBehindProps } from "./content-behind-setting.types";
import { SettingSection } from "jimu-ui/advanced/setting-components";
import { Label, Checkbox, Tooltip } from "jimu-ui";

export default function ContentBehindSetting({
  contentBehindConfig,
  onUpdate,
}: ContentBehindProps) {
  function handleCheckboxChange() {
    onUpdate(!contentBehindConfig);
  }

  return (
    <SettingSection title="Content Behind">
      <Label className="d-flex">
        <Tooltip
          title={
            "Positions the center content behind any `calcite-shell-panel`s."
          }
        >
          <Checkbox
            className="mr-2"
            onChange={handleCheckboxChange}
            checked={contentBehindConfig}
          />
        </Tooltip>
        Content Behind
      </Label>
    </SettingSection>
  );
}
