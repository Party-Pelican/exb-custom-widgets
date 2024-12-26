import { React, FormattedMessage } from "jimu-core";
import { type AllWidgetSettingProps } from "jimu-for-builder";
import { type IMConfig } from "../config";
import {
  JimuMapViewSelector,
  MapWidgetSelector,
  SettingSection,
} from "jimu-ui/advanced/setting-components";

export default function Setting(props: AllWidgetSettingProps<IMConfig>) {
  function onSelect(useMapWidgetIds: string[]) {
    props.onSettingChange({
      id: props.id,
      useMapWidgetIds,
    });
  }
  return (
    <SettingSection>
      <MapWidgetSelector
        useMapWidgetIds={props.useMapWidgetIds}
        onSelect={onSelect}
      />
    </SettingSection>
  );
}
