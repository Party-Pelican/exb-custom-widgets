import { React, jsx, css } from "jimu-core";
import { AllWidgetSettingProps } from "jimu-for-builder";
import { Label, Switch } from "jimu-ui";
import {
  MapWidgetSelector,
  SettingRow,
  SettingSection,
} from "jimu-ui/advanced/setting-components";
import { type IMConfig } from "../config";
import { ColorPicker } from "jimu-ui/basic/color-picker";
import { useState } from "react";

export default function Setting(props: AllWidgetSettingProps<IMConfig>) {
  const [colors, setColors] = useState({
    textColor: props.config?.textColor,
    saveColor: props.config?.saveColor,
    resetColor: props.config?.resetColor,
  });

  // Function called when a new map widget is selected
  // It updates the config with the new useMapWidgetIds
  function onMWSelected(useMapWidgetIds: string[]) {
    props.onSettingChange({
      id: props.id,
      useMapWidgetIds: useMapWidgetIds,
    });
  }

  function onColorChange(property: string, color: string) {
    props.onSettingChange({
      id: props.id,
      config: props.config.set(property, color),
    });

    setColors((prevColors) => {
      return { ...prevColors, [property]: color };
    });
  }

  function onLayerListSettingChange(setting) {
    let newSettings = { ...props.config.getIn(["layerListProps"]) };
    if (Object.keys(setting)[0] in props.config.layerListProps) {
      newSettings = { ...newSettings, ...setting };
    } else {
      newSettings = {
        ...newSettings,
        visibleElements: { ...newSettings.visibleElements, ...setting },
      };
    }

    props.onSettingChange({
      id: props.id,
      config: props.config.set("layerListProps", newSettings),
    });
  }

  return (
    <SettingSection>
      <SettingRow flow="wrap" label={"Select the your map."}>
        <MapWidgetSelector
          onSelect={onMWSelected}
          useMapWidgetIds={props.useMapWidgetIds}
        />
      </SettingRow>

      <SettingRow flow="no-wrap" label={"Text Color"}>
        <ColorPicker
          disableAlpha
          color={colors.textColor}
          onChange={(color) => onColorChange("textColor", color)}
        ></ColorPicker>
      </SettingRow>

      <SettingRow flow="no-wrap" label={"Save Button Color"}>
        <ColorPicker
          disableAlpha
          color={colors.saveColor}
          onChange={(color) => onColorChange("saveColor", color)}
        ></ColorPicker>
      </SettingRow>

      <SettingRow flow="no-wrap" label={"Reset Button Color"}>
        <ColorPicker
          disableAlpha
          color={colors.resetColor}
          onChange={(color) => onColorChange("resetColor", color)}
        ></ColorPicker>
      </SettingRow>

      <SettingRow flow="no-wrap" label={"Search Layers"}>
        <Switch
          checked={props.config.layerListProps.visibleElements.filter}
          onChange={(e) =>
            onLayerListSettingChange({ filter: e.target.checked })
          }
        ></Switch>
      </SettingRow>

      <SettingRow flow="no-wrap" label={"Enable Drag"}>
        <Switch
          checked={props.config.layerListProps.dragEnabled}
          onChange={(e) =>
            onLayerListSettingChange({ dragEnabled: e.target.checked })
          }
        ></Switch>
      </SettingRow>

      <SettingRow flow="no-wrap" label={"Enable Errors"}>
        <Switch
          checked={props.config.layerListProps.visibleElements.errors}
          onChange={(e) =>
            onLayerListSettingChange({ errors: e.target.checked })
          }
        ></Switch>
      </SettingRow>
    </SettingSection>
  );
}
