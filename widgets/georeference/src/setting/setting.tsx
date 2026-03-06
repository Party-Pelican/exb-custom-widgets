import { React } from "jimu-core";
import { type AllWidgetSettingProps } from "jimu-for-builder";
import { type IMConfig } from "../config";
import {
  MapWidgetSelector,
  SettingSection,
} from "jimu-ui/advanced/setting-components";

export default function Setting(props: AllWidgetSettingProps<IMConfig>) {
  function onMapWidgetSelect(useMapWidgetIds: string[]) {
    props.onSettingChange({
      id: props.id,
      useMapWidgetIds,
    });
  }

  return (
    <SettingSection>
      <MapWidgetSelector
        useMapWidgetIds={props.useMapWidgetIds}
        onSelect={onMapWidgetSelect}
      />
    </SettingSection>
  );
}
