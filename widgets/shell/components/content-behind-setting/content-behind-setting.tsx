import { React } from "jimu-core";
import { ContentBehindProps } from "./content-behind-setting.types";
import { SettingSection } from "jimu-ui/advanced/setting-components";
import { Label, Checkbox, Tooltip } from "jimu-ui";
import { useWidgetContext } from "../../context/widget-context";

export default function ContentBehindSetting() {
  const { state, dispatch } = useWidgetContext();

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
            onChange={() =>
              dispatch({
                type: "UPDATE_SHELL",
                payload: { contentBehind: !state.contentBehind },
              })
            }
            checked={state.contentBehind}
          />
        </Tooltip>
        Content Behind
      </Label>
    </SettingSection>
  );
}
