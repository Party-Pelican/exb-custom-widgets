import { React } from "jimu-core";
import { AllWidgetSettingProps } from "jimu-for-builder";
import { type IMConfig } from "../config";
import { MapWidgetSelector } from "jimu-ui/advanced/setting-components";
import { AllDataSourceTypes } from "jimu-ui/advanced/data-source-selector";

export default function Setting(props: AllWidgetSettingProps<IMConfig>) {
  function onSelect(useMapWidgetIds: string[]) {
    props.onSettingChange({
      id: props.id,
      useMapWidgetIds: useMapWidgetIds,
    });
  }

  return (
    <MapWidgetSelector
      onSelect={onSelect}
      useMapWidgetIds={props.useMapWidgetIds}
    ></MapWidgetSelector>
  );
}
