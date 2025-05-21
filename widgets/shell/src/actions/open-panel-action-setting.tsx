import {
  React,
  IMState,
  ActionSettingProps,
  getAppStore,
  IMUseDataSource,
  Immutable,
} from "jimu-core";
import { Select, Option } from "jimu-ui";
import { SettingSection } from "jimu-ui/advanced/setting-components";
import { useEffect } from "react";

type Action = {
  appearance: "solid" | "transparent";
  icon: string;
  label: string | null;
  text: string;
  textEnabled: boolean;
  alignment: "start" | "end" | "center";
};

interface IMConfig {
  selectedItemId: number;
  actions: Action[];
}

export default function OpenPanelActionSetting(
  props: ActionSettingProps<IMConfig>
) {
  console.log("props", props);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newPanelId = e.target.value;
    props.onSettingChange({
      actionId: props.actionId,
      config: {
        ...props.config,
        selectedItemId: newPanelId,
        targetLayoutWidget: props.widgetId,
      },
    });
  }

  function getInitConfig() {
    const config = getAppStore().getState().appStateInBuilder.appConfig;
    const messageWidgetJson = config.widgets[props.widgetId];

    console.log("messageWidgetJson", messageWidgetJson);

    let shellConfig = messageWidgetJson.config;

    return {
      actions: shellConfig.actions,
    };
  }

  useEffect(() => {
    const initConfig = getInitConfig();

    props.onSettingChange({
      actionId: props.actionId,
      config: initConfig,
    });
  }, []);

  return (
    <SettingSection title="Select a panel to open">
      {props.config && props.config.actions ? (
        <Select onChange={handleChange}>
          {props.config.actions.map((action, i) => (
            <Option key={i} value={i}>
              {action.text}
            </Option>
          ))}
        </Select>
      ) : (
        <p>There are no panels to open.</p>
      )}
    </SettingSection>
  );
}
